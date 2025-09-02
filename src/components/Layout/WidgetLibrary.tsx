import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Package, Tags, Hash } from 'lucide-react';
import { WidgetDefinition } from '@/hooks/useWidgetManager';
import { WidgetTagManager } from './WidgetTagManager';

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
                  <Card key={widget.id} className="bg-background/30 border-border hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{widget.icon}</div>
                          <div className="flex-1">
                            <CardTitle className="text-sm font-mono text-primary">
                              {widget.name}
                            </CardTitle>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {widget.user_tags && widget.user_tags.length > 0 ? (
                                widget.user_tags.map(tag => (
                                  <Badge 
                                    key={tag}
                                    variant="secondary" 
                                    className="text-xs font-mono"
                                  >
                                    {tag}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                                  No tags
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openTagManager(widget)}
                          className="text-muted-foreground hover:text-primary p-1"
                        >
                          <Tags className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {widget.description && (
                        <CardDescription className="text-xs font-mono text-muted-foreground mb-3">
                          {widget.description}
                        </CardDescription>
                      )}
                      
                      <Button
                        onClick={() => handleAddWidget(widget.id)}
                        size="sm"
                        className="w-full font-mono text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        ADD WIDGET
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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