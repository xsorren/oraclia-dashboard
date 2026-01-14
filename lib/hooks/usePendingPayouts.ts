'use client';

import { adminApi } from '@/lib/api/admin';
import { Currency } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

export function usePendingPayouts(params?: {
  currency?: Currency;
}) {
  return useQuery({
    queryKey: ['admin', 'pending-payouts', params?.currency],
    queryFn: () => adminApi.getPendingPayouts({
      currency: params?.currency ?? 'USD',
    }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
