import { useEffect, useState, useCallback } from 'react';

interface AccessibilityState {
  reducedMotion: boolean;
  highContrast: boolean;
  forcedColors: boolean;
  screenReader: boolean;
}

interface AccessibilityOptions {
  announceChanges?: boolean;
  respectMotionPreference?: boolean;
  enhanceContrast?: boolean;
}

export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    announceChanges = true,
    respectMotionPreference = true,
    enhanceContrast = true,
  } = options;

  const [state, setState] = useState<AccessibilityState>({
    reducedMotion: false,
    highContrast: false,
    forcedColors: false,
    screenReader: false,
  });

  // Announce changes to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges) return;

    // Create a temporary aria-live region
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    
    // Delay to ensure screen readers pick it up
    setTimeout(() => {
      announcement.textContent = message;
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }, 100);
  }, [announceChanges]);

  // Check for various accessibility preferences
  useEffect(() => {
    const checkAccessibility = () => {
      const newState: AccessibilityState = {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        forcedColors: window.matchMedia('(forced-colors: active)').matches,
        screenReader: !!document.querySelector('[data-testid="screen-reader"]') || 
                     navigator.userAgent.includes('NVDA') ||
                     navigator.userAgent.includes('JAWS') ||
                     'speechSynthesis' in window,
      };

      setState(newState);

      // Apply accessibility enhancements
      if (respectMotionPreference && newState.reducedMotion) {
        document.documentElement.style.setProperty('--duration-fast', '0ms');
        document.documentElement.style.setProperty('--duration-base', '0ms');
        document.documentElement.style.setProperty('--duration-slow', '0ms');
        document.documentElement.style.setProperty('--duration-slower', '0ms');
      }

      if (enhanceContrast && newState.highContrast) {
        document.documentElement.setAttribute('data-high-contrast', 'true');
      }

      if (newState.forcedColors) {
        document.documentElement.setAttribute('data-forced-colors', 'true');
      }
    };

    checkAccessibility();

    // Listen for preference changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(forced-colors: active)'),
    ];

    mediaQueries.forEach(mq => mq.addEventListener('change', checkAccessibility));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', checkAccessibility));
    };
  }, [respectMotionPreference, enhanceContrast]);

  // Focus management utilities
  const focusManagement = {
    // Trap focus within an element
    trapFocus: useCallback((element: HTMLElement) => {
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      element.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        element.removeEventListener('keydown', handleTabKey);
      };
    }, []),

    // Return focus to the previous element
    returnFocus: useCallback((previousElement: HTMLElement | null) => {
      if (previousElement && typeof previousElement.focus === 'function') {
        previousElement.focus();
      }
    }, []),

    // Focus first error element
    focusFirstError: useCallback(() => {
      const firstError = document.querySelector('[aria-invalid="true"], .error, [data-error]') as HTMLElement;
      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, []),
  };

  // Keyboard navigation utilities
  const keyboardNavigation = {
    // Handle arrow key navigation
    handleArrowKeys: useCallback((e: React.KeyboardEvent, items: HTMLElement[]) => {
      const currentIndex = items.indexOf(e.currentTarget as HTMLElement);
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = (currentIndex + 1) % items.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
      }

      if (nextIndex !== currentIndex) {
        items[nextIndex]?.focus();
      }
    }, []),

    // Handle escape key
    handleEscape: useCallback((callback: () => void) => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          callback();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, []),
  };

  return {
    state,
    announce,
    focusManagement,
    keyboardNavigation,
    
    // Utility classes for conditional styling
    classes: {
      reducedMotion: state.reducedMotion ? 'motion-reduce' : '',
      highContrast: state.highContrast ? 'contrast-high' : '',
      forcedColors: state.forcedColors ? 'forced-colors' : '',
      screenReader: state.screenReader ? 'screen-reader' : '',
    },
  };
}

// Hook for managing skip links
export function useSkipLinks() {
  useEffect(() => {
    // Create skip link if it doesn't exist
    if (!document.querySelector('#skip-to-main')) {
      const skipLink = document.createElement('a');
      skipLink.id = 'skip-to-main';
      skipLink.href = '#main-content';
      skipLink.textContent = 'Skip to main content';
      skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md';
      
      document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Ensure main content area has ID
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (main && !main.id) {
      main.id = 'main-content';
    }
  }, []);
}

// Hook for ARIA live regions
export function useAriaLive() {
  const [liveRegion, setLiveRegion] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    let region = document.querySelector('#aria-live-region') as HTMLElement;
    
    if (!region) {
      region = document.createElement('div');
      region.id = 'aria-live-region';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'false');
      region.className = 'sr-only';
      document.body.appendChild(region);
    }

    setLiveRegion(region);

    return () => {
      if (region && region.parentNode) {
        region.parentNode.removeChild(region);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Clear after a delay
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }, [liveRegion]);

  return { announce };
}