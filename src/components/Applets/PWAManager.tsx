import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePWAFeatures } from '@/hooks/usePWAFeatures';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Share2, 
  Bell, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Monitor,
  HardDrive,
  RefreshCw,
  Check,
  AlertTriangle
} from 'lucide-react';

export const PWAManager: React.FC = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const {
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    installApp,
    updateApp,
    shareApp,
    requestNotificationPermission,
    sendNotification,
    getStorageEstimate,
  } = usePWAFeatures();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageEstimate | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check notification permission
    setNotificationsEnabled(Notification.permission === 'granted');
    
    // Load storage info
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    const estimate = await getStorageEstimate();
    setStorageInfo(estimate);
  };

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        toast({
          title: "Installation Started",
          description: "CHIMERA-PIP 3000 is being installed...",
        });
      }
    } catch (error) {
      toast({
        title: "Installation Failed",
        description: "Could not install the app",
        variant: "destructive"
      });
    } finally {
      setInstalling(false);
    }
  };

  const handleShare = async () => {
    try {
      await shareApp();
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Could not share the app",
        variant: "destructive"
      });
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      
      if (granted) {
        sendNotification('Notifications Enabled', {
          body: 'You will now receive system notifications',
          icon: '/favicon.ico',
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Notification permission was not granted",
          variant: "destructive"
        });
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const getStorageUsagePercentage = () => {
    if (!storageInfo?.quota || !storageInfo?.usage) return 0;
    return (storageInfo.usage / storageInfo.quota) * 100;
  };

  return (
    <div className={`p-4 space-y-6 ${isMobile ? 'max-w-full' : 'max-w-4xl mx-auto'}`}>
      <div className="flex items-center space-x-3">
        <Smartphone className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-mono text-primary crt-glow uppercase tracking-wider">
          PWA MANAGER
        </h2>
      </div>

      {/* Status Overview */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <Card className="bg-background/30 border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-primary" />
              ) : (
                <WifiOff className="w-4 h-4 text-destructive" />
              )}
              <div className="font-mono text-xs text-muted-foreground">CONNECTION</div>
            </div>
            <div className="font-mono text-sm font-bold text-foreground">
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/30 border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {isInstalled ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Monitor className="w-4 h-4 text-muted-foreground" />
              )}
              <div className="font-mono text-xs text-muted-foreground">INSTALL</div>
            </div>
            <div className="font-mono text-sm font-bold text-foreground">
              {isInstalled ? 'INSTALLED' : 'BROWSER'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/30 border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {notificationsEnabled ? (
                <Bell className="w-4 h-4 text-primary" />
              ) : (
                <Bell className="w-4 h-4 text-muted-foreground" />
              )}
              <div className="font-mono text-xs text-muted-foreground">NOTIFY</div>
            </div>
            <div className="font-mono text-sm font-bold text-foreground">
              {notificationsEnabled ? 'ENABLED' : 'DISABLED'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/30 border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {updateAvailable ? (
                <AlertTriangle className="w-4 h-4 text-accent animate-pulse" />
              ) : (
                <Check className="w-4 h-4 text-primary" />
              )}
              <div className="font-mono text-xs text-muted-foreground">UPDATE</div>
            </div>
            <div className="font-mono text-sm font-bold text-foreground">
              {updateAvailable ? 'AVAILABLE' : 'CURRENT'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installation & Updates */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <Card className="bg-background/30 border-border">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-primary uppercase tracking-wider flex items-center">
              <Download className="w-4 h-4 mr-2" />
              APP INSTALLATION
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground">Status:</span>
                <Badge variant={isInstalled ? "default" : "outline"} className="font-mono text-xs">
                  {isInstalled ? 'INSTALLED' : 'BROWSER ONLY'}
                </Badge>
              </div>
              
              {isInstalled && (
                <div className="text-xs font-mono text-muted-foreground">
                  App is running in standalone mode
                </div>
              )}
            </div>

            <div className="space-y-3">
              {isInstallable && !isInstalled && (
                <Button
                  onClick={handleInstall}
                  disabled={installing}
                  className="w-full font-mono"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {installing ? 'INSTALLING...' : 'INSTALL APP'}
                </Button>
              )}

              {updateAvailable && (
                <Button
                  onClick={updateApp}
                  variant="outline"
                  className="w-full font-mono"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  UPDATE AVAILABLE
                </Button>
              )}

              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full font-mono"
              >
                <Share2 className="w-4 h-4 mr-2" />
                SHARE APP
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="bg-background/30 border-border">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-primary uppercase tracking-wider flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              NOTIFICATIONS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-mono text-sm text-foreground">
                  System Notifications
                </Label>
                <div className="text-xs font-mono text-muted-foreground">
                  Receive app updates and alerts
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>

            {notificationsEnabled && (
              <Button
                onClick={() => sendNotification('Test Notification', {
                  body: 'This is a test notification from CHIMERA-PIP 3000',
                  icon: '/favicon.ico',
                })}
                variant="outline"
                size="sm"
                className="w-full font-mono"
              >
                SEND TEST NOTIFICATION
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Storage Information */}
      <Card className="bg-background/30 border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono text-primary uppercase tracking-wider flex items-center">
            <HardDrive className="w-4 h-4 mr-2" />
            STORAGE USAGE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {storageInfo ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-muted-foreground">Used:</span>
                  <span className="text-foreground">{formatBytes(storageInfo.usage)}</span>
                </div>
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="text-foreground">{formatBytes(storageInfo.quota)}</span>
                </div>
                <Progress value={getStorageUsagePercentage()} className="h-2" />
                <div className="text-xs font-mono text-muted-foreground text-center">
                  {Math.round(getStorageUsagePercentage())}% used
                </div>
              </div>
              
              <Button
                onClick={loadStorageInfo}
                variant="outline"
                size="sm"
                className="w-full font-mono"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                REFRESH STORAGE INFO
              </Button>
            </>
          ) : (
            <div className="text-center font-mono text-muted-foreground">
              Storage information not available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features List */}
      <Card className="bg-background/30 border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono text-primary uppercase tracking-wider">
            PWA FEATURES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="flex items-center space-x-3">
              <Check className="w-4 h-4 text-primary" />
              <span className="font-mono text-sm text-foreground">Offline functionality</span>
            </div>
            <div className="flex items-center space-x-3">
              <Check className="w-4 h-4 text-primary" />
              <span className="font-mono text-sm text-foreground">App-like experience</span>
            </div>
            <div className="flex items-center space-x-3">
              <Check className="w-4 h-4 text-primary" />
              <span className="font-mono text-sm text-foreground">Push notifications</span>
            </div>
            <div className="flex items-center space-x-3">
              <Check className="w-4 h-4 text-primary" />
              <span className="font-mono text-sm text-foreground">Background sync</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};