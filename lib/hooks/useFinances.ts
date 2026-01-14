'use client';

import { adminApi, FinancesData } from '@/lib/api/admin';
import { getCurrentMonth, getCurrentYear } from '@/lib/utils/dates';
import type { Currency } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

export function useFinances(params?: {
  month?: number;
  year?: number;
  currency?: Currency;
}) {
  return useQuery<FinancesData>({
    queryKey: ['admin', 'finances', params],
    queryFn: () => adminApi.getFinances({
      month: params?.month ?? getCurrentMonth(),
      year: params?.year ?? getCurrentYear(),
      currency: params?.currency,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch the consolidated finances summary (without currency filter)
 * Returns platform_summary with real payments grouped by MercadoPago/PayPal
 */
export function useFinancesSummary(params?: {
  month?: number;
  year?: number;
}) {
  return useQuery<FinancesData>({
    queryKey: ['admin', 'finances-summary', params],
    queryFn: () => adminApi.getFinances({
      month: params?.month ?? getCurrentMonth(),
      year: params?.year ?? getCurrentYear(),
      // No currency = get all platforms summary
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
