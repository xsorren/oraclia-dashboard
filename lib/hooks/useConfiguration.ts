import { adminApi } from '@/lib/api/admin';
import { useQuery } from '@tanstack/react-query';

export function useConfiguration() {
    return useQuery({
        queryKey: ['admin', 'configuration'],
        queryFn: () => adminApi.getConfiguration(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
