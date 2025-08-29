import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tags, Plus, X, Hash } from 'lucide-react';
import { WidgetDefinition } from '@/hooks/useWidgetManager';
import { toast } from 'sonner';

interface WidgetTagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  widget: WidgetDefinition | null;
  onAddTag: (widgetId: string, tag: string) => Promise<any>;
  onRemoveTag: (widgetId: string, tag: string) => Promise<any>;
}

export const WidgetTagManager: React.FC<WidgetTagManagerProps> = ({
  isOpen,
  onClose,
  widget,
  onAddTag,
  onRemoveTag,
}) => {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!widget) return null;

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    const tagToAdd = newTag.trim().toLowerCase();
    
    // Check if tag already exists
    if (widget.user_tags?.includes(tagToAdd)) {
      toast.error('Tag already exists for this widget');
      return;
    }

    setIsAdding(true);
    try {
      await onAddTag(widget.id, tagToAdd);
      setNewTag('');
      toast.success('Tag added successfully');
    } catch (error) {
      toast.error('Failed to add tag');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await onRemoveTag(widget.id, tag);
      toast.success('Tag removed successfully');
    } catch (error) {
      toast.error('Failed to remove tag');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2">
            <Tags className="w-5 h-5" />
            Manage Widget Tags
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Widget Info */}
          <Card className="bg-background/30 border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{widget.icon}</div>
                <div>
                  <CardTitle className="text-sm font-mono text-primary">
                    {widget.name}
                  </CardTitle>
                  <CardDescription className="text-xs font-mono text-muted-foreground">
                    {widget.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Add New Tag */}
          <div className="space-y-2">
            <label className="text-sm font-mono text-primary uppercase tracking-wider">
              Add New Tag
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter tag name..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 font-mono bg-background/50 border-border"
                  disabled={isAdding}
                />
              </div>
              <Button
                onClick={handleAddTag}
                size="sm"
                disabled={!newTag.trim() || isAdding}
                className="font-mono px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Current Tags */}
          <div className="space-y-2">
            <label className="text-sm font-mono text-primary uppercase tracking-wider">
              Current Tags ({widget.user_tags?.length || 0})
            </label>
            <ScrollArea className="max-h-32">
              <div className="flex flex-wrap gap-2 p-1">
                {widget.user_tags && widget.user_tags.length > 0 ? (
                  widget.user_tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="font-mono text-xs gap-1 pr-1"
                    >
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTag(tag)}
                        className="w-4 h-4 p-0 hover:bg-destructive/20 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs font-mono text-muted-foreground">
                    No tags assigned to this widget yet.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              className="font-mono text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};