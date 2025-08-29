import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImageDisplayWidgetProps {
  settings?: Record<string, any>;
  widgetName?: string;
  onSettingsUpdate?: (newSettings: Record<string, any>) => void;
}

export const ImageDisplayWidget: React.FC<ImageDisplayWidgetProps> = ({ 
  settings, 
  widgetName, 
  onSettingsUpdate 
}) => {
  const [fullscreenImage, setFullscreenImage] = useState<{url: string, title: string} | null>(null);
  
  // Debug logging
  console.log('ImageDisplayWidget received settings:', settings);
  console.log('ImageDisplayWidget widgetName:', widgetName);
  
  // Get current settings with defaults
  const containerCount = settings?.containerCount || 1;
  const layoutPattern = settings?.layoutPattern || '1';
  const containers = settings?.containers || [{
    id: '1',
    title: 'Image Container 1',
    imageUrl: '',
    layout: 'card',
    borderStyle: 'solid',
    borderColor: 'border',
    isMonochrome: false,
    monochromeColor: '#000000'
  }];

  console.log('ImageDisplayWidget containerCount:', containerCount);
  console.log('ImageDisplayWidget containers:', containers);

  const getBorderClasses = (container: any) => {
    const styleMap: Record<string, string> = {
      'none': '',
      'solid': 'border',
      'dashed': 'border border-dashed',
      'dotted': 'border border-dotted'
    };
    
    const colorMap: Record<string, string> = {
      'border': 'border-border',
      'border-primary': 'border-primary',
      'border-accent': 'border-accent',
      'border-muted': 'border-muted',
      'border-destructive': 'border-destructive'
    };

    const baseStyle = styleMap[container.borderStyle] || 'border';
    const colorStyle = colorMap[container.borderColor] || 'border-border';
    
    return container.borderStyle === 'none' ? '' : `${baseStyle} ${colorStyle}`;
  };

  const handleImageClick = (imageUrl: string, title: string) => {
    setFullscreenImage({ url: imageUrl, title });
  };

  const renderImageWithClick = (container: any, className: string = "") => {
    if (!container.imageUrl) {
      return (
        <div className="w-full h-32 bg-muted/30 rounded flex items-center justify-center border-2 border-dashed border-muted">
          <span className="text-muted-foreground text-sm font-mono">No image uploaded</span>
        </div>
      );
    }

    return (
      <div 
        className={`relative w-full cursor-pointer group ${className}`}
        onClick={() => handleImageClick(container.imageUrl, container.title)}
      >
        <img
          src={container.imageUrl}
          alt={container.title}
          className="w-full h-auto max-h-64 object-cover rounded transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
          <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

  const renderContainer = (container: any, index: number) => {
    const borderClasses = getBorderClasses(container);
    
    switch (container.layout) {
      case 'minimal':
        return (
          <div key={container.id} className={`p-4 space-y-3 h-full rounded ${borderClasses}`}>
            <h3 className="font-semibold text-foreground text-sm">{container.title}</h3>
            {renderImageWithClick(container)}
          </div>
        );

      case 'banner':
        return (
          <div key={container.id} className={`bg-primary/10 border-l-4 border-primary p-4 space-y-3 h-full rounded ${borderClasses}`}>
            <h3 className="font-bold text-foreground text-sm">{container.title}</h3>
            {renderImageWithClick(container)}
          </div>
        );

      case 'rounded':
        return (
          <div key={container.id} className={`p-4 space-y-3 h-full rounded-xl bg-background/50 ${borderClasses}`}>
            <h3 className="font-semibold text-foreground text-sm text-center">{container.title}</h3>
            {renderImageWithClick(container)}
          </div>
        );

      case 'shadow':
        return (
          <div key={container.id} className={`p-4 space-y-3 h-full rounded-lg shadow-lg bg-background ${borderClasses}`}>
            <h3 className="font-semibold text-foreground text-sm">{container.title}</h3>
            {renderImageWithClick(container)}
          </div>
        );

      default: // card
        return (
          <Card key={container.id} className={`h-full ${borderClasses}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-sm">{container.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderImageWithClick(container)}
            </CardContent>
          </Card>
        );
    }
  };

  const getLayoutGrid = () => {
    // Define layout patterns
    const layoutConfigs: Record<string, { pattern: number[] }> = {
      '1': { pattern: [1] },
      '1-1': { pattern: [1, 1] },
      '2': { pattern: [2] },
      '1-1-1': { pattern: [1, 1, 1] },
      '2-1': { pattern: [2, 1] },
      '1-2': { pattern: [1, 2] },
      '3': { pattern: [3] },
      '1-1-1-1': { pattern: [1, 1, 1, 1] },
      '2-2': { pattern: [2, 2] },
      '3-1': { pattern: [3, 1] },
      '1-3': { pattern: [1, 3] },
      '2-1-1': { pattern: [2, 1, 1] },
      '1-2-1': { pattern: [1, 2, 1] },
      '1-1-2': { pattern: [1, 1, 2] },
      '4': { pattern: [4] },
      '1-1-1-1-1': { pattern: [1, 1, 1, 1, 1] },
      '2-2-1': { pattern: [2, 2, 1] },
      '2-1-2': { pattern: [2, 1, 2] },
      '1-2-2': { pattern: [1, 2, 2] },
      '3-2': { pattern: [3, 2] },
      '2-3': { pattern: [2, 3] },
      '5': { pattern: [5] },
      '1-1-1-1-1-1': { pattern: [1, 1, 1, 1, 1, 1] },
      '2-2-2': { pattern: [2, 2, 2] },
      '3-3': { pattern: [3, 3] },
      '4-2': { pattern: [4, 2] },
      '2-4': { pattern: [2, 4] },
      '6': { pattern: [6] }
    };

    const config = layoutConfigs[layoutPattern] || layoutConfigs['1'];
    let containerIndex = 0;

    return (
      <div className="space-y-4">
        {config.pattern.map((cols, rowIndex) => (
          <div key={rowIndex} className={`grid gap-4 ${cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : cols === 4 ? 'grid-cols-4' : cols === 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
            {Array.from({ length: cols }, (_, colIndex) => {
              const container = containers[containerIndex];
              containerIndex++;
              return container ? renderContainer(container, containerIndex - 1) : null;
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Content Display */}
      <div className="flex-1 overflow-auto p-4">
        {getLayoutGrid()}
      </div>

      {/* Fullscreen Image Modal */}
      <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white border border-white/20"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Image Title */}
            {fullscreenImage?.title && (
              <div className="absolute top-4 left-4 z-50 bg-black/50 px-3 py-1 rounded text-white font-mono text-sm">
                {fullscreenImage.title}
              </div>
            )}

            {/* Fullscreen Image */}
            {fullscreenImage && (
              <img
                src={fullscreenImage.url}
                alt={fullscreenImage.title}
                className="max-w-full max-h-full object-contain cursor-pointer"
                onClick={() => setFullscreenImage(null)}
              />
            )}

            {/* Click to close hint */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-sm font-mono">
              Click image or ✕ to close
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};