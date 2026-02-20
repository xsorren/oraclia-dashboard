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
  body_text?: string;
  created_at: string;
  msg_type: string;
  attachments: Array<{ id: string; media_kind: 'image' | 'audio'; url?: string }>;
  is_reader: boolean;
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

export interface ConfigurationData {
  services: Service[];
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
    display_name: string;
    avatar_url?: string | null;
  };
  answer?: {
    reader_name: string;
    body_text: string;
  };
}

export interface PrivateConsultation {
  id: string;
  service_kind: string;
  status: string;
  created_at: string;
  message_count: number;
  user?: {
    display_name: string;
    avatar_url?: string | null;
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

  // Configuration
  getConfiguration: () =>
    adminFetch<ConfigurationData>('GET', 'admin-dashboard/configuration', {
      unwrapData: true,
      errorMessage: 'Error al obtener configuración',
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
};
