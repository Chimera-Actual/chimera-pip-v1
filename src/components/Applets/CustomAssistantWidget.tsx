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
  isImage?: boolean;
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

  // Initialize conversation session - single effect to avoid duplicates
  useEffect(() => {
    const initializeSession = async () => {
      if (!user || !widgetInstanceId) return;
      
      // Generate session ID only once per widget instance
      const newSessionId = `custom-${user.id}-${widgetInstanceId}-${Date.now()}`;
      console.log('CustomAssistantWidget - Setting session ID:', newSessionId, 'for widget:', widgetInstanceId);
      setSessionId(newSessionId);

      try {
        // Create conversation record
        const { data: conversation, error } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            session_id: newSessionId,
            title: `${config.name} - ${widgetInstanceId}`,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating conversation:', error);
          toast({
            title: "Database Error", 
            description: "Failed to initialize conversation. Messages will not be saved.",
            variant: "destructive",
          });
        } else {
          setConversationId(conversation.id);
          console.log('CustomAssistantWidget - Conversation created:', conversation.id, 'for widget:', widgetInstanceId);
        }
      } catch (error) {
        console.error('Error in conversation initialization:', error);
      }
      
      // Load configuration after conversation is set up
      await loadConfiguration();
    };

    initializeSession();
  }, [user, widgetInstanceId]); // Removed config.name and toast from dependencies

  // Load existing messages when conversation is ready
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId || !user) return;
      
      console.log('CustomAssistantWidget - Loading messages for conversation:', conversationId, 'widget:', widgetInstanceId);
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          return;
        }

        if (data && data.length > 0) {
          const loadedMessages: Message[] = data.map(msg => ({
            id: msg.id,
            type: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            isImage: msg.content.startsWith('data:image/')
          }));
          
          console.log('CustomAssistantWidget - Loaded', loadedMessages.length, 'messages for widget:', widgetInstanceId);
          setMessages(loadedMessages);
        } else {
          console.log('CustomAssistantWidget - No existing messages found for widget:', widgetInstanceId);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [conversationId, user, widgetInstanceId]);

  // Handle settings updates
  useEffect(() => {
    if (settings?.webhookUrl) {
      setConfig(prev => ({
        ...prev,
        webhookUrl: settings.webhookUrl,
        name: settings.agentName || prev.name,
        systemPrompt: settings.customPrompt || prev.systemPrompt
      }));
    }
  }, [settings]);

  // Auto-scroll to bottom when messages change
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
        name: settings.agentName || prev.name,
        systemPrompt: settings.customPrompt || prev.systemPrompt
      }));
      return;
    }

    // Fallback to database configuration
    try {
      const { data, error } = await supabase
        .from('agent_webhooks')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_id', 'custom')
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
        .from('agent_webhooks')
        .upsert({
          user_id: user.id,
          agent_id: 'custom',
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

      // Send to webhook with all AI parameters
      const webhookPayload = {
        message: userMessage.content,
        system_prompt: settings?.customPrompt || config.systemPrompt,
        session_id: sessionId,
        user_id: user?.id,
        max_tokens: settings?.maxTokens || 150,
        temperature: settings?.temperature || 0.7,
        enable_history: settings?.enableHistory ?? true,
        agent_name: settings?.agentName || config.name
      };

      // Add API key to headers if provided
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (settings?.apiKey) {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(webhookPayload)
      });

      let assistantContent = 'No response received from webhook.';
      let isImage = false;
      
      if (response.ok) {
        const data = await response.json();
        console.log('Webhook response:', data);
        
        // Handle different response formats
        let responseText = '';
        if (Array.isArray(data)) {
          // Handle array format like [{"output": "..."}]
          if (data.length > 0 && data[0].output) {
            responseText = data[0].output;
          } else if (data.length > 0 && typeof data[0] === 'string') {
            responseText = data[0];
          }
        } else if (typeof data === 'object' && data !== null) {
          // Handle nested object format like {"data": {"_type": "String", "value": "..."}}
          if (data.data && data.data.value) {
            responseText = data.data.value;
          } else {
            // Handle flat object format like {"response": "...", "message": "...", etc.}
            responseText = data.output || data.response || data.message || data.content || data.text || '';
          }
        } else if (typeof data === 'string') {
          // Handle plain string responses
          responseText = data;
        }

        // Check if response contains base64 image data
        const base64ImageRegex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
        const isBase64Image = responseText && responseText.length > 100 && base64ImageRegex.test(responseText);
        
        if (isBase64Image) {
          // It's a base64 image, format it properly
          assistantContent = `data:image/png;base64,${responseText}`;
          isImage = true;
        } else if (responseText) {
          assistantContent = responseText;
        }
      } else {
        assistantContent = `Webhook error: ${response.status} ${response.statusText}`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        isImage: isImage,
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
    console.log('CustomAssistantWidget - Clearing conversation for widget:', widgetInstanceId, 'session:', sessionId);
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
                        {message.isImage ? (
                          <div className="space-y-2">
                            <img 
                              src={message.content} 
                              alt="Generated image"
                              className="max-w-full h-auto rounded border"
                              style={{ maxHeight: '400px' }}
                            />
                            <div className="text-xs text-muted-foreground font-mono">
                              Generated Image
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-mono whitespace-pre-wrap">
                            {message.content}
                          </div>
                        )}
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