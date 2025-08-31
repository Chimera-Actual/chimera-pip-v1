import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

interface DevicePerformance {
  isLowEnd: boolean;
  reducedMotion: boolean;
  hardwareAcceleration: boolean;
  effectsLevel: 'none' | 'minimal' | 'reduced' | 'full';
}

export const useDevicePerformance = (): DevicePerformance => {
  const isMobile = useIsMobile();
  const [performance, setPerformance] = useState<DevicePerformance>({
    isLowEnd: false,
    reducedMotion: false,
    hardwareAcceleration: true,
    effectsLevel: 'full'
  });

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Estimate device performance based on various factors
    const estimatePerformance = () => {
      let isLowEnd = false;
      let hardwareAcceleration = true;
      
      // Check hardware concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency || 1;
      if (cores <= 2) isLowEnd = true;
      
      // Check memory (if available)
      if ('deviceMemory' in navigator) {
        const memory = (navigator as any).deviceMemory;
        if (memory <= 2) isLowEnd = true;
      }
      
      // Check connection type for mobile devices
      if ('connection' in navigator && isMobile) {
        const connection = (navigator as any).connection;
        if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
          isLowEnd = true;
        }
      }
      
      // Check user agent for known low-end devices
      const userAgent = navigator.userAgent.toLowerCase();
      const lowEndPatterns = [
        'android 4', 'android 5', 'android 6',
        'iphone os 12', 'iphone os 13',
        'samsung-gt-', 'sm-g3', 'sm-j'
      ];
      
      if (lowEndPatterns.some(pattern => userAgent.includes(pattern))) {
        isLowEnd = true;
      }
      
      // Test hardware acceleration availability
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          hardwareAcceleration = false;
          isLowEnd = true;
        }
      } catch (e) {
        hardwareAcceleration = false;
        isLowEnd = true;
      }
      
      // Determine effects level
      let effectsLevel: 'none' | 'minimal' | 'reduced' | 'full' = 'full';
      
      if (reducedMotion) {
        effectsLevel = 'none';
      } else if (isLowEnd && isMobile) {
        effectsLevel = 'minimal';
      } else if (isLowEnd || isMobile) {
        effectsLevel = 'reduced';
      }
      
      return {
        isLowEnd,
        reducedMotion,
        hardwareAcceleration,
        effectsLevel
      };
    };

    const performanceData = estimatePerformance();
    setPerformance(performanceData);

    // Apply performance-based classes to document body
    document.body.classList.remove('low-end-device', 'reduced-effects', 'minimal-effects', 'no-effects');
    
    switch (performanceData.effectsLevel) {
      case 'none':
        document.body.classList.add('no-effects');
        break;
      case 'minimal':
        document.body.classList.add('minimal-effects');
        break;
      case 'reduced':
        document.body.classList.add('reduced-effects');
        break;
    }
    
    if (performanceData.isLowEnd) {
      document.body.classList.add('low-end-device');
    }

    // Listen for changes in reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      const newPerformance = estimatePerformance();
      setPerformance(newPerformance);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [isMobile]);

  return performance;
};

// Performance-aware CSS classes helper
export const getPerformanceClasses = (performance: DevicePerformance): string => {
  const classes = [];
  
  if (performance.isLowEnd) classes.push('low-end-device');
  if (performance.reducedMotion) classes.push('reduced-motion');
  if (!performance.hardwareAcceleration) classes.push('no-hardware-acceleration');
  
  switch (performance.effectsLevel) {
    case 'none':
      classes.push('no-effects');
      break;
    case 'minimal':
      classes.push('minimal-effects');
      break;
    case 'reduced':
      classes.push('reduced-effects');
      break;
    case 'full':
      classes.push('full-effects');
      break;
  }
  
  return classes.join(' ');
};