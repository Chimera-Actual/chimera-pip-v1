import React, { useState, useEffect } from 'react';
import { User, Settings, Shield, Activity } from 'lucide-react';

export const UserInfoWidget: React.FC = () => {
  const [loginTime] = useState(new Date());
  
  const formatUptime = (startTime: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const [uptime, setUptime] = useState(formatUptime(loginTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime(formatUptime(loginTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [loginTime]);

  return (
    <div className="h-full flex flex-col bg-card border border-border">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary crt-glow" />
          <span className="text-primary font-mono text-lg uppercase tracking-wider crt-glow">
            ◉ USER PROFILE
          </span>
        </div>
      </div>

      {/* User Avatar and Basic Info */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 border-2 border-primary bg-background/20 rounded-lg flex items-center justify-center">
            <User className="w-12 h-12 text-primary crt-glow" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-display text-primary crt-glow mb-2">VAULT.DWELLER</h2>
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="text-foreground">VD-2077-001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CLEARANCE:</span>
                <span className="text-primary">ALPHA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">STATUS:</span>
                <span className="text-primary">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Information */}
      <div className="border-b border-border bg-card p-4">
        <h3 className="text-primary font-display mb-3 crt-glow text-sm uppercase">Session Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border bg-background/20 p-3">
            <div className="text-xs text-muted-foreground font-mono mb-1">LOGIN TIME</div>
            <div className="text-primary font-mono text-sm crt-glow">
              {loginTime.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          <div className="border border-border bg-background/20 p-3">
            <div className="text-xs text-muted-foreground font-mono mb-1">SESSION TIME</div>
            <div className="text-primary font-mono text-sm crt-glow">{uptime}</div>
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="flex-1 p-4">
        <h3 className="text-primary font-display mb-3 crt-glow text-sm uppercase">User Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border bg-background/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-mono uppercase">Activity</span>
            </div>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">COMMANDS:</span>
                <span className="text-primary">147</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">APPS USED:</span>
                <span className="text-primary">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">LAST ACTION:</span>
                <span className="text-foreground">USER.INFO</span>
              </div>
            </div>
          </div>

          <div className="border border-border bg-background/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-mono uppercase">Security</span>
            </div>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">AUTH:</span>
                <span className="text-primary">VERIFIED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ENCRYPTION:</span>
                <span className="text-primary">AES-256</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">2FA:</span>
                <span className="text-primary">ENABLED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 p-3 border border-border bg-background/20 hover:bg-primary/10 hover:border-primary/50 transition-colors font-mono text-xs uppercase">
            <Settings className="w-4 h-4" />
            Preferences
          </button>
          <button className="flex items-center justify-center gap-2 p-3 border border-border bg-background/20 hover:bg-primary/10 hover:border-primary/50 transition-colors font-mono text-xs uppercase">
            <Shield className="w-4 h-4" />
            Security
          </button>
        </div>
      </div>
    </div>
  );
};