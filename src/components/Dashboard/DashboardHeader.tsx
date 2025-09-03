import React from 'react';
import { Monitor, Settings } from 'lucide-react';

import { Button } from '../ui/button';
import { GridControls } from './GridControls';
import { QuickLayoutControls } from './QuickLayoutControls';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

export const DashboardHeader: React.FC = () => {
  return (
    <header className={cn(
      "h-16 border-b border-border/50 bg-card/20 backdrop-blur-sm",
      "flex items-center justify-between px-6",
      "pip-boy-scanlines"
    )}>
      {/* Left - System Info */}
      <div className="flex items-center gap-2">
        <Monitor className="w-5 h-5 text-primary" />
        <div className="text-xs text-muted-foreground font-mono">
          SYSTEM ONLINE
        </div>
      </div>

      {/* Center - Dashboard Title & Controls */}
      <div className="flex-1 flex items-center justify-center gap-4">
        <div className="text-center">
          <h1 className="text-xl font-mono font-bold text-primary crt-glow">
            CHIMERA DASHBOARD v2.1
          </h1>
          <div className="text-xs text-muted-foreground">
            UNIFIED WIDGET MANAGEMENT SYSTEM
          </div>
        </div>
        
        <Separator orientation="vertical" className="h-8" />
        
        {/* Quick Layout Controls */}
        <QuickLayoutControls />
        
        <Separator orientation="vertical" className="h-8" />
        
        {/* Grid Controls */}
        <GridControls />
      </div>

      {/* Right - Settings */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};