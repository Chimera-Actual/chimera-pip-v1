import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FileText, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SampleNoteSettingsProps {
  settings: Record<string, any>;
  onSettingsChange: (settings: Record<string, any>) => void;
  onClose: () => void;
}

export const SampleNoteSettings: React.FC<SampleNoteSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState({
    showLineNumbers: settings.showLineNumbers ?? true,
    fontSize: settings.fontSize || 'text-sm',
    theme: settings.theme || 'default',
    autoSave: settings.autoSave ?? true,
    title: settings.title || 'Notes Terminal',
    content: settings.content || '',
    ...settings
  });

  const handleSave = () => {
    onSettingsChange(localSettings);
    toast({
      title: "Settings Saved",
      description: "Notes terminal settings have been updated.",
    });
    onClose();
  };

  const updateSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Notes Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Terminal Title</Label>
            <Input
              id="title"
              value={localSettings.title}
              onChange={(e) => updateSetting('title', e.target.value)}
              placeholder="Enter terminal title"
            />
          </div>

          <div className="space-y-2">
            <Label>Font Size</Label>
            <Select 
              value={localSettings.fontSize} 
              onValueChange={(value) => updateSetting('fontSize', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text-xs">Extra Small</SelectItem>
                <SelectItem value="text-sm">Small</SelectItem>
                <SelectItem value="text-base">Medium</SelectItem>
                <SelectItem value="text-lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Theme</Label>
            <Select 
              value={localSettings.theme} 
              onValueChange={(value) => updateSetting('theme', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="matrix">Matrix</SelectItem>
                <SelectItem value="amber">Amber</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showLineNumbers">Line Numbers</Label>
            <Switch
              id="showLineNumbers"
              checked={localSettings.showLineNumbers}
              onCheckedChange={(checked) => updateSetting('showLineNumbers', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoSave">Auto Save</Label>
            <Switch
              id="autoSave"
              checked={localSettings.autoSave}
              onCheckedChange={(checked) => updateSetting('autoSave', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Default Content</Label>
            <Textarea
              id="content"
              value={localSettings.content}
              onChange={(e) => updateSetting('content', e.target.value)}
              placeholder="Enter default terminal content..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};