import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Package } from 'lucide-react';
import { WidgetDefinition } from '@/hooks/useWidgetManager';

interface WidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  availableWidgets: WidgetDefinition[];
  onAddWidget: (widgetId: string) => void;
  tabCategory: string;
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  isOpen,
  onClose,
  availableWidgets,
  onAddWidget,
  tabCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(availableWidgets.map(w => w.category)))];

  const filteredWidgets = availableWidgets.filter(widget => {
    const matchesSearch = widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         widget.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddWidget = (widgetId: string) => {
    onAddWidget(widgetId);
    onClose();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      navigation: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      environment: 'bg-green-500/20 text-green-300 border-green-500/50',
      utility: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
      system: 'bg-red-500/20 text-red-300 border-red-500/50',
      communication: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      productivity: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
      entertainment: 'bg-pink-500/20 text-pink-300 border-pink-500/50',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
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
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="font-mono text-xs uppercase"
                >
                  {category}
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
                  {searchQuery || selectedCategory !== 'all' 
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
                            <Badge 
                              variant="outline" 
                              className={`text-xs mt-1 ${getCategoryColor(widget.category)}`}
                            >
                              {widget.category}
                            </Badge>
                          </div>
                        </div>
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
      </DialogContent>
    </Dialog>
  );
};