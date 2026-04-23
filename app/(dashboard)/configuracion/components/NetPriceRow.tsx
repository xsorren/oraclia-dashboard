'use client';

import type { NetPrice, ServicePack } from '@/lib/api/admin';
import { useUpdateNetPrice } from '@/lib/hooks/useConfiguration';
import { formatCurrency } from '@/lib/utils/currency';
import { FREE_SERVICE_KINDS, getServiceEmoji, getServiceName } from '@/lib/utils/services';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NetPriceRowProps {
  netPrice: NetPrice;
  packs: ServicePack[];
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export function NetPriceRow({ netPrice, packs, onToast }: NetPriceRowProps) {
  const isFree = FREE_SERVICE_KINDS.has(netPrice.service_kind);
  const { mutate: updateNetPrice, isPending } = useUpdateNetPrice();

  const [editing, setEditing] = useState(false);
  const [ars, setArs] = useState(String(netPrice.price_ars));
  const [usd, setUsd] = useState(String(netPrice.price_usd));
  const [eur, setEur] = useState(String(netPrice.price_eur));

  // Sync when data refreshes after a successful mutation
  useEffect(() => {
    if (!editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArs(String(netPrice.price_ars));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsd(String(netPrice.price_usd));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEur(String(netPrice.price_eur));
    }
  }, [netPrice, editing]);

  // Find x1 pack to compute platform margin
  const x1Pack = packs.find(p => p.service_kind === netPrice.service_kind && p.quantity_units === 1);
  const marginArs = x1Pack ? x1Pack.price_ars - netPrice.price_ars : null;
  const marginPct = marginArs !== null && x1Pack
    ? Math.round((marginArs / x1Pack.price_ars) * 100)
    : null;

  function handleSave() {
    const parsedArs = parseFloat(ars);
    const parsedUsd = parseFloat(usd);
    const parsedEur = parseFloat(eur);

    if ([parsedArs, parsedUsd, parsedEur].some(v => isNaN(v) || v <= 0)) {
      onToast('Todos los precios deben ser mayores a 0', 'error');
      return;
    }

    updateNetPrice(
      { serviceKind: netPrice.service_kind, prices: { price_ars: parsedArs, price_usd: parsedUsd, price_eur: parsedEur } },
      {
        onSuccess: (res) => {
          onToast(res.message || 'Precio actualizado', 'success');
          setEditing(false);
        },
        onError: (err) => {
          onToast(err.message || 'Error al actualizar', 'error');
        },
      }
    );
  }

  function handleCancel() {
    setArs(String(netPrice.price_ars));
    setUsd(String(netPrice.price_usd));
    setEur(String(netPrice.price_eur));
    setEditing(false);
  }

  const inputClass =
    'w-28 px-2 py-1.5 bg-slate-950 border border-purple-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors';

  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
      {/* Servicio */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getServiceEmoji(netPrice.service_kind)}</span>
          <p className="font-medium text-white text-sm">{getServiceName(netPrice.service_kind)}</p>
        </div>
      </td>

      {/* ARS */}
      <td className="px-6 py-4">
        {isFree ? (
          <span className="text-slate-500 text-sm italic">Gratis</span>
        ) : editing ? (
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              step="100"
              value={ars}
              onChange={e => setArs(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </div>
        ) : (
          <span className="text-slate-200 text-sm font-medium">
            {formatCurrency(netPrice.price_ars, 'ARS')}
          </span>
        )}
      </td>

      {/* USD */}
      <td className="px-6 py-4">
        {isFree ? (
          <span className="text-slate-500 text-sm italic">Gratis</span>
        ) : editing ? (
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={usd}
              onChange={e => setUsd(e.target.value)}
              className={inputClass}
            />
          </div>
        ) : (
          <span className="text-slate-200 text-sm font-medium">
            {formatCurrency(netPrice.price_usd, 'USD')}
          </span>
        )}
      </td>

      {/* EUR */}
      <td className="px-6 py-4">
        {isFree ? (
          <span className="text-slate-500 text-sm italic">Gratis</span>
        ) : editing ? (
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-sm">€</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={eur}
              onChange={e => setEur(e.target.value)}
              className={inputClass}
            />
          </div>
        ) : (
          <span className="text-slate-200 text-sm font-medium">
            {formatCurrency(netPrice.price_eur, 'EUR')}
          </span>
        )}
      </td>

      {/* Margen plataforma */}
      <td className="px-6 py-4">
        {!x1Pack ? (
          <span className="text-slate-600 text-xs">—</span>
        ) : (
          <div>
            <span className="text-slate-300 text-sm">
              {formatCurrency(marginArs ?? 0, 'ARS')}
            </span>
            {marginPct !== null && (
              <span className="ml-1.5 text-xs text-amber-400 font-medium">({marginPct}%)</span>
            )}
          </div>
        )}
      </td>

      {/* Acciones */}
      <td className="px-6 py-4">
        {isFree ? (
          <span className="text-slate-600 text-xs">—</span>
        ) : editing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Guardar
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Editar
          </button>
        )}
      </td>
    </tr>
  );
}
