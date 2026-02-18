'use client';

import { adminApi } from '@/lib/api/admin';
import { STALE_TIMES } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';

/** Poll the pending reports count for the sidebar badge. */
export function usePendingReportsCount() {
  return useQuery({
    queryKey: ['admin', 'pending-reports-count'],
    queryFn: () => adminApi.getPendingReportsCount(),
    staleTime: STALE_TIMES.COLD,
    // Background refetch every 2 minutes so the badge stays fresh
    refetchInterval: STALE_TIMES.NORMAL,
  });
}
