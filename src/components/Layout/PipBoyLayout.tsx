import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabContent } from './TabContent';
import { StatusApplet } from '../Applets/StatusApplet';
import { ChatInterface } from '../Applets/ChatInterface';
import { MapWidget } from '../Applets/MapWidget';
import { ClockWidget } from '../Applets/ClockWidget';
import { UserInfoWidget } from '../Applets/UserInfoWidget';
import { UserAvatar } from './UserAvatar';

export type AppletType = 'user-info' | 'user-profile' | 'clock' | 'map' | 'weather' | 'email' | 'calendar' | 'radio' | 'browser' | 'chat' | 'voice' | 'system-settings';

export type TabType = 'status' | 'apps' | 'assistant' | 'settings';

export interface Applet {
  id: AppletType;
  name: string;
  icon: string;
  component: React.ComponentType<any>;
}

export interface TabCategory {
  id: TabType;
  name: string;
  applets: Applet[];
}

const defaultTabs: TabCategory[] = [
  {
    id: 'status',
    name: 'STATUS',
    applets: [
      { id: 'user-info', name: 'SYSTEM INFO', icon: '◉', component: StatusApplet },
      { id: 'user-profile', name: 'USER INFO', icon: '◎', component: UserInfoWidget },
      { id: 'clock', name: 'CLOCK', icon: '◐', component: ClockWidget },
    ]
  },
  {
    id: 'apps',
    name: 'APPS',
    applets: [
      { id: 'map', name: 'MAP', icon: '◈', component: MapWidget },
      { id: 'weather', name: 'WEATHER', icon: '☰', component: () => <div className="h-full flex flex-col bg-card border border-border items-center justify-center text-muted-foreground p-8"><div className="text-center">Weather widget coming soon...</div></div> },
      { id: 'email', name: 'EMAIL', icon: '✉', component: () => <div className="h-full flex flex-col bg-card border border-border items-center justify-center text-muted-foreground p-8"><div className="text-center">Email widget coming soon...</div></div> },
      { id: 'calendar', name: 'CALENDAR', icon: '◔', component: () => <div className="h-full flex flex-col bg-card border border-border items-center justify-center text-muted-foreground p-8"><div className="text-center">Calendar widget coming soon...</div></div> },
      { id: 'radio', name: 'RADIO', icon: '♫', component: () => <div className="h-full flex flex-col bg-card border border-border items-center justify-center text-muted-foreground p-8"><div className="text-center">Radio widget coming soon...</div></div> },
      { id: 'browser', name: 'BROWSER', icon: '⌘', component: () => <div className="h-full flex flex-col bg-card border border-border items-center justify-center text-muted-foreground p-8"><div className="text-center">Browser widget coming soon...</div></div> },
    ]
  },
  {
    id: 'assistant',
    name: 'ASSISTANT',
    applets: [
      { id: 'chat', name: 'AI AGENTS', icon: '◎', component: ChatInterface },
    ]
  },
  {
    id: 'settings',
    name: 'SETTINGS',
    applets: [
      { id: 'system-settings', name: 'SYSTEM', icon: '⚙', component: () => <div className="h-full flex flex-col bg-card border border-border items-center justify-center text-muted-foreground p-8"><div className="text-center">System settings coming soon...</div></div> },
    ]
  },
];

interface PipBoyLayoutProps {
  tabs?: TabCategory[];
  children?: React.ReactNode;
}

export const PipBoyLayout: React.FC<PipBoyLayoutProps> = ({ tabs = defaultTabs, children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('status');

  return (
    <div className="min-h-screen w-full crt-screen font-mono">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full h-full">
        {/* Header with navigation */}
        <header className="border-b border-border bg-card">
          <div className="flex items-center justify-between p-3 md:p-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg md:text-xl font-display text-primary crt-glow uppercase tracking-wider">
                ChimeraPip 3000
              </h1>
            </div>
            
            <UserAvatar />
          </div>
          
          <TabsList className="w-full justify-center rounded-none border-t border-border bg-background/50 p-0 h-auto">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="touch-target flex-1 md:flex-none rounded-none border-r border-border bg-transparent data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-muted-foreground hover:bg-primary/10 hover:text-primary px-4 py-3 text-sm md:text-lg font-bold font-mono uppercase tracking-wider transition-colors"
              >
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </header>
        
        {/* Content area below header */}
        <div className="flex-1">
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="m-0 h-full">
              <TabContent tab={tab} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
      {children}
    </div>
  );
};