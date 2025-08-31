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
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppletType, Applet } from './PipBoyLayout';

interface PipBoySidebarProps {
  applets: Applet[];
  activeApplet: AppletType;
  onAppletChange: (applet: AppletType) => void;
}

const DesktopSidebar: React.FC<{
  applets: Applet[];
  activeApplet: AppletType;
  onAppletChange: (applet: AppletType) => void;
  isCollapsed: boolean;
}> = ({ applets, activeApplet, onAppletChange, isCollapsed }) => (
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
);

const MobileSidebarContent: React.FC<{
  applets: Applet[];
  activeApplet: AppletType;
  onAppletChange: (applet: AppletType) => void;
}> = ({ applets, activeApplet, onAppletChange }) => (
  <div className="flex flex-col h-full bg-background">
    <div className="p-4 border-b border-border">
      <div className="text-primary font-display crt-glow text-lg">
        ChimeraPip 3000
      </div>
      <div className="text-xs text-muted-foreground">Mark V</div>
    </div>

    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <div className="text-accent text-xs font-mono mb-4">APPLETS</div>
        <div className="space-y-2">
          {applets.map((applet) => (
            <Button
              key={applet.id}
              onClick={() => onAppletChange(applet.id)}
              variant={activeApplet === applet.id ? "default" : "ghost"}
              className={`
                w-full justify-start h-12 touch-target
                ${activeApplet === applet.id 
                  ? 'bg-primary/20 text-primary border-l-2 border-primary crt-glow' 
                  : 'text-foreground hover:bg-accent/10 hover:text-accent'
                }
              `}
            >
              <span className="text-xl font-mono mr-3">
                {applet.icon}
              </span>
              <span className="font-mono uppercase tracking-wider text-sm">
                {applet.name}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>

    <div className="p-4 border-t border-border">
      <div className="text-xs text-muted-foreground font-mono">
        POWER LEVEL
      </div>
      <div className="text-primary text-sm font-mono crt-glow">
        OPTIMAL [99%]
      </div>
    </div>
  </div>
);

export const PipBoySidebar: React.FC<PipBoySidebarProps> = ({
  applets,
  activeApplet,
  onAppletChange,
}) => {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm border border-border touch-target"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <MobileSidebarContent
            applets={applets}
            activeApplet={activeApplet}
            onAppletChange={onAppletChange}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sidebar className={isCollapsed ? "w-16 md:w-20" : "w-72 md:w-64"} collapsible="icon">
      <DesktopSidebar
        applets={applets}
        activeApplet={activeApplet}
        onAppletChange={onAppletChange}
        isCollapsed={isCollapsed}
      />
    </Sidebar>
  );
};