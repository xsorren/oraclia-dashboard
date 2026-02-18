'use client';

import { adminApi } from '@/lib/api/admin';
import { STALE_TIMES } from '@/lib/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useUsers(params?: {
  search?: string;
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'banned';
}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.getUsers({
      search: params?.search ?? '',
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      status: params?.status ?? 'all',
    }),
    staleTime: STALE_TIMES.NORMAL,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
