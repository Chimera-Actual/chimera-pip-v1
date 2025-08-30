import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff } from 'lucide-react';

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
    <Card className="w-full h-full min-h-[400px] bg-background border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-mono text-primary flex items-center gap-2">
          <Mic className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div 
            ref={containerRef}
            className="w-full h-full min-h-[300px] flex items-center justify-center"
          >
            {/* ElevenLabs widget will be inserted here */}
            <div className="text-muted-foreground font-mono text-sm flex items-center gap-2">
              <MicOff className="w-4 h-4" />
              Loading voice assistant...
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};