import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { WidgetSettings } from '@/types/widget';

interface BatchSettingsUpdate {
  widgetInstanceId: string;
  settings: WidgetSettings;
}

interface BatchOperation<T> {
  id: string;
  operation: () => Promise<T>;
  retries: number;
  maxRetries: number;
}

class BatchOperationManager {
  private operationQueue: Map<string, BatchOperation<any>> = new Map();
  private isProcessing = false;
  private batchTimeout: NodeJS.Timeout | null = null;

  // Batch widget settings updates
  async batchUpdateWidgetSettings(
    userId: string,
    updates: BatchSettingsUpdate[]
  ): Promise<void> {
    if (!userId || updates.length === 0) return;

    try {
      logger.time('batch-settings-update');
      
      // Prepare upsert data
      const upsertData = updates.map(update => ({
        user_id: userId,
        widget_instance_id: update.widgetInstanceId,
        settings: update.settings,
      }));

      // Single batch upsert operation
      const { error } = await supabase
        .from('user_widget_settings')
        .upsert(upsertData, {
          onConflict: 'user_id,widget_instance_id'
        });

      if (error) throw error;

      logger.timeEnd('batch-settings-update');
      logger.info(`Successfully batch updated ${updates.length} widget settings`);
    } catch (error) {
      logger.error('Batch settings update failed:', error);
      throw error;
    }
  }

  // Batch widget position updates
  async batchUpdateWidgetPositions(
    userId: string,
    positionUpdates: { instanceId: string; position: number }[]
  ): Promise<void> {
    if (!userId || positionUpdates.length === 0) return;

    try {
      logger.time('batch-position-update');

      // Use a transaction for atomic position updates
      const { error } = await supabase.rpc('batch_update_widget_positions', {
        user_id: userId,
        position_updates: positionUpdates
      });

      if (error) throw error;

      logger.timeEnd('batch-position-update');
      logger.info(`Successfully batch updated ${positionUpdates.length} widget positions`);
    } catch (error) {
      logger.error('Batch position update failed:', error);
      // Fallback to individual updates if batch fails
      await this.fallbackIndividualPositionUpdates(userId, positionUpdates);
    }
  }

  private async fallbackIndividualPositionUpdates(
    userId: string,
    positionUpdates: { instanceId: string; position: number }[]
  ): Promise<void> {
    logger.warn('Falling back to individual position updates');
    
    const promises = positionUpdates.map(({ instanceId, position }) =>
      supabase
        .from('user_widget_instances')
        .update({ position })
        .eq('id', instanceId)
        .eq('user_id', userId)
    );

    const results = await Promise.allSettled(promises);
    const failures = results.filter(result => result.status === 'rejected');
    
    if (failures.length > 0) {
      logger.error(`${failures.length} position updates failed`);
    }
  }

  // Generic batch operation with retry logic
  async addOperation<T>(
    id: string,
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<void> {
    this.operationQueue.set(id, {
      id,
      operation,
      retries: 0,
      maxRetries,
    });

    this.scheduleProcessing();
  }

  private scheduleProcessing(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processQueue();
    }, 100); // Process batch every 100ms
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.size === 0) return;

    this.isProcessing = true;
    const operations = Array.from(this.operationQueue.values());
    this.operationQueue.clear();

    logger.info(`Processing ${operations.length} batched operations`);

    const results = await Promise.allSettled(
      operations.map(op => this.executeWithRetry(op))
    );

    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      logger.error(`${failures.length} operations failed after retries`);
    }

    this.isProcessing = false;

    // Process any new operations that were added during processing
    if (this.operationQueue.size > 0) {
      this.scheduleProcessing();
    }
  }

  private async executeWithRetry<T>(operation: BatchOperation<T>): Promise<T> {
    try {
      return await operation.operation();
    } catch (error) {
      operation.retries++;
      
      if (operation.retries < operation.maxRetries) {
        logger.warn(`Operation ${operation.id} failed, retrying (${operation.retries}/${operation.maxRetries})`);
        
        // Exponential backoff
        const delay = Math.pow(2, operation.retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.executeWithRetry(operation);
      }
      
      logger.error(`Operation ${operation.id} failed after ${operation.maxRetries} retries:`, error);
      throw error;
    }
  }

  // Clean up resources
  destroy(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.operationQueue.clear();
  }
}

// Export singleton instance
export const batchOperationManager = new BatchOperationManager();

// Export the class for testing
export { BatchOperationManager };