import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { TabErrorBoundary } from '@/components/ui/ComprehensiveErrorBoundary';

// Lazy load heavy components
const TabContent = React.lazy(() => import('./TabContent').then(m => ({ default: m.TabContent })));
const UserAvatar = React.lazy(() => import('./UserAvatar').then(m => ({ default: m.UserAvatar })));
const TabManager = React.lazy(() => import('./TabManager').then(m => ({ default: m.TabManager })));

import { useTabManager, UserTab } from '@/hooks/useTabManager';
import { useWidgetManager } from '@/hooks/useWidgetManager';

export type AppletType = 'user-info' | 'user-profile' | 'clock' | 'map' | 'weather' | 'email' | 'calendar' | 'radio' | 'browser' | 'chat' | 'voice' | 'system-settings';

interface PipBoyHeaderProps {
  isMobile: boolean;
}

const PipBoyHeader = React.memo<PipBoyHeaderProps>(({ isMobile }) => (
  <div className={`flex-shrink-0 ${isMobile ? 'h-12' : 'h-16'} bg-card border-b border-border ${isMobile ? 'px-4' : 'px-6'} flex items-center justify-between`}>
    <div className="flex items-center space-x-2">
      <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-mono font-bold text-primary crt-glow uppercase tracking-wider`}>
        {isMobile ? 'CHIMERA' : 'CHIMERA-PIP 3000'}
      </h1>
    </div>
    
    <div className="flex items-center space-x-2">
      <React.Suspense fallback={<div className="w-8 h-8 animate-pulse bg-muted rounded-full" />}>
        <UserAvatar />
      </React.Suspense>
    </div>
  </div>
));

interface TabNavigationProps {
  userTabs: UserTab[];
  activeTab: string;
  isMobile: boolean;
  dragOverTab: string | null;
  onTabDragOver: (e: React.DragEvent, tabId: string) => void;
  onTabDragLeave: (e: React.DragEvent) => void;
  onTabDrop: (e: React.DragEvent, tabId: string) => void;
  onShowTabManager: () => void;
}

const TabNavigation = React.memo<TabNavigationProps>(({ 
  userTabs, 
  activeTab, 
  isMobile, 
  dragOverTab, 
  onTabDragOver, 
  onTabDragLeave, 
  onTabDrop, 
  onShowTabManager 
}) => (
  <div className="flex-shrink-0 border-b border-border bg-card/50">
    <div className="flex items-center">
      <TabsList className={`flex-1 ${isMobile ? 'h-12' : 'h-14'} bg-transparent rounded-none border-none p-0 ${isMobile ? 'overflow-x-auto scrollbar-hide' : ''}`}>
        {userTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            onDragOver={!isMobile ? (e) => onTabDragOver(e, tab.id) : undefined}
            onDragLeave={!isMobile ? onTabDragLeave : undefined}
            onDrop={!isMobile ? (e) => onTabDrop(e, tab.id) : undefined}
            className={`${isMobile ? 'flex-shrink-0 min-w-12 px-2' : 'flex-1'} h-full rounded-none bg-transparent data-[state=active]:bg-primary/20 data-[state=active]:border-b-2 data-[state=active]:border-primary font-mono uppercase tracking-wider hover:bg-muted/50 transition-all duration-200 ${isMobile ? 'text-xs' : tab.font_size || 'text-sm'} ${
              dragOverTab === tab.id && dragOverTab !== activeTab
                ? 'bg-primary/10 border-b-2 border-primary/50 shadow-inner'
                : ''
            } touch-target flex-col items-center justify-center`}
            title={isMobile ? tab.name : undefined}
            aria-label={`Switch to ${tab.name} tab`}
          >
            <span className={`${isMobile ? 'text-lg' : 'mr-2 text-lg'}`}>{tab.icon}</span>
            {!isMobile && (
              <span>{tab.name}</span>
            )}
            {dragOverTab === tab.id && dragOverTab !== activeTab && !isMobile && (
              <span className="ml-2 text-xs opacity-70">DROP HERE</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {/* Manage Tabs Button */}
      <div className={`${isMobile ? 'px-2' : 'px-4'}`}>
        <Button
          onClick={onShowTabManager}
          variant="ghost"
          size="sm"
          className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'} p-0 opacity-70 hover:opacity-100 hover:bg-primary/10 touch-target`}
          title="Manage Tabs"
          aria-label="Open tab management settings"
        >
          <Settings className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
        </Button>
      </div>
    </div>
  </div>
));

export const OptimizedPipBoyLayout: React.FC = React.memo(() => {
  const {
    userTabs,
    loading,
    createTab,
    updateTab,
    deleteTab,
    reorderTabs,
    canDeleteTab,
  } = useTabManager();
  
  const { moveWidgetToTab } = useWidgetManager();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState<string>('');
  const [showTabManager, setShowTabManager] = useState(false);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);
  const { toast } = useToast();

  // Set the first tab as active when tabs load
  useEffect(() => {
    if (userTabs.length > 0 && !activeTab) {
      setActiveTab(userTabs[0].id);
    }
  }, [userTabs, activeTab]);

  const handleCreateTab = useCallback(async (name: string, icon: string, fontSize: string) => {
    try {
      const newTab = await createTab(name, icon, fontSize);
      if (newTab) {
        setActiveTab(newTab.id);
      }
      return newTab;
    } catch (error) {
      throw error;
    }
  }, [createTab]);

  const handleDeleteTab = useCallback(async (tabId: string) => {
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
  }, [deleteTab, activeTab, userTabs]);

  const handleTabDragOver = useCallback((e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTab(tabId);
  }, []);

  const handleTabDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the tab area entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverTab(null);
    }
  }, []);

  const handleTabDrop = useCallback(async (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    setDragOverTab(null);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Don't allow dropping on the same tab
      if (dragData.sourceTabId === tabId) {
        return;
      }

      await moveWidgetToTab(dragData.instanceId, tabId);
      
      const targetTab = userTabs.find(t => t.id === tabId);
      toast({
        title: "Widget Moved",
        description: `"${dragData.widgetName}" moved to ${targetTab?.name}`,
      });
    } catch (error) {
      console.error('Error moving widget:', error);
      toast({
        title: "Error",
        description: "Failed to move widget between tabs",
        variant: "destructive"
      });
    }
  }, [moveWidgetToTab, userTabs, toast]);

  const handleShowTabManager = useCallback(() => {
    setShowTabManager(true);
  }, []);

  const handleCloseTabManager = useCallback(() => {
    setShowTabManager(false);
  }, []);

  // Memoized tab content components
  const tabContentComponents = useMemo(() => 
    userTabs.map((tab) => (
      <TabsContent
        key={tab.id}
        value={tab.id}
        className="w-full h-full m-0 overflow-hidden data-[state=inactive]:hidden"
      >
        <TabErrorBoundary>
          <React.Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <div className="text-lg font-mono text-primary crt-glow">LOADING TAB...</div>
              </div>
            </div>
          }>
            <TabContent tab={tab} />
          </React.Suspense>
        </TabErrorBoundary>
      </TabsContent>
    ))
  , [userTabs]);

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
        <PipBoyHeader isMobile={isMobile} />

        {/* Tab Navigation */}
        <TabNavigation
          userTabs={userTabs}
          activeTab={activeTab}
          isMobile={isMobile}
          dragOverTab={dragOverTab}
          onTabDragOver={handleTabDragOver}
          onTabDragLeave={handleTabDragLeave}
          onTabDrop={handleTabDrop}
          onShowTabManager={handleShowTabManager}
        />

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {tabContentComponents}
        </div>
      </Tabs>

      {/* Tab Manager Dialog */}
      <React.Suspense fallback={null}>
        <TabManager
          isOpen={showTabManager}
          onClose={handleCloseTabManager}
          tabs={userTabs}
          onCreateTab={handleCreateTab}
          onUpdateTab={updateTab}
          onDeleteTab={handleDeleteTab}
          onReorderTabs={reorderTabs}
          canDeleteTab={canDeleteTab}
        />
      </React.Suspense>
    </div>
  );
});