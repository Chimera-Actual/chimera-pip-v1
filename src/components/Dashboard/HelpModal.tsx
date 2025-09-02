// Help Modal with Keyboard Shortcuts and Usage Guide
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Keyboard, 
  Mouse, 
  Monitor, 
  Zap, 
  Info,
  Lightbulb,
  Settings
} from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { shortcuts } = useKeyboardShortcuts();

  const tips = [
    {
      title: 'Widget Positioning',
      description: 'Drag widgets from the catalog to any position on the grid. Widgets snap to grid cells automatically.',
      icon: <Monitor className="w-4 h-4" />,
    },
    {
      title: 'Cross-Panel Movement',
      description: 'Drag widgets between panels to organize your workspace. Drop zones appear when dragging.',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      title: 'Widget Resizing',
      description: 'Select a widget and use the resize handles to adjust its size. Each widget has minimum and maximum size limits.',
      icon: <Settings className="w-4 h-4" />,
    },
    {
      title: 'Layout Templates',
      description: 'Use predefined layout templates for quick setup. Templates include Productivity, Monitoring, Media, and Development presets.',
      icon: <Lightbulb className="w-4 h-4" />,
    },
  ];

  const mouseActions = [
    { action: 'Left Click', description: 'Select widget or UI element' },
    { action: 'Drag', description: 'Move widgets or resize panels' },
    { action: 'Right Click', description: 'Context menu (where available)' },
    { action: 'Double Click', description: 'Toggle widget collapse' },
    { action: 'Scroll', description: 'Navigate through widget catalog' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2">
            <Info className="w-5 h-5" />
            Dashboard Help & Shortcuts
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="shortcuts" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shortcuts" className="flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Shortcuts
            </TabsTrigger>
            <TabsTrigger value="mouse" className="flex items-center gap-2">
              <Mouse className="w-4 h-4" />
              Mouse Actions
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Tips & Tricks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shortcuts" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground font-mono mb-4">
                  Use these keyboard shortcuts to navigate and control the dashboard efficiently:
                </div>
                
                <div className="grid gap-3">
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        "bg-background/50 border border-border/50"
                      )}
                    >
                      <span className="text-sm text-foreground">
                        {shortcut.description}
                      </span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {shortcut.key}
                      </Badge>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground font-mono mt-4">
                  <div className="mb-2">Note: Shortcuts are disabled when typing in input fields.</div>
                  <div>Ctrl key works as Cmd key on macOS systems.</div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="mouse" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground font-mono mb-4">
                  Mouse interactions for dashboard control:
                </div>
                
                <div className="grid gap-3">
                  {mouseActions.map((action, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        "bg-background/50 border border-border/50"
                      )}
                    >
                      <span className="text-sm text-foreground">
                        {action.description}
                      </span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {action.action}
                      </Badge>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground font-mono mt-4">
                  <div className="mb-2">Drag operations show visual feedback with drop zones.</div>
                  <div>Panel resize handles appear between panels.</div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tips" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground font-mono mb-4">
                  Pro tips for maximizing your dashboard experience:
                </div>
                
                <div className="grid gap-4">
                  {tips.map((tip, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-lg border border-border/50",
                        "bg-background/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-primary mt-0.5">
                          {tip.icon}
                        </div>
                        <div>
                          <h3 className="font-mono font-semibold text-sm text-foreground mb-2">
                            {tip.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {tip.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-mono font-semibold text-sm text-primary mb-2">
                        Auto-Save Enabled
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Your dashboard layout is automatically saved every 2 seconds. 
                        No need to manually save your changes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};