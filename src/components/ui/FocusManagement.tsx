import { useEffect, useRef, useCallback } from 'react';
import { createFocusTrap } from 'focus-trap';

interface FocusTrapProps {
  children: React.ReactNode;
  active: boolean;
  onEscape?: () => void;
  initialFocus?: string | HTMLElement | (() => HTMLElement);
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active,
  onEscape,
  initialFocus,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<ReturnType<typeof createFocusTrap> | null>(null);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && onEscape) {
      onEscape();
    }
  }, [onEscape]);

  useEffect(() => {
    if (!containerRef.current || !active) return;

    const focusTrapConfig = {
      initialFocus: initialFocus || undefined,
      escapeDeactivates: false, // We handle escape manually
      allowOutsideClick: true,
      onDeactivate: () => {
        focusTrapRef.current = null;
      },
    };

    focusTrapRef.current = createFocusTrap(containerRef.current, focusTrapConfig);
    focusTrapRef.current.activate();

    if (onEscape) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
      }
      if (onEscape) {
        document.removeEventListener('keydown', handleEscape);
      }
    };
  }, [active, initialFocus, onEscape, handleEscape]);

  return (
    <div 
      ref={containerRef} 
      className={className}
      role="dialog"
      aria-modal={active}
    >
      {children}
    </div>
  );
};

// Hook for managing focus restoration
export const useFocusRestore = () => {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previouslyFocusedElement.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previouslyFocusedElement.current && 
        document.contains(previouslyFocusedElement.current)) {
      previouslyFocusedElement.current.focus();
    }
  }, []);

  return { saveFocus, restoreFocus };
};

// Hook for managing aria-describedby relationships
export const useAriaDescribedBy = (id: string, condition: boolean = true) => {
  useEffect(() => {
    const elements = document.querySelectorAll(`[aria-describedby*="${id}"]`);
    
    elements.forEach(element => {
      const currentValue = element.getAttribute('aria-describedby') || '';
      const values = currentValue.split(' ').filter(v => v !== id);
      
      if (condition) {
        values.push(id);
      }
      
      const newValue = values.join(' ').trim();
      
      if (newValue) {
        element.setAttribute('aria-describedby', newValue);
      } else {
        element.removeAttribute('aria-describedby');
      }
    });
  }, [id, condition]);
};

// Accessibility announcements
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.setAttribute('class', 'sr-only');
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};