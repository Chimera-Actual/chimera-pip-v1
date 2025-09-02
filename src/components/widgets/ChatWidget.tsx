import React from 'react';
import { AssistantChat } from '@/components/Applets/AssistantChat';
import WidgetAdapter from '@/components/dashboard/WidgetAdapter';
import { BaseWidgetProps } from '@/types/widget';
import { MessageSquare } from 'lucide-react';

const ChatWidget: React.FC<BaseWidgetProps> = ({
  widgetInstanceId,
  settings = {},
  onSettingsChange,
  widgetName
}) => {
  return (
    <WidgetAdapter
      title="Assistant Chat"
      widgetInstanceId={widgetInstanceId}
      settings={settings}
      onSettingsChange={onSettingsChange}
      widgetName={widgetName}
      icon={<MessageSquare className="w-4 h-4" />}
    >
      <AssistantChat />
    </WidgetAdapter>
  );
};

export default ChatWidget;