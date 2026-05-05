// Edge function: flash-owner-release
//
// Inverse of `flash-owner-takeover`. Lets the dashboard owner release a
// question that she previously took over but couldn't finish answering (e.g.
// the answer submission failed). The question goes back to status='open' so
// the rotation cron will re-assign it to a regular reader.
//
// Authorization model — same as flash-owner-takeover:
//   - JWT must be valid (verify_jwt = true).
//   - Caller must have role = 'tarotista'.
//   - Caller's email must match DASHBOARD_OWNER_EMAIL env var.
//   - The SQL function additionally enforces the caller is the current
//     assignee, so a non-owner reader cannot release someone else's takeover.

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

const releaseSchema = z.object({
  question_id: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

Deno.serve(async (req) => {
  const logger = createLogger(
    createContextFromRequest(req, "flash-owner-release"),
  );

  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST" && req.method !== "PATCH") {
      throw new HttpError(405, "Método no permitido");
    }

    return await handleRelease(req, logger);
  } catch (error) {
    logger.error("flash-owner-release failed", {
      error: error instanceof Error ? error.message : error,
    });
    return errorResponse(error);
  }
});

async function handleRelease(
  req: Request,
  logger: ReturnType<typeof createLogger>,
): Promise<Response> {
  const auth = await requireAuth(req, { roles: ["tarotista"] });
  const callerEmail = (auth.user.email ?? "").toLowerCase();

  if (callerEmail !== OWNER_EMAIL) {
    logger.warn("Release attempt from non-owner", {
      callerEmail,
      callerId: auth.user.id,
    });
    throw new HttpError(403, "Solo la dueña del dashboard puede usar esta acción");
  }

  const payload = await parseJsonBody(req, releaseSchema);

  // Atomic release via SQL function. The function enforces the question is
  // currently claimed by this reader with is_manual_override=true, otherwise
  // it raises an exception that we surface as 409.
  const { data: result, error: rpcError } = await supabaseAdmin.rpc(
    "flash_manual_release",
    {
      p_question_id: payload.question_id,
      p_reader_id: auth.profile.id,
      p_acted_by: auth.profile.id,
      p_reason: payload.reason ?? null,
    },
  );

  if (rpcError) {
    logger.error("flash_manual_release RPC failed", {
      error: rpcError.message,
      questionId: payload.question_id,
    });

    // Map known business-logic errors to 409 instead of 500
    const msg = rpcError.message ?? "";
    if (
      msg.includes("question_not_releasable") ||
      msg.includes("question_not_manually_overridden") ||
      msg.includes("release_not_authorized")
    ) {
      throw new HttpError(409, "La pregunta no se puede liberar", msg);
    }

    if (msg.includes("question_not_found") || msg.includes("session_not_found")) {
      throw new HttpError(404, "Pregunta o sesión no encontrada", msg);
    }

    throw new HttpError(500, "No se pudo liberar la pregunta", msg);
  }

  logger.info("Question released by owner", {
    questionId: payload.question_id,
    readerId: auth.profile.id,
  });

  return jsonResponse(
    {
      data: {
        question_id: payload.question_id,
        session_id: (result as { session_id: string } | null)?.session_id ?? null,
        released_at: (result as { released_at: string } | null)?.released_at ?? null,
      },
    },
    { headers: corsHeaders },
  );
}
