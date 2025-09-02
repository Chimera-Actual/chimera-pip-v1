import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Send, User, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

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
  contentType?: 'text' | 'image';
  timestamp: Date;
}

interface ChatInterfaceProps {
  selectedAssistant: Assistant;
  widgetInstanceId?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedAssistant, widgetInstanceId }) => {
  // Widget-specific localStorage keys
  const getStorageKey = (key: string) => widgetInstanceId ? `widget-${widgetInstanceId}-${key}` : `chat-${key}`;
  
  // State with localStorage persistence
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!widgetInstanceId) return [];
    try {
      const saved = localStorage.getItem(getStorageKey('messages'));
      return saved ? JSON.parse(saved).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) : [];
    } catch {
      return [];
    }
  });
  
  const [inputValue, setInputValue] = useState(() => {
    try {
      return localStorage.getItem(getStorageKey('inputValue')) || '';
    } catch {
      return '';
    }
  });
  
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(selectedAssistant.webhookUrl);
  const [sessionId, setSessionId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (widgetInstanceId && messages.length > 0) {
      try {
        localStorage.setItem(getStorageKey('messages'), JSON.stringify(messages));
      } catch (error) {
        logger.warn('Failed to save messages', error, 'ChatInterface');
      }
    }
  }, [messages, widgetInstanceId]);

  // Save input value to localStorage (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(getStorageKey('inputValue'), inputValue);
      } catch (error) {
        logger.warn('Failed to save input value', error, 'ChatInterface');
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [inputValue, widgetInstanceId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize conversation session
  useEffect(() => {
    const initializeSession = async () => {
      if (!user) return;

      // Generate session ID based on assistant and timestamp
      const newSessionId = `${selectedAssistant.id}_${Date.now()}`;
      setSessionId(newSessionId);

      // Create conversation record
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          session_id: newSessionId,
          title: `Chat with ${selectedAssistant.name}`,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating conversation', error, 'ChatInterface');
        toast({
          title: "Database Error",
          description: "Failed to initialize conversation. Messages will not be saved.",
          variant: "destructive",
        });
      } else {
        setConversationId(conversation.id);
      }
    };

    initializeSession();
  }, [selectedAssistant, user, toast]);

  // Save message to database
  const saveMessageToDatabase = async (message: Message, role: 'user' | 'assistant') => {
    if (!user || !conversationId || !sessionId) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        session_id: sessionId,
        role: role,
        content: message.content,
        metadata: {
          assistant_id: selectedAssistant.id,
          message_id: message.id,
          timestamp: message.timestamp.toISOString()
        }
      });

    if (error) {
      logger.error('Error saving message', error, 'ChatInterface');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update webhook URL when assistant changes
  useEffect(() => {
    setWebhookUrl(selectedAssistant.webhookUrl);
  }, [selectedAssistant]);

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
      logger.error('Error starting recording', error, 'ChatInterface');
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
    if (!webhookUrl) {
      toast({
        title: "Configuration needed",
        description: "Please configure the n8n webhook URL below.",
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
      
      // Save user message to database
      await saveMessageToDatabase(userMessage, 'user');
      
      try {
        const response = await fetch(webhookUrl, {
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
          
          // Save assistant message to database
          await saveMessageToDatabase(assistantMessage, 'assistant');
        } else {
          throw new Error('Failed to send audio message');
        }
      } catch (error) {
        logger.error('Error sending audio', error, 'ChatInterface');
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
    
    if (!webhookUrl) {
      toast({
        title: "Configuration needed",
        description: "Please configure the n8n webhook URL below.",
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

    // Save user message to database
    await saveMessageToDatabase(userMessage, 'user');

    try {
      const response = await fetch(webhookUrl, {
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
        logger.debug('Webhook response', result, 'ChatInterface');
        
        // Handle different possible response formats from n8n
        let assistantResponse = '';
        let contentType: 'text' | 'image' = 'text';
        
        // Handle array responses (common in n8n)
        let data = result;
        if (Array.isArray(result) && result.length > 0) {
          data = result[0];
        }
        
        // Check if this is an image response - handle various formats
        if (data && typeof data === 'object') {
          let imageData = null;
          
          // Check multiple possible fields where image data might be
          const possibleFields = ['data', 'base64', 'image', 'content', 'output'];
          
          for (const field of possibleFields) {
            if (data[field] && typeof data[field] === 'string' && data[field].length > 100) {
              // Check if it looks like base64 data
              const testData = data[field].replace(/^data:image\/[a-z]+;base64,/, '');
              if (testData.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
                imageData = data[field];
                break;
              }
            }
          }
          
          // Also check for explicit image indicators
          if (!imageData && ((data.mimeType && data.mimeType.includes('image')) || data.fileType === 'image')) {
            // Look for any string field that might contain image data
            for (const field of possibleFields) {
              if (data[field] && typeof data[field] === 'string') {
                imageData = data[field];
                break;
              }
            }
          }
          
          // If we found potential image data, process it
          if (imageData) {
            // Clean the base64 data - remove data URI prefix if present
            const cleanBase64 = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
            
            // Validate it looks like base64 (relaxed validation)
            if (cleanBase64.length > 50 && /^[A-Za-z0-9+/=\s]*$/.test(cleanBase64)) {
              // Remove any whitespace
              assistantResponse = cleanBase64.replace(/\s/g, '');
              contentType = 'image';
              logger.debug('Image detected and processed', { base64Length: assistantResponse.length }, 'ChatInterface');
            } else {
              assistantResponse = 'Invalid image data format received from webhook.';
              logger.error('Invalid base64 data received from webhook', undefined, 'ChatInterface');
            }
          }
        }
        
        if (contentType === 'text' && typeof data === 'string') {
          assistantResponse = data;
        } else if (data.output) {
          assistantResponse = data.output;
        } else if (data.response) {
          assistantResponse = data.response;
        } else if (data.message) {
          assistantResponse = data.message;
        } else if (data.text) {
          assistantResponse = data.text;
        } else if (data.reply) {
          assistantResponse = data.reply;
        } else if (typeof result === 'string') {
          assistantResponse = result;
        } else {
          // If none of the expected fields exist, stringify the whole response
          assistantResponse = JSON.stringify(result, null, 2);
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: assistantResponse || 'Message received and processed.',
          contentType,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Save assistant message to database
        await saveMessageToDatabase(assistantMessage, 'assistant');
        
        logger.debug('Assistant message added', assistantMessage, 'ChatInterface');
      } else {
        const errorText = await response.text();
        if (response.status === 404 && errorText.includes('GET request')) {
          throw new Error('Webhook is configured for GET requests only. Please configure your n8n webhook to accept POST requests.');
        }
        throw new Error(`Webhook error (${response.status}): ${errorText}`);
      }
    } catch (error) {
      logger.error('Error sending message', error, 'ChatInterface');
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please check your webhook configuration.';
      toast({
        title: "Webhook Configuration Error",
        description: errorMessage,
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

  return (
    <div className="h-full flex flex-col bg-card border border-border">
      {/* Messages Area */}
      <ScrollArea className="h-96 p-4">
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
                    {message.contentType === 'image' ? (
                      <div className="space-y-2">
                        <img 
                          src={`data:image/png;base64,${message.content}`}
                          alt="Generated image"
                          className="w-32 h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(`data:image/png;base64,${message.content}`, '_blank')}
                        />
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
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
  );
};