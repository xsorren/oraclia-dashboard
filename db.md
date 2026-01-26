-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

-- ============================================================================
-- SISTEMA MULTI-MONEDA / MULTI-PLATAFORMA
-- ============================================================================
-- 
-- PLATAFORMAS DE PAGO:
--   - MercadoPago: Solo ARS (Argentina)
--   - PayPal: USD y EUR (Internacional)
--
-- TABLAS CLAVE:
--   - payments.currency + payments.provider → Determina plataforma de ingreso
--   - reader_profiles.preferred_currency → Moneda en que cobra el tarotista
--   - service_net_prices → Precios netos por servicio en cada moneda
--   - tarotista_payouts.currency → Moneda del pago al tarotista
--
-- FLUJO:
--   1. Usuario paga → payments (provider: mercadopago|paypal, currency: ARS|USD|EUR)
--   2. Consulta respondida → consultation_sessions
--   3. Cálculo pago → service_net_prices[preferred_currency]
--   4. Pago tarotista → tarotista_payouts
-- ============================================================================

CREATE TABLE public.consultation_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reader_id uuid,
  service_kind text NOT NULL CHECK (service_kind = ANY (ARRAY['flash_1carta'::text, 'flash_1carta_gratis'::text, 'privada_3cartas'::text, 'extensa_5cartas'::text, 'lectura_solos_solas'::text, 'lectura_amores_pasados'::text, 'lectura_amores_nuevos'::text, 'lectura_almas_gemelas'::text, 'lectura_global'::text, 'ritual'::text, 'carta_astral'::text, 'sesion_reiki'::text, 'registros_akashicos'::text, 'sesion_numerologia'::text, 'analisis_suenos'::text])),
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'claimed'::text, 'answered'::text, 'closed'::text, 'expired'::text, 'cancelled'::text])),
  question_id uuid,
  thread_id uuid,
  claimed_at timestamp with time zone,
  answered_at timestamp with time zone,
  closed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT consultation_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT consultation_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT consultation_sessions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.global_questions(id),
  CONSTRAINT consultation_sessions_reader_id_fkey FOREIGN KEY (reader_id) REFERENCES public.profiles(id),
  CONSTRAINT consultation_sessions_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.dm_threads(id)
);
CREATE TABLE public.daily_energies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT current_date,
  message text NOT NULL,
  affirmation text NOT NULL,
  theme text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_energies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dm_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  msg_type USER-DEFINED NOT NULL,
  body_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT dm_messages_pkey PRIMARY KEY (id),
  CONSTRAINT dm_messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.dm_threads(id),
  CONSTRAINT dm_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.dm_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reader_id uuid NOT NULL,
  service_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'open'::thread_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_message_at timestamp with time zone,
  last_read_at timestamp with time zone,
  service_kind text CHECK (service_kind = ANY (ARRAY['flash_1carta'::text, 'flash_1carta_gratis'::text, 'privada_3cartas'::text, 'extensa_5cartas'::text, 'lectura_solos_solas'::text, 'lectura_amores_pasados'::text, 'lectura_amores_nuevos'::text, 'lectura_almas_gemelas'::text, 'lectura_global'::text, 'ritual'::text, 'carta_astral'::text, 'sesion_reiki'::text, 'registros_akashicos'::text, 'sesion_numerologia'::text, 'analisis_suenos'::text])),
  CONSTRAINT dm_threads_pkey PRIMARY KEY (id),
  CONSTRAINT dm_threads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT dm_threads_reader_id_fkey FOREIGN KEY (reader_id) REFERENCES public.reader_profiles(id),
  CONSTRAINT dm_threads_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
CREATE TABLE public.global_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL UNIQUE,
  reader_id uuid NOT NULL,
  body_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT global_answers_pkey PRIMARY KEY (id),
  CONSTRAINT global_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.global_questions(id),
  CONSTRAINT global_answers_reader_id_fkey FOREIGN KEY (reader_id) REFERENCES public.reader_profiles(id)
);
CREATE TABLE public.global_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 4000),
  status USER-DEFINED NOT NULL DEFAULT 'open'::global_question_status,
  claimed_by_reader_id uuid,
  claimed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  answered_at timestamp with time zone,
  expired_at timestamp with time zone,
  CONSTRAINT global_questions_pkey PRIMARY KEY (id),
  CONSTRAINT global_questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT global_questions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT global_questions_claimed_by_reader_id_fkey FOREIGN KEY (claimed_by_reader_id) REFERENCES public.reader_profiles(id)
);
CREATE TABLE public.ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_type USER-DEFINED NOT NULL,
  ref_type USER-DEFINED NOT NULL,
  ref_id uuid,
  idempotency_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  inserted_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT ledger_pkey PRIMARY KEY (id),
  CONSTRAINT ledger_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT ledger_inserted_by_fkey FOREIGN KEY (inserted_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.media_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scope USER-DEFINED NOT NULL,
  linked_id uuid NOT NULL,
  media_kind USER-DEFINED NOT NULL CHECK (media_kind <> 'text'::media_type),
  storage_path text NOT NULL,
  mime text NOT NULL,
  size_bytes bigint CHECK (size_bytes >= 0),
  duration_sec integer,
  width integer,
  height integer,
  thumbnail_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT media_attachments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  topic text,
  title text,
  body text,
  data jsonb,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  success boolean,
  error text,
  CONSTRAINT notification_logs_pkey PRIMARY KEY (id),
  CONSTRAINT notification_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider USER-DEFINED NOT NULL,
  provider_ref text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'created'::payment_status,
  currency text DEFAULT 'ARS'::text,
  amount_money numeric NOT NULL CHECK (amount_money >= 0::numeric),
  idempotency_key text,
  raw_payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  pack_sku text,
  units_granted integer CHECK (units_granted IS NULL OR units_granted >= 0),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT payments_pack_sku_fkey FOREIGN KEY (pack_sku) REFERENCES public.service_packs(sku)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'user'::app_role,
  display_name text NOT NULL CHECK (char_length(display_name) >= 3 AND char_length(display_name) <= 80),
  avatar_url text,
  birthdate date,
  zodiac_sign text,
  country text,
  timezone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  preferred_currency text NOT NULL DEFAULT 'ARS'::text CHECK (preferred_currency = ANY (ARRAY['ARS'::text, 'USD'::text, 'EUR'::text])),
  moon_sign text,
  rising_sign text,
  last_oracle_number_at date,
  onboarding_complete boolean NOT NULL DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.push_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  platform text,
  device_model text,
  locale text,
  timezone text,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT push_devices_pkey PRIMARY KEY (id),
  CONSTRAINT push_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.reader_available_services (
  reader_id uuid NOT NULL,
  service_kind text NOT NULL CHECK (service_kind = ANY (ARRAY['flash_1carta'::text, 'flash_1carta_gratis'::text, 'privada_3cartas'::text, 'extensa_5cartas'::text, 'lectura_solos_solas'::text, 'lectura_amores_pasados'::text, 'lectura_amores_nuevos'::text, 'lectura_almas_gemelas'::text, 'lectura_global'::text, 'ritual'::text, 'carta_astral'::text, 'sesion_reiki'::text, 'registros_akashicos'::text, 'sesion_numerologia'::text, 'analisis_suenos'::text])),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reader_available_services_pkey PRIMARY KEY (reader_id, service_kind),
  CONSTRAINT reader_available_services_reader_id_fkey FOREIGN KEY (reader_id) REFERENCES public.reader_profiles(id)
);
CREATE TABLE public.reader_gallery (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reader_id uuid NOT NULL,
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reader_gallery_pkey PRIMARY KEY (id),
  CONSTRAINT reader_gallery_reader_id_fkey FOREIGN KEY (reader_id) REFERENCES public.reader_profiles(id)
);
CREATE TABLE public.reader_intro_video (
  reader_id uuid NOT NULL,
  storage_path text NOT NULL,
  duration_sec integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reader_intro_video_pkey PRIMARY KEY (reader_id),
  CONSTRAINT reader_intro_video_reader_id_fkey FOREIGN KEY (reader_id) REFERENCES public.reader_profiles(id)
);
CREATE TABLE public.reader_profiles (
  id uuid NOT NULL,
  bio_sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  activity_score numeric NOT NULL DEFAULT 0,
  avg_rating numeric NOT NULL DEFAULT 0,
  ratings_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  preferred_currency text NOT NULL DEFAULT 'ARS'::text CHECK (preferred_currency = ANY (ARRAY['ARS'::text, 'USD'::text, 'EUR'::text])),
  CONSTRAINT reader_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT reader_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id)
);
CREATE TABLE public.reader_specialties (
  reader_id uuid NOT NULL,
  specialty_id uuid NOT NULL,
  CONSTRAINT reader_specialties_pkey PRIMARY KEY (reader_id, specialty_id),
  CONSTRAINT reader_specialties_reader_id_fkey FOREIGN KEY (reader_id) REFERENCES public.reader_profiles(id),
  CONSTRAINT reader_specialties_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_id uuid NOT NULL,
  thread_id uuid,
  reason text NOT NULL,
  description text CHECK (char_length(description) <= 2000),
  status USER-DEFINED NOT NULL DEFAULT 'pending'::report_status,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  resolution_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id),
  CONSTRAINT reports_reported_id_fkey FOREIGN KEY (reported_id) REFERENCES public.profiles(id),
  CONSTRAINT reports_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.dm_threads(id),
  CONSTRAINT reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  reader_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.dm_threads(id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_reader_id_fkey FOREIGN KEY (reader_id) REFERENCES public.reader_profiles(id)
);
CREATE TABLE public.service_net_prices (
  service_kind text NOT NULL,
  price_ars numeric NOT NULL DEFAULT 0,
  price_usd numeric NOT NULL DEFAULT 0,
  price_eur numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT service_net_prices_pkey PRIMARY KEY (service_kind)
);
CREATE TABLE public.service_packs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  service_kind text NOT NULL CHECK (service_kind = ANY (ARRAY['flash_1carta'::text, 'flash_1carta_gratis'::text, 'privada_3cartas'::text, 'extensa_5cartas'::text, 'lectura_solos_solas'::text, 'lectura_amores_pasados'::text, 'lectura_amores_nuevos'::text, 'lectura_almas_gemelas'::text, 'lectura_global'::text, 'ritual'::text, 'carta_astral'::text, 'sesion_reiki'::text, 'registros_akashicos'::text, 'sesion_numerologia'::text, 'analisis_suenos'::text])),
  quantity_units integer NOT NULL CHECK (quantity_units > 0),
  price_ars numeric,
  price_usd numeric,
  currency text NOT NULL DEFAULT 'ARS'::text CHECK (currency = ANY (ARRAY['ARS'::text, 'USD'::text, 'EUR'::text])),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  price_eur numeric,
  CONSTRAINT service_packs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug = lower(slug)),
  name text NOT NULL,
  kind USER-DEFINED NOT NULL,
  description text,
  constraints_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id)
);
CREATE TABLE public.specialties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug = lower(slug)),
  name text NOT NULL UNIQUE,
  CONSTRAINT specialties_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tarotista_client_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tarotista_id uuid NOT NULL,
  client_id uuid NOT NULL,
  note_content text NOT NULL DEFAULT ''::text CHECK (char_length(note_content) <= 10000),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tarotista_client_notes_pkey PRIMARY KEY (id),
  CONSTRAINT tarotista_client_notes_tarotista_id_fkey FOREIGN KEY (tarotista_id) REFERENCES public.profiles(id),
  CONSTRAINT tarotista_client_notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.tarotista_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reader_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'USD'::text CHECK (currency = ANY (ARRAY['USD'::text, 'ARS'::text, 'EUR'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  payment_method text,
  transaction_reference text,
  processed_by uuid,
  processed_at timestamp with time zone,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  sessions_count integer DEFAULT 0,
  notes text,
  receipt_url text,
  payment_date date,
  bank_info_snapshot jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tarotista_payouts_pkey PRIMARY KEY (id),
  CONSTRAINT tarotista_payouts_reader_id_fkey FOREIGN KEY (reader_id) REFERENCES public.reader_profiles(id),
  CONSTRAINT tarotista_payouts_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_entitlements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pack_sku text NOT NULL,
  remaining_units integer NOT NULL DEFAULT 0 CHECK (remaining_units >= 0),
  total_purchased integer NOT NULL CHECK (total_purchased > 0),
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  granted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_entitlements_pkey PRIMARY KEY (id),
  CONSTRAINT user_entitlements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_entitlements_pack_sku_fkey FOREIGN KEY (pack_sku) REFERENCES public.service_packs(sku)
);