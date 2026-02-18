'use client';

import { adminApi } from '@/lib/api/admin';
import { STALE_TIMES } from '@/lib/constants';
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
    staleTime: STALE_TIMES.HOT,
  });
}
