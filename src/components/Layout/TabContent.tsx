import React, { useState } from 'react';
import { AppletContainer } from './AppletContainer';
import { TabCategory, AppletType } from './PipBoyLayout';

interface TabContentProps {
  tab: TabCategory;
}

export const TabContent: React.FC<TabContentProps> = ({ tab }) => {
  const [activeApplet, setActiveApplet] = useState<AppletType>(tab.applets[0]?.id);

  return (
    <div className="w-full h-full">
      <AppletContainer 
        activeApplet={activeApplet}
        applets={tab.applets}
        tabName={tab.name}
        onAppletChange={setActiveApplet}
      />
    </div>
  );
};