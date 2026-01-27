import { createClient } from '@/lib/supabase/client';
import type { Currency, PayoutStatus } from '@/types/database';

const EDGE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL!;

async function getAuthToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('No hay sesión activa');
  }

  return session.access_token;
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

export interface Service {
  id: string;
  slug: string;
  name: string;
  kind: string;
  description: string | null;
  constraints_json: any;
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

export const adminApi = {
  async getOverview(params: {
    month?: number;
    year?: number;
    currency?: Currency;
  }): Promise<OverviewData> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();

    if (params.month) searchParams.append('month', params.month.toString());
    if (params.year) searchParams.append('year', params.year.toString());
    if (params.currency) searchParams.append('currency', params.currency);

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/overview?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener overview');
    }

    const json = await response.json();
    return json.data;
  },

  async getTarotistas(params: {
    search?: string;
    status?: 'all' | 'active' | 'inactive';
    page?: number;
    limit?: number;
  }): Promise<{
    data: TarotistaData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/tarotistas?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener tarotistas');
    }

    return await response.json();
  },

  async getPendingPayouts(params: {
    currency?: Currency;
  }): Promise<{
    data: PendingPayout[];
    total_pending: number;
    count: number;
  }> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();

    if (params.currency) searchParams.append('currency', params.currency);

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/pending-payouts?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener pagos pendientes');
    }

    return await response.json();
  },

  async getFinances(params: {
    month?: number;
    year?: number;
    currency?: Currency;
  }): Promise<FinancesData> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();

    if (params.month) searchParams.append('month', params.month.toString());
    if (params.year) searchParams.append('year', params.year.toString());
    if (params.currency) searchParams.append('currency', params.currency);

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/finances?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener finanzas');
    }

    const json = await response.json();
    return json.data;
  },

  async getTarotistaDetail(params: {
    id: string;
    currency?: Currency;
  }): Promise<{
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
  }> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();

    if (params.currency) searchParams.append('currency', params.currency);

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/tarotista/${params.id}?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener detalle del tarotista');
    }

    const json = await response.json();
    return json.data;
  },

  async processPayout(params: {
    readerId: string;
    month?: number;
    year?: number;
    currency?: 'USD' | 'ARS' | 'EUR';
  }): Promise<{ success: boolean; message: string; data: any }> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();

    if (params.currency) searchParams.append('currency', params.currency);
    if (params.month) searchParams.append('month', params.month.toString());
    if (params.year) searchParams.append('year', params.year.toString());

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/process-payout/${params.readerId}?${searchParams.toString()}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al procesar pago');
    }

    return await response.json();
  },

  async updatePayoutStatus(params: {
    payoutId: string;
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
    notes?: string;
    payment_date?: string;
    payment_method?: string;
    transaction_reference?: string;
  }): Promise<{ success: boolean; message: string; data: any }> {
    const token = await getAuthToken();

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/update-payout-status/${params.payoutId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: params.status,
          notes: params.notes,
          payment_date: params.payment_date,
          payment_method: params.payment_method,
          transaction_reference: params.transaction_reference,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al actualizar estado');
    }

    return await response.json();
  },

  async uploadPayoutReceipt(params: {
    payoutId: string;
    file: File;
  }): Promise<{ success: boolean; message: string; data: { receipt_url: string } }> {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', params.file);

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/upload-payout-receipt/${params.payoutId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al subir comprobante');
    }

    return await response.json();
  },

  async getPayoutReceiptUrl(receiptPath: string): Promise<string> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();
    searchParams.append('path', receiptPath);

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/media-get-url?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener URL del comprobante');
    }

    const data = await response.json();
    return data.signedUrl || data.url;
  },

  async getMonthlyPayouts(params: {
    month: number;
    year: number;
    platform?: 'all' | 'mercadopago' | 'paypal_usd' | 'paypal_eur';
  }): Promise<{
    data: Array<{
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
    by_platform: {
      mercadopago: {
        currency: 'ARS';
        payouts: Array<any>;
        total_amount: number;
        pending_count: number;
        processed_count: number;
      };
      paypal_usd: {
        currency: 'USD';
        payouts: Array<any>;
        total_amount: number;
        pending_count: number;
        processed_count: number;
      };
      paypal_eur: {
        currency: 'EUR';
        payouts: Array<any>;
        total_amount: number;
        pending_count: number;
        processed_count: number;
      };
    };
    summary: {
      total_tarotistas: number;
      pending_count: number;
      processed_count: number;
    };
  }> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();

    searchParams.append('month', params.month.toString());
    searchParams.append('year', params.year.toString());
    if (params.platform) searchParams.append('platform', params.platform);

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/monthly-payouts?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener pagos mensuales');
    }

    return await response.json();
  },

  async getPayoutHistory(params: {
    readerId?: string;
    page?: number;
    limit?: number;
    currency?: Currency;
    platform?: 'all' | 'mercadopago' | 'paypal_usd' | 'paypal_eur';
  }): Promise<{
    data: Array<{
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
    }>;
    by_platform: {
      mercadopago: { total: number; count: number };
      paypal_usd: { total: number; count: number };
      paypal_eur: { total: number; count: number };
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();

    if (params.readerId) searchParams.append('readerId', params.readerId);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.currency) searchParams.append('currency', params.currency);
    if (params.platform) searchParams.append('platform', params.platform);

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/payout-history?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener historial de pagos');
    }

    return await response.json();
  },

  async getReports(params: {
    status?: ReportStatus | 'all';
    page?: number;
    limit?: number;
  }): Promise<{
    data: Report[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();

    if (params.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/reports?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener reportes');
    }

    return await response.json();
  },

  async updateReportStatus(params: {
    reportId: string;
    status: ReportStatus;
    resolution_notes?: string;
  }): Promise<any> {
    const token = await getAuthToken();

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/update-report/${params.reportId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: params.status,
          resolution_notes: params.resolution_notes,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al actualizar reporte');
    }

    return await response.json();
  },

  async getFlashQuestions(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{
    data: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/flash-questions?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener preguntas flash');
    }

    return await response.json();
  },

  async deleteFlashQuestion(params: { questionId: string }): Promise<void> {
    const token = await getAuthToken();
    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/flash-questions/${params.questionId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al archivar pregunta');
    }
  },

  async getConfiguration(): Promise<ConfigurationData> {
    const token = await getAuthToken();
    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/configuration`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener configuración');
    }

    const json = await response.json();
    return json.data;
  },

  async exportPayouts(params: {
    month: number;
    year: number;
    status?: 'pending' | 'processing' | 'paid' | 'all';
  }): Promise<Blob> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();
    searchParams.append('month', params.month.toString());
    searchParams.append('year', params.year.toString());
    if (params.status) {
      searchParams.append('status', params.status);
    }

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/export-payouts?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al exportar pagos');
    }

    return await response.blob();
  },

  async getPendingReportsCount(): Promise<number> {
    const token = await getAuthToken();
    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/pending-reports-count`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener conteo de reportes');
    }

    const json = await response.json();
    return json.data.pending_count;
  },

  async updateTarotistaCurrency(params: {
    tarotistaId: string;
    preferredCurrency: Currency;
  }): Promise<{ success: boolean; message: string; platform: 'mercadopago' | 'paypal' }> {
    const token = await getAuthToken();

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/tarotista/${params.tarotistaId}/currency`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferred_currency: params.preferredCurrency }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al actualizar moneda del tarotista');
    }

    return await response.json();
  },

  async updateTarotistaStatus(params: {
    tarotistaId: string;
    status: 'active' | 'inactive';
  }): Promise<{ success: boolean; message: string; new_status: string }> {
    const token = await getAuthToken();

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/tarotista/${params.tarotistaId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: params.status }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al actualizar estado del tarotista');
    }

    return await response.json();
  },

  async getPrivateConsultations(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    serviceKind?: string;
  }): Promise<{
    data: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.serviceKind) searchParams.append('service_kind', params.serviceKind);

    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/private-consultations?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener consultas privadas');
    }

    return await response.json();
  },

  async getConsultationDetail(consultationId: string): Promise<{
    data: {
      session: any;
      messages: any[];
    };
  }> {
    const token = await getAuthToken();
    const response = await fetch(
      `${EDGE_FUNCTIONS_URL}/admin-dashboard/consultation/${consultationId}/details`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener detalle de consulta');
    }

    return await response.json();
  },
};
