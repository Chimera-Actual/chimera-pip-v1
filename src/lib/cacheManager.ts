import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

interface CacheConfig {
  staleTime: number;
  gcTime: number;
  maxEntries?: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

class CacheManager {
  private queryClient: QueryClient;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
  };

  private defaultConfig: Record<string, CacheConfig> = {
    // Static data - cache aggressively
    'widget-definitions': {
      staleTime: 30 * 60 * 1000, // 30 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
    },
    
    // User-specific data - moderate caching
    'user-widget-instances': {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
    },
    
    'user-widget-settings': {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
    
    // Frequently changing data - minimal caching
    'user-tabs': {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
    
    // Tags and metadata - cache well
    'user-widget-tags': {
      staleTime: 15 * 60 * 1000, // 15 minutes
      gcTime: 45 * 60 * 1000, // 45 minutes
    },
  };

  constructor() {
    this.queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes default
          gcTime: 10 * 60 * 1000, // 10 minutes default
          retry: (failureCount, error: any) => {
            // Don't retry auth errors
            if (error?.message?.includes('auth') || error?.code === 'PGRST301') {
              return false;
            }
            return failureCount < 3;
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
        mutations: {
          retry: 2,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        },
      },
    });

    this.setupCacheMonitoring();
  }

  private setupCacheMonitoring(): void {
    // Monitor cache events
    this.queryClient.getQueryCache().subscribe((event) => {
      switch (event.type) {
        case 'added':
          this.metrics.size++;
          break;
        case 'removed':
          this.metrics.size--;
          this.metrics.evictions++;
          break;
        case 'updated':
          if (event.query.state.dataUpdatedAt > 0) {
            this.metrics.hits++;
          } else {
            this.metrics.misses++;
          }
          break;
      }
    });

    // Log metrics periodically in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        this.logMetrics();
      }, 60000); // Every minute
    }
  }

  // Get cache configuration for a query key
  getCacheConfig(queryKey: string[]): CacheConfig {
    const baseKey = queryKey[0];
    return this.defaultConfig[baseKey] || {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    };
  }

  // Prefetch data that's likely to be needed
  async prefetchWidgetData(userId: string): Promise<void> {
    const prefetchQueries = [
      {
        queryKey: ['widget-definitions'],
        queryFn: async () => {
          const { optimizedSupabase } = await import('./optimizedSupabaseClient');
          return optimizedSupabase.query(
            optimizedSupabase.raw
              .from('widget_definitions')
              .select('*')
              .order('category', { ascending: true })
          );
        },
      },
      {
        queryKey: ['user-widget-instances', userId],
        queryFn: async () => {
          const { optimizedSupabase } = await import('./optimizedSupabaseClient');
          return optimizedSupabase.query(
            optimizedSupabase.raw
              .from('user_widget_instances')
              .select('*, widget_definition:widget_definitions(*)')
              .eq('user_id', userId)
              .order('position', { ascending: true })
          );
        },
      },
    ];

    const promises = prefetchQueries.map(({ queryKey, queryFn }) => {
      const config = this.getCacheConfig(queryKey);
      return this.queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: config.staleTime,
        gcTime: config.gcTime,
      });
    });

    try {
      await Promise.allSettled(promises);
      logger.info('Widget data prefetched successfully');
    } catch (error) {
      logger.error('Failed to prefetch widget data:', error);
    }
  }

  // Invalidate related caches when data changes
  invalidateUserData(userId: string): void {
    const userQueries = [
      ['user-widget-instances', userId],
      ['user-widget-settings', userId],
      ['user-widget-tags', userId],
      ['user-tabs', userId],
    ];

    userQueries.forEach((queryKey) => {
      this.queryClient.invalidateQueries({ queryKey });
    });

    logger.info('User data cache invalidated');
  }

  // Smart cache invalidation based on mutation type
  handleMutation(type: string, userId: string, data?: any): void {
    switch (type) {
      case 'widget-instance-added':
      case 'widget-instance-removed':
      case 'widget-instance-moved':
        this.queryClient.invalidateQueries({
          queryKey: ['user-widget-instances', userId],
        });
        break;

      case 'widget-settings-updated':
        this.queryClient.invalidateQueries({
          queryKey: ['user-widget-settings', userId],
        });
        // Also update specific instance if we have the ID
        if (data?.widgetInstanceId) {
          this.queryClient.setQueryData(
            ['user-widget-settings', userId],
            (oldData: any) => {
              if (!oldData) return oldData;
              return oldData.map((setting: any) =>
                setting.widget_instance_id === data.widgetInstanceId
                  ? { ...setting, settings: data.settings }
                  : setting
              );
            }
          );
        }
        break;

      case 'widget-tag-added':
      case 'widget-tag-removed':
        this.queryClient.invalidateQueries({
          queryKey: ['user-widget-tags', userId],
        });
        // Also invalidate widget definitions to update user_tags
        this.queryClient.invalidateQueries({
          queryKey: ['widget-definitions'],
        });
        break;

      default:
        logger.warn('Unknown mutation type:', type);
    }
  }

  // Cache cleanup and optimization
  optimizeCache(): void {
    logger.info('Optimizing cache...');
    
    // Remove queries that haven't been used recently
    const queryCache = this.queryClient.getQueryCache();
    const now = Date.now();
    const maxIdleTime = 15 * 60 * 1000; // 15 minutes

    queryCache.getAll().forEach((query) => {
      const lastAccess = query.state.dataUpdatedAt || query.state.errorUpdatedAt;
      if (now - lastAccess > maxIdleTime) {
        queryCache.remove(query);
        logger.info('Removed idle query:', query.queryKey);
      }
    });

    // Force garbage collection
    queryCache.clear();
    
    logger.info('Cache optimization completed');
  }

  // Get cache metrics
  getMetrics(): CacheMetrics & { hitRate: number } {
    const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;
    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  private logMetrics(): void {
    const metrics = this.getMetrics();
    logger.info('Cache metrics:', metrics);
  }

  // Expose query client
  get client(): QueryClient {
    return this.queryClient;
  }

  // Cleanup
  destroy(): void {
    this.queryClient.clear();
    logger.info('Cache manager destroyed');
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Export the class for testing
export { CacheManager };