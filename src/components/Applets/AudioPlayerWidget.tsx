import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
}

interface PlayerSettings {
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
  const [settings, setSettings] = useState<PlayerSettings>({
    volume: 75,
    autoplay: false,
    loop: false,
    playlist: []
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          const loadedSettings = data.settings as Partial<PlayerSettings>;
          setSettings(prevSettings => ({ ...prevSettings, ...loadedSettings }));
          setPlaylist(loadedSettings.playlist || []);
          if (loadedSettings.volume !== undefined) {
            setVolume([loadedSettings.volume]);
          }
        }
      } catch (error) {
        console.error('Error loading player settings:', error);
      }
    };

    loadSettings();
  }, [user]);

  // Update audio volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const track: AudioTrack = {
        id: `file-${Date.now()}`,
        title: file.name,
        url
      };
      setPlaylist(prev => [...prev, track]);
      if (!currentTrack) {
        setCurrentTrack(track);
      }
    }
  };

  const addUrlToPlaylist = () => {
    if (newUrl.trim()) {
      const track: AudioTrack = {
        id: `url-${Date.now()}`,
        title: newTitle.trim() || 'Streaming Audio',
        url: newUrl.trim()
      };
      setPlaylist(prev => [...prev, track]);
      setNewUrl('');
      setNewTitle('');
      if (!currentTrack) {
        setCurrentTrack(track);
      }
    }
  };

  const removeTrack = (trackId: string) => {
    setPlaylist(prev => prev.filter(track => track.id !== trackId));
    if (currentTrack?.id === trackId) {
      const remainingTracks = playlist.filter(track => track.id !== trackId);
      setCurrentTrack(remainingTracks[0] || null);
      setIsPlaying(false);
    }
  };

  const playTrack = (track: AudioTrack) => {
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.load();
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (!currentTrack || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const nextTrack = () => {
    if (!currentTrack) return;
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    if (playlist[nextIndex]) {
      playTrack(playlist[nextIndex]);
    }
  };

  const prevTrack = () => {
    if (!currentTrack) return;
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    if (playlist[prevIndex]) {
      playTrack(playlist[prevIndex]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-card">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={settings.loop ? () => audioRef.current?.play() : nextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

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

      {/* Current Track Display */}
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
                  setCurrentTime(value[0]);
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

      {/* Add Content */}
      <div className="flex-shrink-0 bg-background/20 border-b border-border p-4 space-y-3">
        <div className="space-y-2">
          <Label className="text-xs font-mono text-primary uppercase">Add Stream URL</Label>
          <div className="flex gap-2">
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://stream.example.com/audio.mp3"
              className="flex-1 text-xs font-mono bg-background/50"
            />
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-32 text-xs font-mono bg-background/50"
            />
            <Button
              onClick={addUrlToPlaylist}
              size="sm"
              disabled={!newUrl.trim()}
              className="px-3"
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-mono text-primary uppercase">Upload File</Label>
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
            Choose Audio File
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
              <span className="text-xs">Add URLs or upload files to begin</span>
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
                  <div className="flex items-center justify-between">
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
    </div>
  );
};