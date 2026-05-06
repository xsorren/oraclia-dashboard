-- =============================================================================
-- Desactivar pack privada_3cartas_promo_50 (50% OFF Privada)
--
-- El pack quedó activo en la DB pero nunca se agregó al frontend mobile como
-- promo "intencional". El filtro del modal de pago en el mobile (whitelist
-- por SKU específico) solo conocía privada_3cartas_promo_32; cualquier otro
-- pack con _promo_ en el SKU pasaba el filtro después de la primera compra.
--
-- Caso real: una clienta nueva (Nahir Berarducci) compró promo_32 (35% off,
-- ARS 2.990) y al día siguiente vio promo_50 (50% off, ARS 2.300) en el
-- modal de pago y la compró también. Resultado: 2 consultas privadas con
-- descuento donde solo debería haber 1.
--
-- Fix combinado:
--   1. Esta migración desactiva el pack en DB (is_active=false) → nunca más
--      aparece en useServicePacks (que filtra por is_active=true)
--   2. Frontend (components/modals/payment/index.tsx) → ahora usa whitelist
--      explícita: cualquier _promo_ no declarado se oculta por defecto
--   3. Backend (supabase/functions/_shared/promo-guard.ts) → ensurePromoEligible
--      rechaza HTTP 409 si el usuario ya compró una promo de la misma
--      categoría. Aplicado en mp/paypal/astropay checkouts.
-- =============================================================================

UPDATE public.service_packs
SET is_active = false,
    updated_at = now()
WHERE sku = 'privada_3cartas_promo_50'
  AND is_active = true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.service_packs
    WHERE sku = 'privada_3cartas_promo_50' AND is_active = false
  ) THEN
    RAISE NOTICE 'Pack "privada_3cartas_promo_50" desactivado correctamente.';
  END IF;
END $$;
