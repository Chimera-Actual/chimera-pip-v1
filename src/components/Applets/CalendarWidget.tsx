import React from 'react';
import { Calendar } from 'lucide-react';
import { StandardWidgetTemplate } from '@/components/Layout/StandardWidgetTemplate';
import { useResponsive } from '@/hooks/useResponsive';

export const CalendarWidget: React.FC = () => {
  const { isMobile } = useResponsive();
  
  return (
    <StandardWidgetTemplate
      icon={<Calendar size={isMobile ? 16 : 20} />}
      title="SCHEDULE MANAGER"
    >
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className={`opacity-50 ${isMobile ? 'text-4xl' : 'text-6xl'}`}>◔</div>
          <div className={`text-muted-foreground font-mono ${isMobile ? 'text-sm px-4' : ''}`}>
            Calendar widget coming soon...
          </div>
        </div>
      </div>
    </StandardWidgetTemplate>
  );
};