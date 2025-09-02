import React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    >
      {children}
    </a>
  );
}

interface AriaLiveRegionProps {
  id?: string;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  children?: React.ReactNode;
}

export function AriaLiveRegion({ 
  id = 'aria-live-region', 
  priority = 'polite', 
  atomic = false,
  children 
}: AriaLiveRegionProps) {
  return (
    <div
      id={id}
      aria-live={priority}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export function FocusTrap({ children, active = true, restoreFocus = true, className }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    previousActiveElement.current = document.activeElement as HTMLElement;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element
    firstElement?.focus();

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

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

interface VisuallyHiddenProps {
  children: React.ReactNode;
  className?: string;
}

export function VisuallyHidden({ children, className }: VisuallyHiddenProps) {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  );
}

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Heading({ level, children, className, id }: HeadingProps) {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  return React.createElement(
    Component,
    {
      id,
      className: cn(
        // Base styles
        'font-heading font-semibold text-foreground',
        // Size based on level
        {
          'text-2xl': level === 1,
          'text-xl': level === 2,
          'text-lg': level === 3,
          'text-base': level === 4,
          'text-sm': level === 5,
          'text-xs': level === 6,
        },
        className
      ),
    },
    children
  );
}

interface LandmarkProps {
  as?: 'main' | 'nav' | 'aside' | 'section' | 'article' | 'header' | 'footer';
  children: React.ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

export function Landmark({ 
  as = 'section', 
  children, 
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className 
}: LandmarkProps) {
  const Component = as;
  
  return (
    <Component
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={className}
    >
      {children}
    </Component>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
  size = 'md',
  variant = 'default',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-sm text-muted-foreground">{percentage.toFixed(0)}%</span>
        </div>
      )}
      
      <div
        className={cn(
          'overflow-hidden rounded-full bg-secondary',
          {
            'h-1': size === 'sm',
            'h-2': size === 'md',
            'h-3': size === 'lg',
          }
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `${percentage.toFixed(0)}% complete`}
      >
        <div
          className={cn(
            'h-full transition-all duration-slow ease-smooth',
            {
              'bg-primary': variant === 'default',
              'bg-green-500': variant === 'success',
              'bg-yellow-500': variant === 'warning',
              'bg-destructive': variant === 'error',
            }
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface AnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  delay?: number;
}

// Hook for making announcements to screen readers
export function useAnnouncement() {
  const announce = React.useCallback(({ message, priority = 'polite', delay = 100 }: AnnouncementProps) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      announcement.textContent = message;
      
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    }, delay);
  }, []);

  return { announce };
}

// Utility for handling keyboard navigation
export function useKeyboardNavigation() {
  const handleArrowKeys = React.useCallback((
    e: React.KeyboardEvent,
    items: HTMLElement[],
    options: {
      loop?: boolean;
      orientation?: 'horizontal' | 'vertical' | 'both';
    } = {}
  ) => {
    const { loop = true, orientation = 'both' } = options;
    const currentIndex = items.indexOf(e.currentTarget as HTMLElement);
    let nextIndex = currentIndex;

    const canMoveHorizontal = orientation === 'horizontal' || orientation === 'both';
    const canMoveVertical = orientation === 'vertical' || orientation === 'both';

    switch (e.key) {
      case 'ArrowDown':
        if (canMoveVertical) {
          e.preventDefault();
          nextIndex = loop ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
        }
        break;
      case 'ArrowUp':
        if (canMoveVertical) {
          e.preventDefault();
          nextIndex = loop ? (currentIndex === 0 ? items.length - 1 : currentIndex - 1) : Math.max(currentIndex - 1, 0);
        }
        break;
      case 'ArrowRight':
        if (canMoveHorizontal) {
          e.preventDefault();
          nextIndex = loop ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
        }
        break;
      case 'ArrowLeft':
        if (canMoveHorizontal) {
          e.preventDefault();
          nextIndex = loop ? (currentIndex === 0 ? items.length - 1 : currentIndex - 1) : Math.max(currentIndex - 1, 0);
        }
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

    if (nextIndex !== currentIndex && items[nextIndex]) {
      items[nextIndex].focus();
    }
  }, []);

  return { handleArrowKeys };
}