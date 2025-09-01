import React from 'react';
import { useResponsive, useResponsiveHeaderHeight, useResponsivePadding, useResponsiveText } from '@/hooks/useResponsive';

interface StandardWidgetTemplateProps {
  icon: React.ReactNode;
  title: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentLayout?: 'default' | 'split' | 'stack';
}

export const StandardWidgetTemplate: React.FC<StandardWidgetTemplateProps> = ({
  icon,
  title,
  controls,
  children,
  className = "",
  contentLayout = 'default'
}) => {
  const { isMobile, isTablet } = useResponsive();
  const headerHeight = useResponsiveHeaderHeight();
  const padding = useResponsivePadding();
  const textSizes = useResponsiveText();

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden ${className}`}>
      {/* Enhanced Responsive Header */}
      <div className={`flex-shrink-0 bg-card border-b border-border ${padding} flex items-center justify-between ${headerHeight}`}>
        <div className="flex items-center gap-2">
          <span className="icon-primary crt-glow">
            {icon}
          </span>
          <span className={`font-mono text-primary uppercase tracking-wider crt-glow ${textSizes.title}`}>
            {title}
          </span>
        </div>
        {controls && (
          <div className="flex items-center gap-2">
            {controls}
          </div>
        )}
      </div>
      
      {/* Flexible Content Area with Layout Support */}
      <div className={`flex-1 overflow-hidden ${
        contentLayout === 'split' && !isMobile 
          ? 'flex flex-row' 
          : contentLayout === 'stack' || isMobile
          ? 'flex flex-col'
          : ''
      }`}>
        {children}
      </div>
    </div>
  );
};