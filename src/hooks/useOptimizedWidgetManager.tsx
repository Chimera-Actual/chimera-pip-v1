import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWidgetManager } from './useWidgetManager';
import { useAuth } from './useAuth';

export const useOptimizedWidgetManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const widgetManager = useWidgetManager();

  // Cache widget data with React Query
  const widgetDataQuery = useQuery({
    queryKey: ['widget-data', user?.id],
    queryFn: widgetManager.refreshData,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Optimized mutations with cache updates
  const addWidgetMutation = useMutation({
    mutationFn: async ({ widgetId, tabId }: { widgetId: string; tabId: string }) => {
      return widgetManager.addWidgetToTab(widgetId, tabId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-data', user?.id] });
    },
  });

  const removeWidgetMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      return widgetManager.removeWidgetFromTab(instanceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-data', user?.id] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async ({ instanceId, settings }: { instanceId: string; settings: Record<string, any> }) => {
      return widgetManager.updateWidgetSettings(instanceId, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-data', user?.id] });
    },
  });

  return {
    // Data
    availableWidgets: widgetManager.availableWidgets,
    userWidgetInstances: widgetManager.userWidgetInstances,
    userWidgetSettings: widgetManager.userWidgetSettings,
    userWidgetTags: widgetManager.userWidgetTags,
    
    // Query states
    loading: widgetManager.loading || widgetDataQuery.isLoading,
    error: widgetDataQuery.error,
    
    // Optimized operations
    addWidgetToTab: addWidgetMutation.mutate,
    removeWidgetFromTab: removeWidgetMutation.mutate,
    updateWidgetSettings: updateSettingsMutation.mutate,
    
    // Read operations (no optimization needed)
    getWidgetSettings: widgetManager.getWidgetSettings,
    updateWidgetName: widgetManager.updateWidgetName,
    updateWidgetPosition: widgetManager.updateWidgetPosition,
    moveWidgetToTab: widgetManager.moveWidgetToTab,
    addTagToWidget: widgetManager.addTagToWidget,
    removeTagFromWidget: widgetManager.removeTagFromWidget,
    getAllUserTags: widgetManager.getAllUserTags,
    getActiveWidgetsForTab: widgetManager.getActiveWidgetsForTab,
    getAvailableWidgetsForTab: widgetManager.getAvailableWidgetsForTab,
    
    // Manual refresh
    refreshData: () => queryClient.invalidateQueries({ queryKey: ['widget-data', user?.id] }),
  };
};