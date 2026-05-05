-- =============================================================================
-- Limpieza: cron job duplicado de auto-release de preguntas flash
--
-- Coexistían dos cron jobs ejecutando la misma función
-- auto_cancel_expired_flash_questions() cada 5 minutos:
--   1. 'auto-release-flash-questions'         — creado por migración
--                                                20251128_setup_auto_release_cron.sql
--   2. 'auto-cancel-expired-flash-questions'  — creado fuera de migraciones
--                                                (manualmente o sin commitear)
--
-- Como la función es idempotente, no había riesgo de corrupción de datos,
-- pero sí carga duplicada en la DB cada 5 minutos. Esta migración elimina
-- el segundo cron y mantiene el original.
--
-- Referencia: detectado al verificar el estado de los crons después de los
-- fixes de takeover (20260504*).
-- =============================================================================

SELECT cron.unschedule('auto-cancel-expired-flash-questions')
WHERE EXISTS (
  SELECT 1 FROM cron.job
  WHERE jobname = 'auto-cancel-expired-flash-questions'
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'auto-cancel-expired-flash-questions'
  ) THEN
    RAISE NOTICE 'Cron duplicado "auto-cancel-expired-flash-questions" eliminado.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'auto-release-flash-questions'
  ) THEN
    RAISE NOTICE 'Cron original "auto-release-flash-questions" sigue activo.';
  ELSE
    RAISE WARNING 'Cron original "auto-release-flash-questions" NO está registrado. Re-aplicar 20251128_setup_auto_release_cron.sql.';
  END IF;
END $$;
