import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Save, Plus, Upload, Palette, RotateCcw, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageContainer {
  id: string;
  title: string;
  imageUrl: string;
  layout: string;
  borderStyle: string;
  borderColor: string;
  isMonochrome: boolean;
  monochromeColor: string;
}

interface ImageDisplaySettingsProps {
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

export const ImageDisplaySettings: React.FC<ImageDisplaySettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const [containerCount, setContainerCount] = useState(settings.containerCount || 1);
  const [layoutPattern, setLayoutPattern] = useState(settings.layoutPattern || '1');
  const [containers, setContainers] = useState<ImageContainer[]>(
    settings.containers || [{
      id: '1',
      title: 'Image Container 1',
      imageUrl: '',
      layout: 'card',
      borderStyle: 'solid',
      borderColor: 'border',
      isMonochrome: false,
      monochromeColor: '#000000'
    }]
  );

  const { toast } = useToast();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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
          title: `Image Container ${i + 1}`,
          imageUrl: '',
          layout: 'card',
          borderStyle: 'solid',
          borderColor: 'border',
          isMonochrome: false,
          monochromeColor: '#000000'
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

  const removeContainer = (index: number) => {
    if (containers.length > 1) {
      const newContainers = containers.filter((_, i) => i !== index);
      // Update IDs to be sequential
      const updatedContainers = newContainers.map((container, i) => ({
        ...container,
        id: (i + 1).toString()
      }));
      setContainers(updatedContainers);
      
      // Adjust container count if needed
      const newCount = Math.min(containerCount, updatedContainers.length);
      setContainerCount(newCount);
      
      // Reset layout pattern for new count
      const availableLayouts = LAYOUT_CONFIGURATIONS[newCount as keyof typeof LAYOUT_CONFIGURATIONS] || [];
      if (availableLayouts.length > 0) {
        setLayoutPattern(availableLayouts[0].name);
      }
      
      toast({
        title: "Container Removed",
        description: "Image container has been removed",
      });
    }
  };

  const moveContainer = (index: number, direction: 'up' | 'down') => {
    const newContainers = [...containers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newContainers.length) {
      // Swap containers
      [newContainers[index], newContainers[targetIndex]] = [newContainers[targetIndex], newContainers[index]];
      
      // Update IDs to maintain sequential order
      const updatedContainers = newContainers.map((container, i) => ({
        ...container,
        id: (i + 1).toString()
      }));
      
      setContainers(updatedContainers);
    }
  };

  const updateContainer = (index: number, field: keyof ImageContainer, value: string | boolean) => {
    const newContainers = [...containers];
    newContainers[index] = { ...newContainers[index], [field]: value };
    setContainers(newContainers);
  };

  const handleImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      updateContainer(index, 'imageUrl', imageUrl);
      toast({
        title: "Image Uploaded",
        description: "Image has been successfully uploaded",
      });
    };
    reader.readAsDataURL(file);
  };

  const convertToMonochrome = async (index: number, originalImageUrl: string, color: string) => {
    return new Promise<string>((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Convert color to RGB
          const hex = color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          
          // Apply monochrome effect with the selected color
          for (let i = 0; i < data.length; i += 4) {
            // Calculate grayscale value
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const intensity = gray / 255;
            
            // Apply the color tint based on intensity
            data[i] = r * intensity;     // Red
            data[i + 1] = g * intensity; // Green
            data[i + 2] = b * intensity; // Blue
            // Alpha channel (data[i + 3]) remains unchanged
          }
          
          // Put modified image data back
          ctx.putImageData(imageData, 0, 0);
          
          // Convert to data URL
          resolve(canvas.toDataURL());
        }
      };
      
      img.src = originalImageUrl;
    });
  };

  const handleMonochromeToggle = async (index: number) => {
    const container = containers[index];
    
    if (!container.isMonochrome && container.imageUrl) {
      // Convert to monochrome
      const monochromeImageUrl = await convertToMonochrome(index, container.imageUrl, container.monochromeColor);
      updateContainer(index, 'imageUrl', monochromeImageUrl);
      updateContainer(index, 'isMonochrome', true);
      
      toast({
        title: "Monochrome Applied",
        description: "Image converted to monochrome style",
      });
    }
  };

  const handleColorChange = async (index: number, color: string) => {
    updateContainer(index, 'monochromeColor', color);
    
    const container = containers[index];
    if (container.isMonochrome && container.imageUrl) {
      // Re-apply monochrome with new color
      const monochromeImageUrl = await convertToMonochrome(index, container.imageUrl, color);
      updateContainer(index, 'imageUrl', monochromeImageUrl);
    }
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
          <Upload className="w-4 h-4" />
          IMAGE CONTAINER CONFIGURATION
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
                ))
                }
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
                ))
                }
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
                ))
                }
              </div>
            ))
            }
          </div>
        </div>
      </div>

      {/* Container Content Settings */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary flex items-center gap-2">
          <Palette className="w-4 h-4" />
          IMAGE CONTAINER CONTENT
        </Label>

        <div className="space-y-4">
          {containers.slice(0, containerCount).map((container, index) => (
            <Card key={container.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono text-foreground">
                    Container {index + 1}
                  </CardTitle>
                  <div className="flex gap-1">
                    {/* Move Up Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveContainer(index, 'up')}
                      disabled={index === 0}
                      className="p-1 h-6 w-6"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    {/* Move Down Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveContainer(index, 'down')}
                      disabled={index === containerCount - 1}
                      className="p-1 h-6 w-6"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContainer(index)}
                      disabled={containers.length <= 1}
                      className="p-1 h-6 w-6 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
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
                        <SelectItem value="rounded">Rounded</SelectItem>
                        <SelectItem value="shadow">Shadow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground font-mono">IMAGE UPLOAD</Label>
                  <div className="mt-1 space-y-2">
                    <input
                      ref={el => fileInputRefs.current[container.id] = el}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(index, file);
                        }
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRefs.current[container.id]?.click()}
                      className="w-full font-mono text-xs"
                    >
                      <Upload className="w-3 h-3 mr-2" />
                      {container.imageUrl ? 'Replace Image' : 'Upload Image'}
                    </Button>
                    
                    {container.imageUrl && (
                      <div className="relative">
                        <img
                          src={container.imageUrl}
                          alt={container.title}
                          className="w-full h-20 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {container.imageUrl && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground font-mono">MONOCHROME COLOR</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={container.monochromeColor}
                          onChange={(e) => handleColorChange(index, e.target.value)}
                          className="w-12 h-8 p-1 rounded"
                        />
                        <Input
                          value={container.monochromeColor}
                          onChange={(e) => handleColorChange(index, e.target.value)}
                          className="font-mono text-xs"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-xs text-muted-foreground font-mono">ACTIONS</Label>
                      <Button
                        type="button"
                        onClick={() => handleMonochromeToggle(index)}
                        variant={container.isMonochrome ? "default" : "outline"}
                        className="font-mono text-xs"
                        disabled={!container.imageUrl}
                      >
                        <Palette className="w-3 h-3 mr-1" />
                        Apply Monochrome
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground font-mono">BORDER STYLE</Label>
                    <Select
                      value={container.borderStyle}
                      onValueChange={(value) => updateContainer(index, 'borderStyle', value)}
                    >
                      <SelectTrigger className="font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="dashed">Dashed</SelectItem>
                        <SelectItem value="dotted">Dotted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground font-mono">BORDER COLOR</Label>
                    <Select
                      value={container.borderColor}
                      onValueChange={(value) => updateContainer(index, 'borderColor', value)}
                    >
                      <SelectTrigger className="font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="border">Default</SelectItem>
                        <SelectItem value="border-primary">Primary</SelectItem>
                        <SelectItem value="border-accent">Accent</SelectItem>
                        <SelectItem value="border-muted">Muted</SelectItem>
                        <SelectItem value="border-destructive">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
          }
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
