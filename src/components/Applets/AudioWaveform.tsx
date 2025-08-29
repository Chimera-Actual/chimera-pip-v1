import React, { useRef, useEffect, useState } from 'react';

interface AudioWaveformProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  className?: string;
  style?: string;
  color?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioElement,
  isPlaying,
  className = '',
  style = 'bars',
  color = 'primary'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Web Audio API - only once per component instance
  useEffect(() => {
    if (!audioElement || isInitialized) return;

    const initializeAudio = async () => {
      try {
        // Check if already connected to avoid creating multiple sources
        if (sourceRef.current) return;
        
        // Create audio context only if we don't have one
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        // Create analyser
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;

        // Only create source if not already connected
        if (!sourceRef.current) {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing audio context:', error);
        // If it fails due to already being connected, try to reuse existing connection
        if (error instanceof Error && error.message.includes('already connected')) {
          // Try to create a new context and analyser without the source
          try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.8;
            setIsInitialized(true);
          } catch (fallbackError) {
            console.error('Fallback initialization failed:', fallbackError);
          }
        }
      }
    };

    // Wait for user interaction before initializing
    const handleUserInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [audioElement, isInitialized]);

  // Drawing function
  const draw = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get colors based on color setting
    const getColors = () => {
      switch (color) {
        case 'primary':
          return {
            main: '#00ff00',
            alpha: 'rgba(0, 255, 0, 0.8)',
            light: 'rgba(0, 255, 0, 0.3)'
          };
        case 'accent':
          return {
            main: '#0ea5e9',
            alpha: 'rgba(14, 165, 233, 0.8)',
            light: 'rgba(14, 165, 233, 0.3)'
          };
        case 'rainbow':
          // For rainbow, we'll calculate colors per bar
          return {
            main: '#ff0080',
            alpha: 'rgba(255, 0, 128, 0.8)',
            light: 'rgba(255, 0, 128, 0.3)'
          };
        case 'mono':
          return {
            main: '#ffffff',
            alpha: 'rgba(255, 255, 255, 0.8)',
            light: 'rgba(255, 255, 255, 0.3)'
          };
        default:
          return {
            main: '#00ff00',
            alpha: 'rgba(0, 255, 0, 0.8)',
            light: 'rgba(0, 255, 0, 0.3)'
          };
      }
    };

    const colors = getColors();

    if (style === 'bars') {
      // Frequency bars visualization
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, colors.main);
      gradient.addColorStop(0.5, colors.alpha);
      gradient.addColorStop(1, colors.light);

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        if (color === 'rainbow') {
          const hue = (i / bufferLength) * 360;
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
          ctx.shadowColor = `hsla(${hue}, 70%, 60%, 1)`;
        } else {
          ctx.fillStyle = gradient;
          ctx.shadowColor = colors.main;
        }

        ctx.shadowBlur = 8;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        ctx.shadowBlur = 0;

        x += barWidth + 1;
      }
    } else if (style === 'wave') {
      // Waveform line visualization
      ctx.strokeStyle = colors.main;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 255.0;
        const y = v * canvas.height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();
    } else if (style === 'circle') {
      // Circular visualization
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.8;

      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2;
        const amplitude = (dataArray[i] / 255) * radius * 0.5;
        
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + amplitude);
        const y2 = centerY + Math.sin(angle) * (radius + amplitude);

        if (color === 'rainbow') {
          const hue = (i / bufferLength) * 360;
          ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
        } else {
          ctx.strokeStyle = colors.main;
        }

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    } else if (style === 'minimal') {
      // Minimal dot visualization
      const dotSize = 2;
      const spacing = canvas.width / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        const x = i * spacing;
        const intensity = dataArray[i] / 255;
        const y = canvas.height - (intensity * canvas.height * 0.8);

        if (color === 'rainbow') {
          const hue = (i / bufferLength) * 360;
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${intensity})`;
        } else {
          ctx.fillStyle = colors.alpha;
        }

        ctx.beginPath();
        ctx.arc(x, y, dotSize * intensity, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw frequency grid lines for bars style
    if (style === 'bars') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      for (let i = 0; i < 5; i++) {
        const y = (canvas.height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !isInitialized) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    // Resume audio context if suspended
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isInitialized]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className={`relative overflow-hidden bg-background/20 border border-border rounded ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ background: 'transparent' }}
      />
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs text-muted-foreground font-mono text-center">
            <div className="mb-1">🎵 WAVEFORM ANALYZER</div>
            <div className="text-xs opacity-60">Play audio to visualize</div>
          </div>
        </div>
      )}
      {isInitialized && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs text-muted-foreground font-mono">
            ⏸ PAUSED
          </div>
        </div>
      )}
    </div>
  );
};