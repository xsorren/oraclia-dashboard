// Edge function: flash-owner-takeover
//
// Lets the dashboard owner (a single tarotista identified by email) grab a
// flash question out of the rotation pool and claim it for herself, even if
// it was assigned to a different reader at the time. After this call returns
// successfully, the owner can submit the answer through the existing
// `global-questions-answer` endpoint as if she had been the assigned reader
// all along.
//
// Authorization model:
//   - JWT must be valid (verify_jwt = true).
//   - Caller must have role = 'tarotista' (the owner is also a reader).
//   - Caller's email must match the OWNER_EMAIL env var (defaults to
//     locutoramajo@hotmail.com — the configured dashboard owner).
//
// All side effects are wrapped inside the SQL function `flash_manual_takeover`
// so the transition is atomic.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { z } from "npm:zod@3.24.1";
import {
  corsHeaders,
  createContextFromRequest,
  createLogger,
  errorResponse,
  HttpError,
  jsonResponse,
  parseJsonBody,
  requireAuth,
  supabaseAdmin,
} from "../_shared/index.ts";

const OWNER_EMAIL = (
  Deno.env.get("DASHBOARD_OWNER_EMAIL") ?? "locutoramajo@hotmail.com"
).toLowerCase();

const takeoverSchema = z.object({
  question_id: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

Deno.serve(async (req) => {
  const logger = createLogger(
    createContextFromRequest(req, "flash-owner-takeover"),
  );

  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST" && req.method !== "PATCH") {
      throw new HttpError(405, "Método no permitido");
    }

    return await handleTakeover(req, logger);
  } catch (error) {
    logger.error("flash-owner-takeover failed", {
      error: error instanceof Error ? error.message : error,
    });
    return errorResponse(error);
  }
});

async function handleTakeover(
  req: Request,
  logger: ReturnType<typeof createLogger>,
): Promise<Response> {
  // Auth: any tarotista can hit the endpoint, but we additionally gate by the
  // dashboard owner email so a leaked endpoint cannot be abused.
  const auth = await requireAuth(req, { roles: ["tarotista"] });
  const callerEmail = (auth.user.email ?? "").toLowerCase();

  if (callerEmail !== OWNER_EMAIL) {
    logger.warn("Takeover attempt from non-owner", {
      callerEmail,
      callerId: auth.user.id,
    });
    throw new HttpError(403, "Solo la dueña del dashboard puede usar esta acción");
  }

  const payload = await parseJsonBody(req, takeoverSchema);

  // Verify the question exists and is in a takeable state. The SQL function
  // re-checks under FOR UPDATE, but a friendly pre-flight 404/409 is nicer.
  const { data: question, error: questionError } = await supabaseAdmin
    .from("global_questions")
    .select("id, status, current_assigned_reader_id, is_manual_override, rotation_round")
    .eq("id", payload.question_id)
    .maybeSingle();

  if (questionError) {
    throw new HttpError(500, "Error al consultar la pregunta", questionError.message);
  }

  if (!question) {
    throw new HttpError(404, "Pregunta no encontrada");
  }

  // 'open' / 'claimed': flujo normal
  // 'expired': rescate de consulta vencida sin respuesta — la dueña puede
  //            tomarla y responderla aunque el cliente ya haya recibido el
  //            reembolso del crédito.
  if (!["open", "claimed", "expired"].includes(question.status)) {
    throw new HttpError(
      409,
      `La pregunta no se puede tomar (estado actual: ${question.status})`,
    );
  }

  // Atomic takeover via SQL function
  const { data: result, error: rpcError } = await supabaseAdmin.rpc(
    "flash_manual_takeover",
    {
      p_question_id: payload.question_id,
      p_reader_id: auth.profile.id,
      p_acted_by: auth.profile.id,
      p_reason: payload.reason ?? null,
    },
  );

  if (rpcError) {
    logger.error("flash_manual_takeover RPC failed", {
      error: rpcError.message,
      questionId: payload.question_id,
    });
    throw new HttpError(500, "No se pudo tomar la pregunta", rpcError.message);
  }

  logger.info("Question taken over by owner", {
    questionId: payload.question_id,
    readerId: auth.profile.id,
    rotationRound: question.rotation_round,
  });

  return jsonResponse(
    {
      data: {
        question_id: payload.question_id,
        session_id: (result as { session_id: string } | null)?.session_id ?? null,
        reader_id: auth.profile.id,
        claimed_at: (result as { claimed_at: string } | null)?.claimed_at ?? null,
        rotation_round:
          (result as { rotation_round: number } | null)?.rotation_round ??
          question.rotation_round ??
          1,
      },
    },
    { headers: corsHeaders },
  );
}
