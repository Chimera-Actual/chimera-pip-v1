import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, Hash, Settings } from 'lucide-react';
import { WidgetDefinition } from '@/hooks/useWidgetManager';
import { WidgetTagManager } from './WidgetTagManager';
import WidgetLibraryCard from './WidgetLibraryCard';
import { useWidgetIconManager } from '@/hooks/useWidgetIconManager';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface WidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  availableWidgets: WidgetDefinition[];
  onAddWidget: (widgetId: string) => void;
  tabCategory: string;
  onAddTag: (widgetId: string, tag: string) => Promise<any>;
  onRemoveTag: (widgetId: string, tag: string) => Promise<any>;
  allUserTags: string[];
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  isOpen,
  onClose,
  availableWidgets,
  onAddWidget,
  tabCategory,
  onAddTag,
  onRemoveTag,
  allUserTags,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [tagManagerWidget, setTagManagerWidget] = useState<WidgetDefinition | null>(null);
  const [editMode, setEditMode] = useState(false);
  const { updateWidgetIcon } = useWidgetIconManager();

  const availableTags = ['all', ...allUserTags];

  const filteredWidgets = availableWidgets.filter(widget => {
    const matchesSearch = widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         widget.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || 
                      (widget.user_tags && widget.user_tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });

  const handleAddWidget = (widgetId: string) => {
    onAddWidget(widgetId);
    onClose();
  };

  const openTagManager = (widget: WidgetDefinition) => {
    setTagManagerWidget(widget);
  };

  const closeTagManager = () => {
    setTagManagerWidget(null);
  };

  const handleUpdateIcon = async (widgetId: string, newIcon: string) => {
    try {
      await updateWidgetIcon(widgetId, newIcon);
      toast({
        title: "Icon Updated",
        description: `Widget icon changed to ${newIcon}`,
      });
    } catch (error) {
      logger.error('Failed to update widget icon', error, 'WidgetLibrary');
      toast({
        title: "Update Failed", 
        description: "Cannot modify widget definitions (admin only)",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2">
            <Package className="w-5 h-5" />
            WIDGET LIBRARY - {tabCategory.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 font-mono bg-background/50 border-border"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {availableTags.map(tag => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                  className="font-mono text-xs uppercase"
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          {/* Widget Grid */}
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {filteredWidgets.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground font-mono">
                  {searchQuery || selectedTag !== 'all' 
                    ? 'No widgets match your search criteria.'
                    : 'No widgets available for this tab.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {filteredWidgets.map(widget => (
                  <WidgetLibraryCard
                    key={widget.id}
                    widget={widget}
                    onAddWidget={handleAddWidget}
                    onUpdateIcon={handleUpdateIcon}
                    onOpenTagManager={openTagManager}
                    showIconEdit={editMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className="font-mono text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            {editMode ? 'EXIT EDIT' : 'EDIT MODE'}
          </Button>
          <div className="text-xs font-mono text-muted-foreground">
            {editMode && 'Double-click widget icons to edit'}
          </div>
        </div>

        <WidgetTagManager
          isOpen={!!tagManagerWidget}
          onClose={closeTagManager}
          widget={tagManagerWidget}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
        />
      </DialogContent>
    </Dialog>
  );
};