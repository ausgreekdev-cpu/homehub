'use client';
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/Skeleton';

export function createLazyComponent(
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ReactNode,
) {
  const LazyComponent = lazy(importFn);
  return function WrappedLazyComponent(props: Record<string, unknown>) {
    return (
      <Suspense fallback={fallback || <Skeleton className="h-32 w-full" />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
