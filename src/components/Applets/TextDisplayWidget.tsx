import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Type, AlignLeft, AlignCenter, AlignRight, Palette, Layout, Edit3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TextDisplayWidgetProps {
  settings?: Record<string, any>;
  widgetName?: string;
  onSettingsUpdate?: (newSettings: Record<string, any>) => void;
}

type LayoutStyle = 'card' | 'minimal' | 'banner' | 'quote' | 'highlight';
type TextSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl';
type TextAlign = 'left' | 'center' | 'right';
type ColorTheme = 'default' | 'primary' | 'accent' | 'muted' | 'success' | 'warning' | 'destructive';

export const TextDisplayWidget: React.FC<TextDisplayWidgetProps> = ({ settings, widgetName, onSettingsUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Get current settings with defaults
  const currentTitle = settings?.title || 'Welcome';
  const currentContent = settings?.content || 'This is your text display widget. Click the edit button to customize the content and try different layout options below.';
  const currentLayout = settings?.layout || 'card';
  const currentTextSize = settings?.textSize || 'base';
  const currentTextAlign = settings?.textAlign || 'left';
  const currentColorTheme = settings?.colorTheme || 'default';

  const handleLayoutChange = (layout: LayoutStyle) => {
    onSettingsUpdate?.({
      ...settings,
      layout
    });
  };

  const handleTextSizeChange = (textSize: TextSize) => {
    onSettingsUpdate?.({
      ...settings,
      textSize
    });
  };

  const handleTextAlignChange = (textAlign: TextAlign) => {
    onSettingsUpdate?.({
      ...settings,
      textAlign
    });
  };

  const handleColorThemeChange = (colorTheme: ColorTheme) => {
    onSettingsUpdate?.({
      ...settings,
      colorTheme
    });
  };

  const handleSaveEdit = () => {
    onSettingsUpdate?.({
      ...settings,
      title: editTitle,
      content: editContent
    });
    setIsEditing(false);
  };

  const openEditDialog = () => {
    setEditTitle(currentTitle);
    setEditContent(currentContent);
    setIsEditing(true);
  };

  const getTextSizeClass = (size: TextSize) => {
    const sizeMap = {
      'sm': 'text-sm',
      'base': 'text-base',
      'lg': 'text-lg',
      'xl': 'text-xl',
      '2xl': 'text-2xl'
    };
    return sizeMap[size];
  };

  const getTextAlignClass = (align: TextAlign) => {
    const alignMap = {
      'left': 'text-left',
      'center': 'text-center',
      'right': 'text-right'
    };
    return alignMap[align];
  };

  const getColorThemeClasses = (theme: ColorTheme) => {
    const themeMap = {
      'default': 'text-foreground',
      'primary': 'text-primary',
      'accent': 'text-accent-foreground',
      'muted': 'text-muted-foreground',
      'success': 'text-green-600 dark:text-green-400',
      'warning': 'text-yellow-600 dark:text-yellow-400',
      'destructive': 'text-destructive'
    };
    return themeMap[theme];
  };

  const renderContent = () => {
    const textClasses = `${getTextSizeClass(currentTextSize)} ${getTextAlignClass(currentTextAlign)} ${getColorThemeClasses(currentColorTheme)}`;
    
    switch (currentLayout) {
      case 'minimal':
        return (
          <div className="p-6 space-y-4">
            <h3 className={`font-semibold ${textClasses}`}>{currentTitle}</h3>
            <p className={`${textClasses} leading-relaxed`}>{currentContent}</p>
          </div>
        );

      case 'banner':
        return (
          <div className="bg-primary/10 border-l-4 border-primary p-6 space-y-4">
            <h3 className={`font-bold ${textClasses}`}>{currentTitle}</h3>
            <p className={`${textClasses} leading-relaxed`}>{currentContent}</p>
          </div>
        );

      case 'quote':
        return (
          <div className="p-6 space-y-4 border-l-4 border-muted-foreground/30 bg-muted/30">
            <blockquote className={`italic ${textClasses} leading-relaxed`}>
              "{currentContent}"
            </blockquote>
            <cite className={`text-sm font-medium ${getColorThemeClasses('muted')} block ${getTextAlignClass(currentTextAlign)}`}>
              — {currentTitle}
            </cite>
          </div>
        );

      case 'highlight':
        return (
          <div className="p-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg border space-y-4">
            <h3 className={`font-bold ${textClasses} flex items-center gap-2`}>
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              {currentTitle}
            </h3>
            <p className={`${textClasses} leading-relaxed`}>{currentContent}</p>
          </div>
        );

      default: // card
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className={`${textClasses}`}>{currentTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${textClasses} leading-relaxed`}>{currentContent}</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      {/* Layout Controls */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-muted-foreground" />
          <Label className="text-xs font-mono">LAYOUT:</Label>
          <Select value={currentLayout} onValueChange={handleLayoutChange}>
            <SelectTrigger className="w-24 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="quote">Quote</SelectItem>
              <SelectItem value="highlight">Highlight</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-muted-foreground" />
          <Label className="text-xs font-mono">SIZE:</Label>
          <Select value={currentTextSize} onValueChange={handleTextSizeChange}>
            <SelectTrigger className="w-16 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">SM</SelectItem>
              <SelectItem value="base">BASE</SelectItem>
              <SelectItem value="lg">LG</SelectItem>
              <SelectItem value="xl">XL</SelectItem>
              <SelectItem value="2xl">2XL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={currentTextAlign === 'left' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTextAlignChange('left')}
            className="h-7 w-7 p-0"
          >
            <AlignLeft className="w-3 h-3" />
          </Button>
          <Button
            variant={currentTextAlign === 'center' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTextAlignChange('center')}
            className="h-7 w-7 p-0"
          >
            <AlignCenter className="w-3 h-3" />
          </Button>
          <Button
            variant={currentTextAlign === 'right' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTextAlignChange('right')}
            className="h-7 w-7 p-0"
          >
            <AlignRight className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <Select value={currentColorTheme} onValueChange={handleColorThemeChange}>
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="accent">Accent</SelectItem>
              <SelectItem value="muted">Muted</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="destructive">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={openEditDialog}
          className="h-7 ml-auto"
        >
          <Edit3 className="w-3 h-3 mr-1" />
          Edit Text
        </Button>
      </div>

      {/* Content Display */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary">Edit Text Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-mono">Title</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter title..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="content" className="text-sm font-mono">Content</Label>
              <Textarea
                id="content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Enter your text content..."
                className="mt-1 min-h-24"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="font-mono"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="font-mono"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};