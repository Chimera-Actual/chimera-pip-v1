import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, Plus, Trash2, GripVertical } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AudioWaveform } from './AudioWaveform';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

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

// Sortable Track Item Component
interface SortableTrackProps {
  track: AudioTrack;
  isActive: boolean;
  onPlay: (track: AudioTrack) => void;
  onRemove: (trackId: string) => void;
}

const SortableTrack: React.FC<SortableTrackProps> = ({ track, isActive, onPlay, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded border cursor-pointer transition-colors ${
        isActive
          ? 'bg-primary/20 border-primary'
          : 'bg-background/30 border-border hover:bg-background/50'
      }`}
      onClick={() => onPlay(track)}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>
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
            onRemove(track.id);
          }}
          size="sm"
          variant="ghost"
          className="ml-2 h-6 w-6 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
};

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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Save playlist to settings
  const savePlaylistToSettings = async (newPlaylist: AudioTrack[]) => {
    if (!user) return;

    try {
      const updatedSettings = { ...settings, playlist: newPlaylist };
      
      await supabase
        .from('user_widget_settings')
        .upsert({
          user_id: user.id,
          widget_id: 'audio-system',
          settings: updatedSettings as any // Type assertion for JSON compatibility
        });
      
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving playlist:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      // Create unique filename with user ID folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('audio')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading file:', error);
        return;
      }

      // Get signed URL for private bucket access (authenticated users only)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('audio')
        .createSignedUrl(fileName, 60 * 60 * 24); // 24 hour expiry

      if (urlError || !urlData) {
        console.error('Error creating signed URL:', urlError);
        return;
      }

      const track: AudioTrack = {
        id: `file-${Date.now()}`,
        title: file.name,
        url: urlData.signedUrl
      };
      
      const newPlaylist = [...playlist, track];
      setPlaylist(newPlaylist);
      
      // Save updated playlist to settings
      await savePlaylistToSettings(newPlaylist);
      
      if (!currentTrack) {
        setCurrentTrack(track);
      }
    } catch (error) {
      console.error('Error handling file upload:', error);
    }
  };

  const addUrlToPlaylist = async () => {
    if (newUrl.trim()) {
      const track: AudioTrack = {
        id: `url-${Date.now()}`,
        title: newTitle.trim() || 'Streaming Audio',
        url: newUrl.trim()
      };
      const newPlaylist = [...playlist, track];
      setPlaylist(newPlaylist);
      
      // Save updated playlist to settings
      await savePlaylistToSettings(newPlaylist);
      
      setNewUrl('');
      setNewTitle('');
      if (!currentTrack) {
        setCurrentTrack(track);
      }
    }
  };

  const removeTrack = async (trackId: string) => {
    const newPlaylist = playlist.filter(track => track.id !== trackId);
    setPlaylist(newPlaylist);
    
    // Save updated playlist to settings
    await savePlaylistToSettings(newPlaylist);
    
    if (currentTrack?.id === trackId) {
      setCurrentTrack(newPlaylist[0] || null);
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
    // If no current track but playlist has tracks, start with first track
    if (!currentTrack && playlist.length > 0) {
      playTrack(playlist[0]);
      return;
    }

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

  // Handle drag end for reordering playlist
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = playlist.findIndex((track) => track.id === active.id);
      const newIndex = playlist.findIndex((track) => track.id === over?.id);
      
      const newPlaylist = arrayMove(playlist, oldIndex, newIndex);
      setPlaylist(newPlaylist);
      
      // Save reordered playlist to settings
      await savePlaylistToSettings(newPlaylist);
    }
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

      {/* Audio Waveform Visualization */}
      <div className="flex-shrink-0 h-24 bg-background/20 border-b border-border p-4">
        <AudioWaveform 
          audioElement={audioRef.current}
          isPlaying={isPlaying}
          className="h-full"
        />
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
            disabled={playlist.length === 0}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={playlist.map(track => track.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {playlist.map((track) => (
                    <SortableTrack
                      key={track.id}
                      track={track}
                      isActive={currentTrack?.id === track.id}
                      onPlay={playTrack}
                      onRemove={removeTrack}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
};