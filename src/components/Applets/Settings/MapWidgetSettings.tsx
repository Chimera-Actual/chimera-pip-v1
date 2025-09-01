import React, { useState } from 'react';
import { Map, Satellite, Mountain, Navigation } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StandardSettingsTemplate } from '@/components/Layout/StandardSettingsTemplate';
import { MapboxPlacemarksManager } from '@/components/Applets/MapComponents/MapboxPlacemarksManager';
import { Placemark } from '@/hooks/useMapboxState';

interface MapWidgetSettingsProps {
  settings: {
    defaultLayer?: string;
    defaultZoom?: number;
    placemarks?: Placemark[];
    showCenterpoint?: boolean;
    autoZoom?: boolean;
    followUser?: boolean;
    enableTerrain?: boolean;
    enableFog?: boolean;
  };
  onSettingsChange: (settings: any) => void;
  onClose: () => void;
}

const mapLayerOptions = [
  { value: 'standard', label: 'STANDARD', icon: Map },
  { value: 'satellite', label: 'SATELLITE', icon: Satellite },
  { value: 'terrain', label: 'TERRAIN', icon: Mountain },
  { value: 'transport', label: 'TRANSPORT', icon: Navigation }
];

export const MapWidgetSettings: React.FC<MapWidgetSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const [defaultLayer, setDefaultLayer] = useState(settings.defaultLayer || 'standard');
  const [defaultZoom, setDefaultZoom] = useState(settings.defaultZoom || 10);
  const [placemarks, setPlacemarks] = useState<Placemark[]>(settings.placemarks || []);
  const [showCenterpoint, setShowCenterpoint] = useState(settings.showCenterpoint ?? true);
  const [autoZoom, setAutoZoom] = useState(settings.autoZoom ?? false);
  const [followUser, setFollowUser] = useState(settings.followUser ?? false);
  const [enableTerrain, setEnableTerrain] = useState(settings.enableTerrain ?? true);
  const [enableFog, setEnableFog] = useState(settings.enableFog ?? false);

  const togglePlacemarkVisibility = (id: string) => {
    setPlacemarks(prev => prev.map(p => 
      p.id === id ? { ...p, visible: !p.visible } : p
    ));
  };

  const removePlacemark = (id: string) => {
    setPlacemarks(prev => prev.filter(p => p.id !== id));
  };

  const updatePlacemark = (id: string, updates: Partial<Placemark>) => {
    setPlacemarks(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const handleNavigateToPlacemark = (placemark: Placemark) => {
    // This would trigger navigation in the parent component
    console.log('Navigate to:', placemark);
  };

  const handleSave = () => {
    onSettingsChange({
      defaultLayer,
      defaultZoom,
      placemarks,
      showCenterpoint,
      autoZoom,
      followUser,
      enableTerrain,
      enableFog
    });
    onClose();
  };

  return (
    <StandardSettingsTemplate
      widgetIcon={<Map />}
      widgetName="TACTICAL MAP"
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
            <Select value={defaultLayer} onValueChange={setDefaultLayer}>
              <SelectTrigger className="w-full bg-background/50 border-border font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {mapLayerOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value} className="font-mono">
                      <span className="flex items-center gap-2">
                        <Icon size={14} />
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Map Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-mono text-primary uppercase tracking-wider">
              ◈ Map Settings
            </Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-card/50 border border-border rounded-lg">
                <div>
                  <Label className="text-xs font-mono text-foreground">Default Zoom Level</Label>
                  <p className="text-xs text-muted-foreground">Initial zoom when widget loads</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={defaultZoom}
                    onChange={(e) => setDefaultZoom(parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-xs font-mono text-muted-foreground w-8">{defaultZoom}</span>
                </div>
              </div>
            </div>
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

              <div className="flex items-center justify-between p-3 bg-card/50 border border-border rounded-lg">
                <div>
                  <Label className="text-xs font-mono text-foreground">Enable 3D Terrain</Label>
                  <p className="text-xs text-muted-foreground">Show topographic elevation data</p>
                </div>
                <Switch
                  checked={enableTerrain}
                  onCheckedChange={setEnableTerrain}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-card/50 border border-border rounded-lg">
                <div>
                  <Label className="text-xs font-mono text-foreground">Atmospheric Fog</Label>
                  <p className="text-xs text-muted-foreground">Add atmospheric effects for realism</p>
                </div>
                <Switch
                  checked={enableFog}
                  onCheckedChange={setEnableFog}
                />
              </div>
            </div>
          </div>

          {/* Custom Placemarks */}
          <div className="space-y-4">
            <Label className="text-sm font-mono text-primary uppercase tracking-wider">
              ◈ Custom Placemarks
            </Label>
            
            <div className="h-64 border border-border rounded-lg bg-card/30">
              <MapboxPlacemarksManager
                placemarks={placemarks}
                onToggleVisibility={togglePlacemarkVisibility}
                onRemove={removePlacemark}
                onUpdate={updatePlacemark}
                onNavigate={handleNavigateToPlacemark}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </StandardSettingsTemplate>
  );
};