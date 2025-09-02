import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, Webhook, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomAssistantSettingsProps {
  settings: Record<string, any>;
  onSettingsChange: (settings: Record<string, any>) => void;
  onClose: () => void;
}

export const CustomAssistantSettings: React.FC<CustomAssistantSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const { toast } = useToast();
  const [agentName, setAgentName] = useState(settings.agentName || 'CUSTOM AI');
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl || '');
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens || 150);
  const [temperature, setTemperature] = useState(settings.temperature || 0.7);
  const [enableHistory, setEnableHistory] = useState(settings.enableHistory ?? true);
  const [customPrompt, setCustomPrompt] = useState(settings.customPrompt || '');
  const [testing, setTesting] = useState(false);

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL first",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          message: 'Test connection from CHIMERA-PIP 3000',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Webhook connection test successful",
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Unable to reach webhook: ${error}`,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const newSettings = {
      agentName,
      webhookUrl,
      apiKey,
      maxTokens,
      temperature,
      enableHistory,
      customPrompt
    };
    
    onSettingsChange(newSettings);
    toast({
      title: "Success",
      description: "Custom assistant settings have been updated",
    });
    onClose();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Basic Configuration */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary">BASIC CONFIGURATION</Label>
        
        <div className="space-y-2">
          <Label className="text-xs font-mono text-foreground">AGENT NAME</Label>
          <Input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="CUSTOM AI"
            className="font-mono bg-background/50 border-border"
          />
          <p className="text-xs text-muted-foreground font-mono">
            This name will be used for both the widget and agent identity
          </p>
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary">WEBHOOK CONFIGURATION</Label>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-mono text-foreground">WEBHOOK URL</Label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-api.com/webhook"
              className="font-mono bg-background/50 border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-mono text-foreground">API KEY (Optional)</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Bearer token or API key"
              className="font-mono bg-background/50 border-border"
            />
          </div>
          
          <Button
            onClick={testWebhook}
            disabled={testing || !webhookUrl}
            variant="outline"
            size="sm"
            className="font-mono"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {testing ? 'TESTING...' : 'TEST CONNECTION'}
          </Button>
        </div>
      </div>

      {/* AI Parameters */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary">AI PARAMETERS</Label>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-mono text-foreground">MAX TOKENS</Label>
            <Input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              min="50"
              max="500"
              className="font-mono bg-background/50 border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-mono text-foreground">TEMPERATURE</Label>
            <Input
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              min="0"
              max="2"
              step="0.1"
              className="font-mono bg-background/50 border-border"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-mono text-foreground">Enable Conversation History</Label>
            <p className="text-xs text-muted-foreground font-mono">
              Remember previous messages in conversation
            </p>
          </div>
          <Switch checked={enableHistory} onCheckedChange={setEnableHistory} />
        </div>
      </div>

      {/* System Message */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary">SYSTEM MESSAGE</Label>
        <Textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="You are a helpful AI assistant. Respond in a professional and informative manner..."
          className="font-mono bg-background/50 border-border min-h-24"
        />
        <p className="text-xs text-muted-foreground font-mono">
          Define the AI's behavior and response style. Leave empty for default.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose} className="font-mono">
          CANCEL
        </Button>
        <Button onClick={handleSave} className="font-mono">
          <Save className="w-4 h-4 mr-2" />
          SAVE SETTINGS
        </Button>
      </div>
    </div>
  );
};