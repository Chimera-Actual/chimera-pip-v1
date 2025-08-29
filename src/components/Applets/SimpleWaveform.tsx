import React, { useRef, useEffect } from 'react';

interface SimpleWaveformProps {
  isPlaying: boolean;
  style?: string;
  color?: string;
}

export const SimpleWaveform: React.FC<SimpleWaveformProps> = ({
  isPlaying,
  style = 'bars',
  color = 'primary'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Generate animated waveform data
  const generateWaveformData = (time: number) => {
    const bufferLength = 64;
    const dataArray = new Uint8Array(bufferLength);
    
    if (isPlaying) {
      for (let i = 0; i < bufferLength; i++) {
        // Create smooth animated bars
        const frequency = 0.02;
        const amplitude = Math.sin(time * frequency + i * 0.2) * 60 + 
                         Math.sin(time * frequency * 2 + i * 0.1) * 40 +
                         Math.random() * 30;
        dataArray[i] = Math.max(10, Math.min(255, 80 + amplitude));
      }
    } else {
      // Flat line when paused
      dataArray.fill(10);
    }
    
    return { dataArray, bufferLength };
  };

  // Get colors based on color setting
  const getColors = () => {
    switch (color) {
      case 'primary':
        return {
          main: 'hsl(var(--primary))',
          alpha: 'hsla(var(--primary), 0.8)',
          light: 'hsla(var(--primary), 0.3)'
        };
      case 'accent':
        return {
          main: 'hsl(var(--accent))',
          alpha: 'hsla(var(--accent), 0.8)', 
          light: 'hsla(var(--accent), 0.3)'
        };
      case 'mono':
        return {
          main: 'hsl(var(--foreground))',
          alpha: 'hsla(var(--foreground), 0.8)',
          light: 'hsla(var(--foreground), 0.3)'
        };
      default:
        return {
          main: 'hsl(var(--primary))',
          alpha: 'hsla(var(--primary), 0.8)',
          light: 'hsla(var(--primary), 0.3)'
        };
    }
  };

  // Drawing function
  const draw = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { dataArray, bufferLength } = generateWaveformData(time);
    const colors = getColors();

    // Clear canvas
    ctx.fillStyle = 'hsla(var(--background), 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (style === 'bars') {
      // Frequency bars visualization
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, colors.main);
      gradient.addColorStop(0.5, colors.alpha);
      gradient.addColorStop(1, colors.light);

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
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
        const y = canvas.height - (v * canvas.height * 0.9);

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
      const radius = Math.min(centerX, centerY) * 0.6;

      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2;
        const amplitude = (dataArray[i] / 255) * radius * 0.4;
        
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + amplitude);
        const y2 = centerY + Math.sin(angle) * (radius + amplitude);

        ctx.strokeStyle = colors.main;
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
        const y = canvas.height - (intensity * canvas.height * 0.9);

        ctx.fillStyle = colors.alpha;
        ctx.beginPath();
        ctx.arc(x, y, dotSize * intensity, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current) return;

    let startTime = Date.now();
    let animationActive = true;

    const animate = () => {
      if (!animationActive) return;
      
      const currentTime = Date.now() - startTime;
      draw(currentTime);
      
      // Always continue animation to keep it smooth
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation immediately
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      animationActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [style, color]); // Remove isPlaying dependency to keep animation running

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

  return (
    <div className="relative w-full h-full overflow-hidden bg-background/20 rounded">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ background: 'transparent' }}
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-xs text-muted-foreground font-mono bg-background/60 px-2 py-1 rounded">
            ⏸ PAUSED
          </div>
        </div>
      )}
    </div>
  );
};