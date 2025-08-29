import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, Trash2, Grid, Layout } from 'lucide-react';

interface TextContainer {
  id: string;
  title: string;
  content: string;
  layout: string;
  textSize: string;
  textAlign: string;
  colorTheme: string;
}

interface TextDisplaySettingsProps {
  settings: Record<string, any>;
  onSettingsChange: (settings: Record<string, any>) => void;
  onClose: () => void;
}

const LAYOUT_CONFIGURATIONS = {
  1: [{ name: '1', pattern: [1] }],
  2: [
    { name: '1-1', pattern: [1, 1] },
    { name: '2', pattern: [2] }
  ],
  3: [
    { name: '1-1-1', pattern: [1, 1, 1] },
    { name: '2-1', pattern: [2, 1] },
    { name: '1-2', pattern: [1, 2] },
    { name: '3', pattern: [3] }
  ],
  4: [
    { name: '1-1-1-1', pattern: [1, 1, 1, 1] },
    { name: '2-2', pattern: [2, 2] },
    { name: '3-1', pattern: [3, 1] },
    { name: '1-3', pattern: [1, 3] },
    { name: '2-1-1', pattern: [2, 1, 1] },
    { name: '1-2-1', pattern: [1, 2, 1] },
    { name: '1-1-2', pattern: [1, 1, 2] },
    { name: '4', pattern: [4] }
  ],
  5: [
    { name: '1-1-1-1-1', pattern: [1, 1, 1, 1, 1] },
    { name: '2-2-1', pattern: [2, 2, 1] },
    { name: '2-1-2', pattern: [2, 1, 2] },
    { name: '1-2-2', pattern: [1, 2, 2] },
    { name: '3-2', pattern: [3, 2] },
    { name: '2-3', pattern: [2, 3] },
    { name: '5', pattern: [5] }
  ],
  6: [
    { name: '1-1-1-1-1-1', pattern: [1, 1, 1, 1, 1, 1] },
    { name: '2-2-2', pattern: [2, 2, 2] },
    { name: '3-3', pattern: [3, 3] },
    { name: '4-2', pattern: [4, 2] },
    { name: '2-4', pattern: [2, 4] },
    { name: '6', pattern: [6] }
  ]
};

export const TextDisplaySettings: React.FC<TextDisplaySettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const [containerCount, setContainerCount] = useState(settings.containerCount || 1);
  const [layoutPattern, setLayoutPattern] = useState(settings.layoutPattern || '1');
  const [containers, setContainers] = useState<TextContainer[]>(
    settings.containers || [{
      id: '1',
      title: 'Welcome',
      content: 'This is your text display widget.',
      layout: 'card',
      textSize: 'base',
      textAlign: 'left',
      colorTheme: 'default'
    }]
  );

  const handleContainerCountChange = (count: string) => {
    const newCount = parseInt(count);
    setContainerCount(newCount);
    
    // Adjust containers array
    const newContainers = [...containers];
    if (newCount > containers.length) {
      // Add new containers
      for (let i = containers.length; i < newCount; i++) {
        newContainers.push({
          id: (i + 1).toString(),
          title: `Container ${i + 1}`,
          content: `This is container ${i + 1}.`,
          layout: 'card',
          textSize: 'base',
          textAlign: 'left',
          colorTheme: 'default'
        });
      }
    } else if (newCount < containers.length) {
      // Remove excess containers
      newContainers.splice(newCount);
    }
    
    setContainers(newContainers);
    
    // Reset layout pattern to first available option
    const availableLayouts = LAYOUT_CONFIGURATIONS[newCount as keyof typeof LAYOUT_CONFIGURATIONS] || [];
    if (availableLayouts.length > 0) {
      setLayoutPattern(availableLayouts[0].name);
    }
  };

  const updateContainer = (index: number, field: keyof TextContainer, value: string) => {
    const newContainers = [...containers];
    newContainers[index] = { ...newContainers[index], [field]: value };
    setContainers(newContainers);
  };

  const handleSave = () => {
    const newSettings = {
      containerCount,
      layoutPattern,
      containers: containers.slice(0, containerCount)
    };
    onSettingsChange(newSettings);
    onClose();
  };

  const availableLayouts = LAYOUT_CONFIGURATIONS[containerCount as keyof typeof LAYOUT_CONFIGURATIONS] || [];

  return (
    <div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
      {/* Container Configuration */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary flex items-center gap-2">
          <Grid className="w-4 h-4" />
          CONTAINER CONFIGURATION
        </Label>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground font-mono">NUMBER OF CONTAINERS</Label>
            <Select value={containerCount.toString()} onValueChange={handleContainerCountChange}>
              <SelectTrigger className="font-mono bg-background/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <SelectItem key={num} value={num.toString()} className="font-mono">
                    {num} Container{num > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground font-mono">LAYOUT PATTERN</Label>
            <Select value={layoutPattern} onValueChange={setLayoutPattern}>
              <SelectTrigger className="font-mono bg-background/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {availableLayouts.map(layout => (
                  <SelectItem key={layout.name} value={layout.name} className="font-mono">
                    {layout.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Layout Preview */}
        <div className="p-3 bg-muted/20 rounded border">
          <Label className="text-xs text-muted-foreground font-mono mb-2 block">LAYOUT PREVIEW</Label>
          <div className="space-y-1">
            {availableLayouts.find(l => l.name === layoutPattern)?.pattern.map((width, rowIndex) => (
              <div key={rowIndex} className="flex gap-1">
                {Array.from({ length: width }, (_, colIndex) => (
                  <div
                    key={colIndex}
                    className="h-6 bg-primary/20 rounded flex-1 flex items-center justify-center text-xs font-mono"
                  >
                    {rowIndex * Math.max(...availableLayouts.find(l => l.name === layoutPattern)?.pattern || [1]) + colIndex + 1}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Container Content Settings */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary flex items-center gap-2">
          <Layout className="w-4 h-4" />
          CONTAINER CONTENT
        </Label>

        <div className="space-y-4">
          {containers.slice(0, containerCount).map((container, index) => (
            <Card key={container.id} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono text-foreground">
                  Container {index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground font-mono">TITLE</Label>
                    <Input
                      value={container.title}
                      onChange={(e) => updateContainer(index, 'title', e.target.value)}
                      className="font-mono text-xs"
                      placeholder="Container title..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground font-mono">LAYOUT STYLE</Label>
                    <Select
                      value={container.layout}
                      onValueChange={(value) => updateContainer(index, 'layout', value)}
                    >
                      <SelectTrigger className="font-mono text-xs bg-background/50">
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
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground font-mono">CONTENT</Label>
                  <Textarea
                    value={container.content}
                    onChange={(e) => updateContainer(index, 'content', e.target.value)}
                    className="font-mono text-xs min-h-20"
                    placeholder="Container content..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground font-mono">TEXT SIZE</Label>
                    <Select
                      value={container.textSize}
                      onValueChange={(value) => updateContainer(index, 'textSize', value)}
                    >
                      <SelectTrigger className="font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="base">Base</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">XL</SelectItem>
                        <SelectItem value="2xl">2XL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground font-mono">ALIGNMENT</Label>
                    <Select
                      value={container.textAlign}
                      onValueChange={(value) => updateContainer(index, 'textAlign', value)}
                    >
                      <SelectTrigger className="font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground font-mono">COLOR THEME</Label>
                    <Select
                      value={container.colorTheme}
                      onValueChange={(value) => updateContainer(index, 'colorTheme', value)}
                    >
                      <SelectTrigger className="font-mono text-xs">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose} className="font-mono">
          CANCEL
        </Button>
        <Button onClick={handleSave} className="font-mono">
          <Save className="w-4 h-4 mr-2" />
          SAVE SETTINGS
        </Button>
      </div>
    </div>
  );
};