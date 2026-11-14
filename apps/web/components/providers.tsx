'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AccessibilityAnnouncer } from '@/components/AccessibilityAnnouncer';

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,          // 1 minute before refetch
        gcTime: 5 * 60_000,         // 5 minutes garbage collection
        refetchOnWindowFocus: false,  // avoid unnecessary refetches
        refetchOnReconnect: true,    // refetch on network reconnect
        retry: 2,                    // retry failed requests twice
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      },
      mutations: {
        retry: 1,
      },
    },
  }));
  return (
    <QueryClientProvider client={qc}>
      <AccessibilityAnnouncer />
      {children}
    </QueryClientProvider>
  );
}
