import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';

interface AudioPlayerSettingsProps {
  settings: {
    volume?: number;
    autoplay?: boolean;
    loop?: boolean;
    playlist?: any[];
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
  const isMobile = useIsMobile();
  const [volume, setVolume] = useState([settings.volume || 75]);
  const [autoplay, setAutoplay] = useState(settings.autoplay ?? false);
  const [loop, setLoop] = useState(settings.loop ?? false);
  const [showWaveform, setShowWaveform] = useState(settings.showWaveform ?? true);

  const handleSave = () => {
    onSettingsChange({
      ...settings,
      volume: volume[0],
      autoplay,
      loop,
      showWaveform
    });
    onClose();
  };

  return (
    <div className={`space-y-4 md:space-y-6 ${isMobile ? 'p-4' : 'p-6'}`}>
      {/* Volume Settings */}
      <div className="space-y-3">
        <Label className={`font-mono text-primary uppercase tracking-wider ${
          isMobile ? 'text-sm' : 'text-sm'
        }`}>
          🔊 Default Volume: {volume[0]}%
        </Label>
        <Slider
          value={volume}
          onValueChange={setVolume}
          min={0}
          max={100}
          step={1}
          className="w-full touch-target"
        />
        <div className={`text-muted-foreground font-mono ${
          isMobile ? 'text-sm' : 'text-xs'
        }`}>
          Set the default volume level for audio playback
        </div>
      </div>

      {/* Playback Options */}
      <div className="space-y-4">
        <Label className={`font-mono text-primary uppercase tracking-wider ${
          isMobile ? 'text-sm' : 'text-sm'
        }`}>
          ⚙️ Playback Options
        </Label>
        
        <div className="space-y-3">
          <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
            <div className="space-y-1">
              <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>Auto-play</Label>
              <div className={`text-muted-foreground font-mono ${
                isMobile ? 'text-sm' : 'text-xs'
              }`}>
                Automatically start playing when a track is selected
              </div>
            </div>
            <Switch checked={autoplay} onCheckedChange={setAutoplay} className="touch-target" />
          </div>

          <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
            <div className="space-y-1">
              <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>Loop Current Track</Label>
              <div className={`text-muted-foreground font-mono ${
                isMobile ? 'text-sm' : 'text-xs'
              }`}>
                Automatically repeat the current track when it ends
              </div>
            </div>
            <Switch checked={loop} onCheckedChange={setLoop} className="touch-target" />
          </div>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="space-y-4">
        <Label className={`font-mono text-primary uppercase tracking-wider ${
          isMobile ? 'text-sm' : 'text-sm'
        }`}>
          📊 Waveform Visualization
        </Label>
        
        <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
          <div className="space-y-1">
            <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>Show Waveform</Label>
            <div className={`text-muted-foreground font-mono ${
              isMobile ? 'text-sm' : 'text-xs'
            }`}>
              Display audio visualization waveform
            </div>
          </div>
          <Switch checked={showWaveform} onCheckedChange={setShowWaveform} className="touch-target" />
        </div>
      </div>

      {/* Supported Formats Info */}
      <div className="bg-background/20 border border-border rounded-lg p-4">
        <Label className={`font-mono text-muted-foreground uppercase ${
          isMobile ? 'text-sm' : 'text-xs'
        }`}>
          📋 Supported Audio Formats
        </Label>
        <div className={`text-muted-foreground font-mono mt-2 space-y-1 ${
          isMobile ? 'text-sm' : 'text-xs'
        }`}>
          <div>• MP3, WAV, OGG, M4A</div>
          <div>• Streaming URLs (HTTP/HTTPS)</div>
          <div>• Local file uploads</div>
          <div>• Internet radio streams</div>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="bg-background/20 border border-border rounded-lg p-4">
        <Label className={`font-mono text-muted-foreground uppercase ${
          isMobile ? 'text-sm' : 'text-xs'
        }`}>
          💡 Usage Tips
        </Label>
        <div className={`text-muted-foreground font-mono mt-2 space-y-1 ${
          isMobile ? 'text-sm' : 'text-xs'
        }`}>
          <div>• Drag and drop audio files onto the widget</div>
          <div>• Use direct links to audio files for streaming</div>
          <div>• Click tracks in playlist to switch between them</div>
          <div>• Use keyboard controls: Space (play/pause)</div>
        </div>
      </div>

      {/* Actions */}
      <div className={`flex gap-3 pt-4 border-t border-border ${
        isMobile ? 'flex-col' : 'justify-end'
      }`}>
        <Button
          onClick={onClose}
          variant="ghost"
          className={`font-mono touch-target ${
            isMobile ? 'h-10 text-sm' : 'h-10 px-6 text-sm'
          }`}
        >
          CANCEL
        </Button>
        <Button
          onClick={handleSave}
          className={`font-mono bg-primary hover:bg-primary/80 touch-target ${
            isMobile ? 'h-10 text-sm' : 'h-10 px-6 text-sm'
          }`}
        >
          SAVE SETTINGS
        </Button>
      </div>
    </div>
  );
};