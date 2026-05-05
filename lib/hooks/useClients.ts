import { adminApi } from '@/lib/api/admin';
import { STALE_TIMES } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const clientKeys = {
  all: ['admin', 'clients'] as const,
  detail: (id: string | null) => ['admin', 'client-detail', id] as const,
};

/**
 * Fetches the full client/customer profile: identity, stats, purchase history,
 * credit ledger, active entitlements and consultation history.
 *
 * Used by ClientDetailModal — opened from the consultation listings when the
 * admin clicks on a customer's avatar/name.
 *
 * Returns null query when id is null so the modal can be conditionally
 * mounted without triggering an extra fetch.
 */
export function useClientDetail(id: string | null) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => adminApi.getClientDetail(id!),
    enabled: !!id,
    staleTime: STALE_TIMES.COLD,
  });
}
