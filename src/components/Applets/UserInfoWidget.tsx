import React, { useState, useEffect, useRef } from 'react';
import { User, Edit3, Save, X, Upload, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="h-full flex flex-col bg-card border border-border">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary crt-glow" />
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
    </div>
  );
};