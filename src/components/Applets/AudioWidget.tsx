import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Play, Pause, Square, Volume2, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AudioSettings {
  selectedVoice: string;
  autoRecord: boolean;
  playbackSpeed: number;
  enableVAD: boolean;
}

interface Recording {
  id: string;
  timestamp: Date;
  duration: number;
  blob: Blob;
  transcription?: string;
}

const voices = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' }
];

export const AudioWidget: React.FC = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [settings, setSettings] = useState<AudioSettings>({
    selectedVoice: 'Aria',
    autoRecord: false,
    playbackSpeed: 1.0,
    enableVAD: true
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

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
          setSettings(prevSettings => ({ ...prevSettings, ...(data.settings as Partial<AudioSettings>) }));
        }
      } catch (error) {
        console.error('Error loading audio settings:', error);
      }
    };

    loadSettings();
  }, [user]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      audioStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const recording: Recording = {
          id: `rec-${Date.now()}`,
          timestamp: new Date(),
          duration: recordingTime,
          blob
        };
        
        setRecordings(prev => [recording, ...prev]);
        setSelectedRecording(recording);
        setRecordingTime(0);
        
        // Auto-transcribe if enabled
        if (settings.enableVAD) {
          transcribeAudio(recording);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
    }
  };

  const playRecording = (recording: Recording) => {
    if (isPlaying) {
      audioElementRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(URL.createObjectURL(recording.blob));
    audio.volume = volume[0] / 100;
    audio.playbackRate = settings.playbackSpeed;
    
    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.play();
    audioElementRef.current = audio;
    setIsPlaying(true);
  };

  const transcribeAudio = async (recording: Recording) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64 }
        });

        if (data?.text) {
          setRecordings(prev => 
            prev.map(rec => 
              rec.id === recording.id 
                ? { ...rec, transcription: data.text }
                : rec
            )
          );
        }
      };
      reader.readAsDataURL(recording.blob);
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-card">
      {/* Header */}
      <div className="flex-shrink-0 h-16 bg-background/50 border-b border-border px-4 flex items-center justify-between">
        <span className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
          🔊 AUDIO SYSTEM
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-muted-foreground" />
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {/* Recording Controls */}
        <div className="bg-background/30 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-mono text-primary uppercase">RECORDING STATION</Label>
            <div className="text-xs font-mono text-muted-foreground">
              {isRecording ? `◉ REC ${formatTime(recordingTime)}` : '● STANDBY'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="lg"
              className={`w-16 h-16 rounded-full font-mono ${
                isRecording 
                  ? 'bg-destructive hover:bg-destructive/80 animate-pulse' 
                  : 'bg-primary hover:bg-primary/80'
              }`}
            >
              {isRecording ? <Square size={24} /> : <Mic size={24} />}
            </Button>

            <div className="flex-1">
              <div className="text-sm font-mono text-foreground mb-1">
                {isRecording ? 'RECORDING IN PROGRESS' : 'READY TO RECORD'}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Voice: {settings.selectedVoice} | VAD: {settings.enableVAD ? 'ON' : 'OFF'}
              </div>
            </div>
          </div>
        </div>

        {/* Recording List */}
        <div className="flex-1 bg-background/30 border border-border rounded-lg p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-mono text-primary uppercase">
              RECORDINGS ({recordings.length})
            </Label>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-60">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="bg-card/50 border border-border rounded p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-muted-foreground">
                    {recording.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {formatTime(recording.duration)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => playRecording(recording)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    {isPlaying && selectedRecording?.id === recording.id ? 
                      <Pause size={14} /> : <Play size={14} />
                    }
                  </Button>

                  <div className="flex-1 min-w-0">
                    {recording.transcription ? (
                      <div className="text-xs text-foreground font-mono truncate">
                        "{recording.transcription}"
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground font-mono">
                        Tap to transcribe...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {recordings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm font-mono">
                NO RECORDINGS AVAILABLE
                <br />
                <span className="text-xs">Press the record button to begin</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};