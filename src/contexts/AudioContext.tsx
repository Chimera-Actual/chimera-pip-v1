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
  addTrack: (track: AudioTrack) => Promise<void>;
  removeTrack: (trackId: string) => Promise<void>;
  reorderPlaylist: (newPlaylist: AudioTrack[]) => Promise<void>;
  handleFileUpload: (file: File) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
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
  const [settings, setSettings] = useState<PlayerSettings>({
    volume: 75,
    autoplay: false,
    loop: false,
    playlist: []
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_widget_settings')
          .select('settings')
          .eq('user_id', user.id)
          .eq('widget_id', 'audio-system')
          .single();

        if (data?.settings && typeof data.settings === 'object') {
          const loadedSettings = data.settings as Partial<PlayerSettings>;
          setSettings(prevSettings => ({ ...prevSettings, ...loadedSettings }));
          setPlaylist(loadedSettings.playlist || []);
          if (loadedSettings.volume !== undefined) {
            setVolumeState([loadedSettings.volume]);
          }
        }
      } catch (error) {
        console.error('Error loading player settings:', error);
      }
    };

    loadSettings();
  }, [user]);

  // Update audio volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  // Save playlist to settings
  const savePlaylistToSettings = async (newPlaylist: AudioTrack[]) => {
    if (!user) return;

    try {
      const updatedSettings = { ...settings, playlist: newPlaylist };
      
      await supabase
        .from('user_widget_settings')
        .upsert({
          user_id: user.id,
          widget_id: 'audio-system',
          settings: updatedSettings as any
        });
      
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving playlist:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      console.log('Uploading file:', file.name);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('audio')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading file:', error);
        return;
      }

      console.log('File uploaded successfully:', data.path);

      const { data: urlData, error: urlError } = await supabase.storage
        .from('audio')
        .createSignedUrl(fileName, 60 * 60 * 24);

      if (urlError || !urlData) {
        console.error('Error creating signed URL:', urlError);
        return;
      }

      const track: AudioTrack = {
        id: `file-${Date.now()}`,
        title: file.name,
        url: urlData.signedUrl,
        storagePath: fileName
      };
      
      const newPlaylist = [...playlist, track];
      setPlaylist(newPlaylist);
      await savePlaylistToSettings(newPlaylist);
      
      if (!currentTrack) {
        setCurrentTrack(track);
      }
      
      console.log('Track added to playlist:', track.title);
    } catch (error) {
      console.error('Error handling file upload:', error);
    }
  };

  const addTrack = async (track: AudioTrack) => {
    const newPlaylist = [...playlist, track];
    setPlaylist(newPlaylist);
    await savePlaylistToSettings(newPlaylist);
  };

  const removeTrack = async (trackId: string) => {
    const newPlaylist = playlist.filter(track => track.id !== trackId);
    setPlaylist(newPlaylist);
    await savePlaylistToSettings(newPlaylist);
    
    if (currentTrack?.id === trackId) {
      setCurrentTrack(newPlaylist[0] || null);
      setIsPlaying(false);
    }
  };

  const reorderPlaylist = async (newPlaylist: AudioTrack[]) => {
    setPlaylist(newPlaylist);
    await savePlaylistToSettings(newPlaylist);
  };

  const playTrack = async (track: AudioTrack) => {
    console.log('Playing track:', track.title, 'URL:', track.url);
    setCurrentTrack(track);
    
    if (audioRef.current) {
      try {
        audioRef.current.src = track.url;
        audioRef.current.load();
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
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
    setVolumeState(newVolume);
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
  };

  return (
    <AudioContext.Provider value={value}>
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
        }}
        onLoadStart={() => console.log('Audio load started')}
        onCanPlay={() => console.log('Audio can play')}
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />
      {children}
    </AudioContext.Provider>
  );
};