import { adminApi } from '@/lib/api/admin';
import { STALE_TIMES } from '@/lib/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useConfiguration() {
  return useQuery({
    queryKey: ['admin', 'configuration'],
    queryFn: () => adminApi.getConfiguration(),
    staleTime: STALE_TIMES.COLD,
  });
}

export function useUpdateNetPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceKind, prices }: {
      serviceKind: string;
      prices: { price_ars: number; price_usd: number; price_eur: number };
    }) => adminApi.updateNetPrice(serviceKind, prices),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'configuration'] });
    },
  });
}

export function useUpdatePack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packId, prices }: {
      packId: string;
      prices: { price_ars: number; price_usd: number; price_eur: number };
    }) => adminApi.updatePack(packId, prices),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'configuration'] });
    },
  });
}

export function useUpdatePackStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packId, isActive }: { packId: string; isActive: boolean }) =>
      adminApi.updatePackStatus(packId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'configuration'] });
    },
  });
}

export function useUpdateServiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, isActive }: { serviceId: string; isActive: boolean }) =>
      adminApi.updateServiceStatus(serviceId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'configuration'] });
    },
  });
}
