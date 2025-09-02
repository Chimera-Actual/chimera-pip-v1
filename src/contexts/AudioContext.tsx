import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

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
  waveformStyle?: string;
  waveformColor?: string;
  waveformSize?: string;
  showWaveform?: boolean;
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
  togglePlayPause: () => Promise<void>;
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
    playlist: [],
    waveformStyle: 'bars',
    waveformColor: 'primary',
    waveformSize: 'medium',
    showWaveform: true
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
      logger.info('Setting audio volume', { volumeValue, sliderValue: volume[0] }, 'AudioContext');
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
                  logger.error('Failed to refresh URL for track', { title: track.title, error: e }, 'AudioContext');
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
          // Only update volume if it's different to prevent resetting user changes
          if (volume[0] !== loadedSettings.volume) {
            setVolumeState([loadedSettings.volume]);
          }
        }
        
        setSettings(prevSettings => ({ ...prevSettings, ...loadedSettings }));
      } else {
        setPlaylist([]);
      }
    } catch (error) {
      logger.error('Error loading widget playlist', error, 'AudioContext');
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
      logger.error('Error saving playlist', error, 'AudioContext');
    }
  };

  const handleFileUpload = async (file: File, widgetInstanceId?: string) => {
    if (!user || !widgetInstanceId) return;

    try {
      logger.info('Starting file upload', { fileName: file.name, widgetInstanceId }, 'AudioContext');
      
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
        logger.debug('File already exists, reusing', { storagePath }, 'AudioContext');
      }

      if (needsUpload) {
        const { data, error } = await supabase.storage
          .from('audio')
          .upload(fileName, file);

        if (error) {
          logger.error('Error uploading file', error, 'AudioContext');
          return;
        }
        logger.info('File uploaded successfully', { path: data.path }, 'AudioContext');
      }

      // Create a longer-lasting signed URL (30 days)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('audio')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 30);

      if (urlError || !urlData) {
        logger.error('Error creating signed URL', urlError, 'AudioContext');
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
        logger.debug('Updated existing track', { title: track.title }, 'AudioContext');
      } else {
        // Add new track to playlist
        newPlaylist = [...playlist, track];
        logger.info('Added new track to playlist', { title: track.title }, 'AudioContext');
      }
      
      setPlaylist(newPlaylist);
      await saveWidgetPlaylist(widgetInstanceId, newPlaylist);
      
      if (!currentTrack) {
        setCurrentTrack(track);
      }
    } catch (error) {
      logger.error('Error handling file upload', error, 'AudioContext');
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
    logger.debug('Starting track playback', { 
      title: track.title, 
      url: track.url, 
      audioExists: !!audioRef.current,
      readyState: audioRef.current?.readyState,
      currentSrc: audioRef.current?.src
    }, 'AudioContext');
    
    if (audioRef.current) {
      try {
        // Always set the source and load to ensure fresh state
        audioRef.current.src = track.url;
        logger.debug('Audio source set', { src: audioRef.current.src }, 'AudioContext');
        audioRef.current.load();
        
        setCurrentTrack(track);
        logger.debug('Current track updated', { title: track.title }, 'AudioContext');
        
        // Wait for loadeddata event before trying to play
        await new Promise((resolve, reject) => {
          const onLoadedData = () => {
            logger.debug('Audio loaded data, ready to play', undefined, 'AudioContext');
            audioRef.current?.removeEventListener('loadeddata', onLoadedData);
            audioRef.current?.removeEventListener('error', onError);
            resolve(true);
          };
          
          const onError = (error: any) => {
            logger.error('Audio load error', error, 'AudioContext');
            audioRef.current?.removeEventListener('loadeddata', onLoadedData);
            audioRef.current?.removeEventListener('error', onError);
            reject(error);
          };
          
          audioRef.current?.addEventListener('loadeddata', onLoadedData);
          audioRef.current?.addEventListener('error', onError);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            audioRef.current?.removeEventListener('loadeddata', onLoadedData);
            audioRef.current?.removeEventListener('error', onError);
            logger.warn('Audio load timeout, attempting play anyway', undefined, 'AudioContext');
            resolve(true);
          }, 10000);
        });
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          logger.info('Track started playing successfully', { title: track.title }, 'AudioContext');
          setIsPlaying(true);
        }
      } catch (error) {
        logger.error('Error playing track', {
          error,
          src: audioRef.current?.src,
          readyState: audioRef.current?.readyState,
          networkState: audioRef.current?.networkState
        }, 'AudioContext');
        setIsPlaying(false);
        
        // Try to refresh URL if it's a network/URL issue
        if (track.storagePath) {
          logger.debug('Attempting to refresh track URL', { storagePath: track.storagePath }, 'AudioContext');
          await refreshTrackUrl(track);
        }
      }
    } else {
      logger.error('No audio element available', undefined, 'AudioContext');
    }
  };

  const togglePlayPause = async () => {
    logger.debug('Toggle play/pause requested', { 
      isPlaying, 
      currentTrack: currentTrack?.title,
      playlistLength: playlist.length,
      audioExists: !!audioRef.current
    }, 'AudioContext');
    
    if (!currentTrack && playlist.length > 0) {
      logger.debug('No current track, playing first from playlist', undefined, 'AudioContext');
      await playTrack(playlist[0]);
      return;
    }

    if (!currentTrack || !audioRef.current) {
      logger.error('Cannot toggle playback', { 
        currentTrack: currentTrack?.title, 
        hasAudioElement: !!audioRef.current 
      }, 'AudioContext');
      return;
    }

    logger.debug('Audio element state check', {
      readyState: audioRef.current.readyState,
      paused: audioRef.current.paused,
      src: audioRef.current.src
    }, 'AudioContext');

    if (isPlaying) {
      logger.debug('Pausing audio', undefined, 'AudioContext');
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      logger.debug('Starting audio playback', undefined, 'AudioContext');
      try {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          logger.debug('Audio play promise resolved', undefined, 'AudioContext');
          setIsPlaying(true);
        }
      } catch (error) {
        logger.error('Error in toggle play/pause', {
          error,
          audioState: {
            readyState: audioRef.current?.readyState,
            networkState: audioRef.current?.networkState,
            paused: audioRef.current?.paused,
            ended: audioRef.current?.ended,
            currentTime: audioRef.current?.currentTime,
            duration: audioRef.current?.duration,
            src: audioRef.current?.src
          }
        }, 'AudioContext');
        setIsPlaying(false);
        // Try to refresh the URL if it's expired
        if (currentTrack?.storagePath) {
          logger.debug('Attempting to refresh expired URL', { storagePath: currentTrack.storagePath }, 'AudioContext');
          await refreshTrackUrl(currentTrack);
        }
      }
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
    logger.debug('Volume changed via slider', { newVolume }, 'AudioContext');
    setVolumeState(newVolume);
    
    // Immediately apply to audio element if available
    if (audioRef.current && newVolume.length > 0) {
      const volumeValue = Math.max(0, Math.min(1, newVolume[0] / 100));
      audioRef.current.volume = volumeValue;
      logger.debug('Applied volume to audio element', { volumeValue }, 'AudioContext');
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
          logger.info('Volume saved to database', { volume: newVolume[0] }, 'AudioContext');
        } catch (err) {
          logger.error('Error saving volume', err, 'AudioContext');
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
      logger.error('Failed to refresh track URL', error, 'AudioContext');
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

  // Fix audio element event handling to be more reliable
  return (
    <AudioContextInstance.Provider value={value}>
      {/* Global audio element with improved error handling */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => {
          const currentTime = (e.target as HTMLAudioElement).currentTime || 0;
          setCurrentTime(currentTime);
        }}
        onDurationChange={(e) => {
          const duration = (e.target as HTMLAudioElement).duration || 0;
          setDuration(duration);
        }}
        onEnded={() => {
          logger.debug('Audio ended', { loop: settings.loop }, 'AudioContext');
          setIsPlaying(false);
          if (settings.loop && currentTrack) {
            logger.debug('Looping current track', { title: currentTrack.title }, 'AudioContext');
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(err => logger.error('Error looping track', err, 'AudioContext'));
              }
            }, 100);
          } else {
            logger.debug('Moving to next track', undefined, 'AudioContext');
            nextTrack();
          }
        }}
        onPlay={() => {
          logger.debug('Audio started playing', undefined, 'AudioContext');
          setIsPlaying(true);
        }}
        onPause={() => {
          logger.debug('Audio paused', undefined, 'AudioContext');
          setIsPlaying(false);
        }}
        onError={(e) => {
          logger.error('Audio element error', { 
            error: e, 
            currentSrc: audioRef.current?.src 
          }, 'AudioContext');
          setIsPlaying(false);
          // Try to refresh the URL if it's expired
          if (currentTrack?.storagePath) {
            logger.debug('Attempting to refresh expired URL after audio error', { storagePath: currentTrack.storagePath }, 'AudioContext');
            refreshTrackUrl(currentTrack);
          }
        }}
        onLoadStart={() => logger.debug('Audio load started', undefined, 'AudioContext')}
        onCanPlay={() => logger.debug('Audio can play', undefined, 'AudioContext')}
        onLoadedData={() => logger.debug('Audio data loaded', undefined, 'AudioContext')}
        onStalled={() => logger.debug('Audio stalled', undefined, 'AudioContext')}
        onSuspend={() => logger.debug('Audio suspended', undefined, 'AudioContext')}
        onWaiting={() => logger.debug('Audio waiting', undefined, 'AudioContext')}
        crossOrigin="anonymous"
        style={{ display: 'none' }}
        preload="metadata"
      />
      {children}
    </AudioContextInstance.Provider>
  );
};