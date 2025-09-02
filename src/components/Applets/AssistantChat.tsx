import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Mic, MicOff, Send, User, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Assistant {
  id: string;
  name: string;
  description: string;
  webhookUrl: string;
  icon: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const defaultAssistants: Assistant[] = [
  {
    id: 'general',
    name: 'GENERAL AI',
    description: 'General purpose assistant',
    webhookUrl: '',
    icon: '◎'
  },
  {
    id: 'technical',
    name: 'TECH SUPPORT',
    description: 'Technical troubleshooting',
    webhookUrl: '',
    icon: '⚡'
  },
  {
    id: 'creative',
    name: 'CREATIVE AI',
    description: 'Creative writing & ideation',
    webhookUrl: '',
    icon: '✦'
  },
  {
    id: 'data',
    name: 'DATA ANALYST',
    description: 'Data analysis & insights',
    webhookUrl: '',
    icon: '◈'
  }
];

interface AssistantChatProps {
  widgetInstanceId?: string;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({ widgetInstanceId }) => {
  // Widget-specific storage keys
  const getMessagesStorageKey = () => `widget-${widgetInstanceId}-chat-messages`;
  const getSelectedAssistantStorageKey = () => `widget-${widgetInstanceId}-selected-assistant`;
  const getInputStorageKey = () => `widget-${widgetInstanceId}-chat-input`;

  const [assistants, setAssistants] = useState<Assistant[]>(defaultAssistants);
  
  // Widget-specific state with localStorage persistence
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant>(() => {
    if (!widgetInstanceId) return defaultAssistants[0];
    try {
      const saved = localStorage.getItem(getSelectedAssistantStorageKey());
      if (saved) {
        const savedAssistant = JSON.parse(saved);
        return defaultAssistants.find(a => a.id === savedAssistant.id) || defaultAssistants[0];
      }
    } catch (error) {
      console.warn('Failed to load selected assistant:', error);
    }
    return defaultAssistants[0];
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    if (!widgetInstanceId) return [];
    try {
      const saved = localStorage.getItem(getMessagesStorageKey());
      return saved ? JSON.parse(saved).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) : [];
    } catch (error) {
      console.warn('Failed to load messages:', error);
      return [];
    }
  });

  const [inputValue, setInputValue] = useState(() => {
    if (!widgetInstanceId) return '';
    try {
      return localStorage.getItem(getInputStorageKey()) || '';
    } catch (error) {
      console.warn('Failed to load input value:', error);
      return '';
    }
  });

  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (widgetInstanceId && messages.length > 0) {
      try {
        localStorage.setItem(getMessagesStorageKey(), JSON.stringify(messages));
      } catch (error) {
        console.warn('Failed to save messages:', error);
      }
    }
  }, [messages, widgetInstanceId]);

  // Save selected assistant to localStorage when it changes
  useEffect(() => {
    if (widgetInstanceId) {
      try {
        localStorage.setItem(getSelectedAssistantStorageKey(), JSON.stringify(selectedAssistant));
      } catch (error) {
        console.warn('Failed to save selected assistant:', error);
      }
    }
  }, [selectedAssistant, widgetInstanceId]);

  // Save input value to localStorage when it changes (debounced)
  useEffect(() => {
    if (!widgetInstanceId) return;
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(getInputStorageKey(), inputValue);
      } catch (error) {
        console.warn('Failed to save input value:', error);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [inputValue, widgetInstanceId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load webhook configurations on mount
  useEffect(() => {
    const loadWebhookConfigs = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('agent_webhooks')
        .select('agent_id, webhook_url')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading webhook configs:', error);
        return;
      }

      // Update assistants with saved webhook URLs
      const updatedAssistants = defaultAssistants.map(assistant => {
        const savedConfig = data.find(config => config.agent_id === assistant.id);
        return {
          ...assistant,
          webhookUrl: savedConfig?.webhook_url || ''
        };
      });

      setAssistants(updatedAssistants);
      setSelectedAssistant(updatedAssistants[0]);
    };

    loadWebhookConfigs();
  }, [user]);

  // Initialize session ID when component mounts or assistant changes
  useEffect(() => {
    const newSessionId = `${selectedAssistant.id}_${widgetInstanceId}_${Date.now()}`;
    setSessionId(newSessionId);
  }, [selectedAssistant, widgetInstanceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak your message...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioMessage = async (audioBlob: Blob) => {
    if (!selectedAssistant.webhookUrl) {
      toast({
        title: "Configuration needed",
        description: "Please configure the webhook URL for this assistant.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Convert audio to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = (reader.result as string).split(',')[1];
      
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: '[Audio message]',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      try {
        const response = await fetch(selectedAssistant.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'audio',
            audio: base64Audio,
            assistant: selectedAssistant.id,
            user_id: user?.email || '',
            session_id: sessionId,
            timestamp: new Date().toISOString()
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: result.response || 'Audio message received and processed.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          throw new Error('Failed to send audio message');
        }
      } catch (error) {
        console.error('Error sending audio:', error);
        toast({
          title: "Error",
          description: "Failed to send audio message. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsDataURL(audioBlob);
  };

  const sendTextMessage = async () => {
    if (!inputValue.trim()) return;
    
    if (!selectedAssistant.webhookUrl) {
      toast({
        title: "Configuration needed",
        description: "Please configure the webhook URL for this assistant.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(selectedAssistant.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'text',
          message: inputValue,
          assistant: selectedAssistant.id,
          user_id: user?.email || '',
          session_id: sessionId,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.response || 'Message received and processed.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please check your webhook configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const updateAssistantWebhook = async (assistantId: string, webhookUrl: string) => {
    if (!user) return;

    // Update local state immediately
    const updatedAssistants = assistants.map(assistant =>
      assistant.id === assistantId ? { ...assistant, webhookUrl } : assistant
    );
    setAssistants(updatedAssistants);
    
    if (selectedAssistant.id === assistantId) {
      setSelectedAssistant({ ...selectedAssistant, webhookUrl });
    }

    // Save to database
    try {
      const { error } = await supabase
        .from('agent_webhooks')
        .upsert({
          user_id: user.id,
          agent_id: assistantId,
          webhook_url: webhookUrl
        });

      if (error) {
        console.error('Error saving webhook config:', error);
        toast({
          title: "Error",
          description: "Failed to save webhook configuration",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Configuration saved",
          description: `Webhook URL saved for ${selectedAssistant.name}`,
        });
      }
    } catch (error) {
      console.error('Error saving webhook config:', error);
    }
  };

  return (
    <div className="h-full flex bg-card border border-border">
      {/* Left Sidebar - Assistant List */}
      <div className="w-80 border-r border-border bg-background/30 flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-primary crt-glow uppercase tracking-wider">
            SELECT AGENT
          </h2>
        </div>
        
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {assistants.map((assistant) => (
              <div
                key={assistant.id}
                className={`p-3 border border-border cursor-pointer transition-all hover:bg-primary/10 hover:border-primary/50 ${
                  selectedAssistant.id === assistant.id 
                    ? 'bg-primary/20 border-primary text-primary' 
                    : 'bg-card text-muted-foreground'
                }`}
                onClick={() => setSelectedAssistant(assistant)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{assistant.icon}</span>
                  <div>
                    <div className="font-bold text-sm uppercase tracking-wide">
                      {assistant.name}
                    </div>
                    <div className="text-xs opacity-75">
                      {assistant.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Webhook Configuration */}
        <div className="p-4 border-t border-border">
          <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
            N8N Webhook URL
          </label>
          <Input
            type="url"
            placeholder="https://your-n8n-instance.com/webhook/..."
            value={selectedAssistant.webhookUrl}
            onChange={(e) => updateAssistantWebhook(selectedAssistant.id, e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-background/20">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{selectedAssistant.icon}</span>
            <div>
              <h3 className="font-bold text-primary crt-glow uppercase tracking-wider">
                {selectedAssistant.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedAssistant.description}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground p-8">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="uppercase tracking-wide">
                  Start conversation with {selectedAssistant.name}
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md p-3 border ${
                    message.type === 'user'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-card border-border text-foreground'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'assistant' ? (
                      <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-60">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border p-3 max-w-xs">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <div className="text-sm text-muted-foreground">
                      Processing...
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-background/20">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="pr-12"
              />
              <Button
                type="button"
                size="sm"
                variant={isRecording ? "destructive" : "ghost"}
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <Button
              onClick={sendTextMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            {isRecording ? (
              <span className="text-destructive crt-glow">● RECORDING - Click mic to stop</span>
            ) : (
              'Press Enter to send, click mic to record audio'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};