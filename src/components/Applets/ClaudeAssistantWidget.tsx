import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, User, Bot, Settings, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const ClaudeAssistantWidget: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setSessionId(`claude-${user.id}-${Date.now()}`);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

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

      // Simulate Claude AI response for now
      // TODO: Implement actual Claude API integration
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Claude AI response to: "${userMessage.content}"\n\nThis is a placeholder response. Claude integration will be implemented with proper API keys and endpoints.`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);

        // Store assistant message
        supabase.from('messages').insert({
          content: assistantMessage.content,
          role: 'assistant',
          session_id: sessionId,
          conversation_id: conversationId,
        });
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
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
          <span className="text-lg">🤖</span>
          <span className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
            CLAUDE AI AGENT
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-70 hover:opacity-100"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🤖</div>
                <div className="text-lg font-mono text-primary mb-2">CLAUDE AI READY</div>
                <div className="text-sm text-muted-foreground font-mono">
                  Advanced reasoning and analysis assistant
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-4 space-y-1">
                  <div>• Complex problem solving</div>
                  <div>• Code analysis and review</div>
                  <div>• Research and synthesis</div>
                  <div>• Creative writing</div>
                </div>
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
                      <Zap className="w-4 h-4 animate-pulse" />
                      Claude is thinking...
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
              placeholder="Ask Claude anything..."
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