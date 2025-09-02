import React, { useEffect, useState, useMemo, useCallback } from "react";
import { FileText, Save } from "lucide-react";
import WidgetFrame from "@/components/dashboard/WidgetFrame";
import WidgetSettingsModal from "@/components/dashboard/WidgetSettingsModal";
import { motion } from "framer-motion";
import { BaseWidgetProps } from "@/types/widget";
import { logger } from '@/lib/logger';

export default React.memo(function SampleNote({ 
  widgetInstanceId, 
  settings: externalSettings, 
  onSettingsChange,
  widgetName,
  title = "Notes Terminal",
  onCollapseChange
}: BaseWidgetProps) {
  // Memoize storage keys to prevent recreation
  const noteStorageKey = useMemo(() => `widget-${widgetInstanceId}-note`, [widgetInstanceId]);
  const settingsStorageKey = useMemo(() => `widget-${widgetInstanceId}-settings`, [widgetInstanceId]);
  
  // Memoize default settings to prevent recreation on each render
  const defaultSettings = useMemo(() => ({
    name: title || "Notes Terminal",
    autoRefresh: true,
    refreshRate: 1,
    opacity: 100,
    theme: 'default' as 'default' | 'accent' | 'muted',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    showBorder: true,
    showWordCount: true,
    autoSave: true,
    saveDelay: 1000
  }), [title]);

  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(noteStorageKey) || "Enter your notes here...\n\nThis is a persistent notepad widget.";
    } catch {
      return "Enter your notes here...\n\nThis is a persistent notepad widget.";
    }
  });
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Load settings from external props or localStorage with instance-specific key  
  const [settings, setSettings] = useState(() => {
    if (externalSettings) return { ...defaultSettings, ...externalSettings };
    
    try {
      const saved = localStorage.getItem(settingsStorageKey);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Memoized save functions to prevent unnecessary re-renders
  const saveSettings = useCallback((newSettings: typeof defaultSettings) => {
    try {
      localStorage.setItem(settingsStorageKey, JSON.stringify(newSettings)); 
      onSettingsChange?.(newSettings);
    } catch (error) {
      logger.warn('Failed to save widget settings', error, 'SampleNote');
    }
  }, [settingsStorageKey, onSettingsChange]);

  const saveNote = useCallback((noteValue: string) => {
    try {
      localStorage.setItem(noteStorageKey, noteValue);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      logger.warn('Failed to save note', error, 'SampleNote');
    }
  }, [noteStorageKey]);

  // Save settings to localStorage when they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings, saveSettings]);

  useEffect(() => {
    if (!settings.autoSave) return;
    
    const timeoutId = setTimeout(() => {
      saveNote(value);
    }, settings.saveDelay);

    return () => clearTimeout(timeoutId);
  }, [value, settings.autoSave, settings.saveDelay, saveNote]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setHasUnsavedChanges(true);
  };

  const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = value.length;

  const getFontSizeClass = () => {
    if (settings.fontSize === 'small') return 'text-xs';
    if (settings.fontSize === 'large') return 'text-base';
    return 'text-sm';
  };

  const getThemeClass = () => {
    if (settings.theme === 'accent') return 'crt-accent';
    if (settings.theme === 'muted') return 'crt-muted';
    return 'crt-text';
  };

  return (
    <>
      <WidgetFrame 
        title={settings.name}
        onSettings={() => setIsSettingsOpen(true)}
        className={!settings.showBorder ? 'border-none' : ''}
        style={{ opacity: settings.opacity / 100 }}
        widgetInstanceId={widgetInstanceId}
        onCollapseChange={onCollapseChange}
        right={
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges ? (
              <motion.div 
                className="flex items-center space-x-1 text-xs crt-accent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                <span>SAVING...</span>
              </motion.div>
            ) : lastSaved && (
              <motion.div 
                className="flex items-center space-x-1 text-xs crt-muted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Save className="w-3 h-3" />
                <span>SAVED</span>
              </motion.div>
            )}
            <FileText className="w-4 h-4 crt-accent" />
          </div>
        }
      >
        <div className="flex flex-col h-full space-y-2">
          <textarea
            className={`flex-1 w-full bg-transparent crt-input rounded p-3 resize-none font-mono ${getFontSizeClass()} ${getThemeClass()} leading-relaxed focus:ring-2 focus:ring-[var(--crt-border)]/50 placeholder-crt-muted`}
            value={value}
            onChange={handleChange}
            placeholder="Enter your notes here..."
          />
          
          <div className="flex justify-between items-center text-xs crt-muted font-mono border-t crt-border pt-2">
            {settings.showWordCount && (
              <div className="flex space-x-4">
                <span>{charCount} chars</span>
                <span>{wordCount} words</span>
              </div>
            )}
            {lastSaved && (
              <span>
                Last saved: {lastSaved.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
          </div>
        </div>
      </WidgetFrame>

      <WidgetSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={setSettings}
        onReset={() => setSettings(defaultSettings)}
        widgetType="SampleNote"
        currentSettings={settings}
        widgetName="Notes Terminal"
      />
    </>
  );
}); // End of React.memo