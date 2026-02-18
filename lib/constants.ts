export const ALLOWED_ADMIN_EMAIL = 'locutoramajo@hotmail.com';

/**
 * Centralized stale times (ms) for React Query.
 * Use these instead of inline magic numbers in hooks.
 */
export const STALE_TIMES = {
  /** Fast-moving data: pending payouts, reports count */
  HOT: 1 * 60 * 1000,
  /** Standard data: overviews, finances, tarotistas, users */
  NORMAL: 2 * 60 * 1000,
  /** Slow-moving data: configuration, service catalog */
  COLD: 5 * 60 * 1000,
} as const;

/**
 * Default pagination values shared across all list views.
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 10,
} as const;
