// Layout Templates for Quick Dashboard Setup
import React from 'react';
import { Layout, Grid3x3, Columns2, Columns3, LayoutGrid } from 'lucide-react';
import { Button } from '../ui/button';
import { useDashboardStore } from '@/stores/dashboardStore';
import { cn } from '@/lib/utils';
import type { Widget, GridPosition } from '@/types/dashboard';

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  positions: GridPosition[];
}

const templates: LayoutTemplate[] = [
  {
    id: 'single-column',
    name: '1 Column',
    description: 'Single column layout',
    icon: <Layout className="w-4 h-4" />,
    positions: [
      { x: 6, y: 0, w: 12, h: 8 },
    ]
  },
  {
    id: 'two-column',
    name: '2 Columns',
    description: 'Two equal columns',
    icon: <Columns2 className="w-4 h-4" />,
    positions: [
      { x: 0, y: 0, w: 12, h: 8 },
      { x: 12, y: 0, w: 12, h: 8 },
    ]
  },
  {
    id: 'three-column',
    name: '3 Columns',
    description: 'Three equal columns',
    icon: <Columns3 className="w-4 h-4" />,
    positions: [
      { x: 0, y: 0, w: 8, h: 8 },
      { x: 8, y: 0, w: 8, h: 8 },
      { x: 16, y: 0, w: 8, h: 8 },
    ]
  },
  {
    id: 'dashboard-grid',
    name: 'Dashboard Grid',
    description: '2x2 grid layout',
    icon: <Grid3x3 className="w-4 h-4" />,
    positions: [
      { x: 0, y: 0, w: 12, h: 6 },
      { x: 12, y: 0, w: 12, h: 6 },
      { x: 0, y: 6, w: 12, h: 6 },
      { x: 12, y: 6, w: 12, h: 6 },
    ]
  },
  {
    id: 'main-sidebar',
    name: 'Main + Sidebar',
    description: 'Large main area with sidebar',
    icon: <LayoutGrid className="w-4 h-4" />,
    positions: [
      { x: 0, y: 0, w: 16, h: 10 },
      { x: 16, y: 0, w: 8, h: 5 },
      { x: 16, y: 5, w: 8, h: 5 },
    ]
  },
];

export const LayoutTemplates: React.FC = () => {
  const { widgets, addWidget, updateWidget, clearAllWidgets } = useDashboardStore();

  const applyTemplate = (template: LayoutTemplate) => {
    // Get widgets in main panel
    const mainWidgets = Array.from(widgets.values()).filter(w => w.panelId === 'main');
    
    // Apply positions to existing widgets
    template.positions.forEach((position, index) => {
      if (mainWidgets[index]) {
        updateWidget(mainWidgets[index].id, { position });
      }
    });
  };

  const createTemplateWithWidgets = (template: LayoutTemplate) => {
    // Clear existing widgets and create new ones based on template
    clearAllWidgets();
    
    // Add default widgets based on template
    template.positions.forEach((position, index) => {
      const widgetTypes = ['clock', 'weather', 'calendar', 'status'];
      const widgetType = widgetTypes[index % widgetTypes.length];
      
      setTimeout(() => {
        addWidget(widgetType, 'main', position);
      }, index * 100); // Stagger creation to avoid conflicts
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="font-mono text-sm font-semibold text-foreground">
        LAYOUT TEMPLATES
      </h3>
      
      <div className="grid grid-cols-1 gap-2">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant="outline"
            size="sm"
            onClick={() => applyTemplate(template)}
            className={cn(
              "flex items-center gap-2 justify-start h-auto p-3",
              "hover:bg-primary/10 hover:border-primary/30"
            )}
          >
            {template.icon}
            <div className="text-left">
              <div className="font-mono text-xs font-medium">
                {template.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {template.description}
              </div>
            </div>
          </Button>
        ))}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => createTemplateWithWidgets(templates[3])} // Dashboard grid with widgets
        className="w-full text-xs font-mono"
      >
        Create Sample Dashboard
      </Button>
    </div>
  );
};