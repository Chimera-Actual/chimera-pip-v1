import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, Trash2, GripVertical, Music } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { useAudio } from '@/contexts/AudioContext';
import { useResponsive } from '@/hooks/useResponsive';
import { StandardWidgetTemplate } from '@/components/Layout/StandardWidgetTemplate';
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
  const { isMobile, isTablet } = useResponsive();
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

  // Header controls for volume
  const headerControls = (
    <div className="flex items-center gap-2">
      <Volume2 size={16} className="text-muted-foreground" />
      <Slider
        value={volume}
        onValueChange={setVolume}
        max={100}
        step={1}
        className={isMobile ? 'w-16' : isTablet ? 'w-18' : 'w-20'}
      />
      <span className={`font-mono text-muted-foreground ${isMobile ? 'text-xs w-6' : 'text-xs w-8'}`}>
        {Math.round(volume[0] || 0)}%
      </span>
    </div>
  );

  return (
    <StandardWidgetTemplate
      icon={<Music size={isMobile ? 16 : isTablet ? 18 : 20} />}
      title="AUDIO PLAYER"
      controls={headerControls}
      contentLayout={isMobile ? 'stack' : 'split'}
    >
      {isMobile ? renderMobileLayout() : renderDesktopTabletLayout()}
    </StandardWidgetTemplate>
  );

  // Mobile layout - vertical stack as per mobile mock
  function renderMobileLayout() {
    return (
      <>
        {/* Track Info & Waveform */}
        <div className="flex-shrink-0 bg-card border-b border-border p-3">
          <div className="text-center space-y-2">
            <div className="text-xs font-mono text-primary truncate">
              {currentTrack ? currentTrack.title : 'NO TRACK SELECTED'}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* Waveform */}
        {settings?.showWaveform !== false && (
          <div className={`flex-shrink-0 bg-card border-b border-border relative ${
            currentWaveformSize === 'small' ? 'h-16' :
            currentWaveformSize === 'large' ? 'h-24' :
            'h-20'
          }`}>
            <div className="absolute top-1 right-1 z-10 flex gap-1">
              {renderWaveformControls()}
            </div>
            <div className="absolute inset-0">
              <AudioWaveform 
                audioElement={audioRef.current}
                isPlaying={isPlaying}
                className="w-full h-full border border-border"
                style={settings?.waveformStyle || 'bars'}
                color={settings?.waveformColor || 'primary'}
              />
            </div>
          </div>
        )}

        {/* Seek Bar */}
        {duration > 0 && (
          <div className="flex-shrink-0 bg-card border-b border-border p-2">
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
          </div>
        )}

        {/* Controls */}
        <div className="flex-shrink-0 bg-card border-b border-border p-3">
          <div className="flex items-center justify-center gap-2">
            <Button onClick={prevTrack} size="sm" variant="ghost" disabled={playlist.length === 0} className="h-8 w-8 p-0">
              <SkipBack size={16} />
            </Button>
            <Button onClick={togglePlayPause} size="default" disabled={playlist.length === 0} className="rounded-full h-10 w-10">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>
            <Button onClick={stopPlayback} size="sm" variant="ghost" disabled={!currentTrack} className="h-8 w-8 p-0">
              <Square size={16} />
            </Button>
            <Button onClick={nextTrack} size="sm" variant="ghost" disabled={playlist.length === 0} className="h-8 w-8 p-0">
              <SkipForward size={16} />
            </Button>
          </div>
        </div>

        {/* Playlist */}
        <div className="flex-1 overflow-hidden">
          <div className="p-2 pb-1">
            <Label className="font-mono text-primary uppercase text-xs">
              PLAYLIST ({playlist.length})
            </Label>
          </div>
          <ScrollArea className="h-full px-2">
            {renderPlaylistContent()}
          </ScrollArea>
        </div>

        {/* Upload */}
        <div className="flex-shrink-0 bg-card border-t border-border p-2">
          {renderUploadSection()}
        </div>
      </>
    );
  }

  // Desktop/Tablet layout - side-by-side as per desktop mock
  function renderDesktopTabletLayout() {
    return (
      <>
        {/* Left side - Playlist */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          <div className={`${isTablet ? 'p-3 pb-2' : 'p-4 pb-2'}`}>
            <Label className={`font-mono text-primary uppercase ${isTablet ? 'text-sm' : 'text-sm'}`}>
              PLAYLIST ({playlist.length})
            </Label>
          </div>
          
          <ScrollArea className={`flex-1 ${isTablet ? 'px-3' : 'px-4'}`}>
            {renderPlaylistContent()}
          </ScrollArea>

          {/* Upload at bottom of playlist */}
          <div className={`flex-shrink-0 bg-card border-t border-border ${isTablet ? 'p-3' : 'p-4'}`}>
            {renderUploadSection()}
          </div>
        </div>

        {/* Right side - Controls and Waveform */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Waveform Section */}
          {settings?.showWaveform !== false && (
            <div className={`flex-shrink-0 bg-card border-b border-border relative ${
              currentWaveformSize === 'small' ? (isTablet ? 'h-24' : 'h-32') :
              currentWaveformSize === 'large' ? (isTablet ? 'h-48' : 'h-60') :
              isTablet ? 'h-32' : 'h-40'
            }`}>
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                {renderWaveformControls()}
              </div>
              <div className="absolute inset-0">
                <AudioWaveform 
                  audioElement={audioRef.current}
                  isPlaying={isPlaying}
                  className="w-full h-full border border-border"
                  style={settings?.waveformStyle || 'bars'}
                  color={settings?.waveformColor || 'primary'}
                />
              </div>
            </div>
          )}

          {/* Current Track & Controls */}
          <div className={`flex-1 flex flex-col justify-center bg-card ${isTablet ? 'p-4' : 'p-6'}`}>
            <div className="text-center space-y-4">
              {/* Track Info */}
              <div className="space-y-2">
                <div className={`font-mono text-primary truncate ${isTablet ? 'text-base' : 'text-lg'}`}>
                  {currentTrack ? currentTrack.title : 'NO TRACK SELECTED'}
                </div>
                <div className={`text-muted-foreground font-mono ${isTablet ? 'text-sm' : 'text-sm'}`}>
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
                    className="w-full max-w-md mx-auto"
                  />
                )}
              </div>

              {/* Controls */}
              <div className={`flex items-center justify-center ${isTablet ? 'gap-3' : 'gap-4'}`}>
                <Button
                  onClick={prevTrack}
                  size="sm"
                  variant="ghost"
                  disabled={playlist.length === 0}
                  className={isTablet ? 'h-10 w-10 p-0' : 'h-12 w-12 p-0'}
                >
                  <SkipBack size={isTablet ? 18 : 20} />
                </Button>
                
                <Button
                  onClick={togglePlayPause}
                  size={isTablet ? 'lg' : 'lg'}
                  disabled={playlist.length === 0}
                  className={`rounded-full ${isTablet ? 'h-14 w-14' : 'h-16 w-16'}`}
                >
                  {isPlaying ? <Pause size={isTablet ? 24 : 28} /> : <Play size={isTablet ? 24 : 28} />}
                </Button>
                
                <Button
                  onClick={stopPlayback}
                  size="sm"
                  variant="ghost"
                  disabled={!currentTrack}
                  className={isTablet ? 'h-10 w-10 p-0' : 'h-12 w-12 p-0'}
                >
                  <Square size={isTablet ? 18 : 20} />
                </Button>
                
                <Button
                  onClick={nextTrack}
                  size="sm"
                  variant="ghost"
                  disabled={playlist.length === 0}
                  className={isTablet ? 'h-10 w-10 p-0' : 'h-12 w-12 p-0'}
                >
                  <SkipForward size={isTablet ? 18 : 20} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Helper functions for reusable content
  function renderWaveformControls() {
    const buttonSize = isMobile ? 'h-5 px-1.5 text-xs' : 'h-6 px-2 text-xs';
    return (
      <>
        <Button
          onClick={() => handleWaveformSizeChange('small')}
          size="sm"
          variant={currentWaveformSize === 'small' ? 'default' : 'ghost'}
          className={`${buttonSize} font-mono`}
        >
          S
        </Button>
        <Button
          onClick={() => handleWaveformSizeChange('medium')}
          size="sm"
          variant={currentWaveformSize === 'medium' ? 'default' : 'ghost'}
          className={`${buttonSize} font-mono`}
        >
          M
        </Button>
        <Button
          onClick={() => handleWaveformSizeChange('large')}
          size="sm"
          variant={currentWaveformSize === 'large' ? 'default' : 'ghost'}
          className={`${buttonSize} font-mono`}
        >
          L
        </Button>
      </>
    );
  }

  function renderPlaylistContent() {
    if (playlist.length === 0) {
      return (
        <div className={`text-center py-8 text-muted-foreground font-mono ${isMobile ? 'text-xs py-4' : 'text-sm'}`}>
          NO AUDIO FILES IN PLAYLIST
          <br />
          <span className="text-xs">Upload audio files to begin listening</span>
        </div>
      );
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={playlist.map(track => track.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 pb-4">
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
    );
  }

  function renderUploadSection() {
    return (
      <div className="space-y-2">
        <Label className={`font-mono text-primary uppercase ${isMobile ? 'text-xs' : 'text-xs'}`}>
          Upload Audio Files
        </Label>
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
        <div className={`text-muted-foreground text-center ${isMobile ? 'text-xs' : 'text-xs'}`}>
          Supported: MP3, WAV, OGG, M4A
        </div>
      </div>
    );
  }
};
