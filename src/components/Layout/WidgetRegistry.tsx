// Widget component registry
import { MapWidget } from '@/components/Applets/MapWidget';
import { WeatherWidget } from '@/components/Applets/WeatherWidget';
import { ClockWidget } from '@/components/Applets/ClockWidget';
import { UserInfoWidget } from '@/components/Applets/UserInfoWidget';
import { EmailWidget } from '@/components/Applets/EmailWidget';
import { CalendarWidget } from '@/components/Applets/CalendarWidget';
import { RadioWidget } from '@/components/Applets/RadioWidget';
import { BrowserWidget } from '@/components/Applets/BrowserWidget';
import { SystemSettingsWidget } from '@/components/Applets/SystemSettingsWidget';
import { ClaudeAssistantWidget } from '@/components/Applets/ClaudeAssistantWidget';
import { GPTAssistantWidget } from '@/components/Applets/GPTAssistantWidget';
import { VoiceAssistantWidget } from '@/components/Applets/VoiceAssistantWidget';
import { CustomAssistantWidget } from '@/components/Applets/CustomAssistantWidget';
import { TextDisplayWidget } from '@/components/Applets/TextDisplayWidget';
import { ImageDisplayWidget } from '@/components/Applets/ImageDisplayWidget';

export const WIDGET_COMPONENTS = {
  MapWidget,
  WeatherWidget,
  ClockWidget,
  UserInfoWidget,
  EmailWidget,
  CalendarWidget,
  RadioWidget,
  BrowserWidget,
  SystemSettingsWidget,
  ClaudeAssistantWidget,
  GPTAssistantWidget,
  VoiceAssistantWidget,
  CustomAssistantWidget,
  TextDisplayWidget,
  ImageDisplayWidget,
} as const;

export type WidgetComponentName = keyof typeof WIDGET_COMPONENTS;