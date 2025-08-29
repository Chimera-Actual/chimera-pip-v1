import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TabContent } from './TabContent';
import { UserAvatar } from './UserAvatar';
import { TabManager } from './TabManager';
import { useTabManager, UserTab } from '@/hooks/useTabManager';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';

export type AppletType = 'user-info' | 'user-profile' | 'clock' | 'map' | 'weather' | 'email' | 'calendar' | 'radio' | 'browser' | 'chat' | 'voice' | 'system-settings';

export type TabType = 'status' | 'apps' | 'settings';

export interface Applet {
  id: AppletType;
  name: string;
  icon: string;
  component: React.ComponentType<any>;
}

export interface TabCategory {
  id: string;
  name: string;
  applets: Applet[];
}

interface PipBoyLayoutProps {
  tabs?: TabCategory[];
}

export const PipBoyLayout: React.FC<PipBoyLayoutProps> = () => {
  const {
    userTabs,
    loading,
    createTab,
    updateTab,
    deleteTab,
    reorderTabs,
    canDeleteTab,
  } = useTabManager();
  
  const [activeTab, setActiveTab] = useState<string>('');
  const [showTabManager, setShowTabManager] = useState(false);
  const { toast } = useToast();

  // Set the first tab as active when tabs load
  useEffect(() => {
    if (userTabs.length > 0 && !activeTab) {
      setActiveTab(userTabs[0].id);
    }
  }, [userTabs, activeTab]);

  const handleCreateTab = async (name: string, icon: string) => {
    try {
      const newTab = await createTab(name, icon);
      if (newTab) {
        setActiveTab(newTab.id);
      }
      return newTab;
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteTab = async (tabId: string) => {
    try {
      await deleteTab(tabId);
      
      // If we deleted the active tab, switch to the first remaining tab
      if (activeTab === tabId && userTabs.length > 1) {
        const remainingTab = userTabs.find(t => t.id !== tabId);
        if (remainingTab) {
          setActiveTab(remainingTab.id);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-background crt-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <div className="text-lg font-mono text-primary crt-glow">INITIALIZING SYSTEM...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-background crt-screen overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 h-16 bg-card border-b border-border px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-mono font-bold text-primary crt-glow uppercase tracking-wider">
              PIP-BOY 3000
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowTabManager(true)}
              variant="ghost"
              size="sm"
              className="font-mono text-xs opacity-70 hover:opacity-100"
            >
              <Settings className="w-4 h-4 mr-2" />
              MANAGE TABS
            </Button>
            <UserAvatar />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 border-b border-border bg-card/50">
          <TabsList className="w-full h-14 bg-transparent rounded-none border-none p-0">
            {userTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 h-full rounded-none bg-transparent data-[state=active]:bg-primary/20 data-[state=active]:border-b-2 data-[state=active]:border-primary font-mono uppercase tracking-wider text-sm hover:bg-muted/50 transition-colors"
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {userTabs.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className="w-full h-full m-0 overflow-hidden data-[state=inactive]:hidden"
            >
              <TabContent tab={tab} />
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Tab Manager Dialog */}
      <TabManager
        isOpen={showTabManager}
        onClose={() => setShowTabManager(false)}
        tabs={userTabs}
        onCreateTab={handleCreateTab}
        onUpdateTab={updateTab}
        onDeleteTab={handleDeleteTab}
        onReorderTabs={reorderTabs}
        canDeleteTab={canDeleteTab}
      />
    </div>
  );
};