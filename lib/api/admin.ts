import { createClient } from '@/lib/supabase/client';
import type { Currency, PayoutStatus } from '@/types/database';

const EDGE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL!;

// ─── Auth ────────────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('No hay sesión activa');
  return session.access_token;
}

// ─── Internal fetch helper ───────────────────────────────────────────────────

/**
 * Authenticated fetch wrapper for the admin-dashboard edge function.
 *
 * @param method      HTTP verb
 * @param path        URL path after EDGE_FUNCTIONS_URL
 * @param options.params     Query-string key/value pairs (undefined values are omitted)
 * @param options.body       Request body — will be JSON-serialized
 * @param options.unwrapData When true, returns `json.data`; default returns full JSON body
 * @param options.errorMessage  Fallback error message when the server body is empty
 */
async function adminFetch<T>(
  method: string,
  path: string,
  options: {
    params?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    unwrapData?: boolean;
    errorMessage?: string;
  } = {},
): Promise<T> {
  const token = await getAuthToken();

  const url = new URL(`${EDGE_FUNCTIONS_URL}/${path}`);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(options.body != null ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || options.errorMessage || 'Error en la solicitud');
  }

  const json = await response.json();
  return (options.unwrapData ? json.data : json) as T;
}

export interface OverviewData {
  month: number;
  year: number;
  currency: Currency;
  gross_revenue: number;
  tarotista_expenses: number;
  net_profit: number;
  profit_margin: number;
  consultations_count: number;
  top_tarotistas: Array<{
    reader_id: string;
    display_name: string;
    amount: number;
    sessions_count: number;
  }>;
}

export interface TarotistaData {
  id: string;
  display_name: string;
  avatar_url: string | null;
  country: string | null;
  is_active: boolean;
  avg_rating: number;
  ratings_count: number;
  activity_score: number;
  preferred_currency: Currency;
  platform: 'mercadopago' | 'paypal';
  pending_payout: number;
  created_at: string;
}

export interface UserData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  is_banned: boolean;
  created_at: string;
  last_sign_in: string | null;
}

export interface PendingPayout {
  reader_id: string;
  display_name: string;
  avatar_url: string | null;
  currency: Currency;
  amount: number;
  sessions_count: number;
  period_start: string | null;
  period_end: string | null;
}

export interface PlatformCurrencyData {
  currency: string;
  revenue: number;
  expenses: number;
  profit: number;
  payments_count: number;
}

export interface PlatformSummary {
  mercadopago: PlatformCurrencyData;
  paypal: {
    usd: PlatformCurrencyData;
    eur: PlatformCurrencyData;
  };
}

export interface FinancesData {
  month: number;
  year: number;
  currency: Currency | 'ALL';
  // Real payments summary by platform
  platform_summary: PlatformSummary;
  // Breakdown by currency
  by_currency: Record<string, {
    total: number;
    provider: string;
    payments_count: number;
  }>;
  // Breakdown by service (only when specific currency selected)
  profit_by_service: Array<{
    service_kind: string;
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
  }>;
  total_revenue: number;
  total_expenses: number;
}

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_email: string | null;
  reporter_type: 'user' | 'tarotista' | 'admin';
  reported_id: string;
  reported_name: string;
  reported_type: 'user' | 'tarotista' | 'admin';
  thread_id: string | null;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultationMessage {
  id: string;
  sender_id: string;
  msg_type: string;
  body_text: string | null;
  created_at: string;
  is_reader: boolean;
  attachments: Array<{
    id: string;
    media_kind: 'image' | 'audio' | 'video';
    url: string | null;
  }>;
}

/** A report submitted by a tarotista about a Flash question author. */
export interface FlashReport {
  id: string;
  /** The tarotista who filed the report */
  reporter_id: string;
  reporter_name: string;
  /** The user (cliente) who authored the Flash question */
  reported_id: string;
  reported_name: string;
  reported_email: string | null;
  reported_avatar: string | null;
  /** Whether the reported user is already banned */
  reported_is_banned: boolean;
  /** The Flash question that was reported */
  question_id: string;
  question_content: string;
  question_status: string;
  question_created_at: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  kind: string;
  description: string | null;
  /** JSON constraints blob — shape varies per service kind */
  constraints_json: unknown;
  is_active: boolean;
  prices: {
    USD: number;
    ARS: number;
    EUR: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ServicePack {
  id: string;
  sku: string;
  name: string;
  description: string;
  service_kind: string;
  quantity_units: number;
  price_usd: number;
  price_ars: number;
  price_eur: number;
  is_active: boolean;
  currency: string;
  metadata: {
    reader_revenue?: number;
    platform_revenue?: number;
    total_price?: number;
    reader_revenue_usd?: number;
    platform_revenue_usd?: number;
    reader_revenue_eur?: number;
    platform_revenue_eur?: number;
    discount_pct?: number;
    [key: string]: unknown;
  } | null;
}

export interface NetPrice {
  service_kind: string;
  price_ars: number;
  price_usd: number;
  price_eur: number;
}

export interface ConfigurationData {
  services: Service[];
  packs: ServicePack[];
  net_prices: NetPrice[];
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface FlashQuestion {
  id: string;
  content: string;
  status: string;
  created_at: string;
  user?: {
    id?: string | null;
    display_name: string;
    avatar_url?: string | null;
  };
  answer?: {
    reader_name: string;
    body_text: string;
    image_url?: string | null;
  };
}

export interface PrivateConsultation {
  id: string;
  service_kind: string;
  status: string;
  created_at: string;
  message_count: number;
  user?: {
    id?: string;
    display_name: string;
    avatar_url?: string | null;
    email?: string | null;
  };
  reader?: {
    display_name: string;
    avatar_url?: string | null;
  };
  last_message?: {
    sender_type: 'reader' | 'user';
    body_text: string;
  };
}



export interface TarotistaDetailData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  status: 'active' | 'inactive';
  preferred_currency: Currency;
  platform: 'mercadopago' | 'paypal';
  created_at: string;
  total_earned: number;
  pending_payout: number;
  consultations_count: number;
  last_consultation_at: string | null;
  bio: string | null;
  specialties: string[];
  recent_consultations: Array<{
    id: string;
    service_kind: string;
    completed_at: string;
    net_price: number;
    currency: string;
  }>;
  monthly_stats: Array<{
    month: string;
    consultations: number;
    earnings: number;
  }>;
  avg_rating: number;
  ratings_count: number;
}

interface PayoutPlatformEntry {
  payouts: Array<{
    reader_id: string;
    display_name: string;
    avatar_url: string | null;
    sessions_count: number;
    amount: number;
    currency: Currency;
    platform: 'mercadopago' | 'paypal';
    period_start: string | null;
    period_end: string | null;
    payout_status: PayoutStatus | null;
    payout_id: string | null;
    processed_at: string | null;
    receipt_url: string | null;
  }>;
  total_amount: number;
  pending_count: number;
  processed_count: number;
}

export interface MonthlyPayoutsData {
  data: PayoutPlatformEntry['payouts'];
  by_platform: {
    mercadopago: PayoutPlatformEntry & { currency: 'ARS' };
    paypal_usd: PayoutPlatformEntry & { currency: 'USD' };
    paypal_eur: PayoutPlatformEntry & { currency: 'EUR' };
  };
  summary: {
    total_tarotistas: number;
    pending_count: number;
    processed_count: number;
  };
}

export interface PayoutEntry {
  id: string;
  reader_id: string;
  display_name: string;
  amount: number;
  currency: Currency;
  platform: 'mercadopago' | 'paypal';
  sessions_count: number;
  processed_at: string;
  processed_by: string;
  status: PayoutStatus;
}

export interface PayoutHistoryData {
  data: PayoutEntry[];
  by_platform: {
    mercadopago: { total: number; count: number };
    paypal_usd: { total: number; count: number };
    paypal_eur: { total: number; count: number };
  };
  pagination: Pagination;
}

export type NotificationsAudience = 'all' | 'users' | 'tarotistas';

export interface ClientProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string | null;
  role: string;
  country: string | null;
  timezone: string | null;
  zodiac_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  birthdate: string | null;
  preferred_currency: 'ARS' | 'USD' | 'EUR';
  is_active: boolean;
  onboarding_complete: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
}

export interface ClientStats {
  total_consultations: number;
  consultations_by_status: Record<string, number>;
  successful_payments_count: number;
  total_spent_by_currency: Record<string, number>;
  total_remaining_units: number;
  active_entitlements_count: number;
  last_activity_at: string | null;
}

export interface ClientPayment {
  id: string;
  provider: string;
  provider_ref: string;
  status: string;
  currency: string;
  amount_money: number;
  pack_sku: string | null;
  pack_name: string | null;
  units_granted: number | null;
  created_at: string;
}

export interface ClientLedgerEntry {
  id: string;
  entry_type: string;
  ref_type: string;
  ref_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ClientEntitlement {
  id: string;
  pack_sku: string;
  pack_name: string | null;
  service_kind: string | null;
  remaining_units: number;
  total_purchased: number;
  granted_at: string | null;
  purchased_at: string;
  expires_at: string | null;
  is_expired: boolean;
}

export interface ClientConsultation {
  id: string;
  service_kind: string;
  status: string;
  thread_id: string | null;
  question_id: string | null;
  claimed_at: string | null;
  answered_at: string | null;
  closed_at: string | null;
  created_at: string;
  reader: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ClientFlashQuestion {
  id: string;
  content: string;
  status: string;
  claimed_at: string | null;
  answered_at: string | null;
  created_at: string;
}

export interface ClientDetailData {
  profile: ClientProfile;
  stats: ClientStats;
  payments: ClientPayment[];
  ledger: ClientLedgerEntry[];
  entitlements: ClientEntitlement[];
  consultations: ClientConsultation[];
  flash_questions: ClientFlashQuestion[];
}

export interface NotificationsBroadcastParams {
  title: string;
  body: string;
  topic?: string;
  data?: Record<string, unknown>;
  audience?: NotificationsAudience;
  batch_size?: number;
}

export interface NotificationsBroadcastResult {
  campaign_id: string;
  audience: NotificationsAudience;
  topic: string;
  recipients_total: number;
  batches_total: number;
  sent: number;
  failed: number;
  failed_batches: number;
  errors: string[];
  started_at: string;
  finished_at: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const adminApi = {
  // Overview
  getOverview: (params: { month?: number; year?: number; currency?: Currency }) =>
    adminFetch<OverviewData>('GET', 'admin-dashboard/overview', {
      params: { month: params.month, year: params.year, currency: params.currency },
      unwrapData: true,
      errorMessage: 'Error al obtener overview',
    }),

  // Tarotistas list
  getTarotistas: (params: { search?: string; status?: 'all' | 'active' | 'inactive'; page?: number; limit?: number }) =>
    adminFetch<{ data: TarotistaData[]; pagination: Pagination }>('GET', 'admin-dashboard/tarotistas', {
      params: { search: params.search, status: params.status, page: params.page, limit: params.limit },
      errorMessage: 'Error al obtener tarotistas',
    }),

  // Tarotista detail
  getTarotistaDetail: (params: { id: string; currency?: Currency }) =>
    adminFetch<TarotistaDetailData>('GET', `admin-dashboard/tarotista/${params.id}`, {
      params: { currency: params.currency },
      unwrapData: true,
      errorMessage: 'Error al obtener detalle del tarotista',
    }),

  // Update tarotista currency
  updateTarotistaCurrency: (params: { tarotistaId: string; preferredCurrency: Currency }) =>
    adminFetch<{ success: boolean; message: string; platform: 'mercadopago' | 'paypal' }>(
      'PATCH', `admin-dashboard/tarotista/${params.tarotistaId}/currency`, {
      body: { preferred_currency: params.preferredCurrency },
      errorMessage: 'Error al actualizar moneda del tarotista',
    },
    ),

  // Update tarotista status
  updateTarotistaStatus: (params: { tarotistaId: string; status: 'active' | 'inactive' }) =>
    adminFetch<{ success: boolean; message: string; new_status: string }>(
      'PATCH', `admin-dashboard/tarotista/${params.tarotistaId}/status`, {
      body: { status: params.status },
      errorMessage: 'Error al actualizar estado del tarotista',
    },
    ),

  // Users list
  getUsers: (params: { search?: string; page?: number; limit?: number; status?: 'all' | 'active' | 'banned' }) =>
    adminFetch<{ data: UserData[]; pagination: Pagination }>('GET', 'admin-dashboard/users', {
      params: {
        search: params.search,
        page: params.page,
        limit: params.limit,
        status: params.status !== 'all' ? params.status : undefined,
      },
      errorMessage: 'Error al obtener usuarios',
    }),

  // Ban/delete user
  deleteUser: (userId: string) =>
    adminFetch<{ success: boolean; message: string }>('DELETE', `admin-dashboard/users/${userId}`, {
      errorMessage: 'Error al eliminar usuario',
    }),

  // Grant entitlement (gift/refund)
  grantEntitlement: (userId: string, params: { pack_sku: string; reason: string; notes?: string }) =>
    adminFetch<{ success: boolean; message: string }>(
      'POST', `admin-dashboard/users/${userId}/entitlements`, {
      body: params,
      errorMessage: 'Error al otorgar créditos',
    }),

  // Pending payouts
  getPendingPayouts: (params: { currency?: Currency }) =>
    adminFetch<{ data: PendingPayout[]; total_pending: number; count: number }>(
      'GET', 'admin-dashboard/pending-payouts', {
      params: { currency: params.currency },
      errorMessage: 'Error al obtener pagos pendientes',
    },
    ),

  // Monthly payouts (pago a tarotistas)
  getMonthlyPayouts: (params: { month: number; year: number; platform?: 'all' | 'mercadopago' | 'paypal_usd' | 'paypal_eur' }) =>
    adminFetch<MonthlyPayoutsData>('GET', 'admin-dashboard/monthly-payouts', {
      params: { month: params.month, year: params.year, platform: params.platform },
      errorMessage: 'Error al obtener pagos mensuales',
    }),

  // Process payout
  processPayout: (params: { readerId: string; month?: number; year?: number; currency?: Currency }) =>
    adminFetch<{ success: boolean; message: string; data: unknown }>(
      'POST', `admin-dashboard/process-payout/${params.readerId}`, {
      params: { currency: params.currency, month: params.month, year: params.year },
      errorMessage: 'Error al procesar pago',
    },
    ),

  // Update payout status
  updatePayoutStatus: (params: {
    payoutId: string;
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
    notes?: string;
    payment_date?: string;
    payment_method?: string;
    transaction_reference?: string;
  }) =>
    adminFetch<{ success: boolean; message: string; data: unknown }>(
      'PATCH', `admin-dashboard/update-payout-status/${params.payoutId}`, {
      body: {
        status: params.status,
        notes: params.notes,
        payment_date: params.payment_date,
        payment_method: params.payment_method,
        transaction_reference: params.transaction_reference,
      },
      errorMessage: 'Error al actualizar estado',
    },
    ),

  // Upload payout receipt (FormData — cannot use adminFetch)
  async uploadPayoutReceipt(params: {
    payoutId: string;
    file: File;
  }): Promise<{ success: boolean; message: string; data: { receipt_url: string } }> {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', params.file);
    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/upload-payout-receipt/${params.payoutId}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData },
    );
    if (!response.ok) throw new Error((await response.text()) || 'Error al subir comprobante');
    return response.json();
  },

  // Get payout receipt signed URL (different base path — cannot use adminFetch)
  async getPayoutReceiptUrl(receiptPath: string): Promise<string> {
    const token = await getAuthToken();
    const url = new URL(`${EDGE_FUNCTIONS_URL}/media-get-url`);
    url.searchParams.set('path', receiptPath);
    const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('Error al obtener URL del comprobante');
    const data = await response.json();
    return data.signedUrl || data.url;
  },

  // Payout history
  getPayoutHistory: (params: {
    readerId?: string;
    page?: number;
    limit?: number;
    currency?: Currency;
    platform?: 'all' | 'mercadopago' | 'paypal_usd' | 'paypal_eur';
  }) =>
    adminFetch<PayoutHistoryData>('GET', 'admin-dashboard/payout-history', {
      params: {
        readerId: params.readerId,
        page: params.page,
        limit: params.limit,
        currency: params.currency,
        platform: params.platform,
      },
      errorMessage: 'Error al obtener historial de pagos',
    }),

  // Export payouts CSV/XLSX (returns Blob — cannot use adminFetch)
  async exportPayouts(params: { month: number; year: number; status?: 'pending' | 'processing' | 'paid' | 'all' }): Promise<Blob> {
    const token = await getAuthToken();
    const url = new URL(`${EDGE_FUNCTIONS_URL}/admin-dashboard/export-payouts`);
    url.searchParams.set('month', params.month.toString());
    url.searchParams.set('year', params.year.toString());
    if (params.status) url.searchParams.set('status', params.status);
    const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error((await response.text()) || 'Error al exportar pagos');
    return response.blob();
  },

  // Finances
  getFinances: (params: { month?: number; year?: number; currency?: Currency }) =>
    adminFetch<FinancesData>('GET', 'admin-dashboard/finances', {
      params: { month: params.month, year: params.year, currency: params.currency },
      unwrapData: true,
      errorMessage: 'Error al obtener finanzas',
    }),

  // Reports
  getReports: (params: { status?: ReportStatus | 'all'; page?: number; limit?: number }) =>
    adminFetch<{ data: Report[]; pagination: Pagination }>('GET', 'admin-dashboard/reports', {
      params: {
        status: params.status !== 'all' ? params.status : undefined,
        page: params.page,
        limit: params.limit,
      },
      errorMessage: 'Error al obtener reportes',
    }),

  updateReportStatus: (params: { reportId: string; status: ReportStatus; resolution_notes?: string }) =>
    adminFetch<unknown>('PATCH', `admin-dashboard/update-report/${params.reportId}`, {
      body: { status: params.status, resolution_notes: params.resolution_notes },
      errorMessage: 'Error al actualizar reporte',
    }),

  async getPendingReportsCount(): Promise<number> {
    const data = await adminFetch<{ pending_count: number }>(
      'GET', 'admin-dashboard/pending-reports-count', {
      unwrapData: true,
      errorMessage: 'Error al obtener conteo de reportes',
    },
    );
    return data.pending_count;
  },

  // Flash questions
  getFlashQuestions: (params: { page?: number; limit?: number; search?: string; status?: string }) =>
    adminFetch<{ data: FlashQuestion[]; pagination: Pagination }>('GET', 'admin-dashboard/flash-questions', {
      params: { page: params.page, limit: params.limit, search: params.search, status: params.status },
      errorMessage: 'Error al obtener preguntas flash',
    }),

  // Delete/archive flash question (no response body)
  async deleteFlashQuestion(params: { questionId: string }): Promise<void> {
    const token = await getAuthToken();
    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/flash-questions/${params.questionId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
    if (!response.ok) {
      const text = await response.text();
      // Try to extract the human-readable message from the JSON error envelope
      try {
        const json = JSON.parse(text);
        throw new Error(json?.error?.message || json?.message || text || 'Error al archivar pregunta');
      } catch {
        throw new Error(text || 'Error al archivar pregunta');
      }
    }
  },

  // Reset flash question (claimed → open)
  resetFlashQuestion: (params: { questionId: string }) =>
    adminFetch<{ success: boolean; message: string }>(
      'PATCH', `admin-dashboard/flash-questions/${params.questionId}/reset`, {
      errorMessage: 'Error al resetear pregunta flash',
    }),

  // Configuration
  getConfiguration: () =>
    adminFetch<ConfigurationData>('GET', 'admin-dashboard/configuration', {
      unwrapData: true,
      errorMessage: 'Error al obtener configuración',
    }),

  updateNetPrice: (serviceKind: string, prices: { price_ars: number; price_usd: number; price_eur: number }) =>
    adminFetch<{ success: boolean; message: string }>(
      'PATCH', `admin-dashboard/configuration/net-price/${serviceKind}`, {
      body: prices,
      errorMessage: 'Error al actualizar precio neto',
    }),

  updatePack: (packId: string, prices: { price_ars: number; price_usd: number; price_eur: number }) =>
    adminFetch<{ success: boolean; message: string }>(
      'PATCH', `admin-dashboard/configuration/pack/${packId}`, {
      body: prices,
      errorMessage: 'Error al actualizar pack',
    }),

  updatePackStatus: (packId: string, isActive: boolean) =>
    adminFetch<{ success: boolean; message: string }>(
      'PATCH', `admin-dashboard/configuration/pack/${packId}/status`, {
      body: { is_active: isActive },
      errorMessage: 'Error al actualizar estado del pack',
    }),

  updateServiceStatus: (serviceId: string, isActive: boolean) =>
    adminFetch<{ success: boolean; message: string }>(
      'PATCH', `admin-dashboard/configuration/service/${serviceId}/status`, {
      body: { is_active: isActive },
      errorMessage: 'Error al actualizar estado del servicio',
    }),

  // Broadcast notifications
  sendNotificationsBroadcast: (params: NotificationsBroadcastParams) =>
    adminFetch<NotificationsBroadcastResult>('POST', 'admin-dashboard/notifications-broadcast', {
      body: {
        title: params.title,
        body: params.body,
        topic: params.topic,
        data: params.data,
        audience: params.audience ?? 'all',
        batch_size: params.batch_size,
      },
      unwrapData: true,
      errorMessage: 'Error al enviar notificaciones',
    }),

  // Private consultations
  getPrivateConsultations: (params: { page?: number; limit?: number; search?: string; status?: string; serviceKind?: string }) =>
    adminFetch<{ data: PrivateConsultation[]; pagination: Pagination }>('GET', 'admin-dashboard/private-consultations', {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search,
        status: params.status,
        service_kind: params.serviceKind,
      },
      errorMessage: 'Error al obtener consultas privadas',
    }),

  // Consultation detail (returns full { data: { session, messages } } envelope)
  getConsultationDetail: (consultationId: string) =>
    adminFetch<{ data: { session: PrivateConsultation & { [key: string]: unknown }; messages: ConsultationMessage[] } }>(
      'GET', `admin-dashboard/consultation/${consultationId}/details`, {
      errorMessage: 'Error al obtener detalle de consulta',
    },
    ),

  // Client detail — full profile, stats, purchases, credits and consultations
  getClientDetail: (clientId: string) =>
    adminFetch<{ data: ClientDetailData }>(
      'GET', `admin-dashboard/client/${clientId}/details`, {
      errorMessage: 'Error al obtener detalle del cliente',
    }),

  // Flash reports (reports linked to Flash questions)
  getFlashReports: (params: { status?: string; page?: number; limit?: number }) =>
    adminFetch<{ data: FlashReport[]; pagination: Pagination }>('GET', 'admin-dashboard/flash-reports', {
      params: {
        status: params.status !== 'all' ? params.status : undefined,
        page: params.page,
        limit: params.limit,
      },
      errorMessage: 'Error al obtener reportes Flash',
    }),

  // Update the moderation status of a flash report
  updateFlashReport: (params: {
    reportId: string;
    status: ReportStatus;
    resolution_notes?: string;
  }) =>
    adminFetch<{ success: boolean }>('PATCH', `admin-dashboard/update-report/${params.reportId}`, {
      body: { status: params.status, resolution_notes: params.resolution_notes },
      errorMessage: 'Error al actualizar reporte Flash',
    }),

  // ────────────────────────────────────────────────────────────────────────
  // Owner emergency takeover for flash questions
  //
  // Owner clicks "Responder" on a flash question → 3 calls to the backend:
  //   1. flashOwnerTakeover()   — claim the question for the owner
  //   2. flashUploadAnswerMedia() — upload an image (signed URL flow)
  //   3. flashAnswerQuestion()  — submit the body + storage paths
  //
  // The first call hits the dedicated `flash-owner-takeover` Edge Function
  // (gated by email = OWNER_EMAIL), the latter two reuse the same endpoints
  // the mobile app uses for the regular tarotista answer flow.
  // ────────────────────────────────────────────────────────────────────────

  flashOwnerTakeover: async (params: { questionId: string; reason?: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${EDGE_FUNCTIONS_URL}/flash-owner-takeover`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question_id: params.questionId,
        reason: params.reason,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json?.error?.message || json?.message || 'Error al tomar la pregunta');
      } catch {
        throw new Error(text || 'Error al tomar la pregunta');
      }
    }

    const json = await response.json();
    return json.data as {
      question_id: string;
      session_id: string;
      reader_id: string;
      claimed_at: string;
      rotation_round: number;
    };
  },

  flashUploadAnswerMedia: async (params: { file: File; serviceSlug: string }) => {
    const token = await getAuthToken();

    // 1. Request signed upload URL
    const signResponse = await fetch(`${EDGE_FUNCTIONS_URL}/media-sign-upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scope: 'global_answer',
        service_slug: params.serviceSlug,
        files: [
          {
            file_name: params.file.name,
            media_kind: 'image',
            mime: params.file.type || 'image/jpeg',
          },
        ],
      }),
    });

    if (!signResponse.ok) {
      const text = await signResponse.text();
      throw new Error(text || 'Error al solicitar URL de subida');
    }

    const signJson = await signResponse.json();
    // The media-sign-upload edge function returns the array under
    // `data.uploads` (see media-sign-upload/index.ts). Older code paths
    // used `data.files`/`signed` — keep them as fallbacks just in case.
    const signed = (
      signJson?.data?.uploads
      ?? signJson?.uploads
      ?? signJson?.data?.files
      ?? signJson?.files
      ?? signJson?.signed
      ?? []
    ) as Array<{
      storage_path: string;
      upload_url: string;
      token?: string;
    }>;

    if (!signed.length || !signed[0].upload_url || !signed[0].storage_path) {
      throw new Error('Respuesta inválida del servidor de subidas');
    }

    const target = signed[0];

    // 2. Upload the file to the signed URL
    const uploadResponse = await fetch(target.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': params.file.type || 'image/jpeg',
        ...(target.token ? { Authorization: `Bearer ${target.token}` } : {}),
      },
      body: params.file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Error al subir la imagen');
    }

    return target.storage_path;
  },

  flashAnswerQuestion: async (params: {
    sessionId: string;
    bodyText: string;
    storagePaths: string[];
    /**
     * Idempotency key for retry safety. If a request with the same key
     * succeeds and the client retries (e.g. network timeout), the backend
     * returns the previously-created answer instead of erroring on the
     * UNIQUE(question_id) constraint.
     *
     * If omitted, a random UUID is generated — fine for a single attempt
     * but callers that may retry should supply a stable key.
     */
    idempotencyKey?: string;
  }) => {
    const token = await getAuthToken();
    const idempotencyKey = params.idempotencyKey ?? crypto.randomUUID();
    const response = await fetch(`${EDGE_FUNCTIONS_URL}/global-questions-answer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        session_id: params.sessionId,
        body_text: params.bodyText,
        storage_paths: params.storagePaths,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json?.error?.message || json?.message || 'Error al enviar la respuesta');
      } catch {
        throw new Error(text || 'Error al enviar la respuesta');
      }
    }

    const json = await response.json();
    return json.data;
  },

  // ────────────────────────────────────────────────────────────────────────
  // Inverse of flashOwnerTakeover. Rolls back a manual takeover if the
  // subsequent answer submission failed, returning the question to the
  // rotation pool (status='open'). Called from useOwnerAnswerFlashQuestion()
  // as a best-effort cleanup after a failed answer step.
  // ────────────────────────────────────────────────────────────────────────
  flashOwnerRelease: async (params: { questionId: string; reason?: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${EDGE_FUNCTIONS_URL}/flash-owner-release`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question_id: params.questionId,
        reason: params.reason,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json?.error?.message || json?.message || 'Error al liberar la pregunta');
      } catch {
        throw new Error(text || 'Error al liberar la pregunta');
      }
    }

    const json = await response.json();
    return json.data as {
      question_id: string;
      session_id: string;
      released_at: string;
    };
  },
};
