import { adminApi } from '@/lib/api/admin';
import { STALE_TIMES } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';

export function useConfiguration() {
  return useQuery({
    queryKey: ['admin', 'configuration'],
    queryFn: () => adminApi.getConfiguration(),
    staleTime: STALE_TIMES.COLD,
  });
}
