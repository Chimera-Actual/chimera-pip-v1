import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Settings, ChevronDown, GripVertical, AlertCircle } from 'lucide-react';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

interface EnhancedWidgetFrameProps {
  title?: string;
  children: React.ReactNode;
  onSettings?: () => void;
  right?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  widgetInstanceId?: string;
  onCollapseChange?: (widgetId: string, collapsed: boolean) => void;
  variant?: 'default' | 'minimal' | 'compact' | 'emphasis';
  size?: 'small' | 'medium' | 'large';
  category?: 'productivity' | 'monitoring' | 'utilities' | 'default';
  loading?: boolean;
  error?: boolean;
  draggable?: boolean;
  resizable?: boolean;
}

export default function EnhancedWidgetFrame({
  title,
  children,
  onSettings,
  right,
  className = "",
  style = {},
  collapsible = true,
  defaultCollapsed = false,
  widgetInstanceId = '',
  onCollapseChange,
  variant = 'default',
  size = 'medium',
  category = 'default',
  loading = false,
  error = false,
  draggable = true,
  resizable = true
}: EnhancedWidgetFrameProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    if (!collapsible) return false;
    
    try {
      const saved = localStorage.getItem(`widget-collapsed-${widgetInstanceId}`);
      return saved ? JSON.parse(saved) : defaultCollapsed;
    } catch {
      return defaultCollapsed;
    }
  });

  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!collapsible || !widgetInstanceId) return;
    
    try {
      localStorage.setItem(`widget-collapsed-${widgetInstanceId}`, JSON.stringify(isCollapsed));
    } catch {
      // Ignore localStorage errors
    }
  }, [isCollapsed, widgetInstanceId, collapsible]);

  const toggleCollapse = () => {
    if (!collapsible) return;
    
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(widgetInstanceId, newCollapsed);
  };

  // Enhanced CSS classes with accessibility and modern styling
  const widgetClasses = cn(
    // Base widget classes
    'widget',
    'widget-container',
    'bg-card',
    'border',
    'border-border',
    'rounded-lg',
    'overflow-hidden',
    'transition-all',
    'duration-base',
    'ease-smooth',
    
    // State classes
    {
      'widget--collapsed': isCollapsed,
      'widget--expanded': !isCollapsed,
      'widget--loading': loading,
      'widget--error': error,
      'shadow-widget': !isHovered && !isFocused,
      'shadow-widget-hover': isHovered || isFocused,
      'ring-2 ring-primary/20': isFocused,
    },
    
    // Variant classes
    {
      'widget--minimal': variant === 'minimal',
      'widget--compact': variant === 'compact', 
      'widget--emphasis': variant === 'emphasis',
    },
    
    // Size classes
    {
      'widget--small': size === 'small',
      'widget--medium': size === 'medium',
      'widget--large': size === 'large',
    },
    
    // Category classes
    {
      'widget--productivity': category === 'productivity',
      'widget--monitoring': category === 'monitoring',
      'widget--utilities': category === 'utilities',
    },
    
    className
  );

  const getCategoryAccent = () => {
    switch (category) {
      case 'productivity': return '45 100% 60%'; // Amber
      case 'monitoring': return '0 100% 60%';   // Red
      case 'utilities': return '200 100% 60%';  // Cyan
      default: return 'var(--primary)';
    }
  };

  return (
    <motion.div
      className={widgetClasses}
      style={{
        ...style,
        '--widget-category-accent': getCategoryAccent(),
      } as React.CSSProperties}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        height: isCollapsed ? 'auto' : 'auto'
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.25,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      role="region"
      aria-label={title}
      tabIndex={0}
    >
      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-mono">Loading...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Header */}
      <div className="widget-header flex items-center justify-between px-3 py-2 bg-gradient-to-r from-transparent to-primary/5 border-b border-border">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          {draggable && (
            <div 
              className={cn(
                "drag-handle cursor-move p-1 rounded-sm transition-colors hover:bg-primary/10",
                "flex items-center justify-center"
              )}
              aria-label="Drag to move widget"
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
          )}

          {/* Error indicator */}
          {error && (
            <AlertCircle className="w-4 h-4 text-destructive" aria-label="Widget error" />
          )}

          {/* Widget Title */}
          {title && (
            <h3 className={cn(
              "font-heading font-semibold text-foreground",
              size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'
            )}>
              {title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1">
          {right}
          
          {/* Collapse Button */}
          {collapsible && (
            <button
              onClick={toggleCollapse}
              className={cn(
                "p-1 rounded-sm transition-all hover:bg-primary/10",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "active:scale-95"
              )}
              aria-label={isCollapsed ? 'Expand widget' : 'Collapse widget'}
              aria-expanded={!isCollapsed}
              type="button"
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </button>
          )}

          {/* Settings Button */}
          {onSettings && (
            <button
              onClick={onSettings}
              className={cn(
                "p-1 rounded-sm transition-all hover:bg-primary/10",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "active:scale-95"
              )}
              aria-label="Widget settings"
              type="button"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content with smooth animations */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            className="widget-content overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: 'auto', 
              opacity: 1,
              transition: {
                height: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
                opacity: { duration: 0.2, delay: 0.1 }
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: {
                opacity: { duration: 0.1 },
                height: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
              }
            }}
          >
            <div className="p-3">
              <WidgetErrorBoundary widgetName={title || 'Widget'}>
                {children}
              </WidgetErrorBoundary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize Handle */}
      {resizable && !isCollapsed && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity">
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/50" />
        </div>
      )}
    </motion.div>
  );
}