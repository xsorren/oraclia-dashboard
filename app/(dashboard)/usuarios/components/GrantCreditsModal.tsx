'use client';

import { useToast } from '@/components/ui/Toast';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import { useGrantEntitlement } from '@/lib/hooks/useUsers';
import { Gift, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface GrantCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; name: string } | null;
}

export function GrantCreditsModal({ isOpen, onClose, user }: GrantCreditsModalProps) {
  const { data: config, isLoading: isConfigLoading } = useConfiguration();
  const { mutate: grantEntitlement, isPending } = useGrantEntitlement();
  const { toast } = useToast();

  const [reason, setReason] = useState<'regalo' | 'devolucion' | 'otro'>('regalo');
  const [packSku, setPackSku] = useState('');
  const [notes, setNotes] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const resetAndClose = useCallback(() => {
    setReason('regalo');
    setPackSku('');
    setNotes('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        resetAndClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, resetAndClose]);

  if (!isOpen || !user) return null;

  const packs = config?.packs || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!packSku) {
      toast('Por favor, selecciona un paquete o servicio.', 'error');
      return;
    }

    grantEntitlement(
      { userId: user.id, params: { pack_sku: packSku, reason, notes } },
      {
        onSuccess: (res) => {
          toast(res.message || 'Acceso otorgado correctamente', 'success');
          resetAndClose();
        },
        onError: (err) => {
          toast(err.message || 'Error al otorgar créditos', 'error');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={resetAndClose}
      />

      {/* Modal */}
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="grant-entitlement-title" aria-describedby="grant-entitlement-description" className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Cerrar"
          onClick={resetAndClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 mb-4">
            <Gift className="w-6 h-6" />
          </div>

          <h2 id="grant-entitlement-title" className="text-xl font-semibold text-white mb-2">
            Gestionar accesos y créditos
          </h2>
          <p id="grant-entitlement-description" className="text-sm text-slate-400 mb-6">
            Otorga un pack, un servicio o el acceso al curso a <span className="font-medium text-white">{user.name}</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="grant-reason" className="block text-sm font-medium text-slate-300 mb-1.5">
                Motivo
              </label>
              <select
                id="grant-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors"
                required
              >
                <option value="regalo">🎁 Regalo / Cortesía</option>
                <option value="devolucion">↩️ Devolución / Reintegro</option>
                <option value="otro">📝 Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="grant-pack" className="block text-sm font-medium text-slate-300 mb-1.5">
                Paquete / Servicio a otorgar
              </label>
              <select
                id="grant-pack"
                value={packSku}
                onChange={(e) => setPackSku(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors"
                required
                disabled={isConfigLoading}
              >
                <option value="" disabled>Seleccionar...</option>
                {packs.map((pack) => (
                  <option key={pack.id} value={pack.sku}>
                    {pack.name} {pack.sku === 'curso_tarot_lifetime' ? '(1 año de acceso)' : `(${pack.quantity_units} unid.)`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="grant-notes" className="block text-sm font-medium text-slate-300 mb-1.5">
                Notas (opcional)
              </label>
              <textarea
                id="grant-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Recompensa por bug, devolución por lectura cancelada..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors resize-none h-20"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={resetAndClose}
                className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition font-medium"
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || isConfigLoading}
                className="flex-[2] flex justify-center items-center px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Otorgar acceso'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
