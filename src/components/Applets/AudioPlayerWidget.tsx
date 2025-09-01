import React, { useState, useEffect } from 'react';
import { Music, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

// New component imports
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { PlaylistPanel } from './PlaylistPanel';
import { PlayerControls } from './PlayerControls';
import { TrackDisplay } from './TrackDisplay';
import { UploadSection } from './UploadSection';

interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
  file_path?: string;
}

interface AudioPlayerWidgetProps {
  widgetInstanceId?: string;
  onSettingsUpdate?: (settings: any) => void;
  settings?: {
    volume?: number;
    autoplay?: boolean;
    loop?: boolean;
    showWaveform?: boolean;
    waveformStyle?: 'bars' | 'wave' | 'circle' | 'minimal';
    waveformColor?: 'primary' | 'accent' | 'rainbow' | 'mono';
  };
}

export function AudioPlayerWidget({ widgetInstanceId, onSettingsUpdate, settings }: AudioPlayerWidgetProps) {
  const { user } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const audioRef = React.useRef<HTMLAudioElement>(null);
  
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(settings?.volume || 50);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (settings?.loop && currentTrack) {
        audio.currentTime = 0;
        audio.play();
        setIsPlaying(true);
      } else {
        handleNext();
      }
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      toast.error('Error loading audio file');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack, settings?.loop]);

  // Load playlist on mount
  useEffect(() => {
    if (user && widgetInstanceId) {
      loadPlaylist();
    }
  }, [user, widgetInstanceId]);

  // Apply settings
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = (isMuted ? 0 : volume) / 100;
    }
  }, [volume, isMuted]);

  const loadPlaylist = async () => {
    if (!user || !widgetInstanceId) return;

    try {
      const { data, error } = await supabase
        .from('widget_instance_audio')
        .select('*')
        .eq('user_id', user.id)
        .eq('widget_instance_id', widgetInstanceId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Generate signed URLs for each track
      const tracksWithUrls = await Promise.all(
        (data || []).map(async (track) => {
          const { data: urlData } = await supabase.storage
            .from('audio_uploads')
            .createSignedUrl(track.audio_path, 3600);
          
          return {
            id: track.id,
            title: track.audio_title,
            url: urlData?.signedUrl || '',
            duration: track.audio_duration,
            file_path: track.audio_path
          };
        })
      );

      setPlaylist(tracksWithUrls);
    } catch (error) {
      console.error('Error loading playlist:', error);
      toast.error('Failed to load playlist');
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!user || !widgetInstanceId) return;

    setIsUploading(true);
    const uploadedTracks: AudioTrack[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('audio/')) continue;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${widgetInstanceId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('audio_uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create signed URL
        const { data: urlData } = await supabase.storage
          .from('audio_uploads')
          .createSignedUrl(filePath, 3600);

        // Create database record
        const { data, error: dbError } = await supabase
          .from('widget_instance_audio')
          .insert({
            widget_instance_id: widgetInstanceId,
            audio_title: file.name.replace(/\.[^/.]+$/, ''),
            audio_path: filePath,
            position: playlist.length
          })
          .select()
          .single();

        if (dbError) throw dbError;

        uploadedTracks.push({
          id: data.id,
          title: data.audio_title,
          url: urlData?.signedUrl || '',
          duration: data.audio_duration,
          file_path: data.audio_path
        });
      }

      setPlaylist(prev => [...prev, ...uploadedTracks]);
      toast.success(`Uploaded ${uploadedTracks.length} track(s)`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayTrack = (track: AudioTrack) => {
    if (!audioRef.current) return;

    if (currentTrack?.id === track.id) {
      handleTogglePlayPause();
    } else {
      setCurrentTrack(track);
      audioRef.current.src = track.url;
      audioRef.current.load();
      
      if (settings?.autoplay !== false) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error('Error playing track:', error);
          toast.error('Error playing track');
        });
      }
    }
  };

  const handleTogglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Error playing track:', error);
        toast.error('Error playing track');
      });
    }
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleNext = () => {
    if (!currentTrack || playlist.length === 0) return;
    
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    handlePlayTrack(playlist[nextIndex]);
  };

  const handlePrev = () => {
    if (!currentTrack || playlist.length === 0) return;
    
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    handlePlayTrack(playlist[prevIndex]);
  };

  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    onSettingsUpdate?.({ ...settings, volume: newVolume });
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleRemoveTrack = async (trackId: string) => {
    try {
      const track = playlist.find(t => t.id === trackId);
      if (!track) return;

      // Remove from database
      const { error } = await supabase
        .from('widget_instance_audio')
        .delete()
        .eq('id', trackId);

      if (error) throw error;

      // Remove from storage
      if (track.file_path) {
        await supabase.storage
          .from('audio_uploads')
          .remove([track.file_path]);
      }

      // Update local state
      setPlaylist(prev => prev.filter(t => t.id !== trackId));
      
      if (currentTrack?.id === trackId) {
        handleStop();
        setCurrentTrack(null);
      }

      toast.success('Track removed');
    } catch (error) {
      console.error('Error removing track:', error);
      toast.error('Failed to remove track');
    }
  };

  const handleReorderPlaylist = (newPlaylist: AudioTrack[]) => {
    setPlaylist(newPlaylist);
  };

  const currentIndex = currentTrack ? playlist.findIndex(t => t.id === currentTrack.id) : -1;
  const canGoNext = playlist.length > 1 && currentIndex < playlist.length - 1;
  const canGoPrev = playlist.length > 1 && currentIndex > 0;

  // Mobile layout (vertical stack)
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Custom Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-lg">AUDIO PLAYER</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleMute}
            className="h-8 w-8 p-0"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-4 gap-6 min-h-0">
          {/* Track Display */}
          <TrackDisplay
            currentTrack={currentTrack}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            layout="mobile"
          />

          {/* Waveform */}
          {settings?.showWaveform && (
            <AudioWaveformVisualizer
              audioElement={audioRef.current}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              style={settings?.waveformStyle || 'bars'}
              colorTheme={settings?.waveformColor || 'primary'}
              height={120}
              className="mb-2"
            />
          )}

          {/* Player Controls */}
          <PlayerControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            canGoNext={canGoNext}
            canGoPrev={canGoPrev}
            onTogglePlayPause={handleTogglePlayPause}
            onStop={handleStop}
            onNext={handleNext}
            onPrev={handlePrev}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
            layout="mobile"
          />

          {/* Playlist */}
          <div className="flex-1 min-h-0">
            <PlaylistPanel
              playlist={playlist}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              onRemoveTrack={handleRemoveTrack}
              onReorderPlaylist={handleReorderPlaylist}
            />
          </div>

          {/* Upload Section */}
          <UploadSection
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
            layout="mobile"
          />
        </div>

        <audio ref={audioRef} />
      </div>
    );
  }

  // Desktop/Tablet layout (side-by-side)
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Custom Header */}
      <div className="flex items-center justify-between p-6 border-b bg-card">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-xl">AUDIO PLAYER</h1>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <div className="w-24">
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono min-w-[30px]">
            {Math.round(isMuted ? 0 : volume)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 min-h-0">
        {/* Left Panel - Playlist */}
        <div className="w-1/3 flex flex-col">
          <PlaylistPanel
            playlist={playlist}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onRemoveTrack={handleRemoveTrack}
            onReorderPlaylist={handleReorderPlaylist}
            className="flex-1 mb-4"
          />
          
          <UploadSection
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
            layout="desktop"
          />
        </div>

        {/* Right Panel - Player Controls & Waveform */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Track Display */}
          <TrackDisplay
            currentTrack={currentTrack}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            layout="desktop"
          />

          {/* Waveform */}
          {settings?.showWaveform && (
            <div className="flex-1">
              <AudioWaveformVisualizer
                audioElement={audioRef.current}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                style={settings?.waveformStyle || 'bars'}
                colorTheme={settings?.waveformColor || 'primary'}
                height={isDesktop ? 200 : 150}
              />
            </div>
          )}

          {/* Player Controls */}
          <PlayerControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            canGoNext={canGoNext}
            canGoPrev={canGoPrev}
            onTogglePlayPause={handleTogglePlayPause}
            onStop={handleStop}
            onNext={handleNext}
            onPrev={handlePrev}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
            layout="desktop"
          />
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  );
}