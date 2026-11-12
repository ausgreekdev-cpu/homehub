'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AccessibilityAnnouncer } from '@/components/AccessibilityAnnouncer';

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={qc}>
      <AccessibilityAnnouncer />
      {children}
    </QueryClientProvider>
  );
}
