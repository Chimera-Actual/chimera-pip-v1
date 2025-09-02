import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useWidgetManager } from './useWidgetManager';
import { useAuth } from './useAuth';
import type { UserWidgetInstance, WidgetSettings } from '@/types/widget';

export const useOptimizedWidgetManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const widgetManager = useWidgetManager();

  // Memoized widget data query with optimized caching
  const widgetDataQuery = useQuery({
    queryKey: ['widget-data', user?.id],
    queryFn: widgetManager.refreshData,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Optimized mutations with intelligent cache updates
  const addWidgetMutation = useMutation({
    mutationFn: useCallback(async ({ widgetId, tabId }: { widgetId: string; tabId: string }) => {
      return widgetManager.addWidgetToTab(widgetId, tabId);
    }, [widgetManager]),
    onMutate: async ({ widgetId, tabId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['widget-data', user?.id] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['widget-data', user?.id]);

      // Optimistically update to the new value - we'll add the widget to UI immediately
      // The actual server response will replace this optimistic update

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['widget-data', user?.id], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['widget-data', user?.id] });
    },
  });

  const removeWidgetMutation = useMutation({
    mutationFn: useCallback(async (instanceId: string) => {
      return widgetManager.removeWidgetFromTab(instanceId);
    }, [widgetManager]),
    onMutate: async (instanceId) => {
      await queryClient.cancelQueries({ queryKey: ['widget-data', user?.id] });
      const previousData = queryClient.getQueryData(['widget-data', user?.id]);

      // Optimistically remove widget from UI
      queryClient.setQueryData(['widget-data', user?.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          userWidgetInstances: old.userWidgetInstances?.map((widget: UserWidgetInstance) =>
            widget.id === instanceId ? { ...widget, is_active: false } : widget
          )
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['widget-data', user?.id], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-data', user?.id] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: useCallback(async ({ instanceId, settings }: { instanceId: string; settings: WidgetSettings }) => {
      return widgetManager.updateWidgetSettings(instanceId, settings);
    }, [widgetManager]),
    onMutate: async ({ instanceId, settings }) => {
      await queryClient.cancelQueries({ queryKey: ['widget-data', user?.id] });
      const previousData = queryClient.getQueryData(['widget-data', user?.id]);

      // Optimistically update settings
      queryClient.setQueryData(['widget-data', user?.id], (old: any) => {
        if (!old) return old;
        
        const existingSettingIndex = old.userWidgetSettings?.findIndex(
          (s: any) => s.widget_instance_id === instanceId
        );

        let newSettings = [...(old.userWidgetSettings || [])];
        
        if (existingSettingIndex >= 0) {
          newSettings[existingSettingIndex] = {
            ...newSettings[existingSettingIndex],
            settings
          };
        } else {
          newSettings.push({
            id: 'temp-' + instanceId,
            user_id: user?.id,
            widget_instance_id: instanceId,
            settings
          });
        }

        return {
          ...old,
          userWidgetSettings: newSettings
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['widget-data', user?.id], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-data', user?.id] });
    },
  });

  // Memoized getters to prevent unnecessary re-renders
  const getActiveWidgetsForTab = useCallback((tabId: string): UserWidgetInstance[] => {
    return widgetManager.getActiveWidgetsForTab(tabId);
  }, [widgetManager]);

  const getWidgetSettings = useCallback((widgetInstanceId: string): WidgetSettings => {
    return widgetManager.getWidgetSettings(widgetInstanceId);
  }, [widgetManager]);

  // Memoized computed values
  const computedData = useMemo(() => ({
    availableWidgets: widgetManager.availableWidgets,
    userWidgetInstances: widgetManager.userWidgetInstances,
    userWidgetSettings: widgetManager.userWidgetSettings,
    userWidgetTags: widgetManager.userWidgetTags,
  }), [
    widgetManager.availableWidgets,
    widgetManager.userWidgetInstances,
    widgetManager.userWidgetSettings,
    widgetManager.userWidgetTags
  ]);

  return {
    // Data
    ...computedData,
    
    // Query states
    loading: widgetManager.loading || widgetDataQuery.isLoading,
    error: widgetDataQuery.error,
    
    // Optimized operations with loading states
    addWidgetToTab: addWidgetMutation.mutate,
    removeWidgetFromTab: removeWidgetMutation.mutate,
    updateWidgetSettings: updateSettingsMutation.mutate,
    
    // Loading states for UI feedback
    isAddingWidget: addWidgetMutation.isPending,
    isRemovingWidget: removeWidgetMutation.isPending,
    isUpdatingSettings: updateSettingsMutation.isPending,
    
    // Memoized getters
    getActiveWidgetsForTab,
    getWidgetSettings,
    
    // Other operations (wrapped in useCallback for stability)
    updateWidgetName: useCallback((instanceId: string, name: string) => 
      widgetManager.updateWidgetName(instanceId, name), [widgetManager]),
    
    updateWidgetPosition: useCallback((instanceId: string, position: number) => 
      widgetManager.updateWidgetPosition(instanceId, position), [widgetManager]),
    
    moveWidgetToTab: useCallback((instanceId: string, tabId: string) => 
      widgetManager.moveWidgetToTab(instanceId, tabId), [widgetManager]),
    
    addTagToWidget: useCallback((widgetId: string, tag: string) => 
      widgetManager.addTagToWidget(widgetId, tag), [widgetManager]),
    
    removeTagFromWidget: useCallback((widgetId: string, tag: string) => 
      widgetManager.removeTagFromWidget(widgetId, tag), [widgetManager]),
    
    getAllUserTags: useCallback(() => 
      widgetManager.getAllUserTags(), [widgetManager]),
    
    getAvailableWidgetsForTab: useCallback((tabId: string) => 
      widgetManager.getAvailableWidgetsForTab(tabId), [widgetManager]),
    
    // Manual refresh with optimized invalidation
    refreshData: useCallback(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['widget-data', user?.id],
        refetchType: 'active' 
      });
    }, [queryClient, user?.id]),
  };
};
