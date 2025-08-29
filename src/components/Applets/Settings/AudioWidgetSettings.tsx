import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface AudioWidgetSettingsProps {
  settings: {
    selectedVoice?: string;
    autoRecord?: boolean;
    playbackSpeed?: number;
    enableVAD?: boolean;
  };
  onSettingsChange: (settings: any) => void;
  onClose: () => void;
}

const voiceOptions = [
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

  const handleSave = () => {
    onSettingsChange({
      selectedVoice,
      autoRecord,
      playbackSpeed: playbackSpeed[0],
      enableVAD
    });
    onClose();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Voice Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-mono text-primary uppercase tracking-wider">
          ◈ Voice Selection
        </Label>
        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
          <SelectTrigger className="w-full bg-background/50 border-border font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            {voiceOptions.map((voice) => (
              <SelectItem key={voice.name} value={voice.name} className="font-mono">
                {voice.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audio Options */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary uppercase tracking-wider">
          ◈ Audio Options
        </Label>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-mono text-foreground">Auto Record</Label>
            <p className="text-xs text-muted-foreground font-mono">
              Automatically start recording when widget is active
            </p>
          </div>
          <Switch checked={autoRecord} onCheckedChange={setAutoRecord} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-mono text-foreground">Voice Activity Detection</Label>
            <p className="text-xs text-muted-foreground font-mono">
              Enable automatic speech detection
            </p>
          </div>
          <Switch checked={enableVAD} onCheckedChange={setEnableVAD} />
        </div>
      </div>

      {/* Playback Speed */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary uppercase tracking-wider">
          ◈ Playback Speed
        </Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-mono text-foreground">Speed</Label>
            <span className="text-sm font-mono text-primary">{playbackSpeed[0].toFixed(1)}x</span>
          </div>
          <Slider
            value={playbackSpeed}
            onValueChange={setPlaybackSpeed}
            min={0.5}
            max={2.0}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>2.0x</span>
          </div>
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