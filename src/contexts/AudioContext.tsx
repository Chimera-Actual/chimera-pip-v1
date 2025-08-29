import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
  storagePath?: string;
}

interface PlayerSettings {
  volume: number;
  autoplay: boolean;
  loop: boolean;
  playlist: AudioTrack[];
}

interface AudioContextType {
  // Audio state
  isPlaying: boolean;
  currentTrack: AudioTrack | null;
  currentTime: number;
  duration: number;
  volume: number[];
  playlist: AudioTrack[];
  settings: PlayerSettings;
  
  // Audio element ref
  audioRef: React.RefObject<HTMLAudioElement>;
  
  // Actions
  playTrack: (track: AudioTrack) => Promise<void>;
  togglePlayPause: () => void;
  stopPlayback: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (volume: number[]) => void;
  addTrack: (track: AudioTrack, widgetInstanceId?: string) => Promise<void>;
  removeTrack: (trackId: string, widgetInstanceId?: string) => Promise<void>;
  reorderPlaylist: (newPlaylist: AudioTrack[], widgetInstanceId?: string) => Promise<void>;
  handleFileUpload: (file: File, widgetInstanceId?: string) => Promise<void>;
  loadWidgetPlaylist: (widgetInstanceId: string) => Promise<void>;
  saveWidgetPlaylist: (widgetInstanceId: string, playlist: AudioTrack[]) => Promise<void>;
}

const AudioContextInstance = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContextInstance);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState([75]);
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [currentWidgetInstance, setCurrentWidgetInstance] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlayerSettings>({
    volume: 75,
    autoplay: false,
    loop: false,
    playlist: []
  });
  
  const volumeSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Load user settings (now handled per widget instance)
  useEffect(() => {
    // Global audio settings can be loaded here if needed
    // Individual widget playlists are loaded via loadWidgetPlaylist()
    
    // Cleanup timeout on unmount
    return () => {
      if (volumeSaveTimeoutRef.current) {
        clearTimeout(volumeSaveTimeoutRef.current);
      }
    };
  }, [user]);

  // Update audio volume when slider changes
  useEffect(() => {
    if (audioRef.current && volume.length > 0) {
      const volumeValue = Math.max(0, Math.min(1, volume[0] / 100));
      audioRef.current.volume = volumeValue;
      console.log('Setting audio volume to:', volumeValue, 'from slider value:', volume[0]);
    }
  }, [volume]);

  // Load playlist for specific widget instance
  const loadWidgetPlaylist = async (widgetInstanceId: string) => {
    if (!user) return;
    
    // Set this as the current active widget instance
    setCurrentWidgetInstance(widgetInstanceId);

    try {
      const { data, error } = await supabase
        .from('user_widget_settings')
        .select('settings')
        .eq('user_id', user.id)
        .eq('widget_instance_id', widgetInstanceId)
        .single();

      if (data?.settings && typeof data.settings === 'object') {
        const loadedSettings = data.settings as Partial<PlayerSettings>;
        
        // Refresh URLs for stored tracks with better error handling
        if (loadedSettings.playlist) {
          const refreshedPlaylist = await Promise.all(
            loadedSettings.playlist.map(async (track) => {
              if (track.storagePath) {
                try {
                  // Create fresh signed URL (30 days)
                  const { data: urlData } = await supabase.storage
                    .from('audio')
                    .createSignedUrl(track.storagePath, 60 * 60 * 24 * 30);
                  
                  if (urlData?.signedUrl) {
                    return { ...track, url: urlData.signedUrl };
                  }
                } catch (e) {
                  console.error('Failed to refresh URL for track:', track.title, e);
                }
              }
              return track;
            })
          );
          
          // Filter out tracks with invalid URLs
          const validTracks = refreshedPlaylist.filter(track => 
            track.url && !track.url.includes('undefined')
          );
          
          setPlaylist(validTracks);
          
          // Set first track as current if no current track and we have tracks
          if (validTracks.length > 0 && !currentTrack) {
            setCurrentTrack(validTracks[0]);
          }
        } else {
          setPlaylist([]);
        }
        
        if (loadedSettings.volume !== undefined) {
          setVolumeState([loadedSettings.volume]);
          setSettings(prevSettings => ({ 
            ...prevSettings, 
            volume: loadedSettings.volume 
          }));
        }
        
        setSettings(prevSettings => ({ ...prevSettings, ...loadedSettings }));
      } else {
        setPlaylist([]);
      }
    } catch (error) {
      console.error('Error loading widget playlist:', error);
    }
  };

  // Save playlist for specific widget instance
  const saveWidgetPlaylist = async (widgetInstanceId: string, newPlaylist: AudioTrack[]) => {
    if (!user) return;

    try {
      const updatedSettings = { ...settings, playlist: newPlaylist };
      
      await supabase
        .from('user_widget_settings')
        .upsert({
          user_id: user.id,
          widget_instance_id: widgetInstanceId,
          settings: updatedSettings as any
        });
      
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving playlist:', error);
    }
  };

  const handleFileUpload = async (file: File, widgetInstanceId?: string) => {
    if (!user || !widgetInstanceId) return;

    try {
      console.log('Uploading file:', file.name, 'for widget:', widgetInstanceId);
      
      // Create a consistent filename based on user and file content
      const fileExt = file.name.split('.').pop();
      const fileHash = await generateFileHash(file);
      const fileName = `${user.id}/${fileHash}.${fileExt}`;

      // Check if file already exists
      const { data: existingFiles } = await supabase.storage
        .from('audio')
        .list(user.id, {
          search: fileHash
        });

      let storagePath = fileName;
      let needsUpload = true;

      if (existingFiles && existingFiles.length > 0) {
        // File already exists, use the existing one
        storagePath = `${user.id}/${existingFiles[0].name}`;
        needsUpload = false;
        console.log('File already exists, reusing:', storagePath);
      }

      if (needsUpload) {
        const { data, error } = await supabase.storage
          .from('audio')
          .upload(fileName, file);

        if (error) {
          console.error('Error uploading file:', error);
          return;
        }
        console.log('File uploaded successfully:', data.path);
      }

      // Create a longer-lasting signed URL (30 days)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('audio')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 30);

      if (urlError || !urlData) {
        console.error('Error creating signed URL:', urlError);
        return;
      }

      const track: AudioTrack = {
        id: `file-${fileHash}`,
        title: file.name,
        url: urlData.signedUrl,
        storagePath: storagePath
      };
      
      // Check if track already exists in playlist
      const existingTrackIndex = playlist.findIndex(t => t.id === track.id);
      let newPlaylist: AudioTrack[];
      
      if (existingTrackIndex >= 0) {
        // Update existing track with new URL
        newPlaylist = [...playlist];
        newPlaylist[existingTrackIndex] = track;
        console.log('Updated existing track:', track.title);
      } else {
        // Add new track to playlist
        newPlaylist = [...playlist, track];
        console.log('Added new track to playlist:', track.title);
      }
      
      setPlaylist(newPlaylist);
      await saveWidgetPlaylist(widgetInstanceId, newPlaylist);
      
      if (!currentTrack) {
        setCurrentTrack(track);
      }
    } catch (error) {
      console.error('Error handling file upload:', error);
    }
  };

  // Generate a simple hash for file deduplication
  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 16); // Use first 16 characters for shorter filenames
  };

  const addTrack = async (track: AudioTrack, widgetInstanceId?: string) => {
    const newPlaylist = [...playlist, track];
    setPlaylist(newPlaylist);
    if (widgetInstanceId) {
      await saveWidgetPlaylist(widgetInstanceId, newPlaylist);
    }
  };

  const removeTrack = async (trackId: string, widgetInstanceId?: string) => {
    const newPlaylist = playlist.filter(track => track.id !== trackId);
    setPlaylist(newPlaylist);
    if (widgetInstanceId) {
      await saveWidgetPlaylist(widgetInstanceId, newPlaylist);
    }
    
    if (currentTrack?.id === trackId) {
      setCurrentTrack(newPlaylist[0] || null);
      setIsPlaying(false);
    }
  };

  const reorderPlaylist = async (newPlaylist: AudioTrack[], widgetInstanceId?: string) => {
    setPlaylist(newPlaylist);
    if (widgetInstanceId) {
      await saveWidgetPlaylist(widgetInstanceId, newPlaylist);
    }
  };

  const playTrack = async (track: AudioTrack) => {
    console.log('Playing track:', track.title, 'URL:', track.url);
    
    if (audioRef.current) {
      try {
        // Only change source if it's different to prevent unnecessary reloads
        if (audioRef.current.src !== track.url) {
          audioRef.current.src = track.url;
          audioRef.current.load();
        }
        
        setCurrentTrack(track);
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Track started playing successfully');
        }
      } catch (error) {
        console.error('Error playing track:', error);
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = () => {
    if (!currentTrack && playlist.length > 0) {
      playTrack(playlist[0]);
      return;
    }

    if (!currentTrack || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const nextTrack = () => {
    if (!currentTrack) return;
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    if (playlist[nextIndex]) {
      playTrack(playlist[nextIndex]);
    }
  };

  const prevTrack = () => {
    if (!currentTrack) return;
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    if (playlist[prevIndex]) {
      playTrack(playlist[prevIndex]);
    }
  };

  const setVolume = (newVolume: number[]) => {
    console.log('Volume slider changed to:', newVolume);
    setVolumeState(newVolume);
    
    // Immediately apply to audio element if available
    if (audioRef.current && newVolume.length > 0) {
      const volumeValue = Math.max(0, Math.min(1, newVolume[0] / 100));
      audioRef.current.volume = volumeValue;
      console.log('Immediately set audio volume to:', volumeValue);
    }
    
    // Save volume to database with debouncing to prevent spam
    if (currentWidgetInstance && user) {
      clearTimeout(volumeSaveTimeoutRef.current);
      volumeSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const updatedSettings = { ...settings, volume: newVolume[0], playlist };
          await supabase
            .from('user_widget_settings')
            .upsert({
              user_id: user.id,
              widget_instance_id: currentWidgetInstance,
              settings: updatedSettings as any
            });
          console.log('Volume saved to database:', newVolume[0]);
        } catch (err) {
          console.error('Error saving volume:', err);
        }
      }, 500); // Save after 500ms of no changes
    }
  };

  // Function to refresh expired track URLs
  const refreshTrackUrl = async (track: AudioTrack) => {
    if (!track.storagePath) return;

    try {
      const { data: urlData } = await supabase.storage
        .from('audio')
        .createSignedUrl(track.storagePath, 60 * 60 * 24 * 30);
      
      if (urlData?.signedUrl) {
        const updatedTrack = { ...track, url: urlData.signedUrl };
        setCurrentTrack(updatedTrack);
        
        // Update in playlist
        const updatedPlaylist = playlist.map(t => 
          t.id === track.id ? updatedTrack : t
        );
        setPlaylist(updatedPlaylist);
        // Note: Would need widgetInstanceId to save, but this is just for URL refresh
        
        // Retry playing with new URL
        if (audioRef.current) {
          audioRef.current.src = updatedTrack.url;
          audioRef.current.load();
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Failed to refresh track URL:', error);
    }
  };

  const value: AudioContextType = {
    isPlaying,
    currentTrack,
    currentTime,
    duration,
    volume,
    playlist,
    settings,
    audioRef,
    playTrack,
    togglePlayPause,
    stopPlayback,
    nextTrack,
    prevTrack,
    setVolume,
    addTrack,
    removeTrack,
    reorderPlaylist,
    handleFileUpload,
    loadWidgetPlaylist,
    saveWidgetPlaylist,
  };

  return (
    <AudioContextInstance.Provider value={value}>
      {/* Global audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => {
          console.log('Audio ended, loop:', settings.loop);
          if (settings.loop && currentTrack) {
            console.log('Looping current track');
            audioRef.current?.play();
          } else {
            console.log('Moving to next track');
            nextTrack();
          }
        }}
        onPlay={() => {
          console.log('Audio started playing');
          setIsPlaying(true);
        }}
        onPause={() => {
          console.log('Audio paused');
          setIsPlaying(false);
        }}
        onError={(e) => {
          console.error('Audio error:', e);
          console.error('Current src:', audioRef.current?.src);
          // Try to refresh the URL if it's expired
          if (currentTrack?.storagePath) {
            refreshTrackUrl(currentTrack);
          }
        }}
        onLoadStart={() => console.log('Audio load started')}
        onCanPlay={() => console.log('Audio can play')}
        crossOrigin="anonymous"
        style={{ display: 'none' }}
        preload="metadata"
      />
      {children}
    </AudioContextInstance.Provider>
  );
};