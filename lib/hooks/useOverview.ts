'use client';

import { adminApi, OverviewData } from '@/lib/api/admin';
import { getCurrentMonth, getCurrentYear } from '@/lib/utils/dates';
import type { Currency } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

export function useOverview(params?: {
  month?: number;
  year?: number;
  currency?: Currency;
}) {
  return useQuery<OverviewData>({
    queryKey: ['admin', 'overview', params],
    queryFn: () => adminApi.getOverview({
      month: params?.month ?? getCurrentMonth(),
      year: params?.year ?? getCurrentYear(),
      currency: params?.currency ?? 'USD',
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: true,
  });
}
