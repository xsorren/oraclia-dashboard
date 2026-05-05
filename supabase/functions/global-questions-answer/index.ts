// Flash Question Answer Handler
// Validates reader permissions, updates consultation_sessions, records media, posts answer
// Uses packs model (pack_consume_flash)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { z } from "npm:zod";
import { ALL_FLASH_SERVICE_KINDS } from "../_shared/constants.ts";
import {
  createContextFromRequest,
  createLogger,
  errorResponse,
  HttpError,
  jsonResponse,
  parseJsonBody,
  requireAuth,
  SESSION_STATUS,
  supabaseAdmin
} from "../_shared/index.ts";
import { getAdminObserverIds, NotificationTemplates, sendPushNotification } from "../_shared/notifications.ts";

const answerSchema = z.object({
  session_id: z.string().uuid(), // consultation_sessions.id
  body_text: z.string().min(1).max(4000),
  storage_paths: z.array(z.string().min(1)).min(1).max(10),
});


Deno.serve(async (req) => {
  const logger = createLogger(createContextFromRequest(req, 'global-questions-answer'));
  logger.info('Incoming request');

  try {
    if (req.method === "OPTIONS") {
      logger.debug('Handling OPTIONS request');
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (req.method !== "POST") {
      logger.warn('Invalid HTTP method', { method: req.method });
      throw new HttpError(405, "Método no permitido");
    }

    return await handleCreateAnswer(req, logger);
  } catch (error) {
    logger.error('Request failed', { error: error instanceof Error ? error.message : error });
    return errorResponse(error);
  }
});

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Idempotency-Key",
  };
}

async function handleCreateAnswer(req: Request, logger: ReturnType<typeof createLogger>): Promise<Response> {
  logger.debug('Authenticating request');
  const auth = await requireAuth(req, { roles: ["tarotista"] });
  logger.info('User authenticated', { userId: auth.profile.id, role: auth.role });

  const idempotencyKey = req.headers.get("X-Idempotency-Key")?.trim();
  if (!idempotencyKey) {
    throw new HttpError(400, "Falta X-Idempotency-Key");
  }

  const payload = await parseJsonBody(req, answerSchema);

  // Idempotent retry: if this idempotency key was already used by this reader,
  // return the previously-created answer instead of creating a duplicate
  // (which would violate the UNIQUE constraint on global_answers.question_id).
  const existing = await findIdempotentAnswer(auth.profile.id, idempotencyKey);
  if (existing) {
    logger.info('Returning idempotent answer', { answerId: existing.answer.id, idempotencyKey });
    return jsonResponse(
      { data: { answer: existing.answer }, idempotent: true },
      { headers: corsHeaders() }
    );
  }

  const bodyText = payload.body_text.trim();
  if (!bodyText) {
    throw new HttpError(400, "El cuerpo de la respuesta no puede estar vacío");
  }

  const storagePaths = Array.from(new Set(payload.storage_paths));
  if (storagePaths.length === 0) {
    throw new HttpError(422, "Debes adjuntar al menos un archivo");
  }

  // Validate NO AUDIO in flash answers (image only)
  const hasAudio = storagePaths.some((path) =>
    path.toLowerCase().match(/\.(mp3|wav|aac|m4a|ogg)$/i)
  );

  if (hasAudio) {
    throw new HttpError(422, "Las preguntas flash no permiten respuestas de audio. Solo imágenes.");
  }

  const hasImage = storagePaths.some((path) =>
    path.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
  );

  if (!hasImage) {
    throw new HttpError(422, "Debes adjuntar al menos una imagen");
  }

  // Fetch and validate consultation session (NEW MODEL)
  const session = await fetchConsultationSession(payload.session_id);
  if (!session) {
    throw new HttpError(404, "Sesión de consulta no encontrada");
  }

  if (session.reader_id !== auth.profile.id) {
    throw new HttpError(403, "Solo el tarotista de esta sesión puede responderla");
  }

  if (!ALL_FLASH_SERVICE_KINDS.includes(session.service_kind as any) && session.service_kind !== "global") {
    throw new HttpError(400, "Esta sesión es de consulta privada, no flash");
  }

  if (session.status !== SESSION_STATUS.CLAIMED) {
    throw new HttpError(409, "La sesión ya no está disponible (debe estar en estado 'claimed')");
  }

  // Fetch question to get context
  const question = await fetchQuestion(session.question_id!);
  if (!question) {
    throw new HttpError(404, "Pregunta asociada no encontrada");
  }

  const answerId = crypto.randomUUID();

  // Prepare media attachments (images only)
  const mediaAttachments = storagePaths.map((path) => {
    const extension = path.split(".").pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };

    return {
      scope: "global_answer",
      media_kind: "image",
      storage_path: path,
      mime: extension ? mimeMap[extension] || "application/octet-stream" : "application/octet-stream",
      size_bytes: null,
      width: null,
      height: null,
      thumbnail_path: null,
    };
  });

  // Create answer atomically via RPC
  const { data: answerData, error: rpcError } = await supabaseAdmin.rpc(
    "create_answer_with_media",
    {
      p_answer_id: answerId,
      p_question_id: session.question_id,
      p_reader_id: auth.profile.id,
      p_body_text: bodyText,
      p_media_attachments: mediaAttachments,
    }
  );

  if (rpcError) {
    console.error("RPC create_answer_with_media failed", { answerId, error: rpcError });
    throw new HttpError(500, "No se pudo registrar la respuesta", rpcError.message);
  }

  // Update consultation_sessions status to 'answered'
  const answeredAt = new Date().toISOString();
  const { error: sessionUpdateError } = await supabaseAdmin
    .from("consultation_sessions")
    .update({
      status: SESSION_STATUS.ANSWERED,
      answered_at: answeredAt,
    })
    .eq("id", payload.session_id);

  if (sessionUpdateError) {
    console.error("Failed to update session to answered", sessionUpdateError);
    throw new HttpError(500, "No se pudo actualizar estado de sesión", sessionUpdateError.message);
  }

  // Also update global_questions table to sync status
  if (session.question_id) {
    const { error: questionError } = await supabaseAdmin
      .from("global_questions")
      .update({
        status: SESSION_STATUS.ANSWERED,
        answered_at: answeredAt,
      })
      .eq("id", session.question_id);

    if (questionError) {
      console.error("Failed to update global_questions after answer", questionError);
      // Don't fail the whole operation, but log it
    }
  }

  // Record in ledger as 'answer_submitted'.
  // The idempotency_key is the X-Idempotency-Key header so a retry with the
  // same key short-circuits to findIdempotentAnswer() above instead of
  // attempting to create a duplicate.
  const { error: ledgerError } = await supabaseAdmin
    .from("ledger")
    .insert({
      user_id: auth.profile.id,
      entry_type: "credit",
      ref_type: "answer_submitted",
      ref_id: payload.session_id,
      idempotency_key: idempotencyKey,
      metadata: { question_id: session.question_id, answer_id: answerId },
    });

  if (ledgerError) {
    console.error("Failed to record in ledger", ledgerError);
    // Continue anyway - answer is created, just log issue
  }

  // Fetch attachments to return
  const { data: attachments } = await supabaseAdmin
    .from("media_attachments")
    .select("id, media_kind, storage_path, thumbnail_path, mime, size_bytes, created_at")
    .eq("linked_id", answerId)
    .eq("scope", "global_answer")
    .order("created_at", { ascending: true });

  const answer = answerData[0];

  // Notify question asker
  await notifyQuestionUserAnswered(session.question_id!, session.user_id).catch((err) => {
    console.error("Error notificando respuesta", err);
  });

  return jsonResponse(
    {
      data: {
        answer: {
          id: answer.answer_id,
          question_id: answer.question_id,
          reader_id: answer.reader_id,
          body_text: answer.body_text,
          created_at: answer.created_at,
          media: attachments ?? [],
        },
      },
    },
    { headers: corsHeaders() }
  );
}

/**
 * Look up a previously-created answer by idempotency key, by joining the ledger
 * entry written at the end of a successful POST. Returns null if the key is new.
 *
 * The ledger row's `metadata.answer_id` is the source of truth for the answer
 * UUID; we then fetch the full answer + attachments to return the same shape
 * as a successful first call.
 */
async function findIdempotentAnswer(readerId: string, idempotencyKey: string) {
  const { data: ledgerEntry, error } = await supabaseAdmin
    .from("ledger")
    .select("id, ref_id, metadata")
    .eq("user_id", readerId)
    .eq("idempotency_key", idempotencyKey)
    .eq("ref_type", "answer_submitted")
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new HttpError(500, "No se pudo verificar idempotencia", error.message);
  }

  if (!ledgerEntry) {
    return null;
  }

  const answerId = (ledgerEntry.metadata as { answer_id?: string } | null)?.answer_id;
  if (!answerId) {
    return null;
  }

  const { data: answer, error: answerError } = await supabaseAdmin
    .from("global_answers")
    .select("id, question_id, reader_id, body_text, created_at")
    .eq("id", answerId)
    .maybeSingle();

  if (answerError || !answer) {
    return null;
  }

  const { data: attachments } = await supabaseAdmin
    .from("media_attachments")
    .select("id, media_kind, storage_path, thumbnail_path, mime, size_bytes, created_at")
    .eq("linked_id", answerId)
    .eq("scope", "global_answer")
    .order("created_at", { ascending: true });

  return {
    answer: {
      id: answer.id,
      question_id: answer.question_id,
      reader_id: answer.reader_id,
      body_text: answer.body_text,
      created_at: answer.created_at,
      media: attachments ?? [],
    },
  };
}

async function fetchConsultationSession(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("consultation_sessions")
    .select("id, user_id, reader_id, question_id, thread_id, service_kind, status, claimed_at, answered_at, created_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new HttpError(500, "No se pudo obtener la sesión", error.message);
  }

  return data ?? null;
}

async function fetchQuestion(questionId: string) {
  const { data, error } = await supabaseAdmin
    .from("global_questions")
    .select("id, user_id, service_id, content, status, created_at")
    .eq("id", questionId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new HttpError(500, "No se pudo obtener la pregunta", error.message);
  }

  return data ?? null;
}

/**
 * Notificar al usuario que su pregunta fue respondida
 * Usa el helper centralizado de notificaciones
 */
async function notifyQuestionUserAnswered(questionId: string, userId: string) {
  const notification = NotificationTemplates.flashAnswered(userId, questionId);
  const result = await sendPushNotification(notification);

  if (!result.success) {
    console.warn("Failed to notify user about answer", { userId, questionId, error: result.error });
  } else {
    console.info("Answer notification sent", { userId, questionId });
  }

  // Notificar a admin observers (excluyendo al usuario si coincide)
  const adminIds = await getAdminObserverIds();
  const newAdminIds = adminIds.filter(id => id !== userId);
  if (newAdminIds.length > 0) {
    await sendPushNotification({ ...notification, userIds: newAdminIds });
  }
}

/* To invoke locally:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/global-questions-answer' \\
    --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
    --header 'Content-Type: application/json' \\
    --data '{"session_id":"00000000-0000-0000-0000-000000000000","body_text":"Tu respuesta","storage_paths":["answers/12345.jpg"]}'

*/
