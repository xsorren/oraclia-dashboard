// Tipos básicos de la base de datos
// TODO: Generar tipos completos con supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'user' | 'tarotista' | 'admin';
export type Currency = 'USD' | 'ARS' | 'EUR';
export type PayoutStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  avatar_url: string | null;
  birthdate: string | null;
  zodiac_sign: string | null;
  country: string | null;
  timezone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  preferred_currency: Currency;
  moon_sign: string | null;
  rising_sign: string | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      reader_profiles: {
        Row: {
          id: string;
          bio_sections: Json;
          activity_score: number;
          avg_rating: number;
          ratings_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          preferred_currency: 'ARS' | 'USD' | 'EUR';
        };
      };
      consultation_sessions: {
        Row: {
          id: string;
          user_id: string;
          reader_id: string | null;
          service_kind: string;
          status: 'open' | 'claimed' | 'answered' | 'closed' | 'expired' | 'cancelled';
          question_id: string | null;
          thread_id: string | null;
          claimed_at: string | null;
          answered_at: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          provider: 'mercadopago' | 'stripe' | 'paypal';
          provider_ref: string | null;
          status: 'created' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
          currency: string;
          amount_money: number;
          idempotency_key: string;
          raw_payload: Json | null;
          created_at: string;
          updated_at: string;
          pack_sku: string | null;
          units_granted: number | null;
        };
      };
      service_packs: {
        Row: {
          id: string;
          sku: string;
          name: string;
          description: string | null;
          service_kind: string;
          quantity_units: number;
          price_ars: number | null;
          price_usd: number | null;
          price_eur: number | null;
          currency: 'ARS' | 'USD' | 'EUR';
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
      };
      service_net_prices: {
        Row: {
          service_kind: string;
          price_ars: number;
          price_usd: number;
          price_eur: number;
          created_at: string;
          updated_at: string;
        };
      };
      tarotista_payouts: {
        Row: {
          id: string;
          reader_id: string;
          amount: number;
          currency: Currency;
          status: PayoutStatus;
          payment_method: string | null;
          processed_by: string;
          processed_at: string;
          period_start: string | null;
          period_end: string | null;
          sessions_count: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      tarotista_payout_items: {
        Row: {
          id: string;
          payout_id: string;
          session_id: string;
          amount: number;
          currency: Currency;
          created_at: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          thread_id: string | null;
          reason: string;
          description: string | null;
          status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
          reviewed_by: string | null;
          reviewed_at: string | null;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      user_entitlements: {
        Row: {
          id: string;
          user_id: string;
          pack_sku: string;
          remaining_units: number;
          total_purchased: number;
          granted_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
