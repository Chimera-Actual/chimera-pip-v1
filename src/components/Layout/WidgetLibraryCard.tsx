import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Tags, Settings } from 'lucide-react';
import * as Icons from 'lucide-react';
import { IconPicker } from '@/components/ui/icon-picker';
import { WidgetDefinition } from '@/hooks/useWidgetManager';

interface WidgetLibraryCardProps {
  widget: WidgetDefinition;
  onAddWidget: (widgetId: string) => void;
  onUpdateIcon?: (widgetId: string, newIcon: string) => void;
  onOpenTagManager?: (widget: WidgetDefinition) => void;
  showIconEdit?: boolean;
}

export default function WidgetLibraryCard({ 
  widget, 
  onAddWidget, 
  onUpdateIcon, 
  onOpenTagManager,
  showIconEdit = false 
}: WidgetLibraryCardProps) {
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Get the Lucide icon component - handle both string names and actual icons
  const IconComponent = typeof widget.icon === 'string' && (Icons as any)[widget.icon] 
    ? (Icons as any)[widget.icon] 
    : null;

  const handleIconDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showIconEdit && onUpdateIcon) {
      setShowIconPicker(true);
    }
  };

  const handleIconSelect = async (iconName: string) => {
    if (onUpdateIcon) {
      try {
        await onUpdateIcon(widget.id, iconName);
      } catch (error) {
        console.error('Failed to update icon:', error);
      }
    }
    setShowIconPicker(false);
  };

  return (
    <>
      <Card className="bg-background/30 border-border hover:border-primary/50 transition-colors h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className={`text-2xl flex items-center justify-center w-8 h-8 ${
                  showIconEdit 
                    ? 'cursor-pointer hover:bg-accent hover:text-accent-foreground p-1 rounded transition-colors' 
                    : ''
                }`}
                onDoubleClick={handleIconDoubleClick}
                title={showIconEdit ? 'Double-click to edit icon' : widget.icon}
              >
                {IconComponent ? (
                  <IconComponent className="w-5 h-5 text-primary" />
                ) : (
                  <span className="text-lg">{widget.icon}</span>
                )}
              </div>
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
            {onOpenTagManager && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenTagManager(widget)}
                className="text-muted-foreground hover:text-primary p-1"
              >
                <Tags className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {widget.description && (
            <CardDescription className="text-xs font-mono text-muted-foreground mb-3">
              {widget.description}
            </CardDescription>
          )}
          
          <Button
            onClick={() => onAddWidget(widget.id)}
            size="sm"
            className="w-full font-mono text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            ADD WIDGET
          </Button>
        </CardContent>
      </Card>

      {showIconPicker && (
        <IconPicker
          isOpen={showIconPicker}
          onClose={() => setShowIconPicker(false)}
          onSelectIcon={handleIconSelect}
          currentIcon={typeof widget.icon === 'string' ? widget.icon : undefined}
          title={`Edit Icon for ${widget.name}`}
        />
      )}
    </>
  );
}