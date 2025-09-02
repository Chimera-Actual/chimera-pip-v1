import React from 'react';
import { AudioPlayer } from '@/components/Applets/AudioPlayer';
import WidgetAdapter from '@/components/dashboard/WidgetAdapter';
import { BaseWidgetProps } from '@/types/widget';
import { Music } from 'lucide-react';

const AudioWidget: React.FC<BaseWidgetProps> = ({
  widgetInstanceId,
  settings = {},
  onSettingsChange,
  widgetName
}) => {
  return (
    <WidgetAdapter
      title="Audio Player"
      widgetInstanceId={widgetInstanceId}
      settings={settings}
      onSettingsChange={onSettingsChange}
      widgetName={widgetName}
      icon={<Music className="w-4 h-4" />}
    >
      <AudioPlayer
        widgetInstanceId={widgetInstanceId}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </WidgetAdapter>
  );
};

export default AudioWidget;