
// Standardized widget component registry with optimized lazy loading
import React, { Suspense } from 'react';
import { WidgetSkeleton } from '@/components/ui/widget-skeleton';
import { createLazyComponent, preloadComponent, getWidgetBundlePriority } from '@/lib/bundleSplitting';

// Core widgets with optimized loading
const SampleClock = createLazyComponent(() => import('@/components/widgets/SampleClock'), 'SampleClock');
const SampleNote = createLazyComponent(() => import('@/components/widgets/SampleNote'), 'SampleNote');
const SampleChart = createLazyComponent(() => import('@/components/widgets/SampleChart'), 'SampleChart');

// Dashboard widgets
const AddWidgetWidget = createLazyComponent(() => import('@/components/widgets/AddWidgetWidget'), 'AddWidgetWidget');
const DashboardSettingsWidget = createLazyComponent(() => import('@/components/widgets/DashboardSettingsWidget'), 'DashboardSettingsWidget');

// Preload high-priority widgets
if (typeof window !== 'undefined') {
  preloadComponent(() => import('@/components/widgets/SampleClock'), 'SampleClock');
  preloadComponent(() => import('@/components/widgets/SampleNote'), 'SampleNote');
}

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
  
  // Demo and development widgets (lowest priority)
  WidgetFactoryDemo: createLazyWidget(createLazyComponent(() => import('@/components/widgets/WidgetFactoryDemo'), 'WidgetFactoryDemo'), 'card'),
  ModernCSSDemo: createLazyWidget(createLazyComponent(() => import('@/components/demo/ModernCSSDemo'), 'ModernCSSDemo'), 'card'),
} as const;

export type WidgetComponentName = keyof typeof WIDGET_COMPONENTS;
