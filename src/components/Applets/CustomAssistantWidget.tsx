import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, User, Bot, Webhook } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CustomAssistantConfig {
  name: string;
  description: string;
  webhookUrl: string;
  systemPrompt: string;
  icon: string;
}

interface CustomAssistantWidgetProps {
  settings?: Record<string, any>;
  widgetName?: string;
  widgetInstanceId?: string;
  onSettingsUpdate?: (newSettings: Record<string, any>) => void;
}

export const CustomAssistantWidget: React.FC<CustomAssistantWidgetProps> = ({ settings, widgetName, widgetInstanceId, onSettingsUpdate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const [config, setConfig] = useState<CustomAssistantConfig>({
    name: 'Custom Assistant',
    description: 'Customizable AI assistant',
    webhookUrl: '',
    systemPrompt: 'You are a helpful AI assistant.',
    icon: '⚙️'
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setSessionId(`custom-${user.id}-${Date.now()}`);
      loadConfiguration();
    }
  }, [user, settings]);

  useEffect(() => {
    // Load webhook URL from widget settings if available
    if (settings?.webhookUrl) {
      setConfig(prev => ({
        ...prev,
        webhookUrl: settings.webhookUrl,
        name: settings.assistantName || prev.name,
        systemPrompt: settings.customPrompt || prev.systemPrompt
      }));
    } else {
      loadConfiguration();
    }
  }, [settings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConfiguration = async () => {
    if (!user) return;

    // If we have settings from the widget, prioritize those
    if (settings?.webhookUrl) {
      setConfig(prev => ({
        ...prev,
        webhookUrl: settings.webhookUrl,
        name: settings.assistantName || prev.name,
        systemPrompt: settings.customPrompt || prev.systemPrompt
      }));
      return;
    }

    // Fallback to database configuration
    try {
      const { data, error } = await supabase
        .from('assistant_webhooks')
        .select('*')
        .eq('user_id', user.id)
        .eq('assistant_id', 'custom')
        .single();

      if (data) {
        setConfig(prev => ({
          ...prev,
          webhookUrl: data.webhook_url
        }));
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const saveConfiguration = async () => {
    if (!user || !config.webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Webhook URL is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('assistant_webhooks')
        .upsert({
          user_id: user.id,
          assistant_id: 'custom',
          webhook_url: config.webhookUrl.trim()
        });

      if (error) throw error;

      toast({
        title: "Configuration Saved",
        description: "Custom assistant settings have been updated",
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!config.webhookUrl.trim()) {
      toast({
        title: "Configuration Required",
        description: "Please configure the webhook URL in the widget settings (use the gear icon on the widget)",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Store user message
      await supabase.from('messages').insert({
        content: userMessage.content,
        role: 'user',
        session_id: sessionId,
        conversation_id: conversationId,
      });

      // Send to webhook
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          system_prompt: config.systemPrompt,
          session_id: sessionId,
          user_id: user?.id
        })
      });

      let assistantContent = 'No response received from webhook.';
      
      if (response.ok) {
        const data = await response.json();
        assistantContent = data.response || data.message || data.content || assistantContent;
      } else {
        assistantContent = `Webhook error: ${response.status} ${response.statusText}`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      // Store assistant message
      await supabase.from('messages').insert({
        content: assistantMessage.content,
        role: 'assistant',
        session_id: sessionId,
        conversation_id: conversationId,
      });

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message to webhook'}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
    toast({
      title: "Conversation cleared",
      description: "Chat history has been reset",
    });
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 h-16 bg-card border-b border-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">{config.icon}</span>
          <span className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
            {config.name.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-muted-foreground">
            {messages.filter(m => m.type === 'user').length} QUERIES
          </div>
          <Button
            onClick={clearConversation}
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs font-mono bg-background/50 hover:bg-primary/20"
          >
            CLEAR
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">{config.icon}</div>
                <div className="text-lg font-mono text-primary mb-2">{config.name.toUpperCase()}</div>
                <div className="text-sm text-muted-foreground font-mono mb-6">
                  {config.description}
                </div>
                
                {!config.webhookUrl.trim() ? (
                  <Card className="bg-background/20 border border-destructive/50 max-w-md mx-auto">
                    <CardContent className="p-4 text-center">
                      <Webhook className="w-8 h-8 text-destructive mx-auto mb-2" />
                      <div className="text-sm font-mono text-destructive mb-2">CONFIGURATION REQUIRED</div>
                      <div className="text-xs text-muted-foreground font-mono mb-3">
                        Set up your webhook URL to start chatting
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-xs text-muted-foreground font-mono space-y-1">
                    <div>• Custom webhook integration</div>
                    <div>• Configurable system prompts</div>
                    <div>• Personalized AI behavior</div>
                    <div>• External API support</div>
                  </div>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className={`flex items-start gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    {message.type === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/20 border border-primary/50 rounded flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    
                    <Card className={`max-w-[80%] ${
                      message.type === 'user' 
                        ? 'bg-primary/20 border-primary/50' 
                        : 'bg-card/50 border-border'
                    }`}>
                      <CardContent className="p-3">
                        <div className="text-sm font-mono whitespace-pre-wrap">
                          {message.content}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </CardContent>
                    </Card>

                    {message.type === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-accent/20 border border-accent/50 rounded flex items-center justify-center">
                        <User className="w-4 h-4 text-accent" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 border border-primary/50 rounded flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                      <Webhook className="w-4 h-4 animate-pulse" />
                      Sending to webhook...
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t border-border bg-card/50">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message your custom assistant..."
              className="flex-1 font-mono bg-background/50 border-border"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 font-mono"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};