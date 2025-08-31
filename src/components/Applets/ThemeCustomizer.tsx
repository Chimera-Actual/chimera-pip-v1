import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useThemeSystem } from '@/hooks/useThemeSystem';
import { useToast } from '@/hooks/use-toast';
import { Palette, Sparkles, Download, Trash2, Eye } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const ThemeCustomizer: React.FC = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const {
    currentTheme,
    customThemes,
    themePresets,
    changeTheme,
    createCustomTheme,
    deleteCustomTheme,
    applyCustomTheme,
    applyTheme,
  } = useThemeSystem();

  const [customName, setCustomName] = useState('');
  const [customHue, setCustomHue] = useState(120);
  const [accentIntensity, setAccentIntensity] = useState(100);
  const [glowIntensity, setGlowIntensity] = useState(100);
  const [scanlineOpacity, setScanlineOpacity] = useState(10);
  const [previewMode, setPreviewMode] = useState(false);

  const handlePreviewTheme = () => {
    setPreviewMode(true);
    applyTheme(customHue, accentIntensity, glowIntensity, scanlineOpacity / 100);
    setTimeout(() => {
      setPreviewMode(false);
      applyTheme(currentTheme.hue);
    }, 3000);
  };

  const handleCreateTheme = async () => {
    if (!customName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your custom theme",
        variant: "destructive"
      });
      return;
    }

    try {
      await createCustomTheme(customName.trim(), customHue, accentIntensity, glowIntensity, scanlineOpacity);
      setCustomName('');
      toast({
        title: "Theme Created",
        description: `"${customName}" theme has been saved`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create theme",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTheme = async (themeId: string, themeName: string) => {
    try {
      await deleteCustomTheme(themeId);
      toast({
        title: "Theme Deleted",
        description: `"${themeName}" theme has been deleted`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete theme",
        variant: "destructive"
      });
    }
  };

  const groupedPresets = themePresets.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, typeof themePresets>);

  return (
    <div className={`p-4 space-y-6 ${isMobile ? 'max-w-full' : 'max-w-4xl mx-auto'}`}>
      <div className="flex items-center space-x-3">
        <Palette className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-mono text-primary crt-glow uppercase tracking-wider">
          THEME CUSTOMIZER
        </h2>
        {previewMode && (
          <Badge variant="secondary" className="animate-pulse">
            PREVIEW MODE (3s)
          </Badge>
        )}
      </div>

      <Tabs defaultValue="presets" className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} bg-background/30`}>
          <TabsTrigger value="presets" className="font-mono">PRESETS</TabsTrigger>
          <TabsTrigger value="custom" className="font-mono">CUSTOM</TabsTrigger>
          {!isMobile && <TabsTrigger value="saved" className="font-mono">SAVED</TabsTrigger>}
        </TabsList>

        <TabsContent value="presets" className="space-y-4">
          {Object.entries(groupedPresets).map(([category, themes]) => (
            <Card key={category} className="bg-background/30 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono text-primary uppercase tracking-wider">
                  {category} THEMES
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`p-3 border rounded cursor-pointer transition-all ${
                        currentTheme.id === theme.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => changeTheme(theme)}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: `hsl(${theme.hue}, 100%, 50%)` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm font-medium text-foreground">
                            {theme.name}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground truncate">
                            {theme.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card className="bg-background/30 border-border">
            <CardHeader>
              <CardTitle className="text-lg font-mono text-primary uppercase tracking-wider flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                CREATE CUSTOM THEME
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="font-mono text-sm text-muted-foreground">THEME NAME</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter theme name..."
                  className="font-mono bg-background/50 border-border"
                  maxLength={30}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="font-mono text-sm text-muted-foreground">
                    HUE: {customHue}°
                  </Label>
                  <Slider
                    value={[customHue]}
                    onValueChange={(value) => setCustomHue(value[0])}
                    max={360}
                    step={1}
                    className="w-full"
                  />
                  <div
                    className="w-full h-3 rounded border border-border"
                    style={{
                      background: `linear-gradient(to right, ${Array.from({ length: 36 }, (_, i) => 
                        `hsl(${i * 10}, 100%, 50%)`
                      ).join(', ')})`
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="font-mono text-sm text-muted-foreground">
                    ACCENT INTENSITY: {accentIntensity}%
                  </Label>
                  <Slider
                    value={[accentIntensity]}
                    onValueChange={(value) => setAccentIntensity(value[0])}
                    max={150}
                    min={50}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="font-mono text-sm text-muted-foreground">
                    GLOW INTENSITY: {glowIntensity}%
                  </Label>
                  <Slider
                    value={[glowIntensity]}
                    onValueChange={(value) => setGlowIntensity(value[0])}
                    max={200}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="font-mono text-sm text-muted-foreground">
                    SCANLINE OPACITY: {scanlineOpacity}%
                  </Label>
                  <Slider
                    value={[scanlineOpacity]}
                    onValueChange={(value) => setScanlineOpacity(value[0])}
                    max={50}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
                <Button
                  onClick={handlePreviewTheme}
                  variant="outline"
                  className="font-mono flex-1"
                  disabled={previewMode}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  PREVIEW (3s)
                </Button>
                <Button
                  onClick={handleCreateTheme}
                  disabled={!customName.trim()}
                  className="font-mono flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  SAVE THEME
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          {customThemes.length === 0 ? (
            <Card className="bg-background/30 border-border">
              <CardContent className="p-6 text-center">
                <div className="font-mono text-muted-foreground">
                  No custom themes created yet
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {customThemes.map((theme) => (
                <Card key={theme.id} className="bg-background/30 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: `hsl(${theme.hue}, 100%, 50%)` }}
                        />
                        <div className="font-mono text-sm font-medium text-foreground">
                          {theme.name}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDeleteTheme(theme.id, theme.name)}
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-xs font-mono text-muted-foreground mb-3">
                      <div>Hue: {theme.hue}°</div>
                      <div>Intensity: {theme.accent_intensity}%</div>
                      <div>Glow: {theme.glow_intensity}%</div>
                    </div>

                    <Button
                      onClick={() => applyCustomTheme(theme)}
                      variant="outline"
                      size="sm"
                      className="w-full font-mono"
                    >
                      APPLY THEME
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};