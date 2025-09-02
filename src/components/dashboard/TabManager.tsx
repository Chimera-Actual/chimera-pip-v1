import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Edit3, Settings, Monitor, Activity, Users, Calendar, BarChart3, MessageSquare, Music, Map, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DashboardTab } from '@/hooks/useDashboardTabs';
import { LucideIcon } from 'lucide-react';

const AVAILABLE_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: 'Monitor', icon: Monitor },
  { name: 'Activity', icon: Activity },
  { name: 'Users', icon: Users },
  { name: 'Calendar', icon: Calendar },
  { name: 'Chart', icon: BarChart3 },
  { name: 'Chat', icon: MessageSquare },
  { name: 'Music', icon: Music },
  { name: 'Map', icon: Map },
  { name: 'Zap', icon: Zap },
  { name: 'Target', icon: Target },
];

interface TabManagerProps {
  tabs: DashboardTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabCreate: (name: string, iconName: string) => void;
  onTabDelete: (tabId: string) => void;
  onTabUpdate: (tabId: string, updates: Partial<DashboardTab>) => void;
  onTabReorder: (sourceIndex: number, destinationIndex: number) => void;
}

interface TabEditModalProps {
  tab: DashboardTab;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, iconName: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function TabEditModal({ tab, isOpen, onClose, onSave, onDelete, canDelete }: TabEditModalProps) {
  const [name, setName] = useState(tab.name);
  const [selectedIcon, setSelectedIcon] = useState<string>(tab.icon || 'Monitor');

  const handleSave = () => {
    onSave(name, selectedIcon);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="crt-card">
        <DialogHeader>
          <DialogTitle className="crt-text">Edit Tab</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm crt-muted mb-2">Tab Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tab name"
              className="crt-input"
            />
          </div>
          
          <div>
            <label className="block text-sm crt-muted mb-2">Icon</label>
            <Select value={selectedIcon} onValueChange={setSelectedIcon}>
              <SelectTrigger className="crt-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="crt-card">
                {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                  <SelectItem key={name} value={name} className="flex items-center">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button
              onClick={onDelete}
              variant="outline"
              className="text-red-400 hover:text-red-300"
              disabled={!canDelete}
            >
              <X className="w-4 h-4 mr-2" />
              Delete Tab
            </Button>
            
            <div className="space-x-2">
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave} className="crt-button">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface NewTabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, iconName: string) => void;
}

function NewTabModal({ isOpen, onClose, onCreate }: NewTabModalProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Monitor');

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), selectedIcon);
      setName('');
      setSelectedIcon('Monitor');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="crt-card">
        <DialogHeader>
          <DialogTitle className="crt-text">Create New Tab</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm crt-muted mb-2">Tab Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tab name"
              className="crt-input"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          
          <div>
            <label className="block text-sm crt-muted mb-2">Icon</label>
            <Select value={selectedIcon} onValueChange={setSelectedIcon}>
              <SelectTrigger className="crt-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="crt-card">
                {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                  <SelectItem key={name} value={name}>
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleCreate} className="crt-button" disabled={!name.trim()}>
              Create Tab
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TabManager({
  tabs,
  activeTabId,
  onTabSelect,
  onTabCreate,
  onTabDelete,
  onTabUpdate,
  onTabReorder
}: TabManagerProps) {
  const [editingTab, setEditingTab] = useState<DashboardTab | null>(null);
  const [showNewTabModal, setShowNewTabModal] = useState(false);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    onTabReorder(result.source.index, result.destination.index);
  };

  const handleTabEdit = (tab: DashboardTab, name: string, iconName: string) => {
    onTabUpdate(tab.id, { name, icon: iconName });
  };

  return (
    <div className="border-b crt-border bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tabs" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex items-center space-x-2"
              >
                {tabs.map((tab, index) => {
                  const IconComponent = AVAILABLE_ICONS.find(i => i.name === tab.icon)?.icon || Monitor;
                  return (
                    <Draggable key={tab.id} draggableId={tab.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-all group ${
                            activeTabId === tab.id
                              ? 'crt-card crt-accent'
                              : 'hover:crt-card hover:bg-muted/20'
                          } ${snapshot.isDragging ? 'shadow-lg z-50' : ''}`}
                        >
                          <div {...provided.dragHandleProps} className="flex items-center space-x-2">
                            <IconComponent className="w-4 h-4" />
                            <span 
                              className="text-sm font-mono"
                              onClick={() => onTabSelect(tab.id)}
                            >
                              {tab.name}
                            </span>
                          </div>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTab(tab);
                            }}
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Button
          onClick={() => setShowNewTabModal(true)}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Tab</span>
        </Button>
      </div>

      {editingTab && (
        <TabEditModal
          tab={editingTab}
          isOpen={!!editingTab}
          onClose={() => setEditingTab(null)}
          onSave={(name, iconName) => handleTabEdit(editingTab, name, iconName)}
          onDelete={() => {
            onTabDelete(editingTab.id);
            setEditingTab(null);
          }}
          canDelete={tabs.length > 1}
        />
      )}

      <NewTabModal
        isOpen={showNewTabModal}
        onClose={() => setShowNewTabModal(false)}
        onCreate={onTabCreate}
      />
    </div>
  );
}