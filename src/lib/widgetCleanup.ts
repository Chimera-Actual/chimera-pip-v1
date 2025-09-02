import { supabase } from '@/integrations/supabase/client';
import { clearWidgetState } from './widgetStateManager';
import { logger } from './logger';

export const cleanupWidgetFiles = async (instanceId: string) => {
  try {
    // Cleanup audio files
    const { data: audioFiles, error: audioError } = await supabase
      .from('widget_instance_audio')
      .select('audio_path')
      .eq('widget_instance_id', instanceId);

    if (!audioError && audioFiles) {
      // Delete audio files from storage
      const filePaths = audioFiles.map(file => file.audio_path);
      if (filePaths.length > 0) {
        await supabase.storage
          .from('audio')
          .remove(filePaths);
      }

      // Delete audio records from database
      await supabase
        .from('widget_instance_audio')
        .delete()
        .eq('widget_instance_id', instanceId);
    }

    // Cleanup image files
    const { data: imageFiles, error: imageError } = await supabase
      .from('widget_instance_images')
      .select('image_path')
      .eq('widget_instance_id', instanceId);

    if (!imageError && imageFiles) {
      // Delete image files from storage
      const filePaths = imageFiles.map(file => file.image_path);
      if (filePaths.length > 0) {
        await supabase.storage
          .from('images')
          .remove(filePaths);
      }

      // Delete image records from database
      await supabase
        .from('widget_instance_images')
        .delete()
        .eq('widget_instance_id', instanceId);
    }

    logger.info('Cleaned up files for widget instance', { instanceId }, 'WidgetCleanup');
  } catch (error) {
    logger.error('Error cleaning up widget files', error, 'WidgetCleanup');
  }
};

export const cleanupTabFiles = async (tabId: string) => {
  try {
    // Get all widget instances in this tab
    const { data: widgets, error } = await supabase
      .from('user_widget_instances')
      .select('id')
      .eq('tab_id', tabId);

    if (!error && widgets) {
      // Clean up files for each widget instance
      await Promise.all(
        widgets.map(widget => cleanupWidgetFiles(widget.id))
      );
    }
  } catch (error) {
    logger.error('Error cleaning up tab files', error, 'WidgetCleanup');
  }
};

/**
 * Comprehensive widget state cleanup including localStorage
 */
export async function cleanupWidgetState(widgetInstanceId: string, userId: string) {
  logger.info('Starting widget state cleanup', { widgetInstanceId, userId }, 'WidgetCleanup');
  
  try {
    // Clear localStorage state for this widget
    clearWidgetState(widgetInstanceId);
    
    // Also clean up files
    await cleanupWidgetFiles(widgetInstanceId);

    // Clean up any widget-specific settings
    const { error: settingsError } = await supabase
      .from('user_widget_settings')
      .delete()
      .eq('widget_instance_id', widgetInstanceId)
      .eq('user_id', userId);

    if (settingsError) {
      logger.warn('Failed to clean up widget settings', settingsError, 'WidgetCleanup');
    } else {
      logger.info('Widget settings cleaned up successfully', { widgetInstanceId }, 'WidgetCleanup');
    }

    logger.info('Widget state cleanup completed', { widgetInstanceId }, 'WidgetCleanup');
  } catch (error) {
    logger.error('Widget state cleanup failed', error, 'WidgetCleanup');
    throw error;
  }
}