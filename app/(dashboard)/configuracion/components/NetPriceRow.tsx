'use client';

import type { Service, ServicePack } from '@/lib/api/admin';
import { useUpdateNetPrice } from '@/lib/hooks/useConfiguration';
import { formatCurrency } from '@/lib/utils/currency';
import { FREE_SERVICE_KINDS, getServiceEmoji, getServiceName } from '@/lib/utils/services';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NetPriceRowProps {
  service: Service;
  packs: ServicePack[];
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export function NetPriceRow({ service, packs, onToast }: NetPriceRowProps) {
  const isFree = FREE_SERVICE_KINDS.has(service.slug) || FREE_SERVICE_KINDS.has(service.kind);
  const { mutate: updateNetPrice, isPending } = useUpdateNetPrice();

  const [editing, setEditing] = useState(false);
  const [ars, setArs] = useState(String(service.prices?.ARS ?? 0));
  const [usd, setUsd] = useState(String(service.prices?.USD ?? 0));
  const [eur, setEur] = useState(String(service.prices?.EUR ?? 0));

  // Sync when data refreshes after a successful mutation
  useEffect(() => {
    if (!editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArs(String(service.prices?.ARS ?? 0));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsd(String(service.prices?.USD ?? 0));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEur(String(service.prices?.EUR ?? 0));
    }
  }, [service.prices, editing]);

  // Find x1 pack to compute platform margin
  const x1Pack = packs.find(p => p.service_kind === service.kind && p.quantity_units === 1);
  const marginArs = x1Pack && service.prices?.ARS
    ? x1Pack.price_ars - (service.prices.ARS)
    : null;
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
      { serviceKind: service.kind, prices: { price_ars: parsedArs, price_usd: parsedUsd, price_eur: parsedEur } },
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
    setArs(String(service.prices?.ARS ?? 0));
    setUsd(String(service.prices?.USD ?? 0));
    setEur(String(service.prices?.EUR ?? 0));
    setEditing(false);
  }

  const inputClass =
    'w-28 px-2 py-1.5 bg-slate-950 border border-purple-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors';

  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
      {/* Servicio */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getServiceEmoji(service.kind)}</span>
          <div>
            <p className="font-medium text-white text-sm">{service.name || getServiceName(service.kind)}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{service.kind}</p>
          </div>
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
            {formatCurrency(service.prices?.ARS ?? 0, 'ARS')}
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
            {formatCurrency(service.prices?.USD ?? 0, 'USD')}
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
            {formatCurrency(service.prices?.EUR ?? 0, 'EUR')}
          </span>
        )}
      </td>

      {/* Margen plataforma */}
      <td className="px-6 py-4">
        {isFree || !x1Pack ? (
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

      {/* Estado */}
      <td className="px-6 py-4">
        {service.is_active ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Inactivo
          </span>
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
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
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
