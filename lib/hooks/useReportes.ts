import { adminApi, Report, ReportStatus } from '@/lib/api/admin';
import { STALE_TIMES } from '@/lib/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Re-export types that pages may need
export type { Report, ReportStatus };

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const reporteKeys = {
  all: ['admin', 'reports'] as const,
  list: (status: string | undefined, page: number, limit: number) =>
    ['admin', 'reports', status, page, limit] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export function useReports(params: { status?: 'all' | ReportStatus; page: number; limit: number }) {
  return useQuery({
    queryKey: reporteKeys.list(params.status, params.page, params.limit),
    queryFn: () => adminApi.getReports(params),
    // HOT: moderation data must stay reasonably fresh; mutations also invalidate
    staleTime: STALE_TIMES.HOT,
    refetchOnMount: true,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      reportId: string;
      status: ReportStatus;
      resolution_notes?: string;
    }) => adminApi.updateReportStatus(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
}
