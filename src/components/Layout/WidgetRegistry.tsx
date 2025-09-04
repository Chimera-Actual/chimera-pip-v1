// Widget component registry with lazy loading
import React, { Suspense } from 'react';
import { WidgetSkeleton } from '@/components/ui/widget-skeleton';

// Lazy load widget components for better performance
const MapWidget = React.lazy(() => import('@/components/Applets/MapWidget'));
const WeatherWidget = React.lazy(() => import('@/components/Applets/WeatherWidget').then(m => ({ default: m.WeatherWidget })));
const ClockWidget = React.lazy(() => import('@/components/Applets/ClockWidget'));
const UserInfoWidget = React.lazy(() => import('@/components/Applets/UserInfoWidget').then(m => ({ default: m.UserInfoWidget })));
const EmailWidget = React.lazy(() => import('@/components/Applets/EmailWidget').then(m => ({ default: m.EmailWidget })));
const CalendarWidget = React.lazy(() => import('@/components/Applets/CalendarWidget').then(m => ({ default: m.CalendarWidget })));
const BrowserWidget = React.lazy(() => import('@/components/Applets/BrowserWidget').then(m => ({ default: m.BrowserWidget })));
const SystemSettingsWidget = React.lazy(() => import('@/components/Applets/SystemSettingsWidget').then(m => ({ default: m.SystemSettingsWidget })));
const CustomAssistantWidget = React.lazy(() => import('@/components/Applets/CustomAssistantWidget').then(m => ({ default: m.CustomAssistantWidget })));
const TextDisplayWidget = React.lazy(() => import('@/components/Applets/TextDisplayWidget').then(m => ({ default: m.TextDisplayWidget })));
const ImageDisplayWidget = React.lazy(() => import('@/components/Applets/ImageDisplayWidget').then(m => ({ default: m.ImageDisplayWidget })));
const AudioPlayer = React.lazy(() => import('@/components/Applets/AudioPlayer').then(m => ({ default: m.AudioPlayer })));
const VoiceAgentWidget = React.lazy(() => import('@/components/Applets/VoiceAgentWidget').then(m => ({ default: m.VoiceAgentWidget })));

// Missing widgets that need to be restored
const SampleClock = React.lazy(() => import('@/components/Applets/SampleClock'));
const SampleChart = React.lazy(() => import('@/components/Applets/SampleChart'));
const SampleNote = React.lazy(() => import('@/components/Applets/SampleNote'));
const DashboardSettingsWidget = React.lazy(() => import('@/components/Applets/DashboardSettingsWidget'));

// Create wrapped components with suspense and optimized skeletons
const createLazyWidget = (
  Component: React.LazyExoticComponent<React.ComponentType<any>>, 
  skeletonType: 'card' | 'minimal' | 'chart' | 'list' | 'media' = 'card'
) => {
  return React.memo((props: Record<string, any>) => (
    <Suspense fallback={<WidgetSkeleton type={skeletonType} />}>
      <Component {...props} />
    </Suspense>
  ));
};

export const WIDGET_COMPONENTS = {
  MapWidget: createLazyWidget(MapWidget, 'card'),
  WeatherWidget: createLazyWidget(WeatherWidget, 'chart'),
  ClockWidget: createLazyWidget(ClockWidget, 'minimal'),
  UserInfoWidget: createLazyWidget(UserInfoWidget, 'card'),
  EmailWidget: createLazyWidget(EmailWidget, 'list'),
  CalendarWidget: createLazyWidget(CalendarWidget, 'list'),
  BrowserWidget: createLazyWidget(BrowserWidget, 'card'),
  SystemSettingsWidget: createLazyWidget(SystemSettingsWidget, 'list'),
  CustomAssistantWidget: createLazyWidget(CustomAssistantWidget, 'card'),
  TextDisplayWidget: createLazyWidget(TextDisplayWidget, 'card'),
  ImageDisplayWidget: createLazyWidget(ImageDisplayWidget, 'media'),
  AudioPlayerWidget: createLazyWidget(AudioPlayer, 'media'),
  VoiceAgentWidget: createLazyWidget(VoiceAgentWidget, 'card'),
  // Restored missing widgets
  SampleClock: createLazyWidget(SampleClock, 'minimal'),
  SampleChart: createLazyWidget(SampleChart, 'chart'),
  SampleNote: createLazyWidget(SampleNote, 'card'),
  DashboardSettingsWidget: createLazyWidget(DashboardSettingsWidget, 'list'),
} as const;

export type WidgetComponentName = keyof typeof WIDGET_COMPONENTS;