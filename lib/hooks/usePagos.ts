import { adminApi } from '@/lib/api/admin';
import { STALE_TIMES } from '@/lib/constants';
import type { Currency, PayoutStatus } from '@/types/database';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type PlatformFilter = 'all' | 'mercadopago' | 'paypal_usd' | 'paypal_eur';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const payoutKeys = {
  all: ['admin', 'payouts'] as const,
  monthly: (month: number, year: number, platform: PlatformFilter) =>
    ['admin', 'monthly-payouts', month, year, platform] as const,
  history: (page: number, limit: number, platform: PlatformFilter, readerId?: string | null) =>
    ['admin', 'payout-history', page, limit, platform, readerId ?? null] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export function useMonthlyPayouts({
  month,
  year,
  platform = 'all',
}: {
  month: number;
  year: number;
  platform?: PlatformFilter;
}) {
  return useQuery({
    queryKey: payoutKeys.monthly(month, year, platform),
    queryFn: () => adminApi.getMonthlyPayouts({ month, year, platform }),
    staleTime: STALE_TIMES.NORMAL,
  });
}

export function usePayoutHistory({
  page = 1,
  limit = 20,
  platform = 'all',
  readerId,
}: {
  page?: number;
  limit?: number;
  platform?: PlatformFilter;
  readerId?: string | null;
}) {
  return useQuery({
    queryKey: payoutKeys.history(page, limit, platform, readerId),
    queryFn: () =>
      adminApi.getPayoutHistory({
        page,
        limit,
        platform,
        readerId: readerId ?? undefined,
      }),
    staleTime: STALE_TIMES.COLD,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useProcessMonthlyPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { readerId: string; month: number; year: number; currency: Currency }) =>
      adminApi.processPayout(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'monthly-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-history'] });
    },
  });
}

export function useUpdatePayoutStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      payoutId: string;
      status: PayoutStatus;
      notes?: string;
      receiptUrl?: string;
    }) => adminApi.updatePayoutStatus(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'monthly-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-history'] });
    },
  });
}

export function useUploadReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { payoutId: string; file: File }) =>
      adminApi.uploadPayoutReceipt(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'monthly-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-history'] });
    },
  });
}
