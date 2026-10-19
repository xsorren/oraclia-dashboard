'use client';

import { useToast } from '@/components/ui/Toast';
import { AdminApiError } from '@/lib/api/admin';
import { useReassignFlashQuestion, useReassignPrivateConsultation } from '@/lib/hooks/useConsultas';
import { useTarotistas } from '@/lib/hooks/useTarotistas';
import { Check, Loader2, Search, Shuffle, X } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface ReassignConsultationTarget {
  /** 'private' → consultation_sessions.id · 'flash' → global_questions.id */
  kind: 'private' | 'flash';
  id: string;
  status: string;
  serviceLabel: string;
  clientName: string;
  /** Tarotista que la tiene hoy (se excluye de la lista de destino). */
  currentReaderId?: string | null;
  currentReaderName?: string | null;
}

interface Props {
  target: ReassignConsultationTarget;
  onClose: () => void;
  /** Se llama después de reasignar con éxito (para cerrar modales padre). */
  onReassigned?: () => void;
}

/**
 * Deriva una consulta a OTRA tarotista cuando la original no puede responder
 * (inactividad, baja, vacaciones). Alternativa a cancelar: la clienta no pierde
 * ni la consulta ni el crédito.
 *
 * - Privada: la sesión y el chat pasan a la nueva tarotista y quedan pendientes
 *   (sin vencimiento automático a las 5 h, igual que "Reabrir").
 * - Flash: la pregunta queda tomada por la tarotista elegida y sale de la
 *   rotación automática. Para devolverla al muro común se usa "Resetear".
 */
export function ReassignConsultationModal({ target, onClose, onReassigned }: Props) {
  const isFlash = target.kind === 'flash';
  const reassignPrivate = useReassignPrivateConsultation();
  const reassignFlash = useReassignFlashQuestion();
  const isPending = reassignPrivate.isPending || reassignFlash.isPending;
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [readerId, setReaderId] = useState<string | null>(null);
  const [notifyReader, setNotifyReader] = useState(true);
  const [notifyClient, setNotifyClient] = useState(true);
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useTarotistas({ status: 'active', limit: 100 });

  const candidates = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.data ?? [])
      .filter((reader) => reader.id !== target.currentReaderId)
      .filter((reader) => !term || (reader.display_name ?? '').toLowerCase().includes(term));
  }, [data, search, target.currentReaderId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!readerId) return;

    const common = {
      readerId,
      notifyReader,
      reason: 'reassign_admin',
      notes: notes.trim() || undefined,
    };
    const callbacks = {
      onSuccess: (result: { message: string }) => {
        toast(result.message, 'success');
        onReassigned?.();
        onClose();
      },
      onError: (error: unknown) => {
        toast(error instanceof AdminApiError ? error.message : 'Error al reasignar', 'error');
      },
    };

    if (isFlash) {
      reassignFlash.mutate({ ...common, questionId: target.id }, callbacks);
    } else {
      reassignPrivate.mutate({ ...common, notifyClient, sessionId: target.id }, callbacks);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isPending}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors z-10 disabled:opacity-50"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 mb-4">
            <Shuffle className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">
            Derivar {isFlash ? 'pregunta' : 'consulta'} a otra tarotista
          </h2>
          <p className="text-sm text-slate-400 mb-5">
            La {isFlash ? 'pregunta' : 'consulta'} de{' '}
            <span className="font-medium text-white">{target.clientName}</span> pasa a la
            tarotista que elijas. No se toca ningún crédito: la clienta no se queda sin
            respuesta.
          </p>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 mb-5 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Servicio</span>
              <span className="text-white text-right">{target.serviceLabel}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Tarotista actual</span>
              <span className="text-white text-right">{target.currentReaderName || 'Sin asignar'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Estado actual</span>
              <span className="text-white uppercase text-xs tracking-wide self-center">{target.status}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Derivar a</label>
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar tarotista..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors"
                />
              </div>
              <div
                role="listbox"
                aria-label="Tarotistas activas"
                className="max-h-52 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800"
              >
                {isLoading ? (
                  <div className="p-4 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                  </div>
                ) : candidates.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 text-center">
                    No hay tarotistas activas para derivar.
                  </p>
                ) : (
                  candidates.map((reader) => {
                    const selected = reader.id === readerId;
                    return (
                      <button
                        key={reader.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => setReaderId(reader.id)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition ${
                          selected ? 'bg-purple-500/15' : 'hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="text-sm text-white truncate">{reader.display_name}</span>
                        {selected && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className={`grid gap-3 ${isFlash ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyReader}
                  onChange={(e) => setNotifyReader(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-purple-500 focus:ring-purple-500/50"
                />
                <span className="text-xs font-medium text-white">Avisar a la nueva tarotista</span>
              </label>
              {!isFlash && (
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyClient}
                    onChange={(e) => setNotifyClient(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-purple-500 focus:ring-purple-500/50"
                  />
                  <span className="text-xs font-medium text-white">Avisar al cliente</span>
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                placeholder="Ej: la tarotista original está de vacaciones..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors resize-none h-20"
              />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {isFlash
                ? 'La pregunta sale de la rotación automática y queda reservada para la tarotista elegida. Si querés devolverla al muro para que la tome cualquiera, usá "Resetear".'
                : 'La consulta derivada ya no se auto-expira a las 5 h: si la nueva tarotista tampoco responde, cancelala desde acá y devolvele el crédito al cliente. Solo se puede derivar una consulta que todavía no tiene respuesta.'}
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
                disabled={isPending || !readerId}
                className="flex-[2] flex justify-center items-center px-4 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-400 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Derivar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
