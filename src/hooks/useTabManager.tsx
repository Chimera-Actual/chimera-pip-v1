import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

import { cleanupTabFiles } from '@/lib/widgetCleanup';

export interface UserTab {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  position: number;
  is_active: boolean;
  font_size: string;
}

const DEFAULT_TABS = [
  { name: 'STATUS', icon: '◉', position: 0, font_size: 'text-sm' },
  { name: 'APPS', icon: '◈', position: 1, font_size: 'text-sm' },
  { name: 'SETTINGS', icon: '⚙', position: 2, font_size: 'text-sm' },
];

export const useTabManager = () => {
  const [userTabs, setUserTabs] = useState<UserTab[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTabs();
    } else {
      setUserTabs([]);
      setLoading(false);
    }
  }, [user]);

  const loadTabs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: tabs, error } = await supabase
        .from('user_tabs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) throw error;

      // If no tabs exist, create default tabs
      if (!tabs || tabs.length === 0) {
        await createDefaultTabs();
        return;
      }

      setUserTabs(tabs);
    } catch (error) {
      console.error('Error loading tabs:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTabs = async () => {
    if (!user) return;

    try {
      const tabsToCreate = DEFAULT_TABS.map(tab => ({
        user_id: user.id,
        name: tab.name,
        icon: tab.icon,
        position: tab.position,
        font_size: tab.font_size,
        is_active: true,
      }));

      const { data, error } = await supabase
        .from('user_tabs')
        .insert(tabsToCreate)
        .select();

      if (error) throw error;
      if (data) {
        setUserTabs(data);
      }
    } catch (error) {
      console.error('Error creating default tabs:', error);
    }
  };

  const createTab = async (name: string, icon: string = '◉', fontSize: string = 'text-sm') => {
    if (!user) return null;

    try {
      const maxPosition = Math.max(...userTabs.map(t => t.position), -1);
      
      const { data, error } = await supabase
        .from('user_tabs')
        .insert({
          user_id: user.id,
          name: name.toUpperCase(),
          icon: icon,
          position: maxPosition + 1,
          font_size: fontSize,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setUserTabs(prev => [...prev, data]);
        return data;
      }
    } catch (error) {
      console.error('Error creating tab:', error);
      throw error;
    }
    return null;
  };

  const updateTab = async (tabId: string, updates: Partial<Pick<UserTab, 'name' | 'icon' | 'font_size'>>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_tabs')
        .update(updates)
        .eq('id', tabId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setUserTabs(prev => prev.map(tab => 
          tab.id === tabId ? { ...tab, ...data } : tab
        ));
        return data;
      }
    } catch (error) {
      console.error('Error updating tab:', error);
      throw error;
    }
  };

  const deleteTab = async (tabId: string) => {
    if (!user) return;

    try {
      // First, cleanup all files associated with widgets in this tab
      await cleanupTabFiles(tabId);

      // Then, remove all widgets from this tab
      await supabase
        .from('user_widget_instances')
        .update({ is_active: false })
        .eq('tab_id', tabId)
        .eq('user_id', user.id);

      // Finally, soft delete the tab
      const { error } = await supabase
        .from('user_tabs')
        .update({ is_active: false })
        .eq('id', tabId)
        .eq('user_id', user.id);

      if (error) throw error;

      setUserTabs(prev => prev.filter(tab => tab.id !== tabId));
    } catch (error) {
      console.error('Error deleting tab:', error);
      throw error;
    }
  };

  const reorderTabs = async (tabIds: string[]) => {
    if (!user) return;

    try {
      const updates = tabIds.map((tabId, index) => ({
        id: tabId,
        position: index,
      }));

      for (const update of updates) {
        await supabase
          .from('user_tabs')
          .update({ position: update.position })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }

      // Reload tabs to get updated positions
      await loadTabs();
    } catch (error) {
      console.error('Error reordering tabs:', error);
      throw error;
    }
  };

  const canDeleteTab = (tabId: string): boolean => {
    // Don't allow deletion if it's the last tab
    return userTabs.length > 1;
  };

  return {
    userTabs,
    loading,
    createTab,
    updateTab,
    deleteTab,
    reorderTabs,
    canDeleteTab,
    refreshTabs: loadTabs,
  };
};