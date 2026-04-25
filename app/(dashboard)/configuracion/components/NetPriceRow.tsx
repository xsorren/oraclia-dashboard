'use client';

import type { NetPrice, ServicePack } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils/currency';
import { FREE_SERVICE_KINDS, getServiceEmoji, getServiceName } from '@/lib/utils/services';
import { Pencil } from 'lucide-react';

interface NetPriceRowProps {
  netPrice: NetPrice;
  packs: ServicePack[];
  onEdit: (np: NetPrice) => void;
}

/**
 * Desktop table row for the net-price configuration tab.
 * Display-only: editing is handled by the universal EditNetPriceModal,
 * triggered through onEdit. Mobile uses a sibling card component.
 */
export function NetPriceRow({ netPrice, packs, onEdit }: NetPriceRowProps) {
  const isFree = FREE_SERVICE_KINDS.has(netPrice.service_kind);

  // Find x1 pack to compute platform margin
  const x1Pack = packs.find(
    (p) => p.service_kind === netPrice.service_kind && p.quantity_units === 1,
  );
  const marginArs = x1Pack ? x1Pack.price_ars - netPrice.price_ars : null;
  const marginPct =
    marginArs !== null && x1Pack && x1Pack.price_ars > 0
      ? Math.round((marginArs / x1Pack.price_ars) * 100)
      : null;

  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
      {/* Servicio */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-shrink-0">{getServiceEmoji(netPrice.service_kind)}</span>
          <p className="font-medium text-white text-sm truncate">{getServiceName(netPrice.service_kind)}</p>
        </div>
      </td>

      {/* ARS */}
      <td className="px-6 py-4">
        {isFree ? (
          <span className="text-slate-500 text-sm italic">Gratis</span>
        ) : (
          <span className="text-slate-200 text-sm font-medium tabular-nums whitespace-nowrap">
            {formatCurrency(netPrice.price_ars, 'ARS')}
          </span>
        )}
      </td>

      {/* USD */}
      <td className="px-6 py-4">
        {isFree ? (
          <span className="text-slate-500 text-sm italic">Gratis</span>
        ) : (
          <span className="text-slate-200 text-sm font-medium tabular-nums whitespace-nowrap">
            {formatCurrency(netPrice.price_usd, 'USD')}
          </span>
        )}
      </td>

      {/* EUR */}
      <td className="px-6 py-4">
        {isFree ? (
          <span className="text-slate-500 text-sm italic">Gratis</span>
        ) : (
          <span className="text-slate-200 text-sm font-medium tabular-nums whitespace-nowrap">
            {formatCurrency(netPrice.price_eur, 'EUR')}
          </span>
        )}
      </td>

      {/* Margen plataforma */}
      <td className="px-6 py-4">
        {!x1Pack || isFree ? (
          <span className="text-slate-600 text-xs">—</span>
        ) : (
          <div className="whitespace-nowrap">
            <span className="text-slate-300 text-sm tabular-nums">
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
        ) : (
          <button
            type="button"
            onClick={() => onEdit(netPrice)}
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
