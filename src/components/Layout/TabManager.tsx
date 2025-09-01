import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, GripVertical, Save, X } from 'lucide-react';
import { UserTab } from '@/hooks/useTabManager';
import { useToast } from '@/hooks/use-toast';

interface TabManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: UserTab[];
  onCreateTab: (name: string, icon: string, fontSize: string) => Promise<UserTab | null>;
  onUpdateTab: (tabId: string, updates: Partial<Pick<UserTab, 'name' | 'icon' | 'font_size'>>) => Promise<UserTab | undefined>;
  onDeleteTab: (tabId: string) => Promise<void>;
  onReorderTabs: (tabIds: string[]) => Promise<void>;
  canDeleteTab: (tabId: string) => boolean;
}

export const TabManager: React.FC<TabManagerProps> = ({
  isOpen,
  onClose,
  tabs,
  onCreateTab,
  onUpdateTab,
  onDeleteTab,
  onReorderTabs,
  canDeleteTab,
}) => {
  const [newTabName, setNewTabName] = useState('');
  const [newTabIcon, setNewTabIcon] = useState('◉');
  const [newTabFontSize, setNewTabFontSize] = useState('text-sm');
  const [editingTab, setEditingTab] = useState<UserTab | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editFontSize, setEditFontSize] = useState('text-sm');
  const [creating, setCreating] = useState(false);
  const [draggedTab, setDraggedTab] = useState<UserTab | null>(null);
  const { toast } = useToast();

  const fontSizeOptions = [
    { value: 'text-xs', label: 'Extra Small' },
    { value: 'text-sm', label: 'Small' },
    { value: 'text-base', label: 'Medium' },
    { value: 'text-lg', label: 'Large' },
    { value: 'text-xl', label: 'Extra Large' },
  ];

  const handleCreateTab = async () => {
    if (!newTabName.trim()) {
      toast({
        title: "Error",
        description: "Tab name is required",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      await onCreateTab(newTabName.trim(), newTabIcon, newTabFontSize);
      setNewTabName('');
      setNewTabIcon('◉');
      setNewTabFontSize('text-sm');
      toast({
        title: "Tab Created",
        description: `"${newTabName}" tab has been created`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tab. Name might already exist.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (tab: UserTab) => {
    setEditingTab(tab);
    setEditName(tab.name);
    setEditIcon(tab.icon);
    setEditFontSize(tab.font_size || 'text-sm');
  };

  const handleSaveEdit = async () => {
    if (!editingTab || !editName.trim()) return;

    try {
      await onUpdateTab(editingTab.id, {
        name: editName.trim().toUpperCase(),
        icon: editIcon,
        font_size: editFontSize
      });
      
      setEditingTab(null);
      setEditName('');
      setEditIcon('');
      setEditFontSize('text-sm');
      
      toast({
        title: "Tab Updated",
        description: "Tab has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tab",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTab(null);
    setEditName('');
    setEditIcon('');
    setEditFontSize('text-sm');
  };

  const handleDeleteTab = async (tab: UserTab) => {
    if (!canDeleteTab(tab.id)) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete the last remaining tab",
        variant: "destructive"
      });
      return;
    }

    try {
      await onDeleteTab(tab.id);
      toast({
        title: "Tab Deleted",
        description: `"${tab.name}" tab has been deleted`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tab",
        variant: "destructive"
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, tab: UserTab) => {
    setDraggedTab(tab);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTab: UserTab) => {
    e.preventDefault();
    
    if (!draggedTab || draggedTab.id === targetTab.id) return;

    const newTabs = [...tabs];
    const draggedIndex = newTabs.findIndex(t => t.id === draggedTab.id);
    const targetIndex = newTabs.findIndex(t => t.id === targetTab.id);

    // Remove dragged tab and insert at target position
    newTabs.splice(draggedIndex, 1);
    newTabs.splice(targetIndex, 0, draggedTab);

    // Update order
    onReorderTabs(newTabs.map(t => t.id));
    setDraggedTab(null);
  };

  // Expanded icon selection with categories
  const iconCategories = {
    system: ['⚙', '◉', '◈', '◎', '◐', '◔', '☰', '⌘', '⚡', '🔋', '💾', '🖥', '📡', '🔗'],
    media: ['♫', '🎵', '🎧', '📷', '🎬', '🎮', '📺', '📻', '🔊', '🔇', '⏯', '⏸', '⏹', '⏪'],
    communication: ['✉', '📧', '💬', '📞', '📱', '🌐', '👥', '📢', '📣', '📨', '📩', '📫', '📬', '📭'],
    productivity: ['📊', '📈', '📉', '📋', '📝', '📄', '📁', '📂', '🗃', '🗂', '📆', '📅', '⏰', '⏲'],
    navigation: ['🗺', '🧭', '📍', '🎯', '🔍', '🔎', '👁', '❤', '⭐', '🔖', '🏠', '📐', '🛠', '🔧'],
    weather: ['☀', '⛅', '☁', '🌧', '⛈', '❄', '🌡', '💨', '🌈', '⚡', '🔥', '💧', '🌊', '🌀'],
    symbols: ['🚀', '✨', '💎', '🎪', '🎨', '🎭', '🎯', '🎲', '🧩', '🔮', '💡', '🔬', '🔭', '⚗']
  };
  
  const allIcons = Object.values(iconCategories).flat();
  const commonIcons = allIcons;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] bg-card border-border p-0">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <DialogTitle className="text-lg md:text-xl font-mono text-primary uppercase tracking-wider crt-glow">
            TAB MANAGEMENT
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-4 pb-4">
          <div className="space-y-4 md:space-y-6 py-2">
          {/* Create New Tab */}
          <Card className="bg-background/30 border-border">
            <CardContent className="p-3 md:p-4">
              <div className="space-y-3 md:space-y-4">
                <div className="text-sm font-mono text-primary uppercase tracking-wider">
                  CREATE NEW TAB
                </div>
                
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-4 md:gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-xs font-mono text-muted-foreground">TAB NAME</Label>
                    <Input
                      value={newTabName}
                      onChange={(e) => setNewTabName(e.target.value)}
                      placeholder="Enter tab name..."
                      className="font-mono bg-background/50 border-border h-10 md:h-9"
                      maxLength={20}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs font-mono text-muted-foreground">ICON</Label>
                    <div className="grid grid-cols-8 gap-1 mb-3 max-h-32 overflow-y-auto">
                      {Object.entries(iconCategories).map(([category, icons]) => (
                        <React.Fragment key={category}>
                          {icons.slice(0, 8).map(icon => (
                            <Button
                              key={icon}
                              variant={newTabIcon === icon ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0 text-xs icon-monochrome hover:scale-110 transition-transform"
                              onClick={() => setNewTabIcon(icon)}
                              title={`${category}: ${icon}`}
                            >
                              {icon}
                            </Button>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                    <Input
                      value={newTabIcon}
                      onChange={(e) => setNewTabIcon(e.target.value)}
                      placeholder="Or type custom icon..."
                      className="font-mono bg-background/50 border-border text-center h-10 md:h-9"
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-mono text-muted-foreground">FONT SIZE</Label>
                    <Select value={newTabFontSize} onValueChange={setNewTabFontSize}>
                      <SelectTrigger className="font-mono bg-background/50 border-border h-10 md:h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontSizeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="font-mono min-h-10 md:min-h-8">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button
                  onClick={handleCreateTab}
                  disabled={!newTabName.trim() || creating}
                  className="font-mono h-10 md:h-9 w-full md:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {creating ? 'CREATING...' : 'CREATE TAB'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Tabs */}
          <div className="space-y-2">
            <div className="text-sm font-mono text-primary uppercase tracking-wider">
              EXISTING TABS ({tabs.length})
            </div>
            
            <div className="max-h-96 md:max-h-64 overflow-y-auto">
              <div className="space-y-2 pr-2">
                {tabs.map((tab, index) => (
                  <Card
                    key={tab.id}
                    className="bg-background/30 border-border transition-colors hover:border-primary/50"
                    draggable
                    onDragStart={(e) => handleDragStart(e, tab)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, tab)}
                  >
                    <CardContent className="p-3 md:p-3">
                      {editingTab?.id === tab.id ? (
                        <div className="space-y-3">
                          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-4 md:gap-3">
                            <div className="md:col-span-2">
                              <Label className="text-xs font-mono text-muted-foreground">TAB NAME</Label>
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="font-mono bg-background/50 border-border h-10 md:h-9"
                                maxLength={20}
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-mono text-muted-foreground">ICON</Label>
                              <Input
                                value={editIcon}
                                onChange={(e) => setEditIcon(e.target.value)}
                                className="font-mono bg-background/50 border-border text-center h-10 md:h-9"
                                maxLength={2}
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-mono text-muted-foreground">FONT SIZE</Label>
                              <Select value={editFontSize} onValueChange={setEditFontSize}>
                                <SelectTrigger className="font-mono bg-background/50 border-border h-10 md:h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fontSizeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="font-mono min-h-10 md:min-h-8">
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-col md:flex-row">
                            <Button onClick={handleSaveEdit} size="sm" className="font-mono h-10 md:h-8">
                              <Save className="w-3 h-3 mr-1" />
                              SAVE
                            </Button>
                            <Button onClick={handleCancelEdit} variant="outline" size="sm" className="font-mono h-10 md:h-8">
                              <X className="w-3 h-3 mr-1" />
                              CANCEL
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            <span className="text-lg">{tab.icon}</span>
                            <div>
                              <div className={`font-mono text-foreground font-medium ${tab.font_size || 'text-sm'}`}>
                                {tab.name}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                Position: {index + 1} • Font: {fontSizeOptions.find(opt => opt.value === (tab.font_size || 'text-sm'))?.label}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-1 md:gap-1">
                            <Button
                              onClick={() => handleStartEdit(tab)}
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 md:h-8 md:w-8 p-0 opacity-70 hover:opacity-100 touch-target"
                            >
                              <Edit className="h-4 w-4 md:h-3 md:w-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteTab(tab)}
                              disabled={!canDeleteTab(tab.id)}
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 md:h-8 md:w-8 p-0 opacity-70 hover:opacity-100 hover:text-destructive disabled:opacity-30 touch-target"
                            >
                              <Trash2 className="h-4 w-4 md:h-3 md:w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Help text moved inside the dialog content */}
          <div className="text-xs text-muted-foreground font-mono space-y-1 bg-background/20 border border-border rounded p-3 mt-4">
            <div>• Drag tabs to reorder them (desktop only)</div>
            <div>• Tab names must be unique</div>
            <div>• Font size affects tab title display</div>
            <div>• At least one tab must remain</div>
            <div>• Deleting a tab removes all its widgets</div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
