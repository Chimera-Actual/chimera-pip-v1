import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export const CalendarWidget: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`flex-shrink-0 bg-card border-b border-border px-3 md:px-4 flex items-center justify-between ${
        isMobile ? 'h-12' : 'h-16'
      }`}>
        <span className={`font-mono text-primary uppercase tracking-wider crt-glow ${
          isMobile ? 'text-sm' : 'text-lg'
        }`}>
          ◔ SCHEDULE MANAGER
        </span>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className={`opacity-50 ${isMobile ? 'text-4xl' : 'text-6xl'}`}>◔</div>
          <div className={`text-muted-foreground font-mono ${isMobile ? 'text-sm px-4' : ''}`}>
            Calendar widget coming soon...
          </div>
        </div>
      </div>
    </div>
  );
};