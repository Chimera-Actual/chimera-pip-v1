import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserWidgetInstance } from '@/hooks/useWidgetManager';
import { Edit, Save, X } from 'lucide-react';

interface WidgetRenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  widget: UserWidgetInstance | null;
  onRename: (instanceId: string, newName: string) => Promise<any>;
}

export const WidgetRenameDialog: React.FC<WidgetRenameDialogProps> = ({
  isOpen,
  onClose,
  widget,
  onRename
}) => {
  const [customName, setCustomName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (widget) {
      setCustomName(widget.custom_name || widget.widget_definition?.name || '');
    }
  }, [widget]);

  const handleSave = async () => {
    if (!widget || !customName.trim()) return;

    setIsSaving(true);
    try {
      await onRename(widget.id, customName.trim());
      onClose();
    } catch (error) {
      console.error('Failed to rename widget:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (widget?.widget_definition?.name) {
      setCustomName(widget.widget_definition.name);
    }
  };

  if (!widget) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Rename Widget
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded border">
            <span className="text-xl">{widget.widget_definition?.icon}</span>
            <div>
              <div className="text-sm font-mono font-medium">
                {widget.widget_definition?.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {widget.widget_definition?.description}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="widget-name" className="text-sm font-mono">
              Custom Name
            </Label>
            <Input
              id="widget-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter custom widget name..."
              className="font-mono"
              maxLength={50}
            />
            <div className="text-xs text-muted-foreground">
              Leave empty to use default name
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              className="font-mono text-xs"
              disabled={isSaving}
            >
              Reset to Default
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="font-mono"
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="font-mono"
              disabled={isSaving || !customName.trim()}
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save Name'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};