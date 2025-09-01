import React from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
  onTogglePlayPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  layout?: 'mobile' | 'desktop';
  className?: string;
}

export function PlayerControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  canGoNext,
  canGoPrev,
  onTogglePlayPause,
  onStop,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  layout = 'desktop',
  className = ''
}: PlayerControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (values: number[]) => {
    onSeek(values[0]);
  };

  const handleVolumeChange = (values: number[]) => {
    onVolumeChange(values[0]);
  };

  const isMobile = layout === 'mobile';

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Seek Bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-mono min-w-[40px]">
          {formatTime(currentTime)}
        </span>
        <div className="flex-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeekChange}
            className="cursor-pointer"
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono min-w-[40px]">
          {formatTime(duration)}
        </span>
      </div>

      {/* Transport Controls */}
      <div className={cn(
        "flex items-center gap-2",
        isMobile ? "justify-center" : "justify-between"
      )}>
        {/* Playback Controls */}
        <div className={cn(
          "flex items-center gap-1",
          isMobile && "order-2"
        )}>
          <Button
            variant="ghost"
            size={isMobile ? "default" : "sm"}
            onClick={onPrev}
            disabled={!canGoPrev}
            className={cn(
              "transition-all duration-200",
              isMobile && "h-12 w-12"
            )}
          >
            <SkipBack className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
          </Button>

          <Button
            variant="default"
            size={isMobile ? "lg" : "default"}
            onClick={onTogglePlayPause}
            className={cn(
              "transition-all duration-200",
              isMobile && "h-14 w-14 rounded-full"
            )}
          >
            {isPlaying ? (
              <Pause className={cn("h-5 w-5", isMobile && "h-6 w-6")} />
            ) : (
              <Play className={cn("h-5 w-5 ml-0.5", isMobile && "h-6 w-6 ml-1")} />
            )}
          </Button>

          <Button
            variant="ghost"
            size={isMobile ? "default" : "sm"}
            onClick={onStop}
            className={cn(
              "transition-all duration-200",
              isMobile && "h-12 w-12"
            )}
          >
            <Square className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
          </Button>

          <Button
            variant="ghost"
            size={isMobile ? "default" : "sm"}
            onClick={onNext}
            disabled={!canGoNext}
            className={cn(
              "transition-all duration-200",
              isMobile && "h-12 w-12"
            )}
          >
            <SkipForward className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
          </Button>
        </div>

        {/* Volume Controls - Desktop Only */}
        {!isMobile && (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMute}
              className="h-8 w-8 p-0"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1">
              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="cursor-pointer"
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono min-w-[30px]">
              {Math.round(isMuted ? 0 : volume)}
            </span>
          </div>
        )}

        {/* Additional Controls - Mobile */}
        {isMobile && (
          <div className="flex items-center gap-1 order-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMute}
              className="h-10 w-10"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Mobile Volume Slider */}
        {isMobile && (
          <div className="order-3 flex items-center gap-2 w-full">
            <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="cursor-pointer"
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono min-w-[30px] flex-shrink-0">
              {Math.round(isMuted ? 0 : volume)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}