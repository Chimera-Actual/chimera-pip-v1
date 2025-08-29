import React, { useRef, useEffect } from 'react';

interface OscilloscopeWaveformProps {
  isPlaying: boolean;
  className?: string;
}

export const OscilloscopeWaveform: React.FC<OscilloscopeWaveformProps> = ({
  isPlaying,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    const animate = () => {
      const width = canvas.width / devicePixelRatio;
      const height = canvas.height / devicePixelRatio;
      
      // Clear canvas with dark background
      ctx.fillStyle = 'hsl(var(--background))';
      ctx.fillRect(0, 0, width, height);

      // Draw oscilloscope grid
      ctx.strokeStyle = 'hsla(var(--primary), 0.2)';
      ctx.lineWidth = 0.5;
      
      // Horizontal grid lines
      for (let i = 0; i <= 8; i++) {
        const y = (height / 8) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Vertical grid lines
      for (let i = 0; i <= 16; i++) {
        const x = (width / 16) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw center horizontal line (stronger)
      ctx.strokeStyle = 'hsla(var(--primary), 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (isPlaying) {
        // Generate oscilloscope waveform
        const time = Date.now() * 0.002;
        const points = 200;
        
        // Create glowing effect with multiple passes
        const colors = [
          { color: 'hsla(var(--primary), 0.3)', width: 6 },
          { color: 'hsla(var(--primary), 0.6)', width: 3 },
          { color: 'hsl(var(--primary))', width: 1.5 }
        ];

        colors.forEach(({ color, width: lineWidth }) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();

          for (let i = 0; i < points; i++) {
            const x = (width / points) * i;
            
            // Generate complex waveform
            const freq1 = 0.02 + Math.sin(time * 0.1) * 0.01;
            const freq2 = 0.05 + Math.cos(time * 0.15) * 0.02;
            const freq3 = 0.08 + Math.sin(time * 0.08) * 0.015;
            
            const wave1 = Math.sin(i * freq1 + time) * 0.3;
            const wave2 = Math.sin(i * freq2 + time * 1.5) * 0.2;
            const wave3 = Math.sin(i * freq3 + time * 0.7) * 0.15;
            
            const y = height / 2 + (wave1 + wave2 + wave3) * height * 0.3;
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          
          ctx.stroke();
        });

        // Add phosphor dots for extra retro effect
        ctx.fillStyle = 'hsl(var(--primary))';
        for (let i = 0; i < points; i += 4) {
          const x = (width / points) * i;
          const freq1 = 0.02 + Math.sin(time * 0.1) * 0.01;
          const freq2 = 0.05 + Math.cos(time * 0.15) * 0.02;
          const freq3 = 0.08 + Math.sin(time * 0.08) * 0.015;
          
          const wave1 = Math.sin(i * freq1 + time) * 0.3;
          const wave2 = Math.sin(i * freq2 + time * 1.5) * 0.2;
          const wave3 = Math.sin(i * freq3 + time * 0.7) * 0.15;
          
          const y = height / 2 + (wave1 + wave2 + wave3) * height * 0.3;
          
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Add scanning beam effect
        const beamX = ((time * 50) % (width + 100)) - 50;
        if (beamX >= 0 && beamX <= width) {
          const gradient = ctx.createLinearGradient(beamX - 20, 0, beamX + 20, 0);
          gradient.addColorStop(0, 'hsla(var(--primary), 0)');
          gradient.addColorStop(0.3, 'hsla(var(--primary), 0.1)');
          gradient.addColorStop(0.5, 'hsla(var(--primary), 0.3)');
          gradient.addColorStop(0.7, 'hsla(var(--primary), 0.1)');
          gradient.addColorStop(1, 'hsla(var(--primary), 0)');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(beamX - 20, 0, 40, height);
        }

      } else {
        // Static flatline when paused
        ctx.strokeStyle = 'hsla(var(--primary), 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Add some static dots
        ctx.fillStyle = 'hsla(var(--primary), 0.3)';
        for (let i = 0; i < width; i += 20) {
          if (Math.random() > 0.7) {
            ctx.beginPath();
            ctx.arc(i, height / 2 + (Math.random() - 0.5) * 4, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Add screen curvature effect (subtle vignette)
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className={`relative bg-background border border-border ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ 
          display: 'block',
          imageRendering: 'pixelated',
          filter: 'contrast(1.1) brightness(1.05)'
        }}
      />
      
      {/* Oscilloscope labels */}
      <div className="absolute top-1 left-1 text-[8px] font-mono text-primary/60 leading-none">
        OSC
      </div>
      <div className="absolute top-1 right-1 text-[8px] font-mono text-primary/60 leading-none">
        1V/DIV
      </div>
      <div className="absolute bottom-1 left-1 text-[8px] font-mono text-primary/60 leading-none">
        10ms/DIV
      </div>
      
      {!isPlaying && (
        <div className="absolute bottom-1 right-1 text-[8px] font-mono text-primary/80 bg-background/60 px-1 rounded">
          TRIG
        </div>
      )}
    </div>
  );
};