// Keyboard Shortcuts for Dashboard Operations
import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAuth } from './useAuth';

export const useKeyboardShortcuts = () => {
  const { user } = useAuth();
  const { 
    undo, 
    redo, 
    createLayout, 
    selectedWidget, 
    removeWidget,
    toggleWidgetCollapse,
    selectWidget 
  } = useDashboardStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for modifier keys
      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const isAlt = event.altKey;

      // Prevent shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Handle keyboard shortcuts
      switch (event.key) {
        // Undo/Redo
        case 'z':
          if (isCtrl && !isShift) {
            event.preventDefault();
            undo();
          } else if (isCtrl && isShift) {
            event.preventDefault();
            redo();
          }
          break;

        case 'y':
          if (isCtrl) {
            event.preventDefault();
            redo();
          }
          break;

        // New Layout
        case 'n':
          if (isCtrl && isShift) {
            event.preventDefault();
            if (user?.id) {
              const name = prompt('Enter layout name:');
              if (name) {
                createLayout(name, user.id);
              }
            }
          }
          break;

        // Delete selected widget
        case 'Delete':
        case 'Backspace':
          if (selectedWidget && !isCtrl && !isShift && !isAlt) {
            event.preventDefault();
            removeWidget(selectedWidget);
            selectWidget(null);
          }
          break;

        // Toggle collapse of selected widget
        case ' ':
          if (selectedWidget && !isCtrl && !isShift && !isAlt) {
            event.preventDefault();
            toggleWidgetCollapse(selectedWidget);
          }
          break;

        // Deselect widget
        case 'Escape':
          if (selectedWidget) {
            event.preventDefault();
            selectWidget(null);
          }
          break;

        // Save (manual trigger for auto-save)
        case 's':
          if (isCtrl) {
            event.preventDefault();
            // Auto-save is already handled, just show feedback
            console.log('Dashboard auto-saved');
          }
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, createLayout, selectedWidget, removeWidget, toggleWidgetCollapse, selectWidget, user?.id]);

  // Return available shortcuts for UI display
  return {
    shortcuts: [
      { key: 'Ctrl+Z', description: 'Undo' },
      { key: 'Ctrl+Shift+Z', description: 'Redo' },
      { key: 'Ctrl+Y', description: 'Redo' },
      { key: 'Ctrl+Shift+N', description: 'New Layout' },
      { key: 'Delete', description: 'Remove Selected Widget' },
      { key: 'Space', description: 'Toggle Widget Collapse' },
      { key: 'Escape', description: 'Deselect Widget' },
      { key: 'Ctrl+S', description: 'Save (Auto-saved)' },
    ],
  };
};