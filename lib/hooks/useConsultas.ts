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
  /**
   * Used to scope the storage upload bucket; defaults to 'pregunta-flash'
   * (the canonical services.slug for the global flash service — NOT to be
   * confused with the service_kind 'flash_1carta' which lives on
   * consultation_sessions.service_kind, not on services.slug).
   */
  serviceSlug?: string;
  reason?: string;
}

export function useOwnerAnswerFlashQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OwnerAnswerInput) => {
      // Step 1: takeover. After this, the question is 'claimed' by the owner
      // and is_manual_override=true; it's invisible to other readers and the
      // rotation cron skips it. Any failure from here on must be rolled back
      // via flashOwnerRelease, otherwise the question is stuck.
      const takeover = await adminApi.flashOwnerTakeover({
        questionId: input.questionId,
        reason: input.reason,
      });

      // Generate a stable idempotency key once per submission attempt so a
      // network retry of the answer step doesn't violate the UNIQUE
      // constraint on global_answers(question_id).
      const idempotencyKey = crypto.randomUUID();

      try {
        const storagePaths: string[] = [];
        if (input.imageFile) {
          const path = await adminApi.flashUploadAnswerMedia({
            file: input.imageFile,
            serviceSlug: input.serviceSlug ?? 'pregunta-flash',
          });
          storagePaths.push(path);
        }

        await adminApi.flashAnswerQuestion({
          sessionId: takeover.session_id,
          bodyText: input.bodyText,
          storagePaths,
          idempotencyKey,
        });

        return takeover;
      } catch (answerError) {
        // Best-effort rollback so the question goes back into rotation
        // instead of being stuck in 'claimed' with no answer. We don't
        // surface release errors — the user already saw the answer error
        // and adding a second error would be confusing.
        try {
          await adminApi.flashOwnerRelease({
            questionId: input.questionId,
            reason: 'answer_submission_failed',
          });
        } catch (releaseError) {
          // Log to console so the issue is at least visible in DevTools.
          // The question may now be stuck and require manual DB intervention.
          console.error(
            '[useOwnerAnswerFlashQuestion] Rollback failed after answer error',
            { answerError, releaseError, questionId: input.questionId },
          );
        }
        throw answerError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flash-questions'] });
    },
    onError: () => {
      // Refresh the list either way — the question may have been released
      // and is now back to 'open', or it may have been answered between the
      // takeover and the failure (rare but possible).
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
