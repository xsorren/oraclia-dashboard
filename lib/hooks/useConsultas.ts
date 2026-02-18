import { adminApi } from '@/lib/api/admin';
import { STALE_TIMES } from '@/lib/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const consultaKeys = {
  all: ['admin', 'consultas'] as const,
  flashQuestions: (page: number, search: string, status: string) =>
    ['admin', 'flash-questions', page, search, status] as const,
  privateConsultations: (
    page: number,
    search: string,
    status: string,
    serviceKind: string,
  ) => ['admin', 'private-consultations', page, search, status, serviceKind] as const,
  consultationDetail: (id: string | null) =>
    ['admin', 'consultation-detail', id] as const,
};

// ---------------------------------------------------------------------------
// Flash Questions
// ---------------------------------------------------------------------------
export function useFlashQuestions(params: {
  page: number;
  limit: number;
  search: string;
  status: string;
}) {
  return useQuery({
    queryKey: consultaKeys.flashQuestions(params.page, params.search, params.status),
    queryFn: () => adminApi.getFlashQuestions(params),
    staleTime: STALE_TIMES.NORMAL,
  });
}

export function useDeleteFlashQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteFlashQuestion({ questionId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flash-questions'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Private Consultations
// ---------------------------------------------------------------------------
export function usePrivateConsultations(params: {
  page: number;
  limit: number;
  search: string;
  status: string;
  serviceKind: string;
}) {
  return useQuery({
    queryKey: consultaKeys.privateConsultations(
      params.page,
      params.search,
      params.status,
      params.serviceKind,
    ),
    queryFn: () => adminApi.getPrivateConsultations(params),
    staleTime: STALE_TIMES.NORMAL,
  });
}

export function useConsultationDetail(id: string | null) {
  return useQuery({
    queryKey: consultaKeys.consultationDetail(id),
    queryFn: () => adminApi.getConsultationDetail(id!),
    enabled: !!id,
    staleTime: STALE_TIMES.COLD,
  });
}
