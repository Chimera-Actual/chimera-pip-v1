import React, { useState, useEffect, useRef } from 'react';
import { User, Edit3, Save, X, Upload, Clock, Calendar, Lock, Shield, Database, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StandardWidgetTemplate } from '@/components/Layout/StandardWidgetTemplate';
import { useResponsive } from '@/hooks/useResponsive';

export const UserInfoWidget: React.FC = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const { toast } = useToast();
  const { isMobile, isTablet } = useResponsive();
  
  const [loginTime] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [totalUsageTime, setTotalUsageTime] = useState(0);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [privacySettings, setPrivacySettings] = useState({
    auto_save_enabled: true,
    data_backup_enabled: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Utility functions
  const formatUptime = (startTime: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (days > 0) {
      return `${days}d ${remainingHours}h ${minutes}m`;
    }
    return `${remainingHours}h ${minutes}m`;
  };

  const [uptime, setUptime] = useState(formatUptime(loginTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime(formatUptime(loginTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [loginTime]);

  // Load user profile and usage stats
  useEffect(() => {
    if (user && profile) {
      setEditedName(profile.display_name || '');
      loadUsageStats();
      loadPrivacySettings();
    }
  }, [user, profile]);

  const loadUsageStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const createdAt = new Date(data.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        setTotalUsageTime(totalMinutes);
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const loadPrivacySettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('auto_save_enabled, data_backup_enabled')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPrivacySettings({
          auto_save_enabled: data.auto_save_enabled ?? true,
          data_backup_enabled: data.data_backup_enabled ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const savePrivacySettings = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          auto_save_enabled: privacySettings.auto_save_enabled,
          data_backup_enabled: privacySettings.data_backup_enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Privacy settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearCache = async () => {
    try {
      const keysToKeep = ['supabase.auth.token'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      sessionStorage.clear();

      toast({
        title: "Cache Cleared",
        description: "All cached data has been cleared successfully.",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !editedName.trim()) return;

    try {
      await updateProfile({ display_name: editedName.trim() });
      setIsEditing(false);
      
      toast({
        title: "Profile Updated",
        description: "Your display name has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from('avatars')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);

      if (urlData?.signedUrl) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: urlData.signedUrl })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        await updateProfile({ avatar_url: urlData.signedUrl });
        
        toast({
          title: "Avatar Updated",
          description: "Your avatar has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Header controls
  const headerControls = (
    <div className="flex items-center gap-2">
      {!isEditing && (
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
          <Edit3 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );

  return (
    <StandardWidgetTemplate
      icon={<User size={isMobile ? 16 : isTablet ? 18 : 20} />}
      title="USER PROFILE"
      controls={headerControls}
    >
      <ScrollArea className="h-full">
        <div className={`space-y-4 ${isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-6'}`}>
          {/* User Avatar and Basic Info */}
          <Card className="bg-card/50 border-border">
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <div className={`flex ${isMobile ? 'flex-col items-center space-y-4' : 'items-center space-x-6'}`}>
                <div className="relative">
                  <div className={`${isMobile ? 'w-20 h-20' : isTablet ? 'w-24 h-24' : 'w-28 h-28'} border-2 border-primary bg-background/20 rounded-lg flex items-center justify-center overflow-hidden`}>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className={`${isMobile ? 'w-10 h-10' : isTablet ? 'w-12 h-12' : 'w-14 h-14'} text-primary crt-glow`} />
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-1 -right-1 h-6 w-6 p-0 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                
                <div className={`flex-1 ${isMobile ? 'text-center' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className={`${isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'} font-display bg-background/50`}
                          placeholder="Enter display name"
                        />
                        <Button size="sm" onClick={handleSaveProfile}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          setIsEditing(false);
                          setEditedName(profile?.display_name || '');
                        }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <h2 className={`${isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'} font-display text-primary crt-glow`}>
                        {profile?.display_name || 'VAULT.DWELLER'}
                      </h2>
                    )}
                  </div>
                  
                  <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'} font-mono`}>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="text-foreground">{user?.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">EMAIL:</span>
                      <span className="text-primary truncate">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">STATUS:</span>
                      <span className="text-primary">ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card className="bg-card/50 border-border">
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <h3 className={`text-primary font-display mb-3 crt-glow ${isMobile ? 'text-sm' : 'text-base'} uppercase flex items-center gap-2`}>
                <Clock className="w-4 h-4" />
                Usage Statistics
              </h3>
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
                <div className="border border-border bg-background/20 p-3">
                  <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground font-mono mb-1`}>TOTAL APP USAGE</div>
                  <div className={`text-primary font-mono ${isMobile ? 'text-sm' : 'text-sm'} crt-glow`}>
                    {formatTotalTime(totalUsageTime)}
                  </div>
                </div>
                <div className="border border-border bg-background/20 p-3">
                  <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground font-mono mb-1`}>CURRENT SESSION</div>
                  <div className={`text-primary font-mono ${isMobile ? 'text-sm' : 'text-sm'} crt-glow`}>{uptime}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Information */}
          <Card className="bg-card/50 border-border">
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <h3 className={`text-primary font-display mb-3 crt-glow ${isMobile ? 'text-sm' : 'text-base'} uppercase flex items-center gap-2`}>
                <Calendar className="w-4 h-4" />
                Session Details
              </h3>
              <div className="space-y-3">
                <div className="border border-border bg-background/20 p-3">
                  <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground font-mono mb-1`}>LOGIN TIME</div>
                  <div className={`text-primary font-mono ${isMobile ? 'text-sm' : 'text-sm'} crt-glow`}>
                    {loginTime.toLocaleString('en-US', { 
                      hour12: false,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="border border-border bg-background/20 p-3">
                  <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground font-mono mb-1`}>MEMBER SINCE</div>
                  <div className={`text-primary font-mono ${isMobile ? 'text-sm' : 'text-sm'} crt-glow`}>
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Loading...'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-card/50 border-border">
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <h3 className={`text-primary font-display mb-3 crt-glow ${isMobile ? 'text-sm' : 'text-base'} uppercase flex items-center gap-2`}>
                <Lock className="w-4 h-4" />
                Security Settings
              </h3>
              <div className="space-y-3">
                {!isChangingPassword ? (
                  <Button
                    onClick={() => setIsChangingPassword(true)}
                    variant="outline"
                    className="w-full font-mono text-sm"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                ) : (
                  <Card className="bg-background/20 border-border">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground font-mono">NEW PASSWORD</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="font-mono text-sm"
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground font-mono">CONFIRM PASSWORD</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="font-mono text-sm"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleChangePassword} size="sm" className="flex-1">
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button 
                          onClick={() => {
                            setIsChangingPassword(false);
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          variant="ghost" 
                          size="sm" 
                          className="flex-1"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="bg-card/50 border-border">
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <h3 className={`text-primary font-display mb-3 crt-glow ${isMobile ? 'text-sm' : 'text-base'} uppercase flex items-center gap-2`}>
                <Shield className="w-4 h-4" />
                Privacy Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-mono text-foreground">Auto-Save Settings</Label>
                    <div className="text-xs text-muted-foreground font-mono">
                      Automatically save widget settings
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.auto_save_enabled}
                    onCheckedChange={(checked) => {
                      setPrivacySettings(prev => ({ ...prev, auto_save_enabled: checked }));
                      savePrivacySettings();
                    }}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-mono text-foreground">Data Backup</Label>
                    <div className="text-xs text-muted-foreground font-mono">
                      Create backups of your data
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.data_backup_enabled}
                    onCheckedChange={(checked) => {
                      setPrivacySettings(prev => ({ ...prev, data_backup_enabled: checked }));
                      savePrivacySettings();
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Maintenance */}
          <Card className="bg-card/50 border-border">
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <h3 className={`text-primary font-display mb-3 crt-glow ${isMobile ? 'text-sm' : 'text-base'} uppercase flex items-center gap-2`}>
                <Database className="w-4 h-4" />
                System Maintenance
              </h3>
              <div className="space-y-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full font-mono text-sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear User Cache
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear User Cache</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will clear all cached data except your authentication session. 
                        The page will reload automatically after clearing the cache.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearCache}>
                        Clear Cache
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </StandardWidgetTemplate>
  );
};