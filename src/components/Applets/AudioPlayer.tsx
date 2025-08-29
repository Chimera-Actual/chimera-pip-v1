import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Track {
  id: string;
  title: string;
  url: string;
  duration?: number;
}

interface AudioPlayerProps {
  widgetInstanceId?: string;
  settings?: {
    volume?: number;
    waveformStyle?: string;
    waveformColor?: string;
    waveformSize?: string;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // State
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(settings.volume || 75);
  const [waveformSize, setWaveformSize] = useState(settings.waveformSize || 'medium');
  const [isLoading, setIsLoading] = useState(false);

  // Load playlist from database
  useEffect(() => {
    if (user && widgetInstanceId) {
      loadPlaylist();
    }
  }, [user, widgetInstanceId]);

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

  // Waveform animation
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    const animate = () => {
      const width = canvas.width / devicePixelRatio;
      const height = canvas.height / devicePixelRatio;
      
      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      if (isPlaying) {
        // Generate animated bars
        const barCount = 32;
        const barWidth = width / barCount;
        const time = Date.now() * 0.003;

        ctx.fillStyle = 'hsl(var(--primary))';
        
        for (let i = 0; i < barCount; i++) {
          const frequency = 0.5 + i * 0.1;
          const amplitude = Math.sin(time * frequency) * 0.5 + 0.5;
          const barHeight = amplitude * height * 0.8;
          
          ctx.fillRect(
            i * barWidth + 1,
            height - barHeight,
            barWidth - 2,
            barHeight
          );
        }
      } else {
        // Static bars when paused
        const barCount = 32;
        const barWidth = width / barCount;
        
        ctx.fillStyle = 'hsla(var(--primary), 0.3)';
        
        for (let i = 0; i < barCount; i++) {
          const barHeight = 10;
          ctx.fillRect(
            i * barWidth + 1,
            height - barHeight,
            barWidth - 2,
            barHeight
          );
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, settings.waveformStyle, settings.waveformColor]);

  const loadPlaylist = async () => {
    try {
      const { data, error } = await supabase
        .from('user_widget_settings')
        .select('settings')
        .eq('user_id', user!.id)
        .eq('widget_instance_id', widgetInstanceId)
        .single();

      if (data?.settings && typeof data.settings === 'object') {
        const settingsData = data.settings as any;
        if (settingsData.playlist) {
          setPlaylist(settingsData.playlist);
        }
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
    }
  };

  const savePlaylist = async (newPlaylist: Track[]) => {
    try {
      const settingsData = {
        playlist: newPlaylist,
        volume,
        waveformSize,
        ...settings
      };

      await supabase
        .from('user_widget_settings')
        .upsert({
          user_id: user!.id,
          widget_instance_id: widgetInstanceId!,
          settings: settingsData as any
        });
    } catch (error) {
      console.error('Error saving playlist:', error);
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
    if (onSettingsUpdate) {
      onSettingsUpdate({ ...settings, volume: newVolume });
    }
  };

  const handleWaveformSizeChange = (size: string) => {
    setWaveformSize(size);
    if (onSettingsUpdate) {
      onSettingsUpdate({ ...settings, waveformSize: size });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !widgetInstanceId) return;

    try {
      setIsLoading(true);
      
      // Generate unique file name
      const fileExt = file.name.split('.').pop() || 'mp3';
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

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

      // Get signed URL for playback
      const { data: urlData, error: urlError } = await supabase.storage
        .from('audio')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

      if (urlError || !urlData) {
        throw urlError || new Error('Could not get file URL');
      }

      // Add to playlist
      const newTrack: Track = {
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: urlData.signedUrl
      };

      const newPlaylist = [...playlist, newTrack];
      setPlaylist(newPlaylist);
      await savePlaylist(newPlaylist);
      
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
    const newPlaylist = playlist.filter(t => t.id !== trackId);
    setPlaylist(newPlaylist);
    await savePlaylist(newPlaylist);
    
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
      stopPlayback();
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getWaveformHeight = () => {
    switch (waveformSize) {
      case 'small': return 'h-16';
      case 'large': return 'h-48';
      default: return 'h-24';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />
      
      {/* Header */}
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
        <div className={`flex-shrink-0 bg-background/20 border-b border-border relative ${getWaveformHeight()}`}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: 'block' }}
          />
          <div className="absolute bottom-2 right-2 flex gap-1 bg-background/80 backdrop-blur-sm rounded p-1">
            {['small', 'medium', 'large'].map((size) => (
              <Button
                key={size}
                onClick={() => handleWaveformSizeChange(size)}
                size="sm"
                variant={waveformSize === size ? 'default' : 'ghost'}
                className="h-6 px-2 text-xs font-mono"
              >
                {size[0].toUpperCase()}
              </Button>
            ))}
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
              step={0.1}
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
      </div>

      {/* Upload */}
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
  );
};