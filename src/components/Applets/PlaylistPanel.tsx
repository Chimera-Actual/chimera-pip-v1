import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Pause, X, GripVertical, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
}

interface PlaylistPanelProps {
  playlist: AudioTrack[];
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  onPlayTrack: (track: AudioTrack) => void;
  onRemoveTrack: (trackId: string) => void;
  onReorderPlaylist: (tracks: AudioTrack[]) => void;
  className?: string;
}

function SortableTrackItem({
  track,
  isActive,
  isPlaying,
  onPlay,
  onRemove
}: {
  track: AudioTrack;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
}) {
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
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 p-2 rounded-lg transition-colors",
        isActive && "bg-primary/10 border border-primary/20",
        !isActive && "hover:bg-muted/50",
        isDragging && "opacity-50 scale-95"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onPlay}
        className="h-8 w-8 p-0 flex-shrink-0"
      >
        {isActive && isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium text-sm truncate",
          isActive && "text-primary"
        )}>
          {track.title}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDuration(track.duration)}
        </div>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-destructive hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PlaylistPanel({
  playlist,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onRemoveTrack,
  onReorderPlaylist,
  className = ''
}: PlaylistPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = playlist.findIndex(track => track.id === active.id);
      const newIndex = playlist.findIndex(track => track.id === over.id);
      const newPlaylist = arrayMove(playlist, oldIndex, newIndex);
      onReorderPlaylist(newPlaylist);
    }
  };

  if (playlist.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
        <div className="rounded-full bg-muted/20 p-6 mb-4">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-2">No tracks in playlist</h3>
        <p className="text-sm text-muted-foreground">
          Upload audio files to get started
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm text-muted-foreground tracking-wide uppercase">
          Playlist ({playlist.length})
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={playlist.map(track => track.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {playlist.map((track) => (
                <SortableTrackItem
                  key={track.id}
                  track={track}
                  isActive={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  onPlay={() => onPlayTrack(track)}
                  onRemove={() => onRemoveTrack(track.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>
    </div>
  );
}