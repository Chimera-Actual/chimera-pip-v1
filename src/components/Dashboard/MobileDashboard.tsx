// Mobile-optimized Dashboard Layout
import React, { useState } from 'react';
import { Menu, X, Grid3x3, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { ReactGridDashboard } from './ReactGridDashboard';
import { WidgetCatalogPanel } from './WidgetCatalogPanel';
import { WidgetPropertiesPanel } from './WidgetPropertiesPanel';
import { DashboardHeader } from './DashboardHeader';
import { cn } from '@/lib/utils';

export const MobileDashboard: React.FC = () => {
  const [showCatalog, setShowCatalog] = useState(false);
  const [showProperties, setShowProperties] = useState(false);

  return (
    <div className="h-screen bg-background text-foreground font-mono flex flex-col">
      {/* Header */}
      <DashboardHeader />
      
      {/* Mobile Navigation */}
      <div className="flex items-center justify-between p-2 border-b border-border/50 bg-card/20">
        <Sheet open={showCatalog} onOpenChange={setShowCatalog}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" />
              Widgets
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <WidgetCatalogPanel />
          </SheetContent>
        </Sheet>

        <div className="text-xs text-muted-foreground font-mono">
          Tap and hold widgets to move them
        </div>

        <Sheet open={showProperties} onOpenChange={setShowProperties}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Properties
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0">
            <WidgetPropertiesPanel />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Dashboard */}
      <div className="flex-1 overflow-hidden">
        <ReactGridDashboard 
          panelId="main" 
          className="h-full mobile-dashboard"
        />
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .mobile-dashboard .react-grid-layout {
            min-height: calc(100vh - 8rem) !important;
          }
          
          .mobile-dashboard .react-grid-item {
            touch-action: none;
          }
          
          .mobile-dashboard .pip-boy-widget {
            min-height: 100px;
            touch-action: manipulation;
          }
          
          .mobile-dashboard .react-grid-dragHandleClassName {
            cursor: grab;
            touch-action: none;
          }
          
          .mobile-dashboard .react-grid-dragHandleClassName:active {
            cursor: grabbing;
          }
        `
      }} />
    </div>
  );
};