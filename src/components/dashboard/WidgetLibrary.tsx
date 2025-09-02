import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Grid3X3, Clock, StickyNote, BarChart3, MessageSquare, Music, Map, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WIDGET_COMPONENTS, WidgetComponentName } from '@/components/Layout/WidgetRegistry';

interface WidgetDefinition {
  id: WidgetComponentName;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  minW: number;
  minH: number;
  defaultW: number;
  defaultH: number;
}

const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: 'SampleClock',
    name: 'Digital Clock',
    description: 'Real-time digital clock display',
    icon: <Clock className="w-5 h-5" />,
    category: 'Utilities',
    minW: 3,
    minH: 3,
    defaultW: 4,
    defaultH: 4
  },
  {
    id: 'SampleNote',
    name: 'Note Widget',
    description: 'Take and save notes with auto-sync',
    icon: <StickyNote className="w-5 h-5" />,
    category: 'Productivity',
    minW: 4,
    minH: 4,
    defaultW: 5,
    defaultH: 6
  },
  {
    id: 'SampleChart',
    name: 'Data Chart',
    description: 'Interactive data visualization',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'Analytics',
    minW: 4,
    minH: 4,
    defaultW: 6,
    defaultH: 6
  },
  {
    id: 'AnalyticsWidget',
    name: 'Analytics Dashboard',
    description: 'Comprehensive analytics and metrics',
    icon: <Grid3X3 className="w-5 h-5" />,
    category: 'Analytics',
    minW: 6,
    minH: 6,
    defaultW: 8,
    defaultH: 8
  },
  {
    id: 'ChatWidget',
    name: 'Assistant Chat',
    description: 'AI-powered chat assistant',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'Communication',
    minW: 4,
    minH: 6,
    defaultW: 6,
    defaultH: 8
  },
  {
    id: 'AudioWidget',
    name: 'Audio Player',
    description: 'Music and audio playback controls',
    icon: <Music className="w-5 h-5" />,
    category: 'Media',
    minW: 4,
    minH: 6,
    defaultW: 6,
    defaultH: 8
  },
  {
    id: 'MapWidget',
    name: 'Interactive Map',
    description: 'Location and mapping services',
    icon: <Map className="w-5 h-5" />,
    category: 'Location',
    minW: 4,
    minH: 4,
    defaultW: 6,
    defaultH: 6
  },
  {
    id: 'BaseWidget',
    name: 'Base Widget',
    description: 'Template widget for development',
    icon: <Cpu className="w-5 h-5" />,
    category: 'System',
    minW: 3,
    minH: 3,
    defaultW: 4,
    defaultH: 4
  }
];

interface WidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widgetDef: WidgetDefinition) => void;
}

export default function WidgetLibrary({ isOpen, onClose, onAddWidget }: WidgetLibraryProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(WIDGET_DEFINITIONS.map(w => w.category)))];
  
  const filteredWidgets = WIDGET_DEFINITIONS.filter(widget => {
    const matchesSearch = widget.name.toLowerCase().includes(search.toLowerCase()) ||
                         widget.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || widget.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="crt-card max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b crt-border">
          <div>
            <h2 className="text-2xl font-bold crt-text">Widget Library</h2>
            <p className="text-sm crt-muted mt-1">Add widgets to your dashboard</p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b crt-border space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 crt-muted" />
            <Input
              placeholder="Search widgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Widget Grid */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWidgets.map(widget => (
              <motion.div
                key={widget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="crt-card border hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => onAddWidget(widget)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="crt-accent">
                        {widget.icon}
                      </div>
                      <div>
                        <h3 className="font-medium crt-text text-sm">{widget.name}</h3>
                        <Badge variant="outline" className="text-xs mt-1">
                          {widget.category}
                        </Badge>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 crt-muted group-hover:crt-accent transition-colors" />
                  </div>
                  
                  <p className="text-xs crt-muted mb-3">{widget.description}</p>
                  
                  <div className="text-xs crt-muted">
                    Size: {widget.defaultW}×{widget.defaultH} (min: {widget.minW}×{widget.minH})
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredWidgets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 opacity-50">🔍</div>
              <p className="crt-muted">No widgets match your search criteria</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}