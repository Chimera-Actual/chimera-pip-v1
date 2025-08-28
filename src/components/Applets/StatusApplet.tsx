import React, { useState, useEffect } from 'react';

export const StatusApplet: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return (
    <div className="h-full flex flex-col bg-card border border-border">
      {/* System Status */}
      {/* ASCII Art Welcome - Responsive */}
      <div className="border border-border bg-card p-4 md:p-6 flex-1 flex items-center justify-center min-h-32 md:min-h-48 m-4">
        <pre className="text-primary text-[0.5rem] sm:text-xs md:text-xs font-mono crt-glow text-center leading-3 sm:leading-4">
{`
   ██████╗██╗  ██╗██╗███╗   ███╗███████╗██████╗  █████╗       ██████╗ ██╗██████╗ 
  ██╔════╝██║  ██║██║████╗ ████║██╔════╝██╔══██╗██╔══██╗      ██╔══██╗██║██╔══██╗
  ██║     ███████║██║██╔████╔██║█████╗  ██████╔╝███████║█████╗██████╔╝██║██████╔╝
  ██║     ██╔══██║██║██║╚██╔╝██║██╔══╝  ██╔══██╗██╔══██║╚════╝██╔═══╝ ██║██╔═══╝ 
  ╚██████╗██║  ██║██║██║ ╚═╝ ██║███████╗██║  ██║██║  ██║      ██║     ██║██║     
   ╚═════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝      ╚═╝     ╚═╝╚═╝     
                                                                                   
                     ██████╗  ██████╗  ██████╗  ██████╗                           
                     ╚════██╗██╔═████╗██╔═████╗██╔═████╗                          
                      █████╔╝██║██╔██║██║██╔██║██║██╔██║                          
                      ╚═══██╗████╔╝██║████╔╝██║████╔╝██║                          
                     ██████╔╝╚██████╔╝╚██████╔╝╚██████╔╝                          
                     ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝                           
`}
        </pre>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4">
        <div className="border border-border bg-card p-2 md:p-2 text-center touch-target">
          <div className="text-[0.6rem] md:text-xs text-muted-foreground font-mono">VERSION</div>
          <div className="text-primary font-mono text-xs md:text-sm crt-glow">v0.0.0</div>
        </div>
        <div className="border border-border bg-card p-2 md:p-2 text-center touch-target">
          <div className="text-[0.6rem] md:text-xs text-muted-foreground font-mono">LAST UPDATE</div>
          <div className="text-primary font-mono text-xs md:text-sm crt-glow">08/28/2025 14:32</div>
        </div>
        <div className="border border-border bg-card p-2 md:p-2 text-center touch-target">
          <div className="text-[0.6rem] md:text-xs text-muted-foreground font-mono">CPU</div>
          <div className="text-primary font-mono text-xs md:text-sm crt-glow">2.1GHZ</div>
        </div>
        <div className="border border-border bg-card p-2 md:p-2 text-center touch-target">
          <div className="text-[0.6rem] md:text-xs text-muted-foreground font-mono">NETWORK</div>
          <div className={`font-mono text-xs md:text-sm crt-glow ${isOnline ? 'text-primary' : 'text-destructive'}`}>
            {isOnline ? 'CONNECTED' : 'OFFLINE'}
          </div>
        </div>
      </div>
    </div>
  );
};