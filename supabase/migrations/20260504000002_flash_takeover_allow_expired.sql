-- =============================================================================
-- Allow owner takeover for expired flash questions
--
-- Extiende flash_manual_takeover() para que la dueña del dashboard pueda
-- rescatar consultas que vencieron sin respuesta (status='expired').
--
-- Comportamiento:
--   - Acepta status IN ('open', 'claimed', 'expired')
--   - Para 'expired': revive la consulta volviendo question + session a 'claimed'
--   - El crédito ya fue reembolsado al cliente cuando expiró; al responder no
--     se vuelve a cobrar (la respuesta es un "extra" que entrega el dueño)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.flash_manual_takeover(
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
  v_session_id      UUID;
  v_current_round   INTEGER;
  v_question_status TEXT;
  v_prev_reader_id  UUID;
  v_now             TIMESTAMPTZ := now();
BEGIN
  -- Lock the question row to avoid races with the rotation cron
  SELECT gq.status, gq.current_assigned_reader_id, gq.rotation_round
  INTO   v_question_status, v_prev_reader_id, v_current_round
  FROM   public.global_questions gq
  WHERE  gq.id = p_question_id
  FOR UPDATE;

  IF v_question_status IS NULL THEN
    RAISE EXCEPTION 'question_not_found' USING ERRCODE = 'P0001';
  END IF;

  -- 'open' / 'claimed': flujo normal de takeover
  -- 'expired': rescate de consulta vencida sin respuesta
  IF v_question_status NOT IN ('open', 'claimed', 'expired') THEN
    RAISE EXCEPTION 'question_not_takeable: status=%', v_question_status USING ERRCODE = 'P0001';
  END IF;

  SELECT cs.id INTO v_session_id
  FROM   public.consultation_sessions cs
  WHERE  cs.question_id = p_question_id
  LIMIT  1;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0001';
  END IF;

  -- 1. Mark any active pending assignment as overridden
  UPDATE public.flash_question_assignments
  SET    status = 'overridden'
  WHERE  question_id = p_question_id
    AND  status      = 'pending';

  -- 2. Insert the manual claim record (long expiry — owner is committing
  --    to answer; rotation will not touch it because of is_manual_override).
  INSERT INTO public.flash_question_assignments
    (question_id, session_id, reader_id, assigned_at, expires_at, status, round, is_manual)
  VALUES
    (p_question_id, v_session_id, p_reader_id,
     v_now, v_now + interval '24 hours', 'claimed', v_current_round, true);

  -- 3. Update question pointers + flags. Para 'expired' también limpiamos
  --    expired_at/answered_at que pudieran haber quedado seteados, para que
  --    la consulta vuelva a un estado coherente de 'claimed'.
  UPDATE public.global_questions
  SET    current_assigned_reader_id = p_reader_id,
         claimed_by_reader_id       = p_reader_id,
         claimed_at                 = v_now,
         status                     = 'claimed',
         is_manual_override         = true,
         manual_override_at         = v_now,
         manual_override_by         = p_acted_by
  WHERE  id = p_question_id;

  -- 4. Sync the consultation session
  UPDATE public.consultation_sessions
  SET    status     = 'claimed',
         reader_id  = p_reader_id,
         claimed_at = v_now,
         updated_at = v_now
  WHERE  id = v_session_id;

  -- 5. Audit log
  INSERT INTO public.flash_manual_override_log
    (question_id, session_id, acted_by, action,
     previous_reader_id, new_reader_id, rotation_round, reason)
  VALUES
    (p_question_id, v_session_id, p_acted_by, 'takeover',
     v_prev_reader_id, p_reader_id, v_current_round,
     -- Anotar el status original en el reason si no se pasó uno explícito,
     -- para tener trazabilidad de takeovers de rescate.
     COALESCE(p_reason, 'rescue_from_' || v_question_status));

  RETURN jsonb_build_object(
    'question_id',     p_question_id,
    'session_id',      v_session_id,
    'reader_id',       p_reader_id,
    'rotation_round',  v_current_round,
    'claimed_at',      v_now,
    'previous_status', v_question_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.flash_manual_takeover(UUID, UUID, UUID, TEXT) TO service_role;
