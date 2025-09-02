import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { optimizedSupabase } from '@/lib/optimizedSupabaseClient';
import { batchOperationManager } from '@/lib/batchOperations';
import { cacheManager } from '@/lib/cacheManager';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';
import type { 
  WidgetDefinition, 
  UserWidgetInstance, 
  UserWidgetSettings, 
  UserWidgetTag,
  WidgetSettings 
} from '@/types/widget';

// Query Keys
export const queryKeys = {
  widgetDefinitions: ['widget-definitions'] as const,
  userWidgetInstances: (userId?: string) => ['user-widget-instances', userId] as const,
  userWidgetSettings: (userId?: string) => ['user-widget-settings', userId] as const,
  userWidgetTags: (userId?: string) => ['user-widget-tags', userId] as const,
  userTabs: (userId?: string) => ['user-tabs', userId] as const,
  userSettings: (userId?: string) => ['user-settings', userId] as const,
} as const;

// Optimized query hooks
export const useOptimizedSupabaseQueries = () => {
  const { user } = useAuth();
  const queryClient = cacheManager.client;

  // Widget Definitions (public, cached globally)
  const widgetDefinitionsQuery = useQuery({
    queryKey: queryKeys.widgetDefinitions,
    queryFn: async (): Promise<WidgetDefinition[]> => {
      logger.time('fetch-widget-definitions');
      
      const result = await optimizedSupabase.query(
        optimizedSupabase.raw
          .from('widget_definitions')
          .select('*')
          .order('category', { ascending: true })
      );

      logger.timeEnd('fetch-widget-definitions');

      if (result.error) throw result.error;
      
      return (result.data || []).map(w => ({
        ...w,
        default_settings: (w.default_settings as WidgetSettings) || {}
      }));
    },
    ...cacheManager.getCacheConfig(queryKeys.widgetDefinitions),
  });

  // User Widget Instances with join optimization
  const userWidgetInstancesQuery = useQuery({
    queryKey: queryKeys.userWidgetInstances(user?.id),
    queryFn: async (): Promise<UserWidgetInstance[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      logger.time('fetch-user-widget-instances');
      
      const result = await optimizedSupabase.query(
        optimizedSupabase.raw
          .from('user_widget_instances')
          .select(`
            *,
            widget_definition:widget_definitions(*)
          `)
          .eq('user_id', user.id)
          .order('position', { ascending: true })
      );

      logger.timeEnd('fetch-user-widget-instances');

      if (result.error) throw result.error;
      
      return (result.data || []).map(i => ({
        ...i,
        widget_definition: i.widget_definition ? {
          ...i.widget_definition,
          default_settings: (i.widget_definition.default_settings as WidgetSettings) || {}
        } : undefined
      }));
    },
    enabled: !!user?.id,
    ...cacheManager.getCacheConfig(queryKeys.userWidgetInstances(user?.id)),
  });

  // User Widget Settings
  const userWidgetSettingsQuery = useQuery({
    queryKey: queryKeys.userWidgetSettings(user?.id),
    queryFn: async (): Promise<UserWidgetSettings[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_widget_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      return (data || []).map(s => ({
        ...s,
        settings: (s.settings as WidgetSettings) || {}
      }));
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // User Widget Tags
  const userWidgetTagsQuery = useQuery({
    queryKey: queryKeys.userWidgetTags(user?.id),
    queryFn: async (): Promise<UserWidgetTag[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_widget_tags')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });

  // Optimized mutations
  const addWidgetMutation = useMutation({
    mutationFn: async ({ widgetId, tabId }: { widgetId: string; tabId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check for existing widget
      const existingQuery = await supabase
        .from('user_widget_instances')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('widget_id', widgetId)
        .eq('tab_id', tabId)
        .maybeSingle();

      if (existingQuery.error) throw existingQuery.error;

      if (existingQuery.data) {
        if (existingQuery.data.is_active) {
          return existingQuery.data; // Already active
        }
        
        // Reactivate existing
        const { data, error } = await supabase
          .from('user_widget_instances')
          .update({ is_active: true })
          .eq('id', existingQuery.data.id)
          .select(`*, widget_definition:widget_definitions(*)`)
          .single();

        if (error) throw error;
        return data;
      }

      // Create new widget instance
      const positionQuery = await supabase
        .from('user_widget_instances')
        .select('position')
        .eq('user_id', user.id)
        .eq('tab_id', tabId)
        .eq('is_active', true)
        .order('position', { ascending: false })
        .limit(1);

      const maxPosition = positionQuery.data?.[0]?.position ?? -1;

      const { data, error } = await supabase
        .from('user_widget_instances')
        .insert({
          user_id: user.id,
          widget_id: widgetId,
          tab_id: tabId,
          position: maxPosition + 1,
          is_active: true,
        })
        .select(`*, widget_definition:widget_definitions(*)`)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.userWidgetInstances(user?.id) 
      });
    },
  });

  const updateWidgetSettingsMutation = useMutation({
    mutationFn: async ({ 
      widgetInstanceId, 
      settings 
    }: { 
      widgetInstanceId: string; 
      settings: WidgetSettings; 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const result = await optimizedSupabase.query(
        optimizedSupabase.raw
          .from('user_widget_settings')
          .upsert({
            user_id: user.id,
            widget_instance_id: widgetInstanceId,
            settings: settings,
          }, {
            onConflict: 'user_id,widget_instance_id'
          })
          .select()
          .single()
      );

      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (data, variables) => {
      cacheManager.handleMutation('widget-settings-updated', user?.id!, {
        widgetInstanceId: variables.widgetInstanceId,
        settings: variables.settings,
      });
    },
  });

  // Enhanced batch settings update
  const batchUpdateWidgetSettingsMutation = useMutation({
    mutationFn: async (updates: { widgetInstanceId: string; settings: WidgetSettings }[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      await batchOperationManager.batchUpdateWidgetSettings(user.id, updates);
    },
    onSuccess: () => {
      cacheManager.handleMutation('widget-settings-updated', user?.id!);
    },
  });

  const removeWidgetMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_widget_instances')
        .update({ is_active: false })
        .eq('id', instanceId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.userWidgetInstances(user?.id) 
      });
    },
  });

  return {
    // Queries
    widgetDefinitions: widgetDefinitionsQuery.data ?? [],
    userWidgetInstances: userWidgetInstancesQuery.data ?? [],
    userWidgetSettings: userWidgetSettingsQuery.data ?? [],
    userWidgetTags: userWidgetTagsQuery.data ?? [],
    
    // Loading states
    loading: userWidgetInstancesQuery.isLoading || 
             userWidgetSettingsQuery.isLoading || 
             userWidgetTagsQuery.isLoading,
    
    // Error states
    error: userWidgetInstancesQuery.error || 
           userWidgetSettingsQuery.error || 
           userWidgetTagsQuery.error,

    // Mutations
    addWidgetToTab: addWidgetMutation.mutate,
    updateWidgetSettings: updateWidgetSettingsMutation.mutate,
    batchUpdateWidgetSettings: batchUpdateWidgetSettingsMutation.mutate,
    removeWidgetFromTab: removeWidgetMutation.mutate,
    
    // Mutation states
    isAddingWidget: addWidgetMutation.isPending,
    isUpdatingSettings: updateWidgetSettingsMutation.isPending,
    isBatchUpdatingSettings: batchUpdateWidgetSettingsMutation.isPending,
    isRemovingWidget: removeWidgetMutation.isPending,

    // Cache management
    prefetchWidgetData: () => cacheManager.prefetchWidgetData(user?.id!),
    invalidateUserData: () => cacheManager.invalidateUserData(user?.id!),
    getCacheMetrics: () => cacheManager.getMetrics(),

    // Manual refresh
    refetchAll: () => {
      cacheManager.invalidateUserData(user?.id!);
    },
  };
};