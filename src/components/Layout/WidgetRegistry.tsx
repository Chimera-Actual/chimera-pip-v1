
// Standardized widget component registry with lazy loading
import React, { Suspense } from 'react';
import { WidgetSkeleton } from '@/components/ui/widget-skeleton';

// Dashboard native widgets - keeping only essential system widgets
const SampleClock = React.lazy(() => import('@/components/widgets/SampleClock'));
const SampleNote = React.lazy(() => import('@/components/widgets/SampleNote'));
const SampleChart = React.lazy(() => import('@/components/widgets/SampleChart'));

// Dashboard widgets
const AddWidgetWidget = React.lazy(() => import('@/components/widgets/AddWidgetWidget'));
const DashboardSettingsWidget = React.lazy(() => import('@/components/widgets/DashboardSettingsWidget'));

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
  // Essential system widgets only
  SampleClock: createLazyWidget(SampleClock, 'minimal'),
  SampleNote: createLazyWidget(SampleNote, 'card'),
  SampleChart: createLazyWidget(SampleChart, 'chart'),
  
  // Dashboard widgets
  AddWidgetWidget: createLazyWidget(AddWidgetWidget, 'card'),
  DashboardSettingsWidget: createLazyWidget(DashboardSettingsWidget, 'card'),
} as const;

export type WidgetComponentName = keyof typeof WIDGET_COMPONENTS;
