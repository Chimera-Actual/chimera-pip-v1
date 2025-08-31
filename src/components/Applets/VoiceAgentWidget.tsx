import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface VoiceAgentWidgetProps {
  widgetInstanceId: string;
  settings?: {
    agentId?: string;
    title?: string;
  };
}

export const VoiceAgentWidget: React.FC<VoiceAgentWidgetProps> = ({
  widgetInstanceId,
  settings = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const isMobile = useIsMobile();

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

  return (
    <Card className={`w-full h-full bg-background border-primary/20 ${
      isMobile ? 'min-h-[300px]' : 'min-h-[400px]'
    }`}>
      <CardHeader className={`${isMobile ? 'pb-2 px-4 py-3' : 'pb-4'}`}>
        <CardTitle className={`font-mono text-primary flex items-center gap-2 ${
          isMobile ? 'text-base' : 'text-lg'
        }`}>
          <Mic className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={`h-full flex flex-col ${isMobile ? 'px-4 pb-4' : ''}`}>
        <div className="flex-1 flex items-center justify-center">
          <div 
            ref={containerRef}
            className={`w-full h-full flex items-center justify-center ${
              isMobile ? 'min-h-[200px]' : 'min-h-[300px]'
            }`}
          >
            {/* ElevenLabs widget will be inserted here */}
            <div className={`text-muted-foreground font-mono flex items-center gap-2 ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              <MicOff className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              Loading voice assistant...
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};