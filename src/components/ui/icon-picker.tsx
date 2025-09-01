import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import * as Icons from 'lucide-react';

// Commonly used icons organized by category
const iconCategories = {
  'General': [
    'Home', 'Settings', 'User', 'Search', 'Plus', 'Minus', 'Edit', 'Trash2', 'Save', 'Copy',
    'Check', 'X', 'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown', 'MoreHorizontal',
    'Heart', 'Star', 'Bookmark', 'Flag', 'Bell', 'Mail', 'Phone', 'MessageCircle'
  ],
  'Navigation': [
    'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Menu', 'Grid3X3', 'List',
    'Filter', 'Sort', 'Refresh', 'RotateCcw', 'RotateCw', 'ZoomIn', 'ZoomOut',
    'Maximize', 'Minimize', 'Move', 'Navigation', 'Compass'
  ],
  'Media & Files': [
    'Play', 'Pause', 'Square', 'SkipForward', 'SkipBack', 'Volume2', 'VolumeX',
    'Image', 'Video', 'Music', 'File', 'FileText', 'Folder', 'Download', 'Upload',
    'Camera', 'Mic', 'Monitor', 'Smartphone', 'Tablet'
  ],
  'Technology': [
    'Wifi', 'Bluetooth', 'Battery', 'Zap', 'Cpu', 'HardDrive', 'Server', 'Database',
    'Cloud', 'Globe', 'Link', 'Code', 'Terminal', 'Gauge', 'Activity', 'Radio',
    'Satellite', 'Router', 'Plug'
  ],
  'Maps & Location': [
    'Map', 'MapPin', 'Navigation2', 'Compass', 'Globe2', 'Car', 'Plane', 'Ship',
    'Train', 'Bike', 'Walk', 'Footprints', 'Route', 'Milestone', 'Building',
    'Building2', 'Store', 'Factory', 'Landmark'
  ],
  'Charts & Data': [
    'BarChart', 'BarChart2', 'BarChart3', 'LineChart', 'PieChart', 'TrendingUp',
    'TrendingDown', 'Target', 'Crosshair', 'Eye', 'EyeOff', 'Scan', 'QrCode',
    'Hash', 'Percent', 'Calculator'
  ],
  'Weather & Time': [
    'Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'Zap', 'Wind', 'Thermometer',
    'Clock', 'Clock3', 'Clock9', 'Clock12', 'Calendar', 'CalendarDays', 'Timer',
    'Hourglass', 'Sunrise', 'Sunset'
  ],
  'Tools & Objects': [
    'Wrench', 'Hammer', 'Screwdriver', 'Scissors', 'Paintbrush', 'Palette',
    'Ruler', 'Pencil', 'Pen', 'PenTool', 'Eraser', 'Pipette', 'Flashlight',
    'Key', 'Lock', 'Unlock', 'Shield', 'ShieldCheck'
  ]
};

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string) => void;
  currentIcon?: string;
  title?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  isOpen,
  onClose,
  onSelectIcon,
  currentIcon,
  title = "Select Icon"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('General');

  // Get all available icons from the selected category
  const categoryIcons = useMemo(() => {
    const category = iconCategories[selectedCategory as keyof typeof iconCategories] || [];
    return category.filter(iconName => 
      iconName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedCategory, searchTerm]);

  // Search across all categories if there's a search term
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    
    const allIcons = Object.values(iconCategories).flat();
    return allIcons.filter(iconName =>
      iconName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const iconsToShow = searchTerm ? searchResults : categoryIcons;

  const handleIconSelect = (iconName: string) => {
    onSelectIcon(iconName);
    onClose();
  };

  const renderIcon = (iconName: string) => {
    // Get the icon component from lucide-react
    const IconComponent = (Icons as any)[iconName];
    if (!IconComponent) return null;

    return (
      <Button
        key={iconName}
        variant={currentIcon === iconName ? "default" : "outline"}
        className="h-12 w-12 p-2 hover:bg-primary/20"
        onClick={() => handleIconSelect(iconName)}
        title={iconName}
      >
        <IconComponent className="w-6 h-6" />
      </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-wider text-primary">
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 font-mono"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Categories (only show when not searching) */}
          {!searchTerm && (
            <div className="w-48 border-r border-border pr-4">
              <div className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Categories
              </div>
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {Object.keys(iconCategories).map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "ghost"}
                      className="w-full justify-start font-mono text-xs"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {iconCategories[category as keyof typeof iconCategories].length}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Icon Grid */}
          <div className="flex-1">
            <div className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-3">
              {searchTerm ? `Search Results (${iconsToShow.length})` : `${selectedCategory} Icons (${iconsToShow.length})`}
            </div>
            <ScrollArea className="h-full">
              <div className="grid grid-cols-8 gap-2 pb-4">
                {iconsToShow.map((iconName) => renderIcon(iconName))}
              </div>
              {iconsToShow.length === 0 && (
                <div className="text-center text-muted-foreground py-8 font-mono">
                  No icons found matching "{searchTerm}"
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <div className="text-xs font-mono text-muted-foreground">
            {currentIcon && `Current: ${currentIcon}`}
          </div>
          <Button variant="outline" onClick={onClose} className="font-mono">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};