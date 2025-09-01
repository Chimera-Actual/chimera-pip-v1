import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, MapPin, Eye, EyeOff } from 'lucide-react';
import { StandardSettingsTemplate } from '@/components/Layout/StandardSettingsTemplate';
import { MapLayer } from '@/hooks/useMapState';

interface Placemark {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  visible: boolean;
}

interface MapWidgetSettingsProps {
  settings: {
    defaultLayer?: MapLayer;
    placemarks?: Placemark[];
    showCenterpoint?: boolean;
    autoZoom?: boolean;
    followUser?: boolean;
  };
  onSettingsChange: (settings: any) => void;
  onClose: () => void;
}

const mapLayerOptions = [
  { value: 'standard', label: 'STANDARD', icon: '🗺️' },
  { value: 'satellite', label: 'SATELLITE', icon: '🛰️' },
  { value: 'terrain', label: 'TERRAIN', icon: '🏔️' },
  { value: 'transport', label: 'TRANSPORT', icon: '🚌' }
];

export const MapWidgetSettings: React.FC<MapWidgetSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const [defaultLayer, setDefaultLayer] = useState<MapLayer>(
    settings.defaultLayer || 'standard'
  );
  const [placemarks, setPlacemarks] = useState<Placemark[]>(
    settings.placemarks || []
  );
  const [showCenterpoint, setShowCenterpoint] = useState(
    settings.showCenterpoint ?? true
  );
  const [autoZoom, setAutoZoom] = useState(
    settings.autoZoom ?? true
  );
  const [followUser, setFollowUser] = useState(
    settings.followUser ?? false
  );

  const addPlacemark = () => {
    const newPlacemark: Placemark = {
      id: `placemark-${Date.now()}`,
      name: 'New Placemark',
      latitude: 37.7749,
      longitude: -122.4194,
      description: '',
      visible: true
    };
    setPlacemarks([...placemarks, newPlacemark]);
  };

  const togglePlacemarkVisibility = (id: string) => {
    setPlacemarks(placemarks.map(p => 
      p.id === id ? { ...p, visible: !p.visible } : p
    ));
  };

  const removePlacemark = (id: string) => {
    setPlacemarks(placemarks.filter(p => p.id !== id));
  };

  const updatePlacemark = (id: string, field: keyof Placemark, value: string | number) => {
    setPlacemarks(placemarks.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleSave = () => {
    onSettingsChange({
      defaultLayer,
      placemarks,
      showCenterpoint,
      autoZoom,
      followUser
    });
    onClose();
  };

  return (
    <StandardSettingsTemplate
      widgetIcon={<MapPin />}
      widgetName="MAP"
      onSave={handleSave}
      onCancel={onClose}
    >
      <ScrollArea className="h-full">
        <div className="space-y-6 p-1">
          {/* Map Layer Settings */}
          <div className="space-y-3">
            <Label className="text-sm font-mono text-primary uppercase tracking-wider">
              ◈ Default Map Layer
            </Label>
            <Select value={defaultLayer} onValueChange={(value: string) => setDefaultLayer(value as MapLayer)}>
              <SelectTrigger className="w-full bg-background/50 border-border font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {mapLayerOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="font-mono">
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Display Options */}
          <div className="space-y-4">
            <Label className="text-sm font-mono text-primary uppercase tracking-wider">
              ◈ Display Options
            </Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-card/50 border border-border rounded-lg">
                <div>
                  <Label className="text-xs font-mono text-foreground">Show Centerpoint Crosshairs</Label>
                  <p className="text-xs text-muted-foreground">Display targeting crosshairs at map center</p>
                </div>
                <Switch
                  checked={showCenterpoint}
                  onCheckedChange={setShowCenterpoint}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-card/50 border border-border rounded-lg">
                <div>
                  <Label className="text-xs font-mono text-foreground">Auto Zoom to Location</Label>
                  <p className="text-xs text-muted-foreground">Automatically adjust zoom when navigating</p>
                </div>
                <Switch
                  checked={autoZoom}
                  onCheckedChange={setAutoZoom}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-card/50 border border-border rounded-lg">
                <div>
                  <Label className="text-xs font-mono text-foreground">Follow User Location</Label>
                  <p className="text-xs text-muted-foreground">Keep map centered on user position</p>
                </div>
                <Switch
                  checked={followUser}
                  onCheckedChange={setFollowUser}
                />
              </div>
            </div>
          </div>

          {/* Custom Placemarks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-mono text-primary uppercase tracking-wider">
                ◈ Custom Placemarks
              </Label>
              <Button
                onClick={addPlacemark}
                size="sm"
                className="h-8 px-3 text-xs font-mono retro-button"
              >
                <Plus size={14} className="mr-1" />
                ADD MARK
              </Button>
            </div>

            <ScrollArea className="max-h-80">
              <div className="space-y-3">
                {placemarks.map((placemark) => (
                  <div
                    key={placemark.id}
                    className="p-4 bg-card/50 border border-border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-mono text-muted-foreground uppercase">
                          PLACEMARK #{placemark.id.split('-')[1]?.slice(-4) || '0000'}
                        </Label>
                        <Button
                          onClick={() => togglePlacemarkVisibility(placemark.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 retro-button"
                        >
                          {placemark.visible ? (
                            <Eye size={12} className="text-accent" />
                          ) : (
                            <EyeOff size={12} className="text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <Button
                        onClick={() => removePlacemark(placemark.id)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/20 retro-button"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-mono text-muted-foreground">NAME</Label>
                        <Input
                          value={placemark.name}
                          onChange={(e) => updatePlacemark(placemark.id, 'name', e.target.value)}
                          className="h-8 text-xs font-mono bg-background/50"
                          placeholder="Placemark name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-mono text-muted-foreground">DESCRIPTION</Label>
                        <Input
                          value={placemark.description || ''}
                          onChange={(e) => updatePlacemark(placemark.id, 'description', e.target.value)}
                          className="h-8 text-xs font-mono bg-background/50"
                          placeholder="Optional description"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-mono text-muted-foreground">LATITUDE</Label>
                        <Input
                          type="number"
                          step="any"
                          value={placemark.latitude}
                          onChange={(e) => updatePlacemark(placemark.id, 'latitude', parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs font-mono bg-background/50"
                          placeholder="0.000000"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-mono text-muted-foreground">LONGITUDE</Label>
                        <Input
                          type="number"
                          step="any"
                          value={placemark.longitude}
                          onChange={(e) => updatePlacemark(placemark.id, 'longitude', parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs font-mono bg-background/50"
                          placeholder="0.000000"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {placemarks.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground text-sm font-mono">
                    NO PLACEMARKS CONFIGURED
                    <br />
                    <span className="text-xs">Click "ADD MARK" to create custom waypoints</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </ScrollArea>
    </StandardSettingsTemplate>
  );
};