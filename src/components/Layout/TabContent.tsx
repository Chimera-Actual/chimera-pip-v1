import React, { useState } from 'react';
import { AppletContainer } from './AppletContainer';
import { TabCategory } from './PipBoyLayout';

interface TabContentProps {
  tab: TabCategory;
}

export const TabContent: React.FC<TabContentProps> = ({ tab }) => {
  const [activeApplet, setActiveApplet] = useState<string>('');

  return (
    <div className="w-full h-full">
      <AppletContainer 
        activeApplet={activeApplet}
        tabName={tab.name}
        tabCategory={tab.id}
        onAppletChange={setActiveApplet}
      />
    </div>
  );
};