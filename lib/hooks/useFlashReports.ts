import { adminApi, FlashReport, ReportStatus } from '@/lib/api/admin';
import { STALE_TIMES } from '@/lib/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type { FlashReport, ReportStatus };

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const flashReportKeys = {
  all: ['admin', 'flash-reports'] as const,
  list: (status: string, page: number, limit: number) =>
    ['admin', 'flash-reports', status, page, limit] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export function useFlashReports(params: { status: string; page: number; limit: number }) {
  return useQuery({
    queryKey: flashReportKeys.list(params.status, params.page, params.limit),
    queryFn: () => adminApi.getFlashReports(params),
    staleTime: STALE_TIMES.HOT,
    refetchOnMount: true,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useUpdateFlashReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      reportId: string;
      status: ReportStatus;
      resolution_notes?: string;
    }) => adminApi.updateFlashReport(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashReportKeys.all });
    },
  });
}

export function useBanUserFromFlashReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      // Refresh flash reports and users lists
      queryClient.invalidateQueries({ queryKey: flashReportKeys.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
