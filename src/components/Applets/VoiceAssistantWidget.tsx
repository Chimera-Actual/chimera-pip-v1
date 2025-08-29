import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Volume2, VolumeX, Settings } from 'lucide-react';

export const VoiceAssistantWidget: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [transcript, setTranscript] = useState('');
  const { toast } = useToast();

  const startConversation = async () => {
    try {
      // Check microphone permissions
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // TODO: Initialize ElevenLabs conversation
      setIsConnected(true);
      setIsListening(true);
      
      toast({
        title: "Voice Assistant Active",
        description: "Microphone access granted. Start speaking!",
      });
    } catch (error) {
      console.error('Error starting voice conversation:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone or start conversation",
        variant: "destructive"
      });
    }
  };

  const stopConversation = () => {
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript('');
    
    toast({
      title: "Voice Assistant Stopped",
      description: "Conversation ended",
    });
  };

  const toggleMute = () => {
    setIsListening(!isListening);
  };

  const adjustVolume = (newVolume: number) => {
    setVolume(newVolume);
    // TODO: Set volume via ElevenLabs API
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 h-16 bg-card border-b border-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🎤</span>
          <span className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
            VOICE AI AGENT
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-muted-foreground">
            {isConnected ? (
              <span className="text-accent animate-pulse">CONNECTED</span>
            ) : (
              <span>DISCONNECTED</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-70 hover:opacity-100"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {!isConnected ? (
              <div className="text-center py-8 space-y-6">
                <div className="text-6xl mb-4">🎤</div>
                <div className="text-lg font-mono text-primary mb-2">VOICE AI READY</div>
                <div className="text-sm text-muted-foreground font-mono mb-6">
                  Voice-enabled AI conversation agent
                </div>
                
                <div className="space-y-4">
                  <Button
                    onClick={startConversation}
                    size="lg"
                    className="font-mono px-8"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    START VOICE CONVERSATION
                  </Button>
                  
                  <div className="text-xs text-muted-foreground font-mono space-y-1">
                    <div>• Real-time voice conversation</div>
                    <div>• Natural speech recognition</div>
                    <div>• Emotional AI responses</div>
                    <div>• Hands-free interaction</div>
                  </div>
                </div>
                
                <Card className="bg-background/20 border border-border mt-6">
                  <CardContent className="p-4">
                    <div className="text-xs font-mono text-muted-foreground space-y-2">
                      <div className="text-primary font-bold">REQUIREMENTS:</div>
                      <div>• Microphone access required</div>
                      <div>• ElevenLabs API key needed</div>
                      <div>• Stable internet connection</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Voice Visualization */}
                <div className="text-center">
                  <div className={`w-32 h-32 mx-auto rounded-full border-4 ${
                    isListening 
                      ? 'border-accent bg-accent/20 animate-pulse' 
                      : 'border-muted bg-muted/20'
                  } flex items-center justify-center mb-4`}>
                    {isListening ? (
                      <Mic className="w-12 h-12 text-accent" />
                    ) : (
                      <MicOff className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="text-lg font-mono text-primary mb-2">
                    {isSpeaking ? 'AI SPEAKING...' : isListening ? 'LISTENING...' : 'MUTED'}
                  </div>
                  
                  {transcript && (
                    <Card className="bg-card/50 border-border mt-4">
                      <CardContent className="p-3">
                        <div className="text-sm font-mono text-foreground">
                          "{transcript}"
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-background/30 border-border">
                    <CardContent className="p-4 text-center">
                      <Button
                        onClick={toggleMute}
                        variant={isListening ? "default" : "outline"}
                        size="sm"
                        className="w-full font-mono"
                      >
                        {isListening ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                        {isListening ? 'MUTE' : 'UNMUTE'}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-background/30 border-border">
                    <CardContent className="p-4">
                      <div className="text-center mb-2">
                        <div className="text-xs font-mono text-muted-foreground mb-1">VOLUME</div>
                        <div className="flex items-center gap-2">
                          <VolumeX className="w-4 h-4 text-muted-foreground" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) => adjustVolume(parseFloat(e.target.value))}
                            className="flex-1"
                          />
                          <Volume2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-xs font-mono text-primary">{Math.round(volume * 100)}%</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-background/30 border-border">
                    <CardContent className="p-4 text-center">
                      <Button
                        onClick={stopConversation}
                        variant="outline"
                        size="sm"
                        className="w-full font-mono hover:border-destructive hover:text-destructive"
                      >
                        END CALL
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="bg-background/30 border border-border rounded p-3">
                    <div className="text-muted-foreground mb-1">CONNECTION:</div>
                    <div className="text-accent animate-pulse">ACTIVE</div>
                  </div>
                  <div className="bg-background/30 border border-border rounded p-3">
                    <div className="text-muted-foreground mb-1">LATENCY:</div>
                    <div className="text-primary">~200ms</div>
                  </div>
                  <div className="bg-background/30 border border-border rounded p-3">
                    <div className="text-muted-foreground mb-1">QUALITY:</div>
                    <div className="text-accent">HIGH</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};