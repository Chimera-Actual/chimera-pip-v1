
// Standardized widget component registry with lazy loading
import React, { Suspense } from 'react';
import { WidgetSkeleton } from '@/components/ui/widget-skeleton';

// All available widgets for the dashboard system
const BaseWidget = React.lazy(() => import('@/components/Applets/BaseWidget'));
const MapWidget = React.lazy(() => import('@/components/Applets/MapWidget'));

// Dashboard native widgets
const SampleClock = React.lazy(() => import('@/components/widgets/SampleClock'));
const SampleNote = React.lazy(() => import('@/components/widgets/SampleNote'));
const SampleChart = React.lazy(() => import('@/components/widgets/SampleChart'));
const AddWidgetWidget = React.lazy(() => import('@/components/widgets/AddWidgetWidget'));
const UndoWidget = React.lazy(() => import('@/components/widgets/UndoWidget'));
const DashboardSettingsWidget = React.lazy(() => import('@/components/widgets/DashboardSettingsWidget'));

// Applet adapters for dashboard
const AnalyticsWidget = React.lazy(() => import('@/components/widgets/AnalyticsWidget'));
const ChatWidget = React.lazy(() => import('@/components/widgets/ChatWidget'));
const AudioWidget = React.lazy(() => import('@/components/widgets/AudioWidget'));

// Create wrapped components with suspense and optimized skeletons
const createLazyWidget = (
  Component: React.LazyExoticComponent<React.ComponentType<any>>, 
  skeletonType: 'card' | 'minimal' | 'chart' | 'list' | 'media' = 'card'
) => {
  return React.memo((props: any) => (
    <Suspense fallback={<WidgetSkeleton type={skeletonType} />}>
      <Component {...props} />
    </Suspense>
  ));
};

export const WIDGET_COMPONENTS = {
  // Core widgets
  BaseWidget: createLazyWidget(BaseWidget, 'card'),
  MapWidget: createLazyWidget(MapWidget, 'card'),
  
  // Dashboard native widgets
  SampleClock: createLazyWidget(SampleClock, 'minimal'),
  SampleNote: createLazyWidget(SampleNote, 'card'),
  SampleChart: createLazyWidget(SampleChart, 'chart'),
  AddWidgetWidget: createLazyWidget(AddWidgetWidget, 'minimal'),
  UndoWidget: createLazyWidget(UndoWidget, 'minimal'),
  DashboardSettingsWidget: createLazyWidget(DashboardSettingsWidget, 'card'),
  
  // Applet widgets
  AnalyticsWidget: createLazyWidget(AnalyticsWidget, 'chart'),
  ChatWidget: createLazyWidget(ChatWidget, 'list'),
  AudioWidget: createLazyWidget(AudioWidget, 'media'),
} as const;

export type WidgetComponentName = keyof typeof WIDGET_COMPONENTS;
