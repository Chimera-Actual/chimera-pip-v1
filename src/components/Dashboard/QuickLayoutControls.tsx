// Quick Layout Controls - Instant layout application
import React from 'react';
import { Layout, Columns2, Columns3, Grid2x2, Maximize } from 'lucide-react';
import { Button } from '../ui/button';
import { useDashboardStore } from '@/stores/dashboardStore';
import { cn } from '@/lib/utils';

interface QuickLayout {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  apply: (widgets: any[]) => void;
}

export const QuickLayoutControls: React.FC = () => {
  const { widgets, updateWidgetPosition } = useDashboardStore();

  const panelWidgets = Array.from(widgets.values()).filter(w => w.panelId === 'main');

  const quickLayouts: QuickLayout[] = [
    {
      id: 'single-column',
      name: 'Single',
      icon: Layout,
      description: 'Single column layout',
      apply: (widgets) => {
        widgets.forEach((widget, index) => {
          updateWidgetPosition(widget.id, {
            x: 0,
            y: index * 3,
            w: 6,
            h: 3,
          }, 'main');
        });
      }
    },
    {
      id: 'two-column',
      name: 'Two Col',
      icon: Columns2,
      description: 'Two column layout',
      apply: (widgets) => {
        widgets.forEach((widget, index) => {
          const col = index % 2;
          const row = Math.floor(index / 2);
          updateWidgetPosition(widget.id, {
            x: col * 6,
            y: row * 3,
            w: 6,
            h: 3,
          }, 'main');
        });
      }
    },
    {
      id: 'three-column',
      name: 'Three Col',
      icon: Columns3,
      description: 'Three column layout',
      apply: (widgets) => {
        widgets.forEach((widget, index) => {
          const col = index % 3;
          const row = Math.floor(index / 3);
          updateWidgetPosition(widget.id, {
            x: col * 4,
            y: row * 3,
            w: 4,
            h: 3,
          }, 'main');
        });
      }
    },
    {
      id: 'grid-2x2',
      name: 'Grid 2x2',
      icon: Grid2x2,
      description: '2x2 grid layout',
      apply: (widgets) => {
        widgets.forEach((widget, index) => {
          const col = index % 2;
          const row = Math.floor(index / 2);
          updateWidgetPosition(widget.id, {
            x: col * 6,
            y: row * 4,
            w: 6,
            h: 4,
          }, 'main');
        });
      }
    },
    {
      id: 'maximize-first',
      name: 'Focus',
      icon: Maximize,
      description: 'Maximize first widget',
      apply: (widgets) => {
        widgets.forEach((widget, index) => {
          if (index === 0) {
            updateWidgetPosition(widget.id, {
              x: 0,
              y: 0,
              w: 8,
              h: 6,
            }, 'main');
          } else {
            const smallCol = (index - 1) % 2;
            const smallRow = Math.floor((index - 1) / 2);
            updateWidgetPosition(widget.id, {
              x: 8 + smallCol * 2,
              y: smallRow * 2,
              w: 2,
              h: 2,
            }, 'main');
          }
        });
      }
    }
  ];

  const applyLayout = (layout: QuickLayout) => {
    if (panelWidgets.length === 0) return;
    layout.apply(panelWidgets);
  };

  if (panelWidgets.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {quickLayouts.map((layout) => (
        <Button
          key={layout.id}
          variant="ghost"
          size="sm"
          onClick={() => applyLayout(layout)}
          className="text-xs px-2 h-7 flex items-center gap-1"
          title={layout.description}
        >
          <layout.icon className="w-3 h-3" />
          <span className="hidden sm:inline">{layout.name}</span>
        </Button>
      ))}
    </div>
  );
};