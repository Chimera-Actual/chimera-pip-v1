import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RectangularSwitch } from '@/components/ui/rectangular-switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { StandardSettingsTemplate } from '@/components/Layout/StandardSettingsTemplate';
import { Volume2 } from 'lucide-react';

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
    <StandardSettingsTemplate
      widgetIcon={<Volume2 />}
      widgetName="AUDIO PLAYER"
      onSave={handleSave}
      onCancel={onClose}
    >
      <div className="space-y-6">
        {/* Volume Settings */}
        <div className="space-y-3">
          <Label className="font-mono text-primary uppercase tracking-wider text-sm">
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
          <div className="text-muted-foreground font-mono text-xs">
            Set the default volume level for audio playback
          </div>
        </div>

        {/* Playback Options */}
        <div className="space-y-4">
          <Label className="font-mono text-primary uppercase tracking-wider text-sm">
            ⚙️ Playback Options
          </Label>
          
          <div className="space-y-3">
            <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
              <div className="space-y-1">
                <Label className="font-mono text-foreground text-sm">Auto-play</Label>
                <div className="text-muted-foreground font-mono text-xs">
                  Automatically start playing when a track is selected
                </div>
              </div>
              <RectangularSwitch checked={autoplay} onCheckedChange={setAutoplay} className="touch-target" />
            </div>

            <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
              <div className="space-y-1">
                <Label className="font-mono text-foreground text-sm">Loop Current Track</Label>
                <div className="text-muted-foreground font-mono text-xs">
                  Automatically repeat the current track when it ends
                </div>
              </div>
              <RectangularSwitch checked={loop} onCheckedChange={setLoop} className="touch-target" />
            </div>
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="space-y-4">
          <Label className="font-mono text-primary uppercase tracking-wider text-sm">
            📊 Waveform Visualization
          </Label>
          
          <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
            <div className="space-y-1">
              <Label className="font-mono text-foreground text-sm">Show Waveform</Label>
              <div className="text-muted-foreground font-mono text-xs">
                Display audio visualization waveform
              </div>
            </div>
            <RectangularSwitch checked={showWaveform} onCheckedChange={setShowWaveform} className="touch-target" />
          </div>
        </div>

        {/* Supported Formats Info */}
        <div className="bg-background/20 border border-border rounded-lg p-4">
          <Label className="font-mono text-muted-foreground uppercase text-xs">
            📋 Supported Audio Formats
          </Label>
          <div className="text-muted-foreground font-mono mt-2 space-y-1 text-xs">
            <div>• MP3, WAV, OGG, M4A</div>
            <div>• Streaming URLs (HTTP/HTTPS)</div>
            <div>• Local file uploads</div>
            <div>• Internet radio streams</div>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-background/20 border border-border rounded-lg p-4">
          <Label className="font-mono text-muted-foreground uppercase text-xs">
            💡 Usage Tips
          </Label>
          <div className="text-muted-foreground font-mono mt-2 space-y-1 text-xs">
            <div>• Drag and drop audio files onto the widget</div>
            <div>• Use direct links to audio files for streaming</div>
            <div>• Click tracks in playlist to switch between them</div>
            <div>• Use keyboard controls: Space (play/pause)</div>
          </div>
        </div>
      </div>
    </StandardSettingsTemplate>
  );
};