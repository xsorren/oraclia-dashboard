-- =============================================================================
-- Owner Release: revertir un takeover si el answer falla
--
-- Cuando la dueña del dashboard llama a flash-owner-takeover y la subida del
-- answer falla en pasos posteriores, hay que devolver la pregunta a la
-- rotación para que las tarotistas puedan volver a tomarla.
--
-- Cambios:
--   1. Permite el status 'released' en flash_question_assignments
--   2. Crea la función flash_manual_release() — inversa de flash_manual_takeover
-- =============================================================================

-- 1. Extender el CHECK constraint para incluir 'released'
ALTER TABLE public.flash_question_assignments
  DROP CONSTRAINT IF EXISTS flash_question_assignments_status_check;

ALTER TABLE public.flash_question_assignments
  ADD CONSTRAINT flash_question_assignments_status_check
  CHECK (status IN ('pending', 'claimed', 'rotated', 'expired', 'overridden', 'released'));

-- 2. Función inversa de flash_manual_takeover
--
-- Revierte la pregunta a 'open' para que la rotación la vuelva a asignar.
-- Solo puede liberarse si:
--   - La pregunta sigue en estado 'claimed' (sin haber sido respondida)
--   - is_manual_override = true (se tomó manualmente)
--   - El reader que llama es el mismo que tomó la pregunta
CREATE OR REPLACE FUNCTION public.flash_manual_release(
  p_question_id UUID,
  p_reader_id   UUID,
  p_acted_by    UUID,
  p_reason      TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id        UUID;
  v_current_round     INTEGER;
  v_question_status   TEXT;
  v_assigned_reader   UUID;
  v_is_manual         BOOLEAN;
  v_now               TIMESTAMPTZ := now();
BEGIN
  -- Lock para evitar carreras con la rotación cron
  SELECT gq.status, gq.current_assigned_reader_id, gq.rotation_round, gq.is_manual_override
  INTO   v_question_status, v_assigned_reader, v_current_round, v_is_manual
  FROM   public.global_questions gq
  WHERE  gq.id = p_question_id
  FOR UPDATE;

  IF v_question_status IS NULL THEN
    RAISE EXCEPTION 'question_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF v_question_status <> 'claimed' THEN
    RAISE EXCEPTION 'question_not_releasable: status=%', v_question_status USING ERRCODE = 'P0001';
  END IF;

  IF v_is_manual IS NOT TRUE THEN
    RAISE EXCEPTION 'question_not_manually_overridden' USING ERRCODE = 'P0001';
  END IF;

  IF v_assigned_reader <> p_reader_id THEN
    RAISE EXCEPTION 'release_not_authorized: caller is not current assignee' USING ERRCODE = 'P0001';
  END IF;

  SELECT cs.id INTO v_session_id
  FROM   public.consultation_sessions cs
  WHERE  cs.question_id = p_question_id
  LIMIT  1;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0001';
  END IF;

  -- 1. Marcar la asignación manual activa como 'released'
  UPDATE public.flash_question_assignments
  SET    status = 'released'
  WHERE  question_id = p_question_id
    AND  reader_id   = p_reader_id
    AND  status      = 'claimed'
    AND  is_manual   = true;

  -- 2. Revertir global_questions a 'open' y limpiar flags de override
  UPDATE public.global_questions
  SET    current_assigned_reader_id = NULL,
         claimed_by_reader_id       = NULL,
         claimed_at                 = NULL,
         status                     = 'open',
         is_manual_override         = false,
         manual_override_at         = NULL,
         manual_override_by         = NULL
  WHERE  id = p_question_id;

  -- 3. Revertir consultation_sessions a 'open'
  UPDATE public.consultation_sessions
  SET    status     = 'open',
         reader_id  = NULL,
         claimed_at = NULL,
         updated_at = v_now
  WHERE  id = v_session_id;

  -- 4. Audit log
  INSERT INTO public.flash_manual_override_log
    (question_id, session_id, acted_by, action,
     previous_reader_id, new_reader_id, rotation_round, reason)
  VALUES
    (p_question_id, v_session_id, p_acted_by, 'release',
     p_reader_id, NULL, v_current_round, p_reason);

  RETURN jsonb_build_object(
    'question_id',    p_question_id,
    'session_id',     v_session_id,
    'released_at',    v_now,
    'rotation_round', v_current_round
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.flash_manual_release(UUID, UUID, UUID, TEXT) TO service_role;
