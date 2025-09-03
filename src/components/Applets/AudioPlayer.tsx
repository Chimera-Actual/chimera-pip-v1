import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OscilloscopeWaveform } from './OscilloscopeWaveform';

interface Track {
  id: string;
  title: string;
  url: string;
  duration?: number;
  storagePath?: string;
  position?: number;
}

interface AudioPlayerProps {
  widgetInstanceId?: string;
  settings?: {
    volume?: number;
    showWaveform?: boolean;
  };
  onSettingsUpdate?: (settings: any) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  widgetInstanceId,
  settings = {},
  onSettingsUpdate
}) => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(settings.volume || 75);
  const [isLoading, setIsLoading] = useState(false);

  // Load playlist from database
  useEffect(() => {
    if (user && widgetInstanceId) {
      migrateAndLoadPlaylist();
    }
  }, [user, widgetInstanceId]);

  const migrateAndLoadPlaylist = async () => {
    // First check if we need to migrate from old JSON format
    await migrateLegacyPlaylist();
    // Then load the playlist normally
    await loadPlaylist();
  };

  const migrateLegacyPlaylist = async () => {
    if (!user || !widgetInstanceId) return;

    try {
      // Check for legacy playlist data in settings
      const { data, error } = await supabase
        .from('user_widget_settings')
        .select('settings')
        .eq('user_id', user.id)
        .eq('widget_instance_id', widgetInstanceId)
        .maybeSingle();

      if (error || !data?.settings) return;

      const settingsData = data.settings as any;
      if (settingsData.playlist && Array.isArray(settingsData.playlist) && settingsData.playlist.length > 0) {
        console.log('Migrating legacy audio playlist for widget instance:', widgetInstanceId);

        // Check if we already have audio files in the new table
        const { data: existingAudio } = await supabase
          .from('widget_instance_audio')
          .select('id')
          .eq('widget_instance_id', widgetInstanceId)
          .limit(1);

        if (!existingAudio || existingAudio.length === 0) {
          // Migrate each track to the new table
          for (let i = 0; i < settingsData.playlist.length; i++) {
            const track = settingsData.playlist[i];
            if (track.title && track.storagePath) {
              await supabase
                .from('widget_instance_audio')
                .insert({
                  widget_instance_id: widgetInstanceId,
                  audio_path: track.storagePath,
                  audio_title: track.title,
                  audio_duration: track.duration || null,
                  position: i
                });
            }
          }

          // Remove playlist from settings after successful migration
          const { playlist, ...cleanSettings } = settingsData;
          await supabase
            .from('user_widget_settings')
            .update({ settings: cleanSettings })
            .eq('user_id', user.id)
            .eq('widget_instance_id', widgetInstanceId);

          console.log('Legacy playlist migration completed');
        }
      }
    } catch (error) {
      console.error('Error migrating legacy playlist:', error);
    }
  };

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      nextTrack();
    };
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsLoading(false);
      setIsPlaying(false);
      toast.error('Audio playback error');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);


  const loadPlaylist = async () => {
    if (!user || !widgetInstanceId) return;
    
    try {
      // Load audio files from normalized table
      const { data: audioFiles, error } = await supabase
        .from('widget_instance_audio')
        .select('*')
        .eq('widget_instance_id', widgetInstanceId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error loading audio files:', error);
        return;
      }

      if (audioFiles && audioFiles.length > 0) {
        // Generate fresh signed URLs for all tracks
        const refreshedPlaylist = await Promise.all(
          audioFiles.map(async (audioFile) => {
            try {
              // Generate fresh signed URL
              const { data: urlData, error: urlError } = await supabase.storage
                .from('audio')
                .createSignedUrl(audioFile.audio_path, 60 * 60 * 24 * 7); // 7 days

              if (!urlError && urlData) {
                return {
                  id: audioFile.id,
                  title: audioFile.audio_title,
                  url: urlData.signedUrl,
                  duration: audioFile.audio_duration ? Number(audioFile.audio_duration) : undefined,
                  storagePath: audioFile.audio_path,
                  position: audioFile.position
                };
              }
            } catch (error) {
              console.error('Error refreshing URL for track:', audioFile.audio_title, error);
            }
            
            // Return track with empty URL if refresh failed
            return {
              id: audioFile.id,
              title: audioFile.audio_title,
              url: '',
              duration: audioFile.audio_duration ? Number(audioFile.audio_duration) : undefined,
              storagePath: audioFile.audio_path,
              position: audioFile.position
            };
          })
        );
        
        setPlaylist(refreshedPlaylist);
      } else {
        setPlaylist([]);
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
    }
  };

  const saveVolumeSettings = async (newVolume: number) => {
    try {
      const settingsData = {
        volume: newVolume,
        showWaveform: settings?.showWaveform !== false,
        ...settings
      };

      await supabase
        .from('user_widget_settings')
        .upsert({
          user_id: user!.id,
          widget_instance_id: widgetInstanceId!,
          settings: settingsData as any
        }, {
          onConflict: 'user_id,widget_instance_id'
        });
    } catch (error) {
      console.error('Error saving volume settings:', error);
    }
  };

  const playTrack = async (track: Track) => {
    if (!audioRef.current) return;

    try {
      setCurrentTrack(track);
      audioRef.current.src = track.url;
      audioRef.current.volume = volume / 100;
      await audioRef.current.play();
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
      console.error('Playback error:', error);
      toast.error('Playback error');
    }
  };

  const stopPlayback = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
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

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    saveVolumeSettings(newVolume);
    if (onSettingsUpdate) {
      onSettingsUpdate({ ...settings, volume: newVolume });
    }
  };


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !widgetInstanceId) return;

    try {
      setIsLoading(true);
      
      // Generate unique file name with widget instance path
      const fileExt = file.name.split('.').pop() || 'mp3';
      const fileName = `${user.id}/widgets/${widgetInstanceId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the next position in the playlist
      const nextPosition = Math.max(...playlist.map(t => t.position || 0), -1) + 1;

      // Save audio file record to database
      const { data: audioRecord, error: dbError } = await supabase
        .from('widget_instance_audio')
        .insert({
          widget_instance_id: widgetInstanceId,
          audio_path: fileName,
          audio_title: file.name.replace(/\.[^/.]+$/, ''),
          position: nextPosition
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Get signed URL for playback
      const { data: urlData, error: urlError } = await supabase.storage
        .from('audio')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

      if (urlError || !urlData) {
        throw urlError || new Error('Could not get file URL');
      }

      // Add to local playlist
      const newTrack: Track = {
        id: audioRecord.id,
        title: audioRecord.audio_title,
        url: urlData.signedUrl,
        storagePath: fileName,
        position: nextPosition
      };

      const newPlaylist = [...playlist, newTrack].sort((a, b) => (a.position || 0) - (b.position || 0));
      setPlaylist(newPlaylist);
      
      toast.success('Audio file uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload audio file');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeTrack = async (trackId: string) => {
    try {
      // Remove from database
      const { error } = await supabase
        .from('widget_instance_audio')
        .delete()
        .eq('id', trackId);

      if (error) {
        throw error;
      }

      // Remove from local playlist
      const newPlaylist = playlist.filter(t => t.id !== trackId);
      setPlaylist(newPlaylist);
      
      if (currentTrack?.id === trackId) {
        setCurrentTrack(null);
        stopPlayback();
      }
      
      toast.success('Track removed successfully');
    } catch (error) {
      console.error('Error removing track:', error);
      toast.error('Failed to remove track');
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  return (
    <div className="w-full h-full flex flex-row bg-card border border-border rounded-lg overflow-hidden">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />
      
      {/* Left Side - Playlist Management */}
      <div className="w-2/5 flex flex-col border-r border-border overflow-hidden">
        {/* Playlist Header */}
        <div className="flex-shrink-0 bg-background/50 border-b border-border p-4">
          <Label className="text-sm font-mono text-primary uppercase">
            PLAYLIST ({playlist.length})
          </Label>
        </div>
        
        {/* Playlist Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {playlist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm font-mono">
              NO TRACKS IN PLAYLIST
              <br />
              <span className="text-xs">Upload audio files to start listening</span>
            </div>
          ) : (
            <div className="space-y-2">
              {playlist.map((track) => (
                <div
                  key={track.id}
                  className={`p-3 rounded border cursor-pointer transition-all hover:bg-background/50 ${
                    currentTrack?.id === track.id
                      ? 'bg-primary/20 border-primary'
                      : 'bg-background/30 border-border'
                  }`}
                  onClick={() => playTrack(track)}
                >
                  <div className="flex items-center justify-between">
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
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="flex-shrink-0 bg-background/20 border-t border-border p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isLoading}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="w-full text-xs font-mono"
            disabled={isLoading || !user || !widgetInstanceId}
          >
            <Upload size={16} className="mr-2" />
            {isLoading ? 'Uploading...' : 'Upload Audio Files'}
          </Button>
          <div className="text-xs text-muted-foreground text-center mt-2">
            Supported: MP3, WAV, OGG, M4A, FLAC
          </div>
        </div>
      </div>

      {/* Right Side - Player Controls */}
      <div className="w-3/5 flex flex-col overflow-hidden">
        {/* Header with Volume Control */}
        <div className="flex-shrink-0 bg-background/50 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono text-primary">🎵 AUDIO PLAYER</span>
              {isLoading && (
                <div className="text-xs text-muted-foreground font-mono animate-pulse">
                  LOADING...
                </div>
              )}
            </div>
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
        </div>

        {/* Waveform */}
        {settings?.showWaveform !== false && (
          <div className="flex-shrink-0 h-48">
            <OscilloscopeWaveform 
              isPlaying={isPlaying} 
              className="h-full"
            />
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
                step={0.1}
                className="w-full"
              />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex items-center justify-center bg-background/20 p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={prevTrack}
              size="sm"
              variant="ghost"
              disabled={playlist.length === 0 || isLoading}
              className="h-10 w-10 p-0"
            >
              <SkipBack size={20} />
            </Button>
            
            <Button
              onClick={togglePlayPause}
              size="lg"
              disabled={!currentTrack || isLoading}
              className="h-12 w-12 rounded-full"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </Button>
            
            <Button
              onClick={stopPlayback}
              size="sm"
              variant="ghost"
              disabled={!currentTrack || isLoading}
              className="h-10 w-10 p-0"
            >
              <Square size={20} />
            </Button>
            
            <Button
              onClick={nextTrack}
              size="sm"
              variant="ghost"
              disabled={playlist.length === 0 || isLoading}
              className="h-10 w-10 p-0"
            >
              <SkipForward size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};