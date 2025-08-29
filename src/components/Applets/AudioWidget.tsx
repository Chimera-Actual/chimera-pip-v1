import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AudioData {
  id: string;
  name: string;
  timestamp: Date;
  duration: number;
  audioUrl?: string;
}

export const AudioWidget: React.FC = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordings, setRecordings] = useState<AudioData[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<string>('');
  const [status, setStatus] = useState<'ready' | 'recording' | 'processing' | 'playing'>('ready');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopRecording();
      stopPlayback();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Setup audio context for level monitoring
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const chunks: Blob[] = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        const newRecording: AudioData = {
          id: `recording-${Date.now()}`,
          name: `Recording ${recordings.length + 1}`,
          timestamp: new Date(),
          duration: recordingTime,
          audioUrl
        };
        setRecordings(prev => [...prev, newRecording]);
        setSelectedRecording(newRecording.id);
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        setAudioLevel(0);
      };

      setIsRecording(true);
      setStatus('recording');
      setRecordingTime(0);
      mediaRecorderRef.current.start();
      updateAudioLevel();

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus('ready');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus('ready');
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  };

  const playRecording = (recordingId: string) => {
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording?.audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(recording.audioUrl);
    audioRef.current.volume = isMuted ? 0 : volume;
    
    audioRef.current.onended = () => {
      setIsPlaying(false);
      setStatus('ready');
      setPlaybackTime(0);
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    };

    audioRef.current.play();
    setIsPlaying(true);
    setStatus('playing');
    setPlaybackTime(0);

    playbackTimerRef.current = setInterval(() => {
      if (audioRef.current) {
        setPlaybackTime(audioRef.current.currentTime);
      }
    }, 100);
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setStatus('ready');
    setPlaybackTime(0);
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume : 0;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'recording': return 'text-red-400';
      case 'playing': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      default: return 'text-primary';
    }
  };

  const selectedRecordingData = recordings.find(r => r.id === selectedRecording);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-card border border-border">
      {/* Header */}
      <div className="flex-shrink-0 h-16 bg-card border-b border-border px-4 flex items-center justify-between">
        <span className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
          ◈ AUDIO SYSTEM
        </span>
        <div className={`text-sm font-mono uppercase tracking-wide ${getStatusColor()}`}>
          {status === 'recording' && '● REC'}
          {status === 'playing' && '▶ PLAY'}
          {status === 'processing' && '⧗ PROC'}
          {status === 'ready' && '◯ READY'}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        
        {/* Recording Controls */}
        <div className="bg-background/50 border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono text-primary uppercase tracking-wide">
              Recording Control
            </h3>
            <span className="text-xs font-mono text-muted-foreground">
              {formatTime(recordingTime)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={status === 'processing'}
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              className="h-12 w-12 rounded-full p-0"
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
            </Button>

            {/* Audio Level Meter */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">LEVEL</span>
                <span className="text-xs font-mono text-primary">{Math.round(audioLevel)}</span>
              </div>
              <Progress 
                value={audioLevel} 
                max={255}
                className="h-2 bg-background/50" 
              />
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="bg-background/50 border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono text-primary uppercase tracking-wide">
              Playback Control
            </h3>
            <span className="text-xs font-mono text-muted-foreground">
              {formatTime(playbackTime)} / {selectedRecordingData ? formatTime(selectedRecordingData.duration) : '00:00'}
            </span>
          </div>

          <div className="space-y-3">
            <Select value={selectedRecording} onValueChange={setSelectedRecording}>
              <SelectTrigger className="w-full bg-background/50 border-border font-mono">
                <SelectValue placeholder="Select recording..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {recordings.map((recording) => (
                  <SelectItem key={recording.id} value={recording.id} className="font-mono">
                    {recording.name} - {formatTime(recording.duration)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => isPlaying ? stopPlayback() : playRecording(selectedRecording)}
                disabled={!selectedRecording}
                variant="outline"
                size="sm"
                className="h-10 w-10 rounded-full p-0"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>

              <Button
                onClick={stopPlayback}
                disabled={!isPlaying}
                variant="outline"
                size="sm"
                className="h-10 w-10 rounded-full p-0"
              >
                <Square size={16} />
              </Button>

              <div className="flex-1">
                {selectedRecordingData && (
                  <Progress 
                    value={(playbackTime / selectedRecordingData.duration) * 100} 
                    className="h-2 bg-background/50"
                  />
                )}
              </div>

              <Button
                onClick={toggleMute}
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-full p-0"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Recording List */}
        <div className="bg-background/50 border border-border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-mono text-primary uppercase tracking-wide">
            Recordings ({recordings.length})
          </h3>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recordings.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm font-mono">
                NO RECORDINGS
                <br />
                <span className="text-xs">Click the record button to start</span>
              </div>
            ) : (
              recordings.map((recording) => (
                <div
                  key={recording.id}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    selectedRecording === recording.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border bg-background/30 hover:bg-background/50'
                  }`}
                  onClick={() => setSelectedRecording(recording.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-foreground">{recording.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatTime(recording.duration)}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {recording.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};