import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AudioPlayerSettingsProps {
  settings: {
    volume?: number;
    autoplay?: boolean;
    loop?: boolean;
    playlist?: any[];
    waveformStyle?: string;
    waveformColor?: string;
    waveformSize?: string;
    showWaveform?: boolean;
  };
  onSettingsChange: (settings: any) => void;
  onClose: () => void;
}

export const AudioPlayerSettings: React.FC<AudioPlayerSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const [volume, setVolume] = useState([settings.volume || 75]);
  const [autoplay, setAutoplay] = useState(settings.autoplay ?? false);
  const [loop, setLoop] = useState(settings.loop ?? false);
  const [waveformStyle, setWaveformStyle] = useState(settings.waveformStyle || 'bars');
  const [waveformColor, setWaveformColor] = useState(settings.waveformColor || 'primary');
  const [waveformSize, setWaveformSize] = useState(settings.waveformSize || 'medium');
  const [showWaveform, setShowWaveform] = useState(settings.showWaveform ?? true);

  const handleSave = () => {
    onSettingsChange({
      ...settings,
      volume: volume[0],
      autoplay,
      loop,
      waveformStyle,
      waveformColor,
      waveformSize,
      showWaveform
    });
    onClose();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Volume Settings */}
      <div className="space-y-3">
        <Label className="text-sm font-mono text-primary uppercase tracking-wider">
          🔊 Default Volume: {volume[0]}%
        </Label>
        <Slider
          value={volume}
          onValueChange={setVolume}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="text-xs text-muted-foreground font-mono">
          Set the default volume level for audio playback
        </div>
      </div>

      {/* Playback Options */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary uppercase tracking-wider">
          ⚙️ Playback Options
        </Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono text-foreground">Auto-play</Label>
              <div className="text-xs text-muted-foreground font-mono">
                Automatically start playing when a track is selected
              </div>
            </div>
            <Switch checked={autoplay} onCheckedChange={setAutoplay} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono text-foreground">Loop Current Track</Label>
              <div className="text-xs text-muted-foreground font-mono">
                Automatically repeat the current track when it ends
              </div>
            </div>
            <Switch checked={loop} onCheckedChange={setLoop} />
          </div>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary uppercase tracking-wider">
          📊 Waveform Visualization
        </Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono text-foreground">Show Waveform</Label>
              <div className="text-xs text-muted-foreground font-mono">
                Display audio visualization waveform
              </div>
            </div>
            <Switch checked={showWaveform} onCheckedChange={setShowWaveform} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-mono text-foreground">Waveform Style</Label>
            <Select value={waveformStyle} onValueChange={setWaveformStyle}>
              <SelectTrigger className="font-mono bg-background/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="bars" className="font-mono">Frequency Bars</SelectItem>
                <SelectItem value="wave" className="font-mono">Waveform</SelectItem>
                <SelectItem value="circle" className="font-mono">Circular</SelectItem>
                <SelectItem value="minimal" className="font-mono">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-mono text-foreground">Waveform Color</Label>
            <Select value={waveformColor} onValueChange={setWaveformColor}>
              <SelectTrigger className="font-mono bg-background/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="primary" className="font-mono">Primary (Green)</SelectItem>
                <SelectItem value="accent" className="font-mono">Accent (Blue)</SelectItem>
                <SelectItem value="rainbow" className="font-mono">Rainbow</SelectItem>
                <SelectItem value="mono" className="font-mono">Monochrome</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-mono text-foreground">Waveform Size</Label>
            <Select value={waveformSize} onValueChange={setWaveformSize}>
              <SelectTrigger className="font-mono bg-background/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="small" className="font-mono">Small</SelectItem>
                <SelectItem value="medium" className="font-mono">Medium</SelectItem>
                <SelectItem value="large" className="font-mono">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Supported Formats Info */}
      <div className="bg-background/20 border border-border rounded-lg p-4">
        <Label className="text-xs font-mono text-muted-foreground uppercase">
          📋 Supported Audio Formats
        </Label>
        <div className="text-xs text-muted-foreground font-mono mt-2 space-y-1">
          <div>• MP3, WAV, OGG, M4A</div>
          <div>• Streaming URLs (HTTP/HTTPS)</div>
          <div>• Local file uploads</div>
          <div>• Internet radio streams</div>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="bg-background/20 border border-border rounded-lg p-4">
        <Label className="text-xs font-mono text-muted-foreground uppercase">
          💡 Usage Tips
        </Label>
        <div className="text-xs text-muted-foreground font-mono mt-2 space-y-1">
          <div>• Drag and drop audio files onto the widget</div>
          <div>• Use direct links to audio files for streaming</div>
          <div>• Click tracks in playlist to switch between them</div>
          <div>• Use keyboard controls: Space (play/pause)</div>
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