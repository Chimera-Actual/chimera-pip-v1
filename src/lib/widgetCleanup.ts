import { supabase } from '@/integrations/supabase/client';

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

    console.log(`Cleaned up files for widget instance: ${instanceId}`);
  } catch (error) {
    console.error('Error cleaning up widget files:', error);
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
    console.error('Error cleaning up tab files:', error);
  }
};