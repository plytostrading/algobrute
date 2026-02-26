'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session — stable across renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 30 seconds before a background refetch
            staleTime: 30_000,
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60_000,
            // Retry failed requests once before surfacing an error
            retry: 1,
            // Don't refetch when the user alt-tabs back — trading data is pulled on interval
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

