import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

interface AudioWidgetSettingsProps {
  settings: {
    selectedVoice?: string;
    autoRecord?: boolean;
    playbackSpeed?: number;
    enableVAD?: boolean;
    elevenLabsApiKey?: string;
  };
  onSettingsChange: (settings: any) => void;
  onClose: () => void;
}

const voices = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' }
];

export const AudioWidgetSettings: React.FC<AudioWidgetSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const [selectedVoice, setSelectedVoice] = useState(settings.selectedVoice || 'Aria');
  const [autoRecord, setAutoRecord] = useState(settings.autoRecord ?? false);
  const [playbackSpeed, setPlaybackSpeed] = useState([settings.playbackSpeed || 1.0]);
  const [enableVAD, setEnableVAD] = useState(settings.enableVAD ?? true);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState(settings.elevenLabsApiKey || '');

  const handleSave = () => {
    onSettingsChange({
      selectedVoice,
      autoRecord,
      playbackSpeed: playbackSpeed[0],
      enableVAD,
      elevenLabsApiKey
    });
    onClose();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Voice Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-mono text-primary uppercase tracking-wider">
          🔊 Voice Selection
        </Label>
        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
          <SelectTrigger className="w-full bg-background/50 border-border font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            {voices.map((voice) => (
              <SelectItem key={voice.id} value={voice.name} className="font-mono">
                {voice.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground font-mono">
          Select the default voice for text-to-speech synthesis
        </div>
      </div>

      {/* ElevenLabs API Key */}
      <div className="space-y-3">
        <Label className="text-sm font-mono text-primary uppercase tracking-wider">
          🔑 ElevenLabs API Key
        </Label>
        <Input
          type="password"
          value={elevenLabsApiKey}
          onChange={(e) => setElevenLabsApiKey(e.target.value)}
          className="font-mono bg-background/50"
          placeholder="Enter your ElevenLabs API key"
        />
        <div className="flex items-start gap-2 text-xs text-muted-foreground font-mono">
          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
          <div>
            Required for text-to-speech functionality. Get your API key from{' '}
            <a 
              href="https://elevenlabs.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              elevenlabs.io
            </a>
          </div>
        </div>
      </div>

      {/* Playback Speed */}
      <div className="space-y-3">
        <Label className="text-sm font-mono text-primary uppercase tracking-wider">
          ⚡ Playback Speed: {playbackSpeed[0]}x
        </Label>
        <Slider
          value={playbackSpeed}
          onValueChange={setPlaybackSpeed}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
        />
        <div className="text-xs text-muted-foreground font-mono">
          Adjust audio playback speed (0.5x - 2.0x)
        </div>
      </div>

      {/* Audio Options */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary uppercase tracking-wider">
          ⚙️ Audio Options
        </Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono text-foreground">Auto-Record</Label>
              <div className="text-xs text-muted-foreground font-mono">
                Automatically start recording when widget opens
              </div>
            </div>
            <Switch checked={autoRecord} onCheckedChange={setAutoRecord} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono text-foreground">Voice Activity Detection</Label>
              <div className="text-xs text-muted-foreground font-mono">
                Automatically detect speech and transcribe recordings
              </div>
            </div>
            <Switch checked={enableVAD} onCheckedChange={setEnableVAD} />
          </div>
        </div>
      </div>

      {/* Audio Quality Info */}
      <div className="bg-background/20 border border-border rounded-lg p-4">
        <Label className="text-xs font-mono text-muted-foreground uppercase">
          📊 Technical Specifications
        </Label>
        <div className="text-xs text-muted-foreground font-mono mt-2 space-y-1">
          <div>• Sample Rate: 44.1kHz</div>
          <div>• Channels: Mono (1 channel)</div>
          <div>• Format: WebM Opus</div>
          <div>• Noise Suppression: Enabled</div>
          <div>• Echo Cancellation: Enabled</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          onClick={onClose}
          variant="ghost"
          className="h-10 px-6 font-mono text-sm"
        >
          CANCEL
        </Button>
        <Button
          onClick={handleSave}
          className="h-10 px-6 font-mono text-sm bg-primary hover:bg-primary/80"
        >
          SAVE SETTINGS
        </Button>
      </div>
    </div>
  );
};