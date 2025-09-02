import React, { useRef, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface AudioWaveformVisualizerProps {
  audioElement?: HTMLAudioElement | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  style?: 'bars' | 'wave' | 'circle' | 'minimal';
  colorTheme?: 'primary' | 'accent' | 'rainbow' | 'mono';
  height?: number;
  className?: string;
}

export function AudioWaveformVisualizer({
  audioElement,
  isPlaying,
  currentTime,
  duration,
  onSeek,
  style = 'bars',
  colorTheme = 'primary',
  height = 120,
  className = ''
}: AudioWaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number>();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio context and analyser
  useEffect(() => {
    if (!audioElement || isInitialized) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioElement);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      setIsInitialized(true);
    } catch (error) {
      logger.info('Web Audio API not supported, using fake data', undefined, 'AudioWaveformVisualizer');
      // Create fake analyser for visualization
      analyserRef.current = {
        frequencyBinCount: 128,
        getByteFrequencyData: (array: Uint8Array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = isPlaying ? Math.random() * 255 * (0.5 + Math.sin(Date.now() / 1000) * 0.3) : 0;
          }
        }
      } as any;
      dataArrayRef.current = new Uint8Array(128);
      setIsInitialized(true);
    }
  }, [audioElement, isInitialized]);

  // Handle canvas click for seeking
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !duration) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const seekTime = (x / canvas.width) * duration;
    onSeek(seekTime);
  };

  // Draw waveform
  const draw = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    if (!canvas || !analyser || !dataArray) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Get frequency data
    analyser.getByteFrequencyData(dataArray);

    // Clear canvas with fade effect
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw progress bar background
    ctx.fillStyle = 'hsl(var(--muted))';
    ctx.fillRect(0, rect.height - 4, rect.width, 4);

    // Draw progress
    if (duration > 0) {
      const progressWidth = (currentTime / duration) * rect.width;
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.fillRect(0, rect.height - 4, progressWidth, 4);
    }

    // Color scheme
    const getColor = (index: number, value: number) => {
      switch (colorTheme) {
        case 'rainbow':
          const hue = (index / dataArray.length) * 360;
          return `hsl(${hue}, 70%, ${50 + (value / 255) * 30}%)`;
        case 'accent':
          return `hsl(var(--accent) / ${0.3 + (value / 255) * 0.7})`;
        case 'mono':
          const intensity = value / 255;
          return `hsl(var(--foreground) / ${0.2 + intensity * 0.8})`;
        default:
          return `hsl(var(--primary) / ${0.3 + (value / 255) * 0.7})`;
      }
    };

    // Draw visualization based on style
    switch (style) {
      case 'bars':
        const barWidth = rect.width / dataArray.length;
        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * (rect.height - 20);
          ctx.fillStyle = getColor(i, dataArray[i]);
          ctx.fillRect(i * barWidth, rect.height - barHeight - 20, barWidth - 1, barHeight);
        }
        break;

      case 'wave':
        ctx.strokeStyle = getColor(0, Math.max(...dataArray));
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < dataArray.length; i++) {
          const x = (i / dataArray.length) * rect.width;
          const y = rect.height / 2 + ((dataArray[i] - 128) / 128) * (rect.height / 3);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;

      case 'circle':
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.min(rect.width, rect.height) / 3;
        
        for (let i = 0; i < dataArray.length; i++) {
          const angle = (i / dataArray.length) * Math.PI * 2;
          const barHeight = (dataArray[i] / 255) * radius;
          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + barHeight);
          const y2 = centerY + Math.sin(angle) * (radius + barHeight);
          
          ctx.strokeStyle = getColor(i, dataArray[i]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        break;

      case 'minimal':
        const dotSize = 2;
        const spacing = 4;
        for (let i = 0; i < Math.min(dataArray.length, rect.width / spacing); i++) {
          const x = i * spacing;
          const intensity = dataArray[i] / 255;
          const y = rect.height / 2 + (Math.random() - 0.5) * intensity * rect.height * 0.6;
          
          ctx.fillStyle = getColor(i, dataArray[i]);
          ctx.beginPath();
          ctx.arc(x, y, dotSize * intensity, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (isPlaying && isInitialized) {
        draw();
        animationFrameRef.current = requestAnimationFrame(animate);
      } else if (isInitialized) {
        draw(); // Draw static state
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isInitialized, currentTime, duration, style, colorTheme]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (isInitialized) draw();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isInitialized]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full cursor-pointer rounded-lg bg-muted/20"
        style={{ height: `${height}px` }}
      />
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <span className="text-sm">Loading waveform...</span>
        </div>
      )}
      {!isPlaying && isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <span className="text-sm">Press play to see visualization</span>
        </div>
      )}
    </div>
  );
}