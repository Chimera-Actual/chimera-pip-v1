// Widget component registry
import { MapWidget } from '@/components/Applets/MapWidget';
import { WeatherWidget } from '@/components/Applets/WeatherWidget';
import { ClockWidget } from '@/components/Applets/ClockWidget';
import { UserInfoWidget } from '@/components/Applets/UserInfoWidget';
import { EmailWidget } from '@/components/Applets/EmailWidget';
import { CalendarWidget } from '@/components/Applets/CalendarWidget';

import { BrowserWidget } from '@/components/Applets/BrowserWidget';
import { SystemSettingsWidget } from '@/components/Applets/SystemSettingsWidget';
import { CustomAssistantWidget } from '@/components/Applets/CustomAssistantWidget';
import { TextDisplayWidget } from '@/components/Applets/TextDisplayWidget';
import { ImageDisplayWidget } from '@/components/Applets/ImageDisplayWidget';
import { AudioPlayer } from '@/components/Applets/AudioPlayer';


export const WIDGET_COMPONENTS = {
  MapWidget,
  WeatherWidget,
  ClockWidget,
  UserInfoWidget,
  EmailWidget,
  CalendarWidget,
  
  BrowserWidget,
  SystemSettingsWidget,
  CustomAssistantWidget,
  TextDisplayWidget,
  ImageDisplayWidget,
  AudioPlayerWidget: AudioPlayer,
} as const;

export type WidgetComponentName = keyof typeof WIDGET_COMPONENTS;