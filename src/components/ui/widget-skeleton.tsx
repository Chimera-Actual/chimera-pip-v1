import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface WidgetSkeletonProps {
  type?: 'card' | 'minimal' | 'chart' | 'list' | 'media';
  className?: string;
}

export const WidgetSkeleton: React.FC<WidgetSkeletonProps> = ({ 
  type = 'card',
  className = ''
}) => {
  const baseClasses = "widget-container w-full h-full p-4 space-y-4 animate-pulse";
  
  const renderSkeletonByType = () => {
    switch (type) {
      case 'chart':
        return (
          <>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32 bg-muted/30" />
              <Skeleton className="h-4 w-16 bg-muted/20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-48 w-full bg-muted/30" />
              <div className="flex justify-between space-x-2">
                <Skeleton className="h-4 w-12 bg-muted/20" />
                <Skeleton className="h-4 w-12 bg-muted/20" />
                <Skeleton className="h-4 w-12 bg-muted/20" />
                <Skeleton className="h-4 w-12 bg-muted/20" />
              </div>
            </div>
          </>
        );
        
      case 'list':
        return (
          <>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-28 bg-muted/30" />
              <Skeleton className="h-4 w-4 rounded bg-muted/20" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded bg-muted/20" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full bg-muted/25" />
                    <Skeleton className="h-3 w-3/4 bg-muted/15" />
                  </div>
                </div>
              ))}
            </div>
          </>
        );
        
      case 'media':
        return (
          <>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24 bg-muted/30" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-6 rounded bg-muted/20" />
                <Skeleton className="h-6 w-6 rounded bg-muted/20" />
              </div>
            </div>
            <Skeleton className="h-32 w-full bg-muted/30 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-2 w-full bg-muted/20" />
              <div className="flex justify-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full bg-muted/25" />
                <Skeleton className="h-8 w-8 rounded-full bg-muted/30" />
                <Skeleton className="h-8 w-8 rounded-full bg-muted/25" />
              </div>
            </div>
          </>
        );
        
      case 'minimal':
        return (
          <>
            <Skeleton className="h-8 w-40 bg-muted/30" />
            <Skeleton className="h-24 w-full bg-muted/20" />
          </>
        );
        
      default: // card
        return (
          <>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32 bg-muted/30" />
              <Skeleton className="h-4 w-4 rounded bg-muted/20" />
            </div>
            <Skeleton className="h-32 w-full bg-muted/30" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-muted/25" />
              <Skeleton className="h-4 w-3/4 bg-muted/20" />
              <Skeleton className="h-4 w-1/2 bg-muted/15" />
            </div>
            <div className="flex space-x-2 mt-4">
              <Skeleton className="h-8 w-16 bg-muted/20" />
              <Skeleton className="h-8 w-20 bg-muted/15" />
            </div>
          </>
        );
    }
  };

  return (
    <div className={`${baseClasses} ${className}`}>
      {renderSkeletonByType()}
    </div>
  );
};

// Specific widget skeleton components
export const MapWidgetSkeleton = () => (
  <WidgetSkeleton type="card" className="bg-card/50 rounded-lg border border-border/50" />
);

export const ChartWidgetSkeleton = () => (
  <WidgetSkeleton type="chart" className="bg-card/50 rounded-lg border border-border/50" />
);

export const ListWidgetSkeleton = () => (
  <WidgetSkeleton type="list" className="bg-card/50 rounded-lg border border-border/50" />
);

export const MediaWidgetSkeleton = () => (
  <WidgetSkeleton type="media" className="bg-card/50 rounded-lg border border-border/50" />
);