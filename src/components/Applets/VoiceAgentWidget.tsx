import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { StandardWidgetTemplate } from '@/components/Layout/StandardWidgetTemplate';
import { Button } from '@/components/ui/button';

interface VoiceAgentWidgetProps {
  widgetInstanceId: string;
  settings?: {
    agentId?: string;
    title?: string;
  };
}

const VoiceAgentWidget: React.FC<VoiceAgentWidgetProps> = ({
  widgetInstanceId,
  settings = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const isMobile = useIsMobile();
  const [showSettings, setShowSettings] = useState(false);

  const agentId = settings.agentId || 'agent_5301k3y02gv7fhctk91r1dzk29dz';
  const title = settings.title || 'Voice Assistant';

  useEffect(() => {
    // Load ElevenLabs script if not already loaded
    if (!scriptLoadedRef.current && !document.querySelector('script[src*="elevenlabs"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      
      script.onload = () => {
        scriptLoadedRef.current = true;
        console.log('ElevenLabs script loaded successfully');
      };
      
      script.onerror = () => {
        console.error('Failed to load ElevenLabs script');
      };
      
      document.head.appendChild(script);
      scriptLoadedRef.current = true;
    }

    // Create and append the ElevenLabs widget
    if (containerRef.current) {
      const existingWidget = containerRef.current.querySelector('elevenlabs-convai');
      if (!existingWidget) {
        const widget = document.createElement('elevenlabs-convai');
        widget.setAttribute('agent-id', agentId);
        containerRef.current.appendChild(widget);
      }
    }

    return () => {
      // Cleanup: remove the widget when component unmounts
      if (containerRef.current) {
        const widget = containerRef.current.querySelector('elevenlabs-convai');
        if (widget) {
          widget.remove();
        }
      }
    };
  }, [agentId]);

  const settingsGear = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowSettings(true)}
      className={`opacity-70 hover:opacity-100 ${isMobile ? 'p-2 h-8 w-8' : 'p-1 h-6 w-6'}`}
    >
      <Settings className={isMobile ? 'h-4 w-4' : 'h-3 w-3'} />
    </Button>
  );

  return (
    <>
      <StandardWidgetTemplate
        icon={<Mic size={isMobile ? 16 : 20} />}
        title={title.toUpperCase()}
        controls={settingsGear}
      >
        <div className="flex-1 flex items-center justify-center">
          <div 
            ref={containerRef}
            className={`w-full h-full flex items-center justify-center ${isMobile ? 'min-h-[200px]' : 'min-h-[300px]'}`}
          >
            {/* ElevenLabs widget will be inserted here */}
            <div className={`text-muted-foreground font-mono flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <MicOff className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              Loading voice assistant...
            </div>
          </div>
        </div>
      </StandardWidgetTemplate>
      
      {/* Note: VoiceAgentWidget doesn't have specific settings component yet */}
      {showSettings && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4">
            <h3 className="font-mono text-primary uppercase tracking-wider mb-4">Voice Assistant Settings</h3>
            <p className="text-muted-foreground font-mono text-sm mb-4">
              Voice assistant settings will be available in a future update.
            </p>
            <Button 
              onClick={() => setShowSettings(false)}
              variant="outline"
              className="w-full font-mono"
            >
              CLOSE
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAgentWidget;