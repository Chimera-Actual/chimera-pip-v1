// Widget Catalog Panel for Left Sidebar
import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Search, Grid3x3, Package } from 'lucide-react';

import { WidgetRegistry } from '../Layout/WidgetRegistry';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import type { WidgetCatalogItem } from '@/types/dashboard';

interface DraggableWidgetItemProps {
  item: WidgetCatalogItem;
}

const DraggableWidgetItem: React.FC<DraggableWidgetItemProps> = ({ item }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `catalog-${item.id}`,
    data: {
      type: 'catalog-item',
      data: item,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group p-3 border border-border/50 rounded-lg cursor-grab active:cursor-grabbing",
        "bg-card/50 hover:bg-card/80 transition-all duration-200",
        "hover:border-primary/50 hover:shadow-[0_0_10px_rgba(var(--primary),0.2)]",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-xl">{item.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm font-medium text-foreground truncate">
            {item.name}
          </div>
          {item.description && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </div>
          )}
          <div className="flex items-center gap-1 mt-2">
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WidgetCatalogPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const widgets = WidgetRegistry.getAll();

  // Convert to catalog items
  const catalogItems: WidgetCatalogItem[] = widgets.map(widget => ({
    id: widget.id,
    name: widget.name,
    description: widget.description,
    icon: widget.icon,
    category: widget.category,
    componentName: widget.component_name,
    defaultSettings: widget.default_settings || {},
    defaultSize: {
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    },
    minSize: { width: 1, height: 1 },
  }));

  // Filter widgets
  const filteredWidgets = catalogItems.filter((widget) => {
    const matchesSearch = !searchQuery || 
      widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      widget.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || widget.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(catalogItems.map(w => w.category))).sort();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="font-mono text-lg font-semibold">WIDGETS</h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 border-b border-border/50">
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Widget List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredWidgets.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Grid3x3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <div className="font-mono text-sm">
                {searchQuery ? 'No widgets match your search' : 'No widgets available'}
              </div>
            </div>
          ) : (
            filteredWidgets.map((widget) => (
              <DraggableWidgetItem key={widget.id} item={widget} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 text-center">
        <div className="text-xs text-muted-foreground font-mono">
          {filteredWidgets.length} widgets available
        </div>
      </div>
    </div>
  );
};