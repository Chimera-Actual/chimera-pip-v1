import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { TabCategory, AppletType } from './PipBoyLayout';

interface TabSidebarProps {
  tab: TabCategory;
  activeApplet: AppletType;
  onAppletChange: (applet: AppletType) => void;
}

export const TabSidebar: React.FC<TabSidebarProps> = ({
  tab,
  activeApplet,
  onAppletChange,
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className="border-r border-border bg-card/50 backdrop-blur-sm">
      <SidebarContent className="bg-transparent">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary crt-glow uppercase tracking-wider text-xs px-3 py-2">
            {isCollapsed ? tab.name.charAt(0) : `${tab.name} WIDGETS`}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tab.applets.map((applet) => (
                <SidebarMenuItem key={applet.id}>
                  <SidebarMenuButton
                    onClick={() => onAppletChange(applet.id)}
                    className={`
                      touch-target w-full justify-start transition-all duration-200 font-mono text-xs uppercase tracking-wider
                      ${activeApplet === applet.id
                        ? 'bg-primary/20 text-primary border-l-2 border-primary crt-glow'
                        : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      }
                    `}
                  >
                    <span className="text-base mr-2 md:mr-3">{applet.icon}</span>
                    {!isCollapsed && (
                      <span className="truncate">{applet.name}</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};