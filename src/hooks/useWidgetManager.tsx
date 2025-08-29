import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WidgetDefinition {
  id: string;
  name: string;
  description?: string;
  icon: string;
  category: string;
  component_name: string;
  default_settings?: Record<string, any>;
}

export interface UserWidgetInstance {
  id: string;
  user_id: string;
  widget_id: string;
  tab_id: string;
  position: number;
  is_active: boolean;
  custom_name?: string;
  widget_definition?: WidgetDefinition;
}

export interface UserWidgetSettings {
  id: string;
  user_id: string;
  widget_instance_id: string;
  settings: Record<string, any>;
}

import { cleanupWidgetFiles } from '@/lib/widgetCleanup';

export const useWidgetManager = () => {
  const [availableWidgets, setAvailableWidgets] = useState<WidgetDefinition[]>([]);
  const [userWidgetInstances, setUserWidgetInstances] = useState<UserWidgetInstance[]>([]);
  const [userWidgetSettings, setUserWidgetSettings] = useState<UserWidgetSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadWidgetData();
    } else {
      setUserWidgetInstances([]);
      setUserWidgetSettings([]);
      setLoading(false);
    }
  }, [user]);

  const loadWidgetData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load available widgets
      const { data: widgets, error: widgetsError } = await supabase
        .from('widget_definitions')
        .select('*')
        .order('category', { ascending: true });

      if (widgetsError) throw widgetsError;
      setAvailableWidgets((widgets || []).map(w => ({
        ...w,
        default_settings: (w.default_settings as Record<string, any>) || {}
      })));

      // Load user widget instances
      const { data: instances, error: instancesError } = await supabase
        .from('user_widget_instances')
        .select(`
          *,
          widget_definition:widget_definitions(*)
        `)
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (instancesError) throw instancesError;
      setUserWidgetInstances((instances || []).map(i => ({
        ...i,
        widget_definition: i.widget_definition ? {
          ...i.widget_definition,
          default_settings: (i.widget_definition.default_settings as Record<string, any>) || {}
        } : undefined
      })));

      // Load user widget settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_widget_settings')
        .select('*')
        .eq('user_id', user.id);

      if (settingsError) throw settingsError;
      setUserWidgetSettings((settings || []).map(s => ({
        ...s,
        settings: (s.settings as Record<string, any>) || {}
      })));

    } catch (error) {
      console.error('Error loading widget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWidgetToTab = async (widgetId: string, tabId: string) => {
    if (!user) return;

    try {
      // First check if there's already an active widget instance of this type in this tab
      const existingWidget = userWidgetInstances.find(
        w => w.widget_id === widgetId && w.tab_id === tabId && w.is_active
      );

      if (existingWidget) {
        // Widget already exists and is active, no need to create a new one
        return existingWidget;
      }

      // Check if there's an inactive widget instance we can reactivate
      const inactiveWidget = userWidgetInstances.find(
        w => w.widget_id === widgetId && w.tab_id === tabId && !w.is_active
      );

      if (inactiveWidget) {
        // Reactivate the existing widget instance
        const { data, error } = await supabase
          .from('user_widget_instances')
          .update({ is_active: true })
          .eq('id', inactiveWidget.id)
          .eq('user_id', user.id)
          .select(`
            *,
            widget_definition:widget_definitions(*)
          `)
          .single();

        if (error) throw error;
        
        if (data) {
          const transformedData = {
            ...data,
            widget_definition: data.widget_definition ? {
              ...data.widget_definition,
              default_settings: (data.widget_definition.default_settings as Record<string, any>) || {}
            } : undefined
          };
          setUserWidgetInstances(prev =>
            prev.map(w => w.id === inactiveWidget.id ? transformedData : w)
          );
          return transformedData;
        }
      }

      // No existing widget found, create a new one
      // Get the highest position in this tab
      const existingWidgets = userWidgetInstances.filter(
        w => w.tab_id === tabId && w.is_active
      );
      const maxPosition = Math.max(...existingWidgets.map(w => w.position), -1);

      const { data, error } = await supabase
        .from('user_widget_instances')
        .insert({
          user_id: user.id,
          widget_id: widgetId,
          tab_id: tabId,
          position: maxPosition + 1,
          is_active: true,
        })
        .select(`
          *,
          widget_definition:widget_definitions(*)
        `)
        .single();

      if (error) throw error;
      
      if (data) {
        const transformedData = {
          ...data,
          widget_definition: data.widget_definition ? {
            ...data.widget_definition,
            default_settings: (data.widget_definition.default_settings as Record<string, any>) || {}
          } : undefined
        };
        setUserWidgetInstances(prev => [...prev, transformedData]);
        return transformedData;
      }
      
      return data;
    } catch (error) {
      console.error('Error adding widget:', error);
      throw error;
    }
  };

  const removeWidgetFromTab = async (instanceId: string) => {
    if (!user) return;

    try {
      // First, cleanup associated files for this widget instance
      await cleanupWidgetFiles(instanceId);

      const { error } = await supabase
        .from('user_widget_instances')
        .update({ is_active: false })
        .eq('id', instanceId)
        .eq('user_id', user.id);

      if (error) throw error;

      setUserWidgetInstances(prev =>
        prev.map(w => w.id === instanceId ? { ...w, is_active: false } : w)
      );
    } catch (error) {
      console.error('Error removing widget:', error);
      throw error;
    }
  };

  const updateWidgetSettings = async (widgetInstanceId: string, settings: Record<string, any>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_widget_settings')
        .upsert({
          user_id: user.id,
          widget_instance_id: widgetInstanceId,
          settings: settings,
        }, {
          onConflict: 'user_id,widget_instance_id'
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const transformedData = {
          ...data,
          settings: (data.settings as Record<string, any>) || {}
        };
        setUserWidgetSettings(prev => {
          const filtered = prev.filter(s => s.widget_instance_id !== widgetInstanceId);
          return [...filtered, transformedData];
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error updating widget settings:', error);
      throw error;
    }
  };

  const getWidgetSettings = (widgetInstanceId: string): Record<string, any> => {
    const widgetSettings = userWidgetSettings.find(s => s.widget_instance_id === widgetInstanceId);
    const widgetInstance = userWidgetInstances.find(i => i.id === widgetInstanceId);
    const widgetDefinition = availableWidgets.find(w => w.id === widgetInstance?.widget_id);
    
    return {
      ...widgetDefinition?.default_settings,
      ...widgetSettings?.settings,
    };
  };

  const getActiveWidgetsForTab = (tabId: string): UserWidgetInstance[] => {
    return userWidgetInstances
      .filter(w => w.tab_id === tabId && w.is_active)
      .sort((a, b) => a.position - b.position);
  };

  const getAvailableWidgetsForTab = (tabId: string): WidgetDefinition[] => {
    // Allow any widget to be added to any tab - no restrictions
    // Each widget instance is separate even if it's the same widget type
    return availableWidgets;
  };

  const updateWidgetPosition = async (instanceId: string, newPosition: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_widget_instances')
        .update({ position: newPosition })
        .eq('id', instanceId)
        .eq('user_id', user.id);

      if (error) throw error;

      setUserWidgetInstances(prev =>
        prev.map(w => w.id === instanceId ? { ...w, position: newPosition } : w)
      );
    } catch (error) {
      console.error('Error updating widget position:', error);
      throw error;
    }
  };

  const updateWidgetName = async (instanceId: string, customName: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_widget_instances')
        .update({ custom_name: customName })
        .eq('id', instanceId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setUserWidgetInstances(prev =>
          prev.map(w => w.id === instanceId ? { ...w, custom_name: customName } : w)
        );
      }

      return data;
    } catch (error) {
      console.error('Error updating widget name:', error);
      throw error;
    }
  };

  const moveWidgetToTab = async (instanceId: string, newTabId: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_widget_instances')
        .update({ tab_id: newTabId })
        .eq('id', instanceId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setUserWidgetInstances(prev => 
        prev.map(instance => 
          instance.id === instanceId 
            ? { ...instance, tab_id: newTabId }
            : instance
        )
      );
    } catch (error) {
      console.error('Error moving widget to tab:', error);
      throw error;
    }
  };

  return {
    availableWidgets,
    userWidgetInstances,
    userWidgetSettings,
    loading,
    addWidgetToTab,
    removeWidgetFromTab,
    updateWidgetSettings,
    getWidgetSettings,
    getActiveWidgetsForTab,
    getAvailableWidgetsForTab,
    updateWidgetPosition,
    updateWidgetName,
    moveWidgetToTab,
    refreshData: loadWidgetData,
  };
};