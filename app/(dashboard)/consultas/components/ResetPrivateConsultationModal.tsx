'use client';

import { useToast } from '@/components/ui/Toast';
import { AdminApiError } from '@/lib/api/admin';
import { useResetPrivateConsultation } from '@/lib/hooks/useConsultas';
import { AlertTriangle, Loader2, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

export interface ResetPrivateConsultationTarget {
  /** consultation_sessions.id */
  id: string;
  status: string;
  serviceLabel: string;
  clientName: string;
  readerName?: string | null;
}

interface Props {
  consultation: ResetPrivateConsultationTarget;
  onClose: () => void;
  /** Se llama después de un reset exitoso (para cerrar modales padre). */
  onReset?: () => void;
}

/** Una consulta ya respondida pierde el pago pendiente de la tarotista al resetearse. */
function wasAnswered(status: string): boolean {
  return status === 'answered' || status === 'closed';
}

/**
 * Reabre una consulta privada: borra la respuesta de la tarotista y la deja
 * pendiente otra vez, con la MISMA tarotista y sin tocar créditos.
 *
 * Es la alternativa a cancelar cuando lo que hace falta es que la consulta se
 * responda de nuevo (respuesta equivocada, imagen de otra clienta, audio
 * cortado) en vez de devolverle el crédito al cliente.
 */
export function ResetPrivateConsultationModal({ consultation, onClose, onReset }: Props) {
  const { mutate: resetConsultation, isPending } = useResetPrivateConsultation();
  const { toast } = useToast();

  const [deleteAnswer, setDeleteAnswer] = useState(true);
  const [notifyReader, setNotifyReader] = useState(true);
  const [notifyClient, setNotifyClient] = useState(true);
  const [notes, setNotes] = useState('');

  const answered = wasAnswered(consultation.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    resetConsultation(
      {
        sessionId: consultation.id,
        deleteAnswer,
        notifyReader,
        notifyClient,
        reason: 'reset_admin',
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          toast(result.message, 'success');
          onReset?.();
          onClose();
        },
        onError: (error) => {
          const message = error instanceof AdminApiError
            ? error.message
            : 'Error al reabrir la consulta';
          toast(message, 'error');
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isPending}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors z-10 disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 mb-4">
            <RefreshCw className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">Reabrir consulta</h2>
          <p className="text-sm text-slate-400 mb-5">
            La consulta de{' '}
            <span className="font-medium text-white">{consultation.clientName}</span> vuelve a
            quedar pendiente para{' '}
            <span className="font-medium text-white">
              {consultation.readerName || 'la misma tarotista'}
            </span>
            . No se toca ningún crédito.
          </p>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 mb-5 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Servicio</span>
              <span className="text-white text-right">{consultation.serviceLabel}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Tarotista</span>
              <span className="text-white text-right">{consultation.readerName || 'Sin asignar'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Estado actual</span>
              <span className="text-white uppercase text-xs tracking-wide self-center">
                {consultation.status}
              </span>
            </div>
          </div>

          {answered && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 mb-5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <p className="font-medium text-amber-200 mb-1">La tarotista ya respondió.</p>
                  <p>
                    Mientras la consulta esté reabierta deja de contar para su pago pendiente;
                    vuelve a contar en cuanto la responda de nuevo.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deleteAnswer}
                onChange={(e) => setDeleteAnswer(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-600 bg-slate-950 text-purple-500 focus:ring-purple-500/50"
              />
              <span>
                <span className="block text-sm font-medium text-white">
                  Borrar la respuesta de la tarotista
                </span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  Se eliminan sus mensajes y las imágenes/audios adjuntos. La pregunta del
                  cliente se conserva. Si lo destildás, la respuesta queda en el chat y la
                  consulta igual vuelve a estar pendiente.
                </span>
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyReader}
                  onChange={(e) => setNotifyReader(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-purple-500 focus:ring-purple-500/50"
                />
                <span className="text-xs font-medium text-white">Avisar a la tarotista</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyClient}
                  onChange={(e) => setNotifyClient(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-purple-500 focus:ring-purple-500/50"
                />
                <span className="text-xs font-medium text-white">Avisar al cliente</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                placeholder="Ej: mandó la foto de otra tirada, el audio se cortó..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors resize-none h-20"
              />
              <p className="text-xs text-slate-500 mt-1">
                Queda registrado en el ledger junto con tu email de admin.
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Una consulta reabierta ya no se auto-expira a las 5 h: si la tarotista no
              responde, cancelala desde acá y devolvele el crédito al cliente.
            </p>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition font-medium disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-[2] flex justify-center items-center px-4 py-2.5 bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reabrir consulta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
