import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/hooks/useAccessibility';

interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPlacement?: 'left' | 'right';
  animation?: 'scale' | 'glow' | 'slide' | 'none';
  haptic?: boolean;
}

export function InteractiveButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  iconPlacement = 'left',
  animation = 'scale',
  haptic = true,
  onClick,
  ...props
}: InteractiveButtonProps) {
  const { state } = useAccessibility();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Haptic feedback on supported devices
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    onClick?.(e);
  };

  const buttonClasses = cn(
    // Base styles
    'relative inline-flex items-center justify-center',
    'font-medium transition-all focus:outline-none',
    'disabled:pointer-events-none disabled:opacity-50',
    
    // Size variants
    {
      'h-8 px-3 text-xs rounded-md': size === 'sm',
      'h-10 px-4 text-sm rounded-md': size === 'md', 
      'h-12 px-6 text-base rounded-lg': size === 'lg',
    },
    
    // Color variants
    {
      'bg-primary text-primary-foreground shadow hover:bg-primary/90': variant === 'primary',
      'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80': variant === 'secondary',
      'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
      'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90': variant === 'destructive',
      'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground': variant === 'outline',
    },
    
    // Focus styles
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    
    // Animation classes
    {
      'hover:scale-105 active:scale-95': animation === 'scale' && !state.reducedMotion,
      'hover:shadow-lg hover:glow-pulse': animation === 'glow' && !state.reducedMotion,
      'overflow-hidden': animation === 'slide',
    },
    
    className
  );

  const motionProps = state.reducedMotion ? {} : {
    whileHover: animation === 'scale' ? { scale: 1.05 } : undefined,
    whileTap: animation === 'scale' ? { scale: 0.95 } : undefined,
    transition: { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] as const }
  };

  return (
    <motion.button
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...motionProps}
      {...(props as any)}
    >
      {/* Slide animation background */}
      {animation === 'slide' && !state.reducedMotion && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
      )}
      
      {/* Loading spinner */}
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      
      {/* Icon */}
      {icon && iconPlacement === 'left' && (
        <span className={cn('flex items-center', children && 'mr-2')}>
          {icon}
        </span>
      )}
      
      {children}
      
      {icon && iconPlacement === 'right' && (
        <span className={cn('flex items-center', children && 'ml-2')}>
          {icon}
        </span>
      )}
    </motion.button>
  );
}

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animation?: 'lift' | 'glow' | 'border' | 'none';
}

export function InteractiveCard({
  children,
  className,
  clickable = false,
  hoverable = true,
  onClick,
  variant = 'default',
  padding = 'md',
  animation = 'lift',
}: InteractiveCardProps) {
  const { state } = useAccessibility();
  
  const cardClasses = cn(
    // Base styles
    'rounded-lg transition-all duration-base',
    
    // Variant styles
    {
      'bg-card text-card-foreground border border-border': variant === 'default',
      'bg-card text-card-foreground shadow-lg border border-border': variant === 'elevated',
      'bg-transparent border-2 border-border': variant === 'outlined',
      'bg-accent text-accent-foreground': variant === 'filled',
    },
    
    // Padding styles
    {
      'p-0': padding === 'none',
      'p-3': padding === 'sm',
      'p-4': padding === 'md',
      'p-6': padding === 'lg',
    },
    
    // Interactive styles
    {
      'cursor-pointer': clickable,
      'hover:shadow-lg': hoverable && animation === 'lift' && !state.reducedMotion,
      'hover:ring-2 hover:ring-primary/20': hoverable && animation === 'border',
      'hover:bg-accent/50': hoverable && variant === 'default',
    },
    
    className
  );

  const motionProps = state.reducedMotion ? {} : {
    whileHover: animation === 'lift' && hoverable ? { y: -2 } : undefined,
    whileTap: clickable ? { scale: 0.98 } : undefined,
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const }
  };

  return (
    <motion.div
      className={cardClasses}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedIconProps {
  icon: React.ReactNode;
  animation?: 'spin' | 'pulse' | 'bounce' | 'wiggle' | 'none';
  trigger?: 'hover' | 'always' | 'focus';
  className?: string;
}

export function AnimatedIcon({
  icon,
  animation = 'none',
  trigger = 'hover',
  className,
}: AnimatedIconProps) {
  const { state } = useAccessibility();
  
  const iconClasses = cn(
    'inline-flex items-center justify-center',
    
    // Animation classes (only if motion is not reduced)
    !state.reducedMotion && {
      'animate-spin': animation === 'spin' && trigger === 'always',
      'animate-pulse': animation === 'pulse' && trigger === 'always',
      'animate-bounce': animation === 'bounce' && trigger === 'always',
      'hover:animate-spin': animation === 'spin' && trigger === 'hover',
      'hover:animate-pulse': animation === 'pulse' && trigger === 'hover',
      'hover:animate-bounce': animation === 'bounce' && trigger === 'hover',
      'focus:animate-spin': animation === 'spin' && trigger === 'focus',
      'focus:animate-pulse': animation === 'pulse' && trigger === 'focus',
      'focus:animate-bounce': animation === 'bounce' && trigger === 'focus',
      'hover:rotate-12 hover:-rotate-12': animation === 'wiggle' && trigger === 'hover',
    },
    
    className
  );

  return (
    <span className={iconClasses}>
      {icon}
    </span>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'muted';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  className,
}: LoadingSpinnerProps) {
  const { state } = useAccessibility();
  
  const spinnerClasses = cn(
    'rounded-full border-2 border-current border-t-transparent',
    
    // Size variants
    {
      'h-4 w-4': size === 'sm',
      'h-6 w-6': size === 'md',
      'h-8 w-8': size === 'lg',
    },
    
    // Color variants
    {
      'text-primary': variant === 'primary',
      'text-secondary-foreground': variant === 'secondary',
      'text-muted-foreground': variant === 'muted',
    },
    
    // Animation (respect reduced motion)
    !state.reducedMotion ? 'animate-spin' : 'animate-pulse',
    
    className
  );

  return (
    <div 
      className={spinnerClasses}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function ProgressIndicator({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  animated = true,
  className,
}: ProgressIndicatorProps) {
  const { state } = useAccessibility();
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const progressClasses = cn(
    'overflow-hidden rounded-full bg-secondary',
    
    // Size variants
    {
      'h-1': size === 'sm',
      'h-2': size === 'md',
      'h-3': size === 'lg',
    },
    
    className
  );
  
  const fillClasses = cn(
    'h-full transition-all duration-slow ease-smooth',
    
    // Color variants
    {
      'bg-primary': variant === 'default',
      'bg-green-500': variant === 'success',
      'bg-yellow-500': variant === 'warning',
      'bg-destructive': variant === 'error',
    },
    
    // Animation
    animated && !state.reducedMotion && 'animate-shimmer',
  );

  return (
    <div className="w-full">
      <div 
        className={progressClasses}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={showLabel ? `${percentage.toFixed(0)}% complete` : undefined}
      >
        <div 
          className={fillClasses}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showLabel && (
        <div className="mt-1 text-xs text-muted-foreground text-center">
          {percentage.toFixed(0)}%
        </div>
      )}
    </div>
  );
}