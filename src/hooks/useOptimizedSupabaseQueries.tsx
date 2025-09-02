import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { WidgetSettings } from '@/types/common';

// Optimized queries with proper joins to reduce round-trips
export const useOptimizedSupabaseQueries = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Single query to get all user dashboard data with joins
  const dashboardDataQuery = useQuery({
    queryKey: ['dashboard-data', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Single query with joins to get all related data
      const { data, error } = await supabase
        .from('user_tabs')
        .select(`
          *,
          user_widget_instances!user_widget_instances_tab_id_fkey (
            *,
            user_widget_settings!user_widget_settings_widget_instance_id_fkey (
              settings
            ),
            widget_instance_audio (
              *
            ),
            widget_instance_images (
              *
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('position');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Widget definitions query (cached globally)
  const widgetDefinitionsQuery = useQuery({
    queryKey: ['widget-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('widget_definitions')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // User settings query
  const userSettingsQuery = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Optimized mutations with cache updates
  const createTabMutation = useMutation({
    mutationFn: async ({ name, icon }: { name: string; icon: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_tabs')
        .insert([{
          user_id: user.id,
          name,
          icon,
          position: 0, // Will be handled by DB
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-data', user?.id] });
    },
  });

  const updateTabMutation = useMutation({
    mutationFn: async ({ tabId, updates }: { tabId: string; updates: Record<string, any> }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_tabs')
        .update(updates)
        .eq('id', tabId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-data', user?.id] });
    },
  });

  const addWidgetMutation = useMutation({
    mutationFn: async ({ widgetId, tabId }: { widgetId: string; tabId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_widget_instances')
        .insert([{
          user_id: user.id,
          widget_id: widgetId,
          tab_id: tabId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-data', user?.id] });
    },
  });

  const updateWidgetSettingsMutation = useMutation({
    mutationFn: async ({ 
      instanceId, 
      settings 
    }: { 
      instanceId: string; 
      settings: WidgetSettings 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Use upsert to handle both insert and update cases
      const { data, error } = await supabase
        .from('user_widget_settings')
        .upsert([{
          user_id: user.id,
          widget_instance_id: instanceId,
          settings: settings as any, // Cast to match Supabase Json type
        }], {
          onConflict: 'user_id,widget_instance_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ instanceId, settings }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['dashboard-data', user?.id] });
      
      const previousData = queryClient.getQueryData(['dashboard-data', user?.id]);
      
      // Update cache optimistically
      queryClient.setQueryData(['dashboard-data', user?.id], (old: any) => {
        if (!old) return old;
        
        return old.map((tab: any) => ({
          ...tab,
          user_widget_instances: tab.user_widget_instances?.map((instance: any) => 
            instance.id === instanceId 
              ? {
                  ...instance,
                  user_widget_settings: [{ settings }]
                }
              : instance
          )
        }));
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(['dashboard-data', user?.id], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-data', user?.id] });
    },
  });

  const removeWidgetMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_widget_instances')
        .delete()
        .eq('id', instanceId)
        .eq('user_id', user.id);

      if (error) throw error;
      return instanceId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-data', user?.id] });
    },
  });

  return {
    // Data queries
    dashboardData: dashboardDataQuery.data,
    widgetDefinitions: widgetDefinitionsQuery.data,
    userSettings: userSettingsQuery.data,
    
    // Loading states
    isDashboardLoading: dashboardDataQuery.isLoading,
    isWidgetDefinitionsLoading: widgetDefinitionsQuery.isLoading,
    isUserSettingsLoading: userSettingsQuery.isLoading,
    
    // Error states
    dashboardError: dashboardDataQuery.error,
    widgetDefinitionsError: widgetDefinitionsQuery.error,
    userSettingsError: userSettingsQuery.error,
    
    // Mutations
    createTab: createTabMutation.mutate,
    updateTab: updateTabMutation.mutate,
    addWidget: addWidgetMutation.mutate,
    updateWidgetSettings: updateWidgetSettingsMutation.mutate,
    removeWidget: removeWidgetMutation.mutate,
    
    // Mutation states
    isCreatingTab: createTabMutation.isPending,
    isUpdatingTab: updateTabMutation.isPending,
    isAddingWidget: addWidgetMutation.isPending,
    isUpdatingSettings: updateWidgetSettingsMutation.isPending,
    isRemovingWidget: removeWidgetMutation.isPending,
    
    // Manual refresh
    refreshDashboard: () => queryClient.invalidateQueries({ 
      queryKey: ['dashboard-data', user?.id] 
    }),
  };
};