import React, { useState } from 'react';
import { AppletContainer } from './AppletContainer';
import { UserTab } from '@/hooks/useTabManager';

interface TabContentProps {
  tab: UserTab;
}

export const TabContent: React.FC<TabContentProps> = ({ tab }) => {
  const [activeApplet, setActiveApplet] = useState<string>('');

  return (
    <div className="w-full h-full">
      <AppletContainer 
        activeApplet={activeApplet}
        tabName={tab.name}
        tabId={tab.id}
        onAppletChange={setActiveApplet}
      />
    </div>
  );
};