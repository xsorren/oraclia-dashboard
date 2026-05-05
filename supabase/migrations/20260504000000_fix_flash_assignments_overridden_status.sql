-- =============================================================================
-- Fix: Add 'overridden' to flash_question_assignments status CHECK constraint
--
-- The flash_manual_takeover function (introduced in 20260425) sets status to
-- 'overridden' when an admin/owner manually takes over a question, but that
-- value was missing from the original CHECK constraint, causing an
-- INTERNAL_SERVER_ERROR when attempting to answer from the web dashboard.
-- =============================================================================

ALTER TABLE public.flash_question_assignments
  DROP CONSTRAINT IF EXISTS flash_question_assignments_status_check;

ALTER TABLE public.flash_question_assignments
  ADD CONSTRAINT flash_question_assignments_status_check
  CHECK (status IN ('pending', 'claimed', 'rotated', 'expired', 'overridden'));
