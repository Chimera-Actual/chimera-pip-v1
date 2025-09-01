import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface StandardWidgetTemplateProps {
  icon: React.ReactNode;
  title: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const StandardWidgetTemplate: React.FC<StandardWidgetTemplateProps> = ({
  icon,
  title,
  controls,
  children,
  className = ""
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden ${className}`}>
      {/* Standard Header */}
      <div className={`flex-shrink-0 bg-card border-b border-border px-3 md:px-4 flex items-center justify-between ${
        isMobile ? 'h-12' : 'h-16'
      }`}>
        <div className="flex items-center gap-2">
          <span className="icon-primary crt-glow">
            {icon}
          </span>
          <span className={`font-mono text-primary uppercase tracking-wider crt-glow ${
            isMobile ? 'text-sm' : 'text-lg'
          }`}>
            {title}
          </span>
        </div>
        {controls && (
          <div className="flex items-center gap-2">
            {controls}
          </div>
        )}
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};