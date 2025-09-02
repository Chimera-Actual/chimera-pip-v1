// Dashboard Header with Layout Management
import React from 'react';
import { Monitor, Plus, Save, Undo, Redo, Settings, Layout, HelpCircle } from 'lucide-react';

import { useDashboardStore } from '@/stores/dashboardStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { LAYOUT_TEMPLATES, createLayoutFromTemplate } from './LayoutTemplates';
import { HelpModal } from './HelpModal';
import { cn } from '@/lib/utils';

export const DashboardHeader: React.FC = () => {
  const { user } = useAuth();
  const { 
    currentLayout, 
    layouts, 
    history,
    historyIndex,
    createLayout, 
    setActiveLayout, 
    deleteLayout,
    undo,
    redo,
    updateLayout
  } = useDashboardStore();

  const [showHelp, setShowHelp] = React.useState(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleCreateLayout = async () => {
    if (!user?.id) return;
    const name = prompt('Enter layout name:');
    if (name) {
      await createLayout(name, user.id);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    if (!user?.id) return;
    const template = LAYOUT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    const name = prompt('Enter layout name:', template.name);
    if (name) {
      const layoutData = createLayoutFromTemplate(template, user.id, name);
      await createLayout(name, user.id);
      // Note: In a real implementation, we'd pass the template data to createLayout
    }
  };

  const handleRenameLayout = () => {
    if (!currentLayout) return;
    const name = prompt('Enter new layout name:', currentLayout.name);
    if (name && name !== currentLayout.name) {
      updateLayout({ name });
    }
  };

  const handleDeleteLayout = async (layoutId: string) => {
    if (layouts.length <= 1) {
      alert('Cannot delete the last layout');
      return;
    }
    if (confirm('Are you sure you want to delete this layout?')) {
      await deleteLayout(layoutId);
    }
  };

  return (
    <header className={cn(
      "h-16 border-b border-border/50 bg-card/20 backdrop-blur-sm",
      "flex items-center justify-between px-6",
      "pip-boy-scanlines"
    )}>
      {/* Left Section - Logo & Layout Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-mono text-lg font-bold text-foreground">
              CHIMERA-PIP 4000 mk 2
            </h1>
            <div className="text-xs text-muted-foreground">
              Dashboard Framework v2.0
            </div>
          </div>
        </div>

        {currentLayout && (
          <>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {currentLayout.name}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {currentLayout.widgets.length} widgets
              </span>
            </div>
          </>
        )}
      </div>

      {/* Center Section - Quick Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          className="text-muted-foreground hover:text-foreground"
        >
          <Undo className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          className="text-muted-foreground hover:text-foreground"
        >
          <Redo className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border/50 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Layout
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-64">
            <DropdownMenuItem onClick={handleCreateLayout}>
              <Plus className="w-4 h-4 mr-2" />
              Blank Layout
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {LAYOUT_TEMPLATES.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => handleCreateFromTemplate(template.id)}
                className="flex items-start gap-2"
              >
                <div className="mt-0.5">{template.icon}</div>
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {template.description}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Section - Layout Selector & Settings */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="font-mono">
              {currentLayout?.name || 'Select Layout'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {layouts.map((layout) => (
              <DropdownMenuItem
                key={layout.id}
                onClick={() => setActiveLayout(layout.id)}
                className={cn(
                  "font-mono text-sm",
                  layout.isActive && "bg-primary/20"
                )}
              >
                <div className="flex-1">
                  <div>{layout.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {layout.widgets.length} widgets
                  </div>
                </div>
                {layout.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCreateLayout}>
              <Plus className="w-4 h-4 mr-2" />
              New Layout
            </DropdownMenuItem>
            {currentLayout && (
              <>
                <DropdownMenuItem onClick={handleRenameLayout}>
                  Rename Layout
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteLayout(currentLayout.id)}
                  className="text-destructive"
                  disabled={layouts.length <= 1}
                >
                  Delete Layout
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHelp(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>

        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    </header>
  );
};