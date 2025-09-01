import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, Trash2, GripVertical } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { useAudio } from '@/contexts/AudioContext';
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
  storagePath?: string;
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

interface AudioPlayerWidgetProps {
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

export const AudioPlayerWidget: React.FC<AudioPlayerWidgetProps> = ({ 
  widgetInstanceId, 
  settings,
  onSettingsUpdate 
}) => {
  const {
    isPlaying,
    currentTrack,
    currentTime,
    duration,
    volume,
    playlist,
    audioRef,
    playTrack,
    togglePlayPause,
    stopPlayback,
    nextTrack,
    prevTrack,
    setVolume,
    removeTrack,
    reorderPlaylist,
    handleFileUpload,
    loadWidgetPlaylist,
  } = useAudio();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize waveform size state
  const [currentWaveformSize, setCurrentWaveformSize] = useState(settings?.waveformSize || 'medium');

  // Handle waveform size change
  const handleWaveformSizeChange = (newSize: string) => {
    setCurrentWaveformSize(newSize);
    if (onSettingsUpdate) {
      onSettingsUpdate({
        ...settings,
        waveformSize: newSize
      });
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load playlist when widget mounts and set as active instance
  React.useEffect(() => {
    if (widgetInstanceId) {
      // Only load if we haven't loaded for this widget yet
      loadWidgetPlaylist(widgetInstanceId);
    }
  }, [widgetInstanceId]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && widgetInstanceId) {
      await handleFileUpload(file, widgetInstanceId);
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

    if (active.id !== over?.id && widgetInstanceId) {
      const oldIndex = playlist.findIndex((track) => track.id === active.id);
      const newIndex = playlist.findIndex((track) => track.id === over?.id);
      
      const newPlaylist = arrayMove(playlist, oldIndex, newIndex);
      await reorderPlaylist(newPlaylist, widgetInstanceId);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-card">
      {/* Header - Widget title and volume control */}
      <div className="flex-shrink-0 h-16 bg-background/50 border-b border-border px-4 flex items-center justify-between">
        <span className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
          🎵 AUDIO PLAYER
        </span>
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-muted-foreground" />
          <Slider
            value={volume}
            onValueChange={(newValue) => {
              console.log('Volume slider moved to:', newValue);
              setVolume(newValue);
            }}
            max={100}
            step={1}
            className="w-20"
          />
        </div>
      </div>

      {/* Waveform component */}
      {settings?.showWaveform !== false && (
        <div className={`flex-shrink-0 bg-background/20 border-b border-border relative ${
          currentWaveformSize === 'small' ? 'h-20' :
          currentWaveformSize === 'large' ? 'h-60' :
          'h-32'
        }`}>
          {/* Waveform Size Controls */}
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <Button
              onClick={() => handleWaveformSizeChange('small')}
              size="sm"
              variant={currentWaveformSize === 'small' ? 'default' : 'ghost'}
              className="h-6 px-2 text-xs font-mono"
            >
              S
            </Button>
            <Button
              onClick={() => handleWaveformSizeChange('medium')}
              size="sm"
              variant={currentWaveformSize === 'medium' ? 'default' : 'ghost'}
              className="h-6 px-2 text-xs font-mono"
            >
              M
            </Button>
            <Button
              onClick={() => handleWaveformSizeChange('large')}
              size="sm"
              variant={currentWaveformSize === 'large' ? 'default' : 'ghost'}
              className="h-6 px-2 text-xs font-mono"
            >
              L
            </Button>
          </div>
          {/* Waveform container */}
          <div className="absolute inset-0 p-4">
            <AudioWaveform 
              audioElement={audioRef.current}
              isPlaying={isPlaying}
              className="w-full h-full"
              style={settings?.waveformStyle || 'bars'}
              color={settings?.waveformColor || 'primary'}
            />
          </div>
        </div>
      )}

      {/* Current Track Display - Song Information */}
      <div className="flex-shrink-0 bg-background/30 border-b border-border p-3">
        <div className="text-center space-y-1">
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

      {/* Controls - Play Controls */}
      <div className="flex-shrink-0 bg-background/20 border-b border-border p-3">
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

      {/* Playlist with scroll bar */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4 pb-2">
          <Label className="text-sm font-mono text-primary uppercase">
            PLAYLIST ({playlist.length})
          </Label>
        </div>
        
        <div className="px-4 pb-4 overflow-y-auto h-full">
          {playlist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm font-mono">
              NO AUDIO FILES IN PLAYLIST
              <br />
              <span className="text-xs">Upload audio files to begin listening</span>
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
                      onRemove={(trackId) => removeTrack(trackId, widgetInstanceId)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Upload Audio Files section at bottom */}
      <div className="flex-shrink-0 bg-background/20 border-t border-border p-4">
        <div className="space-y-2">
          <Label className="text-xs font-mono text-primary uppercase">Upload Audio Files</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="w-full text-xs font-mono"
          >
            📁 Choose Audio Files
          </Button>
          <div className="text-xs text-muted-foreground text-center">
            Supported: MP3, WAV, OGG, M4A
          </div>
        </div>
      </div>
    </div>
  );
};