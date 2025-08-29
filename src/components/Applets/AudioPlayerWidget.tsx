import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Plus, 
  Trash2, 
  SkipBack, 
  SkipForward,
  Shuffle,
  Repeat
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
}

interface AudioPlayerSettings {
  volume: number;
  autoplay: boolean;
  loop: boolean;
  playlist: AudioTrack[];
}

export const AudioPlayerWidget: React.FC = () => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [settings, setSettings] = useState<AudioPlayerSettings>({
    volume: 75,
    autoplay: false,
    loop: false,
    playlist: []
  });

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_widget_settings')
          .select('settings')
          .eq('user_id', user.id)
          .eq('widget_id', 'audio-system')
          .single();

        if (data?.settings && typeof data.settings === 'object') {
          const loadedSettings = data.settings as Partial<AudioPlayerSettings>;
          setSettings(prevSettings => ({ ...prevSettings, ...loadedSettings }));
          setPlaylist(loadedSettings.playlist || []);
          setVolume([loadedSettings.volume || 75]);
        }
      } catch (error) {
        console.error('Error loading audio player settings:', error);
      }
    };

    loadSettings();
  }, [user]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume[0] / 100;
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNext();
      }
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  const addToPlaylist = () => {
    if (!newUrl.trim()) return;

    const track: AudioTrack = {
      id: `track-${Date.now()}`,
      title: newTitle.trim() || 'Untitled Track',
      url: newUrl.trim()
    };

    setPlaylist(prev => [...prev, track]);
    setNewUrl('');
    setNewTitle('');
  };

  const removeFromPlaylist = (trackId: string) => {
    setPlaylist(prev => prev.filter(track => track.id !== trackId));
    if (currentTrack?.id === trackId) {
      stop();
    }
  };

  const playTrack = (track: AudioTrack) => {
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.load();
      setCurrentTrack(track);
      
      if (settings.autoplay) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;

    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    let nextIndex;

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }

    playTrack(playlist[nextIndex]);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;

    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    let prevIndex;

    if (shuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    }

    playTrack(playlist[prevIndex]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-card">
      {/* Header */}
      <div className="flex-shrink-0 h-16 bg-background/50 border-b border-border px-4 flex items-center justify-between">
        <span className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
          🎵 AUDIO PLAYER
        </span>
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-muted-foreground" />
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            className="w-20"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {/* Now Playing */}
        <div className="bg-background/30 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-mono text-primary uppercase">NOW PLAYING</Label>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShuffle(!shuffle)}
                size="sm"
                variant="ghost"
                className={`h-8 w-8 p-0 ${shuffle ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Shuffle size={14} />
              </Button>
              <Button
                onClick={() => setRepeat(!repeat)}
                size="sm"
                variant="ghost"
                className={`h-8 w-8 p-0 ${repeat ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Repeat size={14} />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm font-mono text-foreground">
                {currentTrack?.title || 'No track selected'}
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-1">
                {currentTrack?.url || 'Select a track from playlist'}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                onValueChange={handleSeek}
                max={duration || 100}
                step={1}
                className="w-full"
                disabled={!currentTrack}
              />
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={playPrevious}
                size="sm"
                variant="ghost"
                className="h-10 w-10 p-0"
                disabled={playlist.length === 0}
              >
                <SkipBack size={18} />
              </Button>

              <Button
                onClick={togglePlayPause}
                size="lg"
                className="h-12 w-12 rounded-full"
                disabled={!currentTrack}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>

              <Button
                onClick={stop}
                size="sm"
                variant="ghost"
                className="h-10 w-10 p-0"
                disabled={!currentTrack}
              >
                <Square size={18} />
              </Button>

              <Button
                onClick={playNext}
                size="sm"
                variant="ghost"
                className="h-10 w-10 p-0"
                disabled={playlist.length === 0}
              >
                <SkipForward size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* Add Track */}
        <div className="bg-background/30 border border-border rounded-lg p-4">
          <Label className="text-sm font-mono text-primary uppercase mb-3 block">
            ADD TRACK
          </Label>
          <div className="space-y-3">
            <Input
              placeholder="Track title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="font-mono bg-background/50"
            />
            <Input
              placeholder="Audio URL or file path"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="font-mono bg-background/50"
            />
            <Button
              onClick={addToPlaylist}
              disabled={!newUrl.trim()}
              className="w-full font-mono"
            >
              <Plus size={16} className="mr-2" />
              ADD TO PLAYLIST
            </Button>
          </div>
        </div>

        {/* Playlist */}
        <div className="flex-1 bg-background/30 border border-border rounded-lg p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-mono text-primary uppercase">
              PLAYLIST ({playlist.length})
            </Label>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-48">
            {playlist.map((track) => (
              <div
                key={track.id}
                className={`bg-card/50 border border-border rounded p-3 flex items-center justify-between cursor-pointer hover:bg-card/70 ${
                  currentTrack?.id === track.id ? 'border-primary bg-primary/10' : ''
                }`}
                onClick={() => playTrack(track)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono text-foreground truncate">
                    {track.title}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {track.url}
                  </div>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromPlaylist(track.id);
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/20"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))}

            {playlist.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm font-mono">
                NO TRACKS IN PLAYLIST
                <br />
                <span className="text-xs">Add audio URLs or files above</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};