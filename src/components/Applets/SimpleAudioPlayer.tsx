import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, Trash2, Upload } from 'lucide-react';
import { SimpleWaveform } from './SimpleWaveform';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
}

interface SimpleAudioPlayerProps {
  widgetInstanceId?: string;
  settings?: {
    volume?: number;
    autoplay?: boolean;
    loop?: boolean;
    waveformStyle?: string;
    waveformColor?: string;
    waveformSize?: string;
    showWaveform?: boolean;
  };
  onSettingsUpdate?: (settings: any) => void;
}

export const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({ 
  widgetInstanceId, 
  settings = {},
  onSettingsUpdate 
}) => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state - no complex context
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(settings.volume || 75);
  const [waveformSize, setWaveformSize] = useState(settings.waveformSize || 'medium');

  // Load playlist from database
  const loadPlaylist = async () => {
    if (!user || !widgetInstanceId) return;

    try {
      const { data, error } = await supabase
        .from('user_widget_settings')
        .select('settings')
        .eq('user_id', user.id)
        .eq('widget_instance_id', widgetInstanceId)
        .single();

      if (data?.settings && typeof data.settings === 'object') {
        const settings = data.settings as any;
        if (settings.playlist && Array.isArray(settings.playlist)) {
          setPlaylist(settings.playlist);
        }
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
    }
  };

  // Save playlist to database  
  const savePlaylist = async (newPlaylist: AudioTrack[]) => {
    if (!user || !widgetInstanceId) return;

    try {
      const settingsData = {
        playlist: newPlaylist,
        volume,
        waveformSize,
        ...settings
      };

      const { error } = await supabase
        .from('user_widget_settings')
        .upsert({
          user_id: user.id,
          widget_instance_id: widgetInstanceId,
          settings: settingsData as any
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving playlist:', error);
    }
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      nextTrack();
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Load playlist on mount
  useEffect(() => {
    loadPlaylist();
  }, [user, widgetInstanceId]);

  // Save playlist when it changes
  useEffect(() => {
    if (playlist.length > 0) {
      savePlaylist(playlist);
    }
  }, [playlist]);

  // Playback functions
  const playTrack = async (track: AudioTrack) => {
    if (!audioRef.current) return;

    try {
      console.log('Playing track:', track.title);
      setCurrentTrack(track);
      audioRef.current.src = track.url;
      audioRef.current.volume = volume / 100;
      
      await audioRef.current.play();
      console.log('Track playing successfully');
    } catch (error) {
      console.error('Error playing track:', error);
      toast.error('Could not play audio file');
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || !currentTrack) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      toast.error('Playback error');
    }
  };

  const stopPlayback = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  const nextTrack = () => {
    if (!currentTrack || playlist.length === 0) return;
    
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    playTrack(playlist[nextIndex]);
  };

  const prevTrack = () => {
    if (!currentTrack || playlist.length === 0) return;
    
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    playTrack(playlist[prevIndex]);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol / 100;
    }
    
    // Update settings
    if (onSettingsUpdate) {
      onSettingsUpdate({ ...settings, volume: vol });
    }
  };

  const handleWaveformSizeChange = (size: string) => {
    setWaveformSize(size);
    if (onSettingsUpdate) {
      onSettingsUpdate({ ...settings, waveformSize: size });
    }
  };

  // File upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !widgetInstanceId) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(filePath);

      const newTrack: AudioTrack = {
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        url: publicUrl
      };

      const newPlaylist = [...playlist, newTrack];
      setPlaylist(newPlaylist);
      
      toast.success('Audio file uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload audio file');
    }
  };

  const removeTrack = (trackId: string) => {
    const newPlaylist = playlist.filter(t => t.id !== trackId);
    setPlaylist(newPlaylist);
    
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
      stopPlayback();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-card">
      {/* Hidden audio element */}
      <audio ref={audioRef} />
      
      {/* Header */}
      <div className="flex-shrink-0 h-16 bg-background/50 border-b border-border px-4 flex items-center justify-between">
        <span className="text-lg font-mono text-primary uppercase tracking-wider">
          🎵 AUDIO PLAYER
        </span>
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-muted-foreground" />
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-20"
          />
        </div>
      </div>

      {/* Waveform */}
      {settings?.showWaveform !== false && (
        <div className={`flex-shrink-0 bg-background/20 border-b border-border relative ${
          waveformSize === 'small' ? 'h-20' :
          waveformSize === 'large' ? 'h-60' :
          'h-32'
        }`}>
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <Button
              onClick={() => handleWaveformSizeChange('small')}
              size="sm"
              variant={waveformSize === 'small' ? 'default' : 'ghost'}
              className="h-6 px-2 text-xs font-mono"
            >
              S
            </Button>
            <Button
              onClick={() => handleWaveformSizeChange('medium')}
              size="sm"
              variant={waveformSize === 'medium' ? 'default' : 'ghost'}
              className="h-6 px-2 text-xs font-mono"
            >
              M
            </Button>
            <Button
              onClick={() => handleWaveformSizeChange('large')}
              size="sm"
              variant={waveformSize === 'large' ? 'default' : 'ghost'}
              className="h-6 px-2 text-xs font-mono"
            >
              L
            </Button>
          </div>
          <div className="absolute inset-0 p-4">
            <SimpleWaveform 
              isPlaying={isPlaying}
              style={settings?.waveformStyle || 'bars'}
              color={settings?.waveformColor || 'primary'}
            />
          </div>
        </div>
      )}

      {/* Track Info */}
      <div className="flex-shrink-0 bg-background/30 border-b border-border p-4">
        <div className="text-center space-y-2">
          <div className="text-sm font-mono text-primary truncate">
            {currentTrack ? currentTrack.title : 'NO TRACK SELECTED'}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          {duration > 0 && (
            <Slider
              value={[currentTime]}
              onValueChange={(value) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = value[0];
                }
              }}
              max={duration}
              step={1}
              className="w-full"
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 bg-background/20 border-b border-border p-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={prevTrack}
            size="sm"
            variant="ghost"
            disabled={playlist.length === 0}
            className="h-10 w-10 p-0"
          >
            <SkipBack size={20} />
          </Button>
          
          <Button
            onClick={togglePlayPause}
            size="lg"
            disabled={!currentTrack}
            className="h-12 w-12 rounded-full"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </Button>
          
          <Button
            onClick={stopPlayback}
            size="sm"
            variant="ghost"
            disabled={!currentTrack}
            className="h-10 w-10 p-0"
          >
            <Square size={20} />
          </Button>
          
          <Button
            onClick={nextTrack}
            size="sm"
            variant="ghost"
            disabled={playlist.length === 0}
            className="h-10 w-10 p-0"
          >
            <SkipForward size={20} />
          </Button>
        </div>
      </div>

      {/* Playlist */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4">
          <Label className="text-sm font-mono text-primary uppercase">
            PLAYLIST ({playlist.length})
          </Label>
        </div>
        
        <div className="px-4 pb-4 overflow-y-auto max-h-full">
          {playlist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm font-mono">
              NO AUDIO FILES IN PLAYLIST
              <br />
              <span className="text-xs">Upload audio files to begin listening</span>
            </div>
          ) : (
            <div className="space-y-2">
              {playlist.map((track) => (
                <div
                  key={track.id}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    currentTrack?.id === track.id
                      ? 'bg-primary/20 border-primary'
                      : 'bg-background/30 border-border hover:bg-background/50'
                  }`}
                  onClick={() => playTrack(track)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-mono text-foreground truncate">
                        {track.title}
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrack(track.id);
                      }}
                      size="sm"
                      variant="ghost"
                      className="ml-2 h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload */}
      <div className="flex-shrink-0 bg-background/20 border-t border-border p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          className="w-full text-xs font-mono"
        >
          <Upload size={16} className="mr-2" />
          Upload Audio Files
        </Button>
      </div>
    </div>
  );
};