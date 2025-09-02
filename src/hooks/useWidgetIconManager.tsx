import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export const useWidgetIconManager = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const updateWidgetIcon = async (widgetId: string, newIcon: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update widget icons');
    }

    setLoading(true);
    try {
      // Note: This would normally require admin permissions to update widget_definitions
      // For now, we'll update the local state only since widget_definitions is read-only
      logger.info('Icon update requested for widget', { widgetId, newIcon }, 'WidgetIconManager');
      
      // In a real implementation, this would require backend admin API
      // For demo purposes, we'll just log the change and show that it "worked"
      const { error } = await supabase
        .from('widget_definitions')
        .update({ icon: newIcon })
        .eq('id', widgetId);

      if (error) {
        logger.warn('Cannot update widget_definitions directly (read-only table)', error, 'WidgetIconManager');
        // This is expected since widget_definitions is read-only
        // In production, this would need an admin API endpoint
        throw new Error('Widget definitions are read-only. Admin API required.');
      }

    } catch (error) {
      logger.error('Error updating widget icon', error, 'WidgetIconManager');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateWidgetIcon,
    loading
  };
};