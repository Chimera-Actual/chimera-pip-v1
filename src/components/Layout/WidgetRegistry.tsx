
// Standardized widget component registry with lazy loading
import React, { Suspense } from 'react';
import { WidgetSkeleton } from '@/components/ui/widget-skeleton';

// Base widget - the only widget in the standardized system
const BaseWidget = React.lazy(() => import('@/components/Applets/BaseWidget'));

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
  BaseWidget: createLazyWidget(BaseWidget, 'card'),
} as const;

export type WidgetComponentName = keyof typeof WIDGET_COMPONENTS;
