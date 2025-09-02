import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://hwcndbqedbowkgpbinxl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3Y25kYnFlZGJvd2tncGJpbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MDA5ODQsImV4cCI6MjA3MTk3Njk4NH0.mGjCCbnYh0QKT86rgknk5tgAZ-u2s-2Kt2sxrisabDU";

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

class OptimizedSupabaseClient {
  private client: SupabaseClient<Database>;
  private connectionPool: Map<string, Promise<any>> = new Map();
  private defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT',
      'CONNECTION_ERROR',
      'PGRST301', // Row level security violation (might be temporary)
      'PGRST116', // Too many requests
    ],
  };

  constructor() {
    this.client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'X-Client-Info': 'pipboy-app/1.0.0',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    // Set up connection monitoring
    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring(): void {
    // Monitor auth state changes
    this.client.auth.onAuthStateChange((event, session) => {
      logger.info(`Auth event: ${event}`, { hasSession: !!session });
      
      if (event === 'SIGNED_OUT') {
        this.clearConnectionPool();
      }
    });
  }

  private clearConnectionPool(): void {
    this.connectionPool.clear();
    logger.info('Connection pool cleared');
  }

  // Enhanced query with retry logic and connection pooling
  async query<T>(
    queryBuilder: any,
    options: Partial<RetryOptions> = {}
  ): Promise<{ data: T | null; error: any }> {
    const retryOptions = { ...this.defaultRetryOptions, ...options };
    const queryKey = this.generateQueryKey(queryBuilder);

    // Check if we have a pending query for the same operation
    if (this.connectionPool.has(queryKey)) {
      logger.info(`Reusing pending query: ${queryKey}`);
      return this.connectionPool.get(queryKey);
    }

    // Create and cache the query promise
    const queryPromise = this.executeWithRetry(queryBuilder, retryOptions);
    this.connectionPool.set(queryKey, queryPromise);

    try {
      const result = await queryPromise;
      return result;
    } finally {
      // Remove from pool after completion
      setTimeout(() => {
        this.connectionPool.delete(queryKey);
      }, 1000); // Keep for 1 second to handle duplicate requests
    }
  }

  private async executeWithRetry(
    queryBuilder: any,
    options: RetryOptions,
    attempt: number = 1
  ): Promise<{ data: any | null; error: any }> {
    try {
      logger.time(`query-attempt-${attempt}`);
      const result = await queryBuilder;
      logger.timeEnd(`query-attempt-${attempt}`);

      if (result.error && this.isRetryableError(result.error, options)) {
        throw result.error;
      }

      return result;
    } catch (error: any) {
      logger.error(`Query attempt ${attempt} failed:`, error);

      if (attempt < options.maxRetries && this.isRetryableError(error, options)) {
        const delay = Math.min(
          options.baseDelay * Math.pow(2, attempt - 1),
          options.maxDelay
        );
        
        logger.info(`Retrying query in ${delay}ms (attempt ${attempt + 1}/${options.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(queryBuilder, options, attempt + 1);
      }

      return { data: null, error };
    }
  }

  private isRetryableError(error: any, options: RetryOptions): boolean {
    if (!error) return false;

    const errorCode = error.code || error.message || '';
    const isNetworkError = error.name === 'AbortError' || 
                          error.message?.includes('network') ||
                          error.message?.includes('timeout');

    return isNetworkError || options.retryableErrors.some(code => 
      errorCode.includes(code)
    );
  }

  private generateQueryKey(queryBuilder: any): string {
    // Simple query key generation based on the query string
    const queryString = queryBuilder.toString?.() || 
                       JSON.stringify(queryBuilder) || 
                       Math.random().toString();
    
    return btoa(queryString).slice(0, 16);
  }

  // Batch operations
  async batchInsert<T>(
    tableName: string,
    records: T[],
    options?: { chunkSize?: number; onConflict?: string }
  ): Promise<{ data: T[] | null; error: any }> {
    const chunkSize = options?.chunkSize || 100;
    const chunks = this.chunkArray(records, chunkSize);
    
    logger.info(`Batch inserting ${records.length} records in ${chunks.length} chunks`);
    
    const results: T[] = [];
    let lastError: any = null;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        let query = this.client.from(tableName).insert(chunk);
        
        if (options?.onConflict) {
          query = query.select();
        }

        const result = await this.query(query);
        
        if (result.error) {
          lastError = result.error;
          logger.error(`Chunk ${i + 1} failed:`, result.error);
        } else if (result.data) {
          results.push(...(Array.isArray(result.data) ? result.data : [result.data]));
        }
      } catch (error) {
        lastError = error;
        logger.error(`Chunk ${i + 1} threw error:`, error);
      }
    }

    return { data: results.length > 0 ? results : null, error: lastError };
  }

  async batchUpdate<T>(
    tableName: string,
    updates: { filter: Record<string, any>; data: Partial<T> }[],
    options?: { chunkSize?: number }
  ): Promise<{ success: number; failed: number }> {
    const chunkSize = options?.chunkSize || 50;
    const chunks = this.chunkArray(updates, chunkSize);
    
    let success = 0;
    let failed = 0;

    for (const chunk of chunks) {
      const promises = chunk.map(async ({ filter, data }) => {
        try {
          let query = this.client.from(tableName).update(data);
          
          // Apply filters
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });

          const result = await this.query(query);
          return { success: !result.error, error: result.error };
        } catch (error) {
          return { success: false, error };
        }
      });

      const results = await Promise.allSettled(promises);
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          success++;
        } else {
          failed++;
        }
      });
    }

    logger.info(`Batch update completed: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Expose the original client for direct access when needed
  get raw(): SupabaseClient<Database> {
    return this.client;
  }

  // Connection health check
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('widget_definitions')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  // Cleanup resources
  destroy(): void {
    this.clearConnectionPool();
  }
}

// Export singleton instance
export const optimizedSupabase = new OptimizedSupabaseClient();

// Export the class for testing
export { OptimizedSupabaseClient };