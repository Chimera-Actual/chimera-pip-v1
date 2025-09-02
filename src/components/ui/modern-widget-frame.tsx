import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModernWidgetFrameProps {
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
  category?: string;
}

export default function ModernWidgetFrame({
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
  category = 'default'
}: ModernWidgetFrameProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    if (!collapsible) return false;
    
    try {
      const saved = localStorage.getItem(`widget-collapsed-${widgetInstanceId}`);
      return saved ? JSON.parse(saved) : defaultCollapsed;
    } catch {
      return defaultCollapsed;
    }
  });

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

  // Build CSS classes using the modern architecture
  const widgetClasses = cn(
    'widget',
    'widget-container',
    'transition-collapse',
    {
      'widget--collapsed': isCollapsed,
      'widget--expanded': !isCollapsed,
      'widget--minimal': variant === 'minimal',
      'widget--compact': variant === 'compact',
      'widget--emphasis': variant === 'emphasis',
      'widget--small': size === 'small',
      'widget--medium': size === 'medium',
      'widget--large': size === 'large',
      [`widget--${category}`]: category !== 'default',
    },
    className
  );

  return (
    <motion.div
      className={widgetClasses}
      style={{
        ...style,
        // Use CSS custom properties for dynamic styling
        '--widget-category-accent': category === 'productivity' ? '45 100% 60%' : 
                                   category === 'monitoring' ? '0 100% 60%' :
                                   category === 'utilities' ? '200 100% 60%' :
                                   'var(--color-primary)',
      } as React.CSSProperties}
      layout
      transition={{
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] // CSS cubic-bezier equivalent
      }}
    >
      {/* Widget Header */}
      <div className="widget-header">
        <div className="flex items-center gap-sm">
          {/* Drag Handle - using logical properties in CSS */}
          <div 
            className="drag-handle cursor-move padding-inline-xs padding-block-xs border-radius-xs transition-base hover:bg-primary/10"
            style={{ 
              background: 'linear-gradient(45deg, hsl(var(--widget-accent) / 0.2) 25%, transparent 25%, transparent 75%, hsl(var(--widget-accent) / 0.2) 75%)',
              backgroundSize: '4px 4px'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" className="icon-monochrome">
              <circle cx="3" cy="3" r="1" />
              <circle cx="9" cy="3" r="1" />
              <circle cx="3" cy="9" r="1" />
              <circle cx="9" cy="9" r="1" />
            </svg>
          </div>

          {/* Widget Title with responsive text */}
          {title && (
            <h3 className="widget-title text-responsive-sm font-heading font-semibold text-widget-text">
              {title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-xs">
          {right}
          
          {/* Collapse Button */}
          {collapsible && (
            <button
              onClick={toggleCollapse}
              className="padding-xs border-radius-sm transition-base hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label={isCollapsed ? 'Expand widget' : 'Collapse widget'}
              type="button"
            >
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                className="icon-monochrome"
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <path
                  fill="currentColor"
                  d="M4.5 6L8 9.5L11.5 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </button>
          )}

          {/* Settings Button */}
          {onSettings && (
            <button
              onClick={onSettings}
              className="padding-xs border-radius-sm transition-base hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Widget settings"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" className="icon-monochrome">
                <path
                  fill="currentColor"
                  d="M8 10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                />
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M6.94 2.5c.26-.26.62-.4.98-.4h.16c.36 0 .72.14.98.4.26.26.4.62.4.98v.34c.18.06.35.14.52.22l.24-.24c.26-.26.62-.4.98-.4s.72.14.98.4c.26.26.4.62.4.98s-.14.72-.4.98l-.24.24c.08.17.16.34.22.52h.34c.36 0 .72.14.98.4.26.26.4.62.4.98v.16c0 .36-.14.72-.4.98-.26.26-.62.4-.98.4h-.34c-.06.18-.14.35-.22.52l.24.24c.26.26.4.62.4.98s-.14.72-.4.98c-.26.26-.62.4-.98.4s-.72-.14-.98-.4l-.24-.24c-.17.08-.34.16-.52.22v.34c0 .36-.14.72-.4.98-.26.26-.62.4-.98.4h-.16c-.36 0-.72-.14-.98-.4-.26-.26-.4-.62-.4-.98v-.34c-.18-.06-.35-.14-.52-.22l-.24.24c-.26.26-.62.4-.98.4s-.72-.14-.98-.4c-.26-.26-.4-.62-.4-.98s.14-.72.4-.98l.24-.24c-.08-.17-.16-.34-.22-.52h-.34c-.36 0-.72-.14-.98-.4-.26-.26-.4-.62-.4-.98v-.16c0-.36.14-.72.4-.98.26-.26.62-.4.98-.4h.34c.06-.18.14-.35.22-.52l-.24-.24c-.26-.26-.4-.62-.4-.98s.14-.72.4-.98c.26-.26.62-.4.98-.4s.72.14.98.4l.24.24c.17-.08.34-.16.52-.22v-.34c0-.36.14-.72.4-.98z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Widget Content with improved collapse animation */}
      <motion.div
        className="widget-content"
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={{
          collapsed: {
            opacity: 0,
            height: 0,
            transition: {
              opacity: { duration: 0.15 },
              height: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
            }
          },
          expanded: {
            opacity: 1,
            height: 'auto',
            transition: {
              height: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
              opacity: { duration: 0.25, delay: 0.15 }
            }
          }
        }}
        style={{ overflow: isCollapsed ? 'hidden' : 'visible' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}