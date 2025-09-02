import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  center?: boolean;
  fluid?: boolean;
  breakout?: boolean;
}

export function ResponsiveContainer({
  children,
  className,
  size = 'lg',
  padding = 'md',
  center = true,
  fluid = false,
  breakout = false,
}: ResponsiveContainerProps) {
  const containerClasses = cn(
    // Base container styles
    'container-query',
    
    // Size classes using CSS custom properties
    {
      'max-w-container-xs': size === 'xs' && !fluid,
      'max-w-container-sm': size === 'sm' && !fluid,
      'max-w-container-md': size === 'md' && !fluid,
      'max-w-container-lg': size === 'lg' && !fluid,
      'max-w-container-xl': size === 'xl' && !fluid,
      'max-w-container-2xl': size === '2xl' && !fluid,
      'max-w-container-3xl': size === '3xl' && !fluid,
      'w-full': fluid,
    },
    
    // Padding classes using CSS custom properties
    {
      'px-0': padding === 'none',
      'px-xs': padding === 'xs',
      'px-sm': padding === 'sm',
      'px-md': padding === 'md',
      'px-lg': padding === 'lg',
      'px-xl': padding === 'xl',
      'px-2xl': padding === '2xl',
      'px-3xl': padding === '3xl',
    },
    
    // Center alignment
    {
      'mx-auto': center && !fluid,
    },
    
    // Breakout styles for full-width sections
    {
      'breakout': breakout,
    },
    
    className
  );

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export function ResponsiveGrid({
  children,
  className,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  align = 'stretch',
  justify = 'start',
}: ResponsiveGridProps) {
  const gridClasses = cn(
    'grid',
    
    // Gap classes using CSS custom properties
    {
      'gap-xs': gap === 'xs',
      'gap-sm': gap === 'sm',
      'gap-md': gap === 'md',
      'gap-lg': gap === 'lg',
      'gap-xl': gap === 'xl',
      'gap-2xl': gap === '2xl',
      'gap-3xl': gap === '3xl',
    },
    
    // Alignment classes
    {
      'items-start': align === 'start',
      'items-center': align === 'center',
      'items-end': align === 'end',
      'items-stretch': align === 'stretch',
    },
    
    // Justify classes
    {
      'justify-start': justify === 'start',
      'justify-center': justify === 'center',
      'justify-end': justify === 'end',
      'justify-between': justify === 'between',
      'justify-around': justify === 'around',
      'justify-evenly': justify === 'evenly',
    },
    
    className
  );

  return (
    <div 
      className={gridClasses}
      style={{
        // Use container queries for responsive columns
        gridTemplateColumns: `repeat(var(--grid-columns, ${columns.xs || 1}), minmax(0, 1fr))`,
        ...(columns.sm && { '--grid-columns-sm': columns.sm }),
        ...(columns.md && { '--grid-columns-md': columns.md }),
        ...(columns.lg && { '--grid-columns-lg': columns.lg }),
        ...(columns.xl && { '--grid-columns-xl': columns.xl }),
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

interface ResponsiveFlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'col';
  wrap?: boolean;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  responsive?: {
    sm?: Partial<Pick<ResponsiveFlexProps, 'direction' | 'wrap' | 'align' | 'justify'>>;
    md?: Partial<Pick<ResponsiveFlexProps, 'direction' | 'wrap' | 'align' | 'justify'>>;
    lg?: Partial<Pick<ResponsiveFlexProps, 'direction' | 'wrap' | 'align' | 'justify'>>;
  };
}

export function ResponsiveFlex({
  children,
  className,
  direction = 'row',
  wrap = false,
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  responsive = {},
}: ResponsiveFlexProps) {
  const flexClasses = cn(
    'flex',
    
    // Direction classes
    {
      'flex-row': direction === 'row',
      'flex-col': direction === 'col',
    },
    
    // Wrap classes
    {
      'flex-wrap': wrap,
      'flex-nowrap': !wrap,
    },
    
    // Gap classes using CSS custom properties
    {
      'gap-xs': gap === 'xs',
      'gap-sm': gap === 'sm',
      'gap-md': gap === 'md',
      'gap-lg': gap === 'lg',
      'gap-xl': gap === 'xl',
      'gap-2xl': gap === '2xl',
      'gap-3xl': gap === '3xl',
    },
    
    // Alignment classes
    {
      'items-start': align === 'start',
      'items-center': align === 'center',
      'items-end': align === 'end',
      'items-stretch': align === 'stretch',
      'items-baseline': align === 'baseline',
    },
    
    // Justify classes
    {
      'justify-start': justify === 'start',
      'justify-center': justify === 'center',
      'justify-end': justify === 'end',
      'justify-between': justify === 'between',
      'justify-around': justify === 'around',
      'justify-evenly': justify === 'evenly',
    },
    
    // Responsive classes
    responsive.sm && {
      [`sm:flex-${responsive.sm.direction}`]: responsive.sm.direction,
      'sm:flex-wrap': responsive.sm.wrap,
      [`sm:items-${responsive.sm.align}`]: responsive.sm.align,
      [`sm:justify-${responsive.sm.justify}`]: responsive.sm.justify,
    },
    
    responsive.md && {
      [`md:flex-${responsive.md.direction}`]: responsive.md.direction,
      'md:flex-wrap': responsive.md.wrap,
      [`md:items-${responsive.md.align}`]: responsive.md.align,
      [`md:justify-${responsive.md.justify}`]: responsive.md.justify,
    },
    
    responsive.lg && {
      [`lg:flex-${responsive.lg.direction}`]: responsive.lg.direction,
      'lg:flex-wrap': responsive.lg.wrap,
      [`lg:items-${responsive.lg.align}`]: responsive.lg.align,
      [`lg:justify-${responsive.lg.justify}`]: responsive.lg.justify,
    },
    
    className
  );

  return (
    <div className={flexClasses}>
      {children}
    </div>
  );
}

// Enhanced responsive text component
interface ResponsiveTextProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  font?: 'sans' | 'mono' | 'heading' | 'display' | 'terminal';
  color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'destructive';
  className?: string;
  responsive?: boolean;
}

export function ResponsiveText({
  children,
  as = 'p',
  size = 'base',
  weight = 'normal',
  font = 'sans',
  color = 'primary',
  className,
  responsive = true,
}: ResponsiveTextProps) {
  const Component = as;
  
  const textClasses = cn(
    // Base text classes
    'text-responsive-' + size,
    
    // Font family classes
    {
      'font-sans': font === 'sans',
      'font-mono': font === 'mono',
      'font-heading': font === 'heading',
      'font-display': font === 'display',
      'font-terminal': font === 'terminal',
    },
    
    // Font weight classes
    {
      'font-normal': weight === 'normal',
      'font-medium': weight === 'medium',
      'font-semibold': weight === 'semibold',
      'font-bold': weight === 'bold',
    },
    
    // Color classes
    {
      'text-foreground': color === 'primary',
      'text-secondary-foreground': color === 'secondary',
      'text-muted-foreground': color === 'muted',
      'text-accent-foreground': color === 'accent',
      'text-destructive': color === 'destructive',
    },
    
    className
  );

  return (
    <Component className={textClasses}>
      {children}
    </Component>
  );
}