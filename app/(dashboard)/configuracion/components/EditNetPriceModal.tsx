'use client';

import type { NetPrice, ServicePack } from '@/lib/api/admin';
import { useUpdateNetPrice } from '@/lib/hooks/useConfiguration';
import { formatCurrency } from '@/lib/utils/currency';
import { getServiceEmoji, getServiceName } from '@/lib/utils/services';
import { Loader2, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EditNetPriceModalProps {
  netPrice: NetPrice | null;
  packs: ServicePack[];
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

/**
 * Universal modal for editing the tarotista net payout for a given service.
 * Used both on desktop (replaces inline editing in NetPriceRow) and mobile
 * (only entry point — mobile cards open this).
 *
 * Shows a live preview of the platform margin for the matching x1 pack so
 * the owner can spot configurations where the net price exceeds the user-
 * facing pack price (negative margin).
 */
export function EditNetPriceModal({ netPrice, packs, onClose, onToast }: EditNetPriceModalProps) {
  const { mutate: updateNetPrice, isPending } = useUpdateNetPrice();

  const [ars, setArs] = useState('');
  const [usd, setUsd] = useState('');
  const [eur, setEur] = useState('');

  useEffect(() => {
    if (netPrice) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArs(String(netPrice.price_ars));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsd(String(netPrice.price_usd));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEur(String(netPrice.price_eur));
    }
  }, [netPrice]);

  if (!netPrice) return null;

  const parsedArs = parseFloat(ars) || 0;
  const parsedUsd = parseFloat(usd) || 0;
  const parsedEur = parseFloat(eur) || 0;

  // x1 pack of the same service_kind — used to preview platform margin
  const x1Pack = packs.find(
    (p) => p.service_kind === netPrice.service_kind && p.quantity_units === 1,
  );

  const platformArs = x1Pack ? x1Pack.price_ars - parsedArs : null;
  const platformUsd = x1Pack ? x1Pack.price_usd - parsedUsd : null;
  const platformEur = x1Pack ? x1Pack.price_eur - parsedEur : null;
  const marginPct =
    x1Pack && x1Pack.price_ars > 0 && platformArs !== null
      ? Math.round((platformArs / x1Pack.price_ars) * 100)
      : null;

  const hasError = parsedArs <= 0 || parsedUsd <= 0 || parsedEur <= 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasError) {
      onToast('Todos los precios deben ser mayores a 0', 'error');
      return;
    }

    updateNetPrice(
      {
        serviceKind: netPrice!.service_kind,
        prices: { price_ars: parsedArs, price_usd: parsedUsd, price_eur: parsedEur },
      },
      {
        onSuccess: (res) => {
          onToast(res.message || 'Precio actualizado', 'success');
          onClose();
        },
        onError: (err) => {
          onToast(err.message || 'Error al actualizar', 'error');
        },
      },
    );
  }

  const inputClass =
    'w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors placeholder:text-slate-600 tabular-nums';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex-shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white">Editar ganancia del tarotista</h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {getServiceEmoji(netPrice.service_kind)} {getServiceName(netPrice.service_kind)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-5">
            {/* Help text */}
            <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-400 leading-relaxed">
                Este es el <span className="text-white font-medium">pago base por consulta</span> que recibe la tarotista.
                Se aplica independientemente del pack que compre el usuario.
              </p>
            </div>

            {/* Price inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Precio ARS</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="100"
                    value={ars}
                    onChange={(e) => setArs(e.target.value)}
                    className={`${inputClass} pl-7`}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Precio USD</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    value={usd}
                    onChange={(e) => setUsd(e.target.value)}
                    className={`${inputClass} pl-7`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Precio EUR</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">€</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    value={eur}
                    onChange={(e) => setEur(e.target.value)}
                    className={`${inputClass} pl-7`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Platform margin preview */}
            {x1Pack && parsedArs > 0 && (
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/50">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Margen de plataforma (vs pack ×1)
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 truncate">ARS — Pack ×1 cobra al usuario</span>
                    <span className="text-xs font-medium text-slate-200 whitespace-nowrap tabular-nums">
                      {formatCurrency(x1Pack.price_ars, 'ARS')}
                    </span>
                  </div>
                  <div className="space-y-1.5 pl-3 border-l-2 border-slate-700">
                    <div className="flex justify-between gap-2">
                      <span className="text-xs text-slate-500 truncate">↳ Tarotista gana</span>
                      <span className="text-xs text-green-400 font-medium whitespace-nowrap tabular-nums">
                        {formatCurrency(parsedArs, 'ARS')}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-xs text-slate-500 truncate">↳ Plataforma retiene</span>
                      <span
                        className={`text-xs font-medium whitespace-nowrap tabular-nums ${
                          platformArs !== null && platformArs >= 0 ? 'text-amber-400' : 'text-red-400'
                        }`}
                      >
                        {platformArs !== null ? formatCurrency(Math.abs(platformArs), 'ARS') : '—'}
                        {marginPct !== null && (
                          <span className="ml-1 text-xs opacity-70">({marginPct}%)</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {parsedUsd > 0 && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/50">
                      <span className="text-xs text-slate-500 truncate">USD — Plataforma retiene</span>
                      <span
                        className={`text-xs font-medium whitespace-nowrap tabular-nums ${
                          platformUsd !== null && platformUsd >= 0 ? 'text-amber-400' : 'text-red-400'
                        }`}
                      >
                        {platformUsd !== null ? formatCurrency(Math.abs(platformUsd), 'USD') : '—'}
                      </span>
                    </div>
                  )}
                  {parsedEur > 0 && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 truncate">EUR — Plataforma retiene</span>
                      <span
                        className={`text-xs font-medium whitespace-nowrap tabular-nums ${
                          platformEur !== null && platformEur >= 0 ? 'text-amber-400' : 'text-red-400'
                        }`}
                      >
                        {platformEur !== null ? formatCurrency(Math.abs(platformEur), 'EUR') : '—'}
                      </span>
                    </div>
                  )}

                  {platformArs !== null && platformArs < 0 && (
                    <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                      ⚠️ La ganancia del tarotista supera al precio del pack ×1.
                    </p>
                  )}
                </div>
              </div>
            )}

            {!x1Pack && (
              <p className="text-xs text-slate-500 italic">
                No hay pack ×1 configurado para este servicio — sin vista previa de margen.
              </p>
            )}
          </div>

          {/* Footer actions — sticky */}
          <div className="flex gap-3 p-4 sm:p-6 border-t border-slate-800 bg-slate-900 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 min-h-[44px] sm:min-h-[40px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition font-medium text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || hasError}
              className="flex-[2] min-h-[44px] sm:min-h-[40px] flex justify-center items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
