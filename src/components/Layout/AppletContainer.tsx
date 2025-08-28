import React, { useState, useEffect } from 'react';
import { AppletType, Applet } from './PipBoyLayout';
import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface Assistant {
  id: string;
  name: string;
  description: string;
  webhookUrl: string;
  icon: string;
}

interface AppletContainerProps {
  activeApplet: AppletType;
  applets: Applet[];
  tabName?: string;
  onAppletChange: (applet: AppletType) => void;
}

const defaultAssistants: Assistant[] = [
  {
    id: 'general',
    name: 'GENERAL AI',
    description: 'General purpose assistant',
    webhookUrl: '',
    icon: '◎'
  },
  {
    id: 'technical',
    name: 'TECH SUPPORT',
    description: 'Technical troubleshooting',
    webhookUrl: '',
    icon: '⚡'
  },
  {
    id: 'creative',
    name: 'CREATIVE AI',
    description: 'Creative writing & ideation',
    webhookUrl: '',
    icon: '✦'
  },
  {
    id: 'data',
    name: 'DATA ANALYST',
    description: 'Data analysis & insights',
    webhookUrl: '',
    icon: '◈'
  }
];

const availableIcons = [
  '◎', '⚡', '✦', '◈', '★', '♦', '▲', '●', '■', '♠',
  '🤖', '💡', '🔧', '📊', '🧠', '⚙️', '🎯', '🔮', '💎', '🚀',
  '📱', '💻', '🖥️', '⌨️', '🖱️', '📡', '🛡️', '🔐', '🔑', '⭐'
];

export const AppletContainer: React.FC<AppletContainerProps> = ({
  activeApplet,
  applets,
  tabName,
  onAppletChange,
}) => {
  const [assistants, setAssistants] = useState<Assistant[]>(defaultAssistants);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant>(assistants[0]);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const currentApplet = applets.find(applet => applet.id === activeApplet);

  // Load webhook configurations on mount
  useEffect(() => {
    const loadWebhookConfigs = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('assistant_webhooks')
        .select('assistant_id, webhook_url')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading webhook configs:', error);
        return;
      }

      // Update assistants with saved webhook URLs
      const updatedAssistants = defaultAssistants.map(assistant => {
        const savedConfig = data.find(config => config.assistant_id === assistant.id);
        return {
          ...assistant,
          webhookUrl: savedConfig?.webhook_url || ''
        };
      });

      setAssistants(updatedAssistants);
      setSelectedAssistant(updatedAssistants[0]);
    };

    loadWebhookConfigs();
  }, [user]);

  const handleEditAssistant = (assistant: Assistant) => {
    setEditingAssistant({ ...assistant });
    setIsEditModalOpen(true);
  };

  const handleSaveAssistant = async () => {
    if (!editingAssistant || !user) return;
    
    const updatedAssistants = assistants.map(assistant =>
      assistant.id === editingAssistant.id ? editingAssistant : assistant
    );
    
    setAssistants(updatedAssistants);
    
    if (selectedAssistant.id === editingAssistant.id) {
      setSelectedAssistant(editingAssistant);
    }

    // Save webhook URL to database if it changed
    try {
      const { error } = await supabase
        .from('assistant_webhooks')
        .upsert({
          user_id: user.id,
          assistant_id: editingAssistant.id,
          webhook_url: editingAssistant.webhookUrl
        });

      if (error) {
        console.error('Error saving webhook config:', error);
        toast({
          title: "Error",
          description: "Failed to save webhook configuration",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Configuration saved",
          description: `Assistant configuration saved successfully`,
        });
      }
    } catch (error) {
      console.error('Error saving webhook config:', error);
    }
    
    setIsEditModalOpen(false);
    setEditingAssistant(null);
  };

  if (!currentApplet) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-destructive font-mono">
          ERROR: APPLET NOT FOUND
        </div>
      </div>
    );
  }

  const AppletComponent = currentApplet.component;

  return (
    <div className="h-full flex bg-background">
      {/* Left Sidebar - Applet Menu */}
      <div className="w-64 border-r border-border bg-card/20 flex flex-col">
        <div className="flex-1 p-2">
          {activeApplet === 'chat' ? (
            // Show AI Agents when in Assistant mode
            <>
              {assistants.map((assistant) => (
                <div
                  key={assistant.id}
                  className={`p-3 border border-border cursor-pointer transition-all hover:bg-primary/10 hover:border-primary/50 mb-2 ${
                    selectedAssistant.id === assistant.id 
                      ? 'bg-primary/20 border-primary text-primary crt-glow' 
                      : 'bg-card text-muted-foreground'
                  }`}
                  onClick={() => setSelectedAssistant(assistant)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{assistant.icon}</span>
                      <div>
                        <div className="font-bold text-xs uppercase tracking-wide">
                          {assistant.name}
                        </div>
                        <div className="text-xs opacity-75">
                          {assistant.description}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAssistant(assistant);
                      }}
                      className="opacity-70 hover:opacity-100 p-1 h-6 w-6"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            // Show regular applets for other modes
            <>
              {applets.map((applet) => (
                <button
                  key={applet.id}
                  onClick={() => onAppletChange(applet.id)}
                  className={`
                    w-full px-3 py-3 text-xs font-mono uppercase tracking-wider border mb-2 transition-colors text-left
                    ${activeApplet === applet.id 
                      ? 'bg-primary/20 text-primary border-primary crt-glow' 
                      : 'bg-background text-muted-foreground border-border hover:bg-accent/10 hover:text-accent hover:border-accent/50'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{applet.icon}</span>
                    <span>{applet.name}</span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Widget Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full p-3 md:p-4">
            {activeApplet === 'chat' ? (
              <AppletComponent selectedAssistant={selectedAssistant} />
            ) : (
              <AppletComponent />
            )}
          </div>
        </main>
      </div>

      {/* Edit Assistant Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary font-mono uppercase">
              Edit Assistant
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Configure the assistant's name, description, icon, and webhook URL for n8n integration.
            </DialogDescription>
          </DialogHeader>
          
          {editingAssistant && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="icon" className="text-xs font-mono uppercase text-muted-foreground">
                  Icon
                </Label>
                <Select
                  value={editingAssistant.icon}
                  onValueChange={(value) => setEditingAssistant({
                    ...editingAssistant,
                    icon: value
                  })}
                >
                  <SelectTrigger className="w-full font-mono bg-background border-border">
                    <SelectValue>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{editingAssistant.icon}</span>
                        <span className="text-sm text-muted-foreground">Current Icon</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    <div className="grid grid-cols-5 gap-1 p-2">
                      {availableIcons.map((icon) => (
                        <SelectItem
                          key={icon}
                          value={icon}
                          className="cursor-pointer hover:bg-accent focus:bg-accent p-2 rounded flex items-center justify-center"
                        >
                          <span className="text-lg">{icon}</span>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name" className="text-xs font-mono uppercase text-muted-foreground">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingAssistant.name}
                  onChange={(e) => setEditingAssistant({
                    ...editingAssistant,
                    name: e.target.value
                  })}
                  className="font-mono"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-xs font-mono uppercase text-muted-foreground">
                  Description
                </Label>
                <Input
                  id="description"
                  value={editingAssistant.description}
                  onChange={(e) => setEditingAssistant({
                    ...editingAssistant,
                    description: e.target.value
                  })}
                  className="font-mono"
                />
              </div>
              
              <div>
                <Label htmlFor="webhook" className="text-xs font-mono uppercase text-muted-foreground">
                  Webhook URL
                </Label>
                <Input
                  id="webhook"
                  value={editingAssistant.webhookUrl}
                  onChange={(e) => setEditingAssistant({
                    ...editingAssistant,
                    webhookUrl: e.target.value
                  })}
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  className="font-mono"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="font-mono"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAssistant}
                  className="font-mono"
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};