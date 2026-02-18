'use client';

import { ToastProvider } from '@/components/ui/Toast';
import { STALE_TIMES } from '@/lib/constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Per-hook staleTime takes precedence; this is the fallback for any
            // query that does not specify one.
            staleTime: STALE_TIMES.HOT,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
