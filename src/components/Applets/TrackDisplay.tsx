import React from 'react';
import { Music, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
}

interface TrackDisplayProps {
  currentTrack: AudioTrack | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  layout?: 'mobile' | 'desktop';
  className?: string;
}

export function TrackDisplay({
  currentTrack,
  currentTime,
  duration,
  isPlaying,
  layout = 'desktop',
  className = ''
}: TrackDisplayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isMobile = layout === 'mobile';

  if (!currentTrack) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center text-center p-8",
        className
      )}>
        <div className="rounded-full bg-muted/20 p-6 mb-4">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-2">No track selected</h3>
        <p className="text-sm text-muted-foreground">
          Choose a track from your playlist to start listening
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col gap-4",
      isMobile ? "items-center text-center" : "items-start",
      className
    )}>
      {/* Album Art Placeholder */}
      <div className={cn(
        "rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center",
        isMobile ? "w-32 h-32" : "w-24 h-24"
      )}>
        <Music className={cn(
          "text-primary/60",
          isMobile ? "h-12 w-12" : "h-8 w-8"
        )} />
      </div>

      {/* Track Info */}
      <div className={cn(
        "flex-1",
        isMobile ? "max-w-full" : "min-w-0"
      )}>
        <h2 className={cn(
          "font-semibold leading-tight",
          isMobile ? "text-xl mb-2" : "text-lg mb-1",
          !isMobile && "truncate"
        )}>
          {currentTrack.title}
        </h2>
        
        <div className={cn(
          "flex items-center gap-2 text-muted-foreground",
          isMobile ? "justify-center text-base" : "text-sm"
        )}>
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span className="font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          {isPlaying && (
            <div className="flex items-center gap-1 ml-2">
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-100" />
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-200" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}