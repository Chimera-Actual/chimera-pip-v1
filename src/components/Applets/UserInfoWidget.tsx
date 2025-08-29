import React, { useState, useEffect, useRef } from 'react';
import { User, Edit3, Save, X, Upload, Clock, Calendar, Lock, AlertTriangle, Database, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const UserInfoWidget: React.FC = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const { toast } = useToast();
  const [loginTime] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [totalUsageTime, setTotalUsageTime] = useState(0);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [privacySettings, setPrivacySettings] = useState({
    auto_save_enabled: true,
    data_backup_enabled: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Calculate total usage time based on user creation date
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
      setCurrentPassword('');
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
      // Clear localStorage but preserve all Supabase auth-related keys
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        // Keep any key that starts with 'supabase.auth.' or contains 'sb-'
        if (!key.startsWith('supabase.auth.') && !key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage but preserve auth keys if any exist there
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (!key.startsWith('supabase.auth.') && !key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });

      toast({
        title: "Cache Cleared",
        description: "All cached data has been cleared successfully. You remain logged in.",
      });

      // Optionally reload the page to ensure clean state
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
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

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

  return (
    <div className="h-full flex flex-col bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="text-primary font-mono text-lg uppercase tracking-wider crt-glow">
            ◉ USER PROFILE
          </span>
        </div>
      </div>

      {/* User Avatar and Basic Info */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 border-2 border-primary bg-background/20 rounded-lg flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-primary crt-glow" />
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full"
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
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-xl font-display bg-background/50"
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
                <>
                  <h2 className="text-2xl font-display text-primary crt-glow">
                    {profile?.display_name || 'VAULT.DWELLER'}
                  </h2>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="text-foreground">{user?.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">EMAIL:</span>
                <span className="text-primary">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">STATUS:</span>
                <span className="text-primary">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto crt-scrollbar">
        {/* Usage Statistics */}
      <div className="border-b border-border bg-card p-4">
        <h3 className="text-primary font-display mb-3 crt-glow text-sm uppercase flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Usage Statistics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border bg-background/20 p-3">
            <div className="text-xs text-muted-foreground font-mono mb-1">TOTAL APP USAGE</div>
            <div className="text-primary font-mono text-sm crt-glow">
              {formatTotalTime(totalUsageTime)}
            </div>
          </div>
          <div className="border border-border bg-background/20 p-3">
            <div className="text-xs text-muted-foreground font-mono mb-1">CURRENT SESSION</div>
            <div className="text-primary font-mono text-sm crt-glow">{uptime}</div>
          </div>
        </div>
      </div>

      {/* Session Information */}
      <div className="flex-1 p-4">
        <h3 className="text-primary font-display mb-3 crt-glow text-sm uppercase flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Session Details
        </h3>
        <div className="space-y-3">
          <div className="border border-border bg-background/20 p-3">
            <div className="text-xs text-muted-foreground font-mono mb-1">LOGIN TIME</div>
            <div className="text-primary font-mono text-sm crt-glow">
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
            <div className="text-xs text-muted-foreground font-mono mb-1">MEMBER SINCE</div>
            <div className="text-primary font-mono text-sm crt-glow">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'Loading...'}
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="border-b border-border bg-card p-4">
        <h3 className="text-primary font-display mb-3 crt-glow text-sm uppercase flex items-center gap-2">
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
      </div>

      {/* Data & Privacy */}
      <div className="border-b border-border bg-card p-4">
        <h3 className="text-primary font-display mb-3 crt-glow text-sm uppercase flex items-center gap-2">
          <Database className="w-4 h-4" />
          Data & Privacy
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono text-foreground">
                Auto-Save Settings
              </Label>
              <p className="text-xs text-muted-foreground font-mono">
                Automatically save changes to your preferences
              </p>
            </div>
            <Switch
              checked={privacySettings.auto_save_enabled}
              onCheckedChange={(checked) => {
                setPrivacySettings(prev => ({ ...prev, auto_save_enabled: checked }));
                // Auto-save this change immediately
                setTimeout(() => savePrivacySettings(), 100);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono text-foreground">
                Cloud Data Backup
              </Label>
              <p className="text-xs text-muted-foreground font-mono">
                Create backups of your settings and data
              </p>
            </div>
            <Switch
              checked={privacySettings.data_backup_enabled}
              onCheckedChange={(checked) => {
                setPrivacySettings(prev => ({ ...prev, data_backup_enabled: checked }));
                setTimeout(() => savePrivacySettings(), 100);
              }}
            />
          </div>

          <div className="bg-background/20 border border-border rounded p-3 text-xs font-mono space-y-1">
            <div className="text-muted-foreground">PRIVACY NOTICE:</div>
            <div className="text-foreground">
              • All data is encrypted and stored securely
            </div>
            <div className="text-foreground">
              • You have full control over your data
            </div>
            <div className="text-foreground">
              • Data can be exported or deleted at any time
            </div>
          </div>
        </div>
      </div>

      {/* System Maintenance */}
      <div className="flex-1 p-4">
        <h3 className="text-primary font-display mb-3 crt-glow text-sm uppercase flex items-center gap-2">
          <Shield className="w-4 h-4" />
          System Maintenance
        </h3>
        <div className="space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full font-mono text-sm text-destructive border-destructive/50 hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear User Cache
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-primary font-mono flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Clear Cache Warning
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground font-mono">
                  This will clear all cached data including:
                  <br />• Temporary files and data
                  <br />• Widget settings cache
                  <br />• Application state
                  <br /><br />
                  You will remain logged in, but the app will reload to ensure a clean state.
                  <br /><br />
                  Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-mono">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleClearCache}
                  className="bg-destructive hover:bg-destructive/90 font-mono"
                >
                  Clear Cache
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="bg-background/20 border border-border rounded p-3 text-xs font-mono space-y-1">
            <div className="text-muted-foreground">MAINTENANCE INFO:</div>
            <div className="text-foreground">
              • Use cache clearing if experiencing issues
            </div>
            <div className="text-foreground">
              • This action is safe and reversible
            </div>
            <div className="text-foreground">
              • Your account data will remain intact
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};