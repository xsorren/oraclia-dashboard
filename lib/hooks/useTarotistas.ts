'use client';

import { adminApi } from '@/lib/api/admin';
import { STALE_TIMES } from '@/lib/constants';
import type { Currency } from '@/types/database';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Query key factory — keeps all tarotista cache keys consistent. */
export const tarotistaKeys = {
  all: ['admin', 'tarotistas'] as const,
  list: (params?: object) => [...tarotistaKeys.all, params] as const,
  detail: (id: string) => ['admin', 'tarotista-detail', id] as const,
};

export function useTarotistas(params?: {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: tarotistaKeys.list(params),
    queryFn: () => adminApi.getTarotistas({
      search: params?.search ?? '',
      status: params?.status ?? 'all',
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    }),
    staleTime: STALE_TIMES.NORMAL,
  });
}

export function useTarotistaDetail(id: string) {
  return useQuery({
    queryKey: tarotistaKeys.detail(id),
    queryFn: () => adminApi.getTarotistaDetail({ id }),
    enabled: !!id,
    staleTime: STALE_TIMES.NORMAL,
  });
}

export function useUpdateTarotistaStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { tarotistaId: string; status: 'active' | 'inactive' }) =>
      adminApi.updateTarotistaStatus(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: tarotistaKeys.all });
      queryClient.invalidateQueries({ queryKey: tarotistaKeys.detail(variables.tarotistaId) });
    },
  });
}

export function useUpdateTarotistaCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { tarotistaId: string; preferredCurrency: Currency }) =>
      adminApi.updateTarotistaCurrency(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: tarotistaKeys.all });
      queryClient.invalidateQueries({ queryKey: tarotistaKeys.detail(variables.tarotistaId) });
    },
  });
}

export function useProcessPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { readerId: string; currency: Currency }) =>
      adminApi.processPayout(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: tarotistaKeys.detail(variables.readerId) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-payouts'] });
    },
  });
}
