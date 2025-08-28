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
import { AppletType, Applet } from './PipBoyLayout';

interface PipBoySidebarProps {
  applets: Applet[];
  activeApplet: AppletType;
  onAppletChange: (applet: AppletType) => void;
}

export const PipBoySidebar: React.FC<PipBoySidebarProps> = ({
  applets,
  activeApplet,
  onAppletChange,
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-16 md:w-20" : "w-72 md:w-64"} collapsible="icon">
      <SidebarContent className="border-r border-border bg-sidebar">
        <div className="p-3 md:p-4 border-b border-border">
          <div className="text-primary font-display crt-glow text-sm md:text-base">
            {isCollapsed ? "CHIMERA" : "ChimeraPip 3000"}
          </div>
          {!isCollapsed && (
            <div className="text-xs text-muted-foreground">Mark V</div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-accent text-xs">
            {isCollapsed ? "APP" : "APPLETS"}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {applets.map((applet) => (
                <SidebarMenuItem key={applet.id}>
                  <SidebarMenuButton
                    onClick={() => onAppletChange(applet.id)}
                    className={`
                      mobile-nav transition-all duration-200 min-h-12 md:min-h-10
                      active:scale-95 active:bg-primary/30
                      ${activeApplet === applet.id 
                        ? 'bg-primary/20 text-primary border-l-2 border-primary crt-glow' 
                        : 'text-foreground hover:bg-accent/10 hover:text-accent active:bg-accent/20'
                      }
                    `}
                  >
                    <span className="text-xl md:text-lg font-mono mr-2 md:mr-2">
                      {applet.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="font-mono uppercase tracking-wider text-sm md:text-sm">
                        {applet.name}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-3 md:p-4 border-t border-border">
          <div className="text-xs text-muted-foreground font-mono">
            {isCollapsed ? "PWR" : "POWER LEVEL"}
          </div>
          <div className="text-primary text-sm font-mono crt-glow">
            {isCollapsed ? "99%" : "OPTIMAL [99%]"}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};