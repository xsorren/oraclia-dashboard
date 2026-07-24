'use client';

import { useToast } from '@/components/ui/Toast';
import { AdminApiError } from '@/lib/api/admin';
import { useCancelPrivateConsultation } from '@/lib/hooks/useConsultas';
import { AlertTriangle, Loader2, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';

export interface CancelPrivateConsultationTarget {
  /** consultation_sessions.id */
  id: string;
  status: string;
  serviceLabel: string;
  clientName: string;
  readerName?: string | null;
}

interface Props {
  consultation: CancelPrivateConsultationTarget;
  onClose: () => void;
  /** Se llama después de una cancelación exitosa (para cerrar modales padre). */
  onCancelled?: () => void;
}

/**
 * Cancela una consulta privada y le devuelve el crédito al cliente, que queda
 * libre para volver a consultar con otra tarotista.
 *
 * La cancelación forzada (consulta ya respondida) es un segundo paso explícito:
 * el backend responde 409 ALREADY_ANSWERED y recién ahí aparece la casilla.
 */
export function CancelPrivateConsultationModal({ consultation, onClose, onCancelled }: Props) {
  const { mutate: cancelConsultation, isPending } = useCancelPrivateConsultation();
  const { toast } = useToast();

  const [refund, setRefund] = useState(true);
  const [notes, setNotes] = useState('');
  const [force, setForce] = useState(false);
  // Se activa cuando el backend avisa que la tarotista ya respondió.
  const [answeredWarning, setAnsweredWarning] = useState(
    consultation.status === 'answered' || consultation.status === 'closed',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    cancelConsultation(
      {
        sessionId: consultation.id,
        refund,
        force,
        reason: 'devolucion_admin',
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          if (result.data.refund_mode === 'failed') {
            toast(
              result.message + (result.data.refund_error ? ` (${result.data.refund_error})` : ''),
              'error',
            );
          } else {
            toast(result.message, 'success');
          }
          onCancelled?.();
          onClose();
        },
        onError: (error) => {
          if (error instanceof AdminApiError && error.code === 'ALREADY_ANSWERED') {
            setAnsweredWarning(true);
            toast(error.message, 'error');
            return;
          }
          toast(error.message || 'Error al cancelar la consulta', 'error');
        },
      },
    );
  };

  const confirmLabel = force ? 'Cancelar de todos modos' : 'Cancelar consulta';

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
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 text-red-400 mb-4">
            <RotateCcw className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">Cancelar y devolver crédito</h2>
          <p className="text-sm text-slate-400 mb-5">
            La consulta queda cancelada y{' '}
            <span className="font-medium text-white">{consultation.clientName}</span> puede volver a
            consultar con otra tarotista.
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

          {answeredWarning && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 mb-5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <p className="font-medium text-amber-200 mb-1">La tarotista ya respondió.</p>
                  <p>
                    Si la cancelás igual, la consulta deja de contar para el pago pendiente de la
                    tarotista y el cliente recupera su crédito.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-amber-500/50"
                />
                <span className="text-xs font-medium text-amber-200">
                  Entiendo, cancelar igualmente
                </span>
              </label>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={refund}
                onChange={(e) => setRefund(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-600 bg-slate-950 text-purple-500 focus:ring-purple-500/50"
              />
              <span>
                <span className="block text-sm font-medium text-white">
                  Devolver el crédito al cliente
                </span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  Se le restituye 1 unidad del mismo servicio. Si no tiene un pack donde
                  restaurarla, se le otorga un crédito nuevo.
                </span>
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                placeholder="Ej: la tarotista no respondió, el cliente pidió cambiar de tarotista..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors resize-none h-20"
              />
              <p className="text-xs text-slate-500 mt-1">
                Queda registrado en el ledger junto con tu email de admin.
              </p>
            </div>

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
                disabled={isPending || (answeredWarning && !force)}
                className="flex-[2] flex justify-center items-center px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : confirmLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
