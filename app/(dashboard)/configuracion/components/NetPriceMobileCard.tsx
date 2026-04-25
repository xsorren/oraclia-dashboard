'use client';

import type { NetPrice, ServicePack } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils/currency';
import { FREE_SERVICE_KINDS, getServiceEmoji, getServiceName } from '@/lib/utils/services';
import { Pencil } from 'lucide-react';

interface NetPriceMobileCardProps {
  netPrice: NetPrice;
  packs: ServicePack[];
  onEdit: (np: NetPrice) => void;
}

/**
 * Mobile card layout for the net-price tab. Mirrors the data shown in
 * NetPriceRow plus an explicit edit button (the desktop table only shows it
 * once per row; mobile users would otherwise have no entry point).
 */
export function NetPriceMobileCard({ netPrice, packs, onEdit }: NetPriceMobileCardProps) {
  const isFree = FREE_SERVICE_KINDS.has(netPrice.service_kind);

  const x1Pack = packs.find(
    (p) => p.service_kind === netPrice.service_kind && p.quantity_units === 1,
  );
  const marginArs = x1Pack ? x1Pack.price_ars - netPrice.price_ars : null;
  const marginPct =
    marginArs !== null && x1Pack && x1Pack.price_ars > 0
      ? Math.round((marginArs / x1Pack.price_ars) * 100)
      : null;

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xl flex-shrink-0">{getServiceEmoji(netPrice.service_kind)}</span>
        <p className="text-sm font-medium text-white truncate">{getServiceName(netPrice.service_kind)}</p>
      </div>

      {isFree ? (
        <p className="text-sm text-slate-500 italic">Servicio gratuito</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800/50 rounded-lg px-2 py-2">
              <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">ARS</p>
              <p className="text-sm font-medium text-white tabular-nums">
                {formatCurrency(netPrice.price_ars, 'ARS')}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg px-2 py-2">
              <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">USD</p>
              <p className="text-sm font-medium text-white tabular-nums">
                {formatCurrency(netPrice.price_usd, 'USD')}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg px-2 py-2">
              <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">EUR</p>
              <p className="text-sm font-medium text-white tabular-nums">
                {formatCurrency(netPrice.price_eur, 'EUR')}
              </p>
            </div>
          </div>

          {x1Pack && (
            <div className="flex items-center justify-between gap-2 text-xs px-1">
              <span className="text-slate-500">Margen plataforma (×1)</span>
              <span className="text-slate-300 tabular-nums whitespace-nowrap">
                {formatCurrency(marginArs ?? 0, 'ARS')}
                {marginPct !== null && (
                  <span className="ml-1 text-amber-400 font-medium">({marginPct}%)</span>
                )}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onEdit(netPrice)}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Editar precio
          </button>
        </>
      )}
    </div>
  );
}
