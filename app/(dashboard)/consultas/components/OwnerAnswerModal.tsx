'use client';

import { SignedAvatar } from '@/components/common/SignedAvatar';
import { useToast } from '@/components/ui/Toast';
import type { FlashQuestion } from '@/lib/api/admin';
import { useOwnerAnswerFlashQuestion } from '@/lib/hooks/useConsultas';
import { formatDateTime } from '@/lib/utils/dates';
import { Image as ImageIcon, Loader2, MessageSquare, Send, User, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  question: FlashQuestion;
  onClose: () => void;
}

const MIN_BODY_LENGTH = 20;
const MAX_BODY_LENGTH = 2000;
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Bottom-of-rotation emergency modal — lets the dashboard owner reply directly
 * to a flash question (claim + answer in one flow). Mirrors the mobile
 * tarotista answer modal: textarea (20-2000 chars) + single image attachment.
 */
export function OwnerAnswerModal({ question, onClose }: Props) {
  const { toast } = useToast();
  const mutation = useOwnerAnswerFlashQuestion();

  const [bodyText, setBodyText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup the object URL when the file changes/closes
  useEffect(() => {
    if (!imageFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const charCount = bodyText.trim().length;
  const isBodyValid = charCount >= MIN_BODY_LENGTH && charCount <= MAX_BODY_LENGTH;
  const canSubmit = isBodyValid && !!imageFile && !mutation.isPending;

  const charCountColor = useMemo(() => {
    if (charCount > MAX_BODY_LENGTH) return 'text-red-400';
    if (charCount < MIN_BODY_LENGTH) return 'text-amber-400';
    return 'text-emerald-400';
  }, [charCount]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME.includes(file.type)) {
      setError('Formato no permitido. Usa JPG, PNG o WEBP.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError('La imagen supera el límite de 8 MB.');
      e.target.value = '';
      return;
    }

    setImageFile(file);
  }

  function handleClearImage() {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit() {
    setError(null);

    if (!isBodyValid) {
      setError(
        charCount < MIN_BODY_LENGTH
          ? `La respuesta debe tener al menos ${MIN_BODY_LENGTH} caracteres.`
          : `La respuesta no puede superar los ${MAX_BODY_LENGTH} caracteres.`,
      );
      return;
    }

    if (!imageFile) {
      setError('Debes adjuntar una imagen con la respuesta.');
      return;
    }

    try {
      await mutation.mutateAsync({
        questionId: question.id,
        bodyText: bodyText.trim(),
        imageFile,
        reason: 'Respuesta directa desde el dashboard',
      });
      toast('Respuesta enviada correctamente', 'success');
      onClose();
    } catch (e) {
      const msg = (e as Error).message || 'Error al enviar la respuesta';
      setError(msg);
      toast(msg, 'error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              <SignedAvatar
                src={question.user?.avatar_url}
                alt=""
                className="w-full h-full object-cover"
                fallback={<User className="w-5 h-5 text-slate-400" />}
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white truncate">
                {question.user?.display_name || 'Desconocido'}
              </h3>
              <p className="text-xs text-slate-400">{formatDateTime(question.created_at)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="p-1.5 hover:bg-slate-800 rounded-lg disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Question content */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Pregunta
              </h4>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{question.content}</p>
            </div>
          </section>

          {/* Answer composer */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Tu respuesta
              </h4>
              <span className={`text-xs font-mono ${charCountColor}`}>
                {charCount}/{MAX_BODY_LENGTH}
              </span>
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              disabled={mutation.isPending}
              placeholder={`Escribe tu respuesta (mínimo ${MIN_BODY_LENGTH} caracteres)...`}
              rows={8}
              maxLength={MAX_BODY_LENGTH}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 disabled:opacity-50 resize-none"
            />
          </section>

          {/* Image attachment */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-medium flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" />
                Imagen de la carta
                <span className="text-red-400 normal-case">obligatoria</span>
              </h4>
              {imageFile && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  disabled={mutation.isPending}
                  className="text-xs text-slate-400 hover:text-red-400 disabled:opacity-50"
                >
                  Quitar
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={mutation.isPending}
              className="hidden"
              id="owner-answer-image-input"
            />

            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full max-h-64 object-contain bg-slate-950"
                />
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-slate-900/90 rounded text-xs text-slate-300">
                  {(imageFile!.size / 1024).toFixed(0)} KB
                </div>
              </div>
            ) : (
              <label
                htmlFor="owner-answer-image-input"
                className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/30 rounded-lg cursor-pointer transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-slate-500" />
                <span className="text-sm text-slate-400">
                  Click para seleccionar una imagen
                </span>
                <span className="text-xs text-slate-600">
                  JPG, PNG o WEBP · máx 8 MB
                </span>
              </label>
            )}
          </section>

          {/* Error banner */}
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar respuesta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
