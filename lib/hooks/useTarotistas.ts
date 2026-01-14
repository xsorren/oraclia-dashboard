'use client';

import { adminApi } from '@/lib/api/admin';
import { useQuery } from '@tanstack/react-query';

export function useTarotistas(params?: {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'tarotistas', params],
    queryFn: () => adminApi.getTarotistas({
      search: params?.search ?? '',
      status: params?.status ?? 'all',
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
