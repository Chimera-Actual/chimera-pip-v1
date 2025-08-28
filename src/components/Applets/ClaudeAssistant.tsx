import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, RefreshCw, ArrowLeft, ArrowRight, Globe } from 'lucide-react';

export const ClaudeAssistant: React.FC = () => {
  const [url, setUrl] = useState('https://claude.ai');
  const [showDirectAccess, setShowDirectAccess] = useState(true); // Default to showing direct access

  const handleOpenInNewTab = () => {
    window.open('https://claude.ai', '_blank', 'noopener,noreferrer');
  };

  const handleOpenInSameTab = () => {
    window.location.href = 'https://claude.ai';
  };

  return (
    <div className="h-full flex flex-col bg-card border border-border">
      {/* Browser-like header */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
          <ArrowLeft className="h-4 w-4 text-muted-foreground/50" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
          <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
          <RefreshCw className="h-4 w-4 text-muted-foreground/50" />
        </Button>
        
        <div className="flex-1 mx-2">
          <Input
            value={url}
            className="bg-input text-xs font-mono text-muted-foreground"
            readOnly
          />
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 hover:bg-primary/10" 
          onClick={handleOpenInNewTab}
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content - Direct access interface */}
      <div className="flex-1 flex items-center justify-center bg-background/50">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="space-y-2">
            <Globe className="w-16 h-16 mx-auto text-primary crt-glow" />
            <div className="text-primary crt-glow text-xl font-mono">
              CLAUDE AI ASSISTANT
            </div>
          </div>
          
          <div className="space-y-3 text-muted-foreground font-mono text-sm">
            <p>External AI assistant interface detected.</p>
            <p>Security protocols prevent embedded access.</p>
            <p className="text-primary">Choose your access method:</p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleOpenInNewTab}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground crt-glow"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </Button>
            
            <Button 
              onClick={handleOpenInSameTab}
              variant="outline"
              className="w-full border-primary/50 text-primary hover:bg-primary/10"
            >
              <Globe className="mr-2 h-4 w-4" />
              Navigate to Claude.ai
            </Button>
          </div>

          <div className="text-xs text-muted-foreground font-mono border-t border-border pt-4">
            <p>▸ New Tab: Keep PipBoy interface open</p>
            <p>▸ Navigate: Replace current interface</p>
          </div>
        </div>
      </div>
    </div>
  );
};