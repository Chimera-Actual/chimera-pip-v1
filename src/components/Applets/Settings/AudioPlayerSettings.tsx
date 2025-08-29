import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';

interface AudioTrack {
  id: string;
  title: string;
  url: string;
}

interface AudioPlayerSettingsProps {
  settings: {
    volume?: number;
    autoplay?: boolean;
    loop?: boolean;
    playlist?: AudioTrack[];
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
  const [playlist, setPlaylist] = useState<AudioTrack[]>(settings.playlist || []);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleSave = () => {
    onSettingsChange({
      volume: volume[0],
      autoplay,
      loop,
      playlist
    });
    onClose();
  };

  const addTrack = () => {
    if (!newUrl.trim()) return;

    const track: AudioTrack = {
      id: `track-${Date.now()}`,
      title: newTitle.trim() || 'Untitled Track',
      url: newUrl.trim()
    };

    setPlaylist([...playlist, track]);
    setNewTitle('');
    setNewUrl('');
  };

  const removeTrack = (trackId: string) => {
    setPlaylist(playlist.filter(track => track.id !== trackId));
  };

  const updateTrack = (trackId: string, field: keyof AudioTrack, value: string) => {
    setPlaylist(playlist.map(track => 
      track.id === trackId ? { ...track, [field]: value } : track
    ));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Volume */}
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
              <Label className="text-sm font-mono text-foreground">Autoplay</Label>
              <div className="text-xs text-muted-foreground font-mono">
                Automatically start playing when a track is selected
              </div>
            </div>
            <Switch checked={autoplay} onCheckedChange={setAutoplay} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono text-foreground">Loop Tracks</Label>
              <div className="text-xs text-muted-foreground font-mono">
                Repeat the current track when it ends
              </div>
            </div>
            <Switch checked={loop} onCheckedChange={setLoop} />
          </div>
        </div>
      </div>

      {/* Default Playlist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-mono text-primary uppercase tracking-wider">
            🎵 Default Playlist
          </Label>
        </div>

        {/* Add Track Form */}
        <div className="bg-background/20 border border-border rounded-lg p-4 space-y-3">
          <Label className="text-xs font-mono text-muted-foreground uppercase">
            Add New Track
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Track title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="font-mono bg-background/50 text-xs"
            />
            <Input
              placeholder="Audio URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="font-mono bg-background/50 text-xs"
            />
          </div>
          <Button
            onClick={addTrack}
            disabled={!newUrl.trim()}
            size="sm"
            className="w-full font-mono text-xs"
          >
            <Plus size={12} className="mr-1" />
            ADD TRACK
          </Button>
        </div>

        {/* Playlist Items */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {playlist.map((track, index) => (
            <div
              key={track.id}
              className="bg-card/50 border border-border rounded p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono text-muted-foreground uppercase">
                  Track #{index + 1}
                </Label>
                <Button
                  onClick={() => removeTrack(track.id)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-destructive hover:bg-destructive/20"
                >
                  <Trash2 size={12} />
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-xs font-mono text-muted-foreground">TITLE</Label>
                  <Input
                    value={track.title}
                    onChange={(e) => updateTrack(track.id, 'title', e.target.value)}
                    className="h-8 text-xs font-mono bg-background/50"
                  />
                </div>
                <div>
                  <Label className="text-xs font-mono text-muted-foreground">URL</Label>
                  <Input
                    value={track.url}
                    onChange={(e) => updateTrack(track.id, 'url', e.target.value)}
                    className="h-8 text-xs font-mono bg-background/50"
                  />
                </div>
              </div>
            </div>
          ))}

          {playlist.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm font-mono">
              NO TRACKS CONFIGURED
              <br />
              <span className="text-xs">Add audio URLs above to create a default playlist</span>
            </div>
          )}
        </div>
      </div>

      {/* Supported Formats */}
      <div className="bg-background/20 border border-border rounded-lg p-4">
        <Label className="text-xs font-mono text-muted-foreground uppercase">
          📊 Supported Audio Formats
        </Label>
        <div className="text-xs text-muted-foreground font-mono mt-2 space-y-1">
          <div>• MP3, WAV, OGG, M4A</div>
          <div>• Streaming URLs (HTTP/HTTPS)</div>
          <div>• Local file paths</div>
          <div>• CORS-enabled audio sources</div>
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