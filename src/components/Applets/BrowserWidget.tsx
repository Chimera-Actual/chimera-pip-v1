import React from 'react';

export const BrowserWidget: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 h-16 bg-card border-b border-border px-4 flex items-center justify-between">
        <span className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
          ⌘ DATA TERMINAL
        </span>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl opacity-50">⌘</div>
          <div className="text-muted-foreground font-mono">
            Browser widget coming soon...
          </div>
        </div>
      </div>
    </div>
  );
};