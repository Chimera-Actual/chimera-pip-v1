import { useEffect, useRef } from 'react';
import { createFocusTrap, FocusTrap } from 'focus-trap';

interface FocusManagerProps {
  children: React.ReactNode;
  enabled?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: string | HTMLElement | (() => HTMLElement);
  onEscape?: () => void;
}

export function FocusManager({ 
  children, 
  enabled = true, 
  autoFocus = true,
  restoreFocus = true,
  initialFocus,
  onEscape 
}: FocusManagerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<FocusTrap | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    try {
      focusTrapRef.current = createFocusTrap(containerRef.current, {
        initialFocus: initialFocus || undefined,
        fallbackFocus: containerRef.current,
        escapeDeactivates: (e) => {
          if (onEscape) {
            onEscape();
            return false;
          }
          return true;
        },
        clickOutsideDeactivates: false,
        returnFocusOnDeactivate: restoreFocus,
        setReturnFocus: (node) => {
          // Enhanced return focus logic
          if (restoreFocus && node) {
            return node;
          }
          return false;
        },
        allowOutsideClick: true,
      });

      if (autoFocus) {
        focusTrapRef.current.activate();
      }

      return () => {
        if (focusTrapRef.current) {
          focusTrapRef.current.deactivate();
        }
      };
    } catch (error) {
      console.warn('Failed to create focus trap:', error);
    }
  }, [enabled, autoFocus, restoreFocus, initialFocus, onEscape]);

  return (
    <div 
      ref={containerRef}
      role="dialog"
      aria-modal={enabled ? "true" : undefined}
    >
      {children}
    </div>
  );
}

// Hook for managing focus in custom components
export function useFocusManagement() {
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  const saveFocus = () => {
    lastFocusedElement.current = document.activeElement as HTMLElement;
  };

  const restoreFocus = () => {
    if (lastFocusedElement.current?.focus) {
      lastFocusedElement.current.focus();
    }
  };

  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
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
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  };

  return {
    saveFocus,
    restoreFocus,
    trapFocus,
  };
}