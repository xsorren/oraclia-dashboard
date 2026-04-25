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

export function useResetFlashQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.resetFlashQuestion({ questionId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flash-questions'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Owner emergency takeover + answer
//
// Three-step flow wrapped in a single mutation so the modal can show a
// unified loading state. Order:
//   1. takeover — claims the question for the dashboard owner
//   2. (optional) media upload — single image via signed URL
//   3. answer   — body text + storage paths
// ---------------------------------------------------------------------------

interface OwnerAnswerInput {
  questionId: string;
  bodyText: string;
  /** Optional image attachment. The dashboard composer is single-image. */
  imageFile?: File | null;
  /** Used to scope the storage upload bucket; defaults to 'flash_1carta'. */
  serviceSlug?: string;
  reason?: string;
}

export function useOwnerAnswerFlashQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OwnerAnswerInput) => {
      const takeover = await adminApi.flashOwnerTakeover({
        questionId: input.questionId,
        reason: input.reason,
      });

      const storagePaths: string[] = [];
      if (input.imageFile) {
        const path = await adminApi.flashUploadAnswerMedia({
          file: input.imageFile,
          serviceSlug: input.serviceSlug ?? 'flash_1carta',
        });
        storagePaths.push(path);
      }

      await adminApi.flashAnswerQuestion({
        sessionId: takeover.session_id,
        bodyText: input.bodyText,
        storagePaths,
      });

      return takeover;
    },
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
