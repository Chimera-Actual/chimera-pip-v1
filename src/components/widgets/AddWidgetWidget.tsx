import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WidgetLibrary } from '@/components/Layout/WidgetLibrary';
import { useOptimizedWidgetManager } from '@/hooks/useOptimizedWidgetManager';
import WidgetAdapter from '@/components/dashboard/WidgetAdapter';
import { BaseWidgetProps } from '@/types/widget';
import { useDashboardTabs } from '@/hooks/useDashboardTabs';

const AddWidgetWidget: React.FC<BaseWidgetProps> = ({
  widgetInstanceId,
  widgetName,
  onCollapseChange
}) => {
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const { addWidgetToTab, availableWidgets, addTagToWidget, removeTagFromWidget, getAllUserTags } = useOptimizedWidgetManager();
  const { activeTabId } = useDashboardTabs();

  const handleAddWidget = async (widgetId: string) => {
    if (activeTabId) {
      await addWidgetToTab({ widgetId, tabId: activeTabId });
      setShowWidgetLibrary(false);
    }
  };

  return (
    <>
      <WidgetAdapter
        title="Add Widget"
        widgetInstanceId={widgetInstanceId}
        widgetName={widgetName}
        icon={<Plus className="w-4 h-4" />}
        onCollapseChange={onCollapseChange}
      >
        <div className="h-full flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Add New Widget</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Browse and add widgets to your dashboard
              </p>
              <Button
                onClick={() => setShowWidgetLibrary(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Browse Widgets
              </Button>
            </div>
          </div>
        </div>
      </WidgetAdapter>

      <WidgetLibrary
        isOpen={showWidgetLibrary}
        onClose={() => setShowWidgetLibrary(false)}
        availableWidgets={availableWidgets}
        onAddWidget={handleAddWidget}
        tabCategory="Dashboard"
        onAddTag={addTagToWidget}
        onRemoveTag={removeTagFromWidget}
        allUserTags={getAllUserTags()}
      />
    </>
  );
};

export default AddWidgetWidget;