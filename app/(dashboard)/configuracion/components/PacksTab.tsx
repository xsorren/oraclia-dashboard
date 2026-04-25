'use client';

import type { ConfigurationData, ServicePack } from '@/lib/api/admin';
import { useUpdatePackStatus } from '@/lib/hooks/useConfiguration';
import { formatCurrency } from '@/lib/utils/currency';
import { getServiceEmoji, getServiceName } from '@/lib/utils/services';
import { ChevronDown, ChevronRight, Loader2, Package2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { EditPackModal } from './EditPackModal';

interface PacksTabProps {
  config: ConfigurationData;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

interface ServiceGroup {
  serviceKind: string;
  packs: ServicePack[];
  netPriceArs: number;
  netPriceUsd: number;
  netPriceEur: number;
}

function buildGroups(config: ConfigurationData): ServiceGroup[] {
  // Use net_prices (service_net_prices table) — not services.kind which is a different enum
  const kindToNetPrice = new Map<string, { ars: number; usd: number; eur: number }>();
  for (const np of config.net_prices ?? []) {
    kindToNetPrice.set(np.service_kind, {
      ars: np.price_ars,
      usd: np.price_usd,
      eur: np.price_eur,
    });
  }

  const groupMap = new Map<string, ServicePack[]>();
  for (const pack of config.packs) {
    if (!groupMap.has(pack.service_kind)) groupMap.set(pack.service_kind, []);
    groupMap.get(pack.service_kind)!.push(pack);
  }

  const groups: ServiceGroup[] = [];
  for (const [kind, packs] of groupMap) {
    const net = kindToNetPrice.get(kind) ?? { ars: 0, usd: 0, eur: 0 };
    groups.push({
      serviceKind: kind,
      packs: packs.sort((a, b) => a.quantity_units - b.quantity_units),
      netPriceArs: net.ars,
      netPriceUsd: net.usd,
      netPriceEur: net.eur,
    });
  }

  return groups.sort((a, b) => a.serviceKind.localeCompare(b.serviceKind));
}

// ─────────────────────────────────────────────────────────────────────────
// Shared per-pack helpers (used by both desktop row and mobile card)
// ─────────────────────────────────────────────────────────────────────────

function computePackMargin(pack: ServicePack, netPriceArs: number) {
  const marginArs =
    pack.quantity_units > 0 && pack.price_ars > 0
      ? pack.price_ars / pack.quantity_units - netPriceArs
      : null;
  const marginPct =
    marginArs !== null && pack.price_ars > 0
      ? Math.round((marginArs / (pack.price_ars / pack.quantity_units)) * 100)
      : null;
  return { marginArs, marginPct };
}

function getDiscountPct(pack: ServicePack): number | null {
  return pack.metadata?.discount_pct ? Number(pack.metadata.discount_pct) : null;
}

interface PackToggleProps {
  pack: ServicePack;
  size?: 'sm' | 'lg';
  onToast: (msg: string, type: 'success' | 'error') => void;
}

/**
 * Active/inactive switch — small variant for desktop, large variant for mobile
 * (44×28 vs 36×20). Uses the same useUpdatePackStatus mutation.
 */
function PackToggle({ pack, size = 'sm', onToast }: PackToggleProps) {
  const { mutate: updateStatus, isPending } = useUpdatePackStatus();

  function handleToggle() {
    updateStatus(
      { packId: pack.id, isActive: !pack.is_active },
      {
        onSuccess: (res) => onToast(res.message || 'Estado actualizado', 'success'),
        onError: (err) => onToast(err.message || 'Error al actualizar estado', 'error'),
      },
    );
  }

  const dims =
    size === 'lg'
      ? { track: 'h-7 w-12', thumb: 'h-5 w-5', shift: 'translate-x-5' }
      : { track: 'h-5 w-9', thumb: 'h-4 w-4', shift: 'translate-x-4' };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${dims.track} ${
        pack.is_active ? 'bg-purple-600' : 'bg-slate-700'
      }`}
      title={pack.is_active ? 'Desactivar pack' : 'Activar pack'}
      aria-pressed={pack.is_active}
    >
      {isPending ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className={`text-white animate-spin ${size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3'}`} />
        </span>
      ) : (
        <span
          className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            dims.thumb
          } ${pack.is_active ? dims.shift : 'translate-x-0'}`}
        />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Desktop table row
// ─────────────────────────────────────────────────────────────────────────

interface PackRowProps {
  pack: ServicePack;
  netPriceArs: number;
  onEdit: (pack: ServicePack) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function PackRow({ pack, netPriceArs, onEdit, onToast }: PackRowProps) {
  const discountPct = getDiscountPct(pack);
  const { marginArs, marginPct } = computePackMargin(pack, netPriceArs);

  return (
    <tr className="border-b border-slate-800/30 hover:bg-slate-800/10 transition-colors">
      <td className="px-5 py-3.5">
        <p className="text-sm text-white font-medium truncate max-w-[220px]">{pack.name}</p>
      </td>

      <td className="px-5 py-3.5 text-center">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 text-sm font-bold tabular-nums">
          ×{pack.quantity_units}
        </span>
      </td>

      <td className="px-5 py-3.5">
        <div className="whitespace-nowrap">
          <span className="text-sm text-slate-200 font-medium tabular-nums">
            {formatCurrency(pack.price_ars, 'ARS')}
          </span>
          {pack.quantity_units > 1 && (
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {formatCurrency(pack.price_ars / pack.quantity_units, 'ARS')}/u
            </p>
          )}
        </div>
      </td>

      <td className="px-5 py-3.5">
        <div className="whitespace-nowrap">
          <span className="text-sm text-slate-200 font-medium tabular-nums">
            {formatCurrency(pack.price_usd, 'USD')}
          </span>
          {pack.quantity_units > 1 && (
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {formatCurrency(pack.price_usd / pack.quantity_units, 'USD')}/u
            </p>
          )}
        </div>
      </td>

      <td className="px-5 py-3.5">
        <div className="whitespace-nowrap">
          <span className="text-sm text-slate-200 font-medium tabular-nums">
            {formatCurrency(pack.price_eur, 'EUR')}
          </span>
          {pack.quantity_units > 1 && (
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {formatCurrency(pack.price_eur / pack.quantity_units, 'EUR')}/u
            </p>
          )}
        </div>
      </td>

      <td className="px-5 py-3.5 text-center">
        {discountPct ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            -{discountPct}%
          </span>
        ) : (
          <span className="text-slate-600 text-xs">—</span>
        )}
      </td>

      <td className="px-5 py-3.5">
        {marginArs !== null ? (
          <div className="whitespace-nowrap">
            <span
              className={`text-sm font-medium tabular-nums ${
                marginArs >= 0 ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {formatCurrency(Math.abs(marginArs), 'ARS')}
            </span>
            {marginPct !== null && (
              <span className="ml-1 text-xs text-slate-500">({marginPct}%)</span>
            )}
          </div>
        ) : (
          <span className="text-slate-600 text-xs">—</span>
        )}
      </td>

      <td className="px-5 py-3.5">
        <PackToggle pack={pack} size="sm" onToast={onToast} />
      </td>

      <td className="px-5 py-3.5">
        <button
          type="button"
          onClick={() => onEdit(pack)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Editar
        </button>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Mobile card
// ─────────────────────────────────────────────────────────────────────────

interface PackMobileCardProps {
  pack: ServicePack;
  netPriceArs: number;
  onEdit: (pack: ServicePack) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function PackMobileCard({ pack, netPriceArs, onEdit, onToast }: PackMobileCardProps) {
  const discountPct = getDiscountPct(pack);
  const { marginArs, marginPct } = computePackMargin(pack, netPriceArs);

  return (
    <div
      className={`px-4 py-4 space-y-3 border-b border-slate-800/30 last:border-b-0 ${
        pack.is_active ? '' : 'opacity-60'
      }`}
    >
      {/* Title + units + discount */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white font-medium truncate">{pack.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 h-6 rounded-md bg-slate-800 text-slate-300 text-xs font-bold tabular-nums">
              ×{pack.quantity_units}
            </span>
            {discountPct && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                -{discountPct}% off
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Prices grid */}
      <div className="grid grid-cols-3 gap-2">
        {(['ARS', 'USD', 'EUR'] as const).map((cur) => {
          const total = cur === 'ARS' ? pack.price_ars : cur === 'USD' ? pack.price_usd : pack.price_eur;
          return (
            <div key={cur} className="bg-slate-800/50 rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">{cur}</p>
              <p className="text-sm font-medium text-white tabular-nums">
                {formatCurrency(total, cur)}
              </p>
              {pack.quantity_units > 1 && (
                <p className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                  {formatCurrency(total / pack.quantity_units, cur)}/u
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Platform margin */}
      {marginArs !== null && (
        <div className="flex items-center justify-between gap-2 text-xs px-1">
          <span className="text-slate-500">Margen plataforma</span>
          <span
            className={`tabular-nums font-medium whitespace-nowrap ${
              marginArs >= 0 ? 'text-amber-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(Math.abs(marginArs), 'ARS')}
            {marginPct !== null && (
              <span className="ml-1 text-slate-500 font-normal">({marginPct}%)</span>
            )}
          </span>
        </div>
      )}

      {/* Status + edit row */}
      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-2 flex-1 bg-slate-800/30 rounded-lg px-3 py-2">
          <PackToggle pack={pack} size="lg" onToast={onToast} />
          <span
            className={`text-xs font-medium ${
              pack.is_active ? 'text-purple-300' : 'text-slate-500'
            }`}
          >
            {pack.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onEdit(pack)}
          className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Editar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Group card (collapsible header + table or mobile cards)
// ─────────────────────────────────────────────────────────────────────────

interface ServiceGroupCardProps {
  group: ServiceGroup;
  onEdit: (pack: ServicePack) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function ServiceGroupCard({ group, onEdit, onToast }: ServiceGroupCardProps) {
  const [expanded, setExpanded] = useState(true);
  const activePacks = group.packs.filter((p) => p.is_active).length;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      {/* Group header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-slate-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{getServiceEmoji(group.serviceKind)}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {getServiceName(group.serviceKind)}
            </h3>
            {/* Mobile-only: compact stats line */}
            <p className="sm:hidden text-[11px] text-slate-500 mt-0.5">
              {group.packs.length} packs · {activePacks} activos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-1 bg-slate-800 rounded-md">{group.packs.length} packs</span>
            <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md border border-green-500/20">
              {activePacks} activos
            </span>
          </div>
          <div className="hidden sm:block text-xs text-slate-400 whitespace-nowrap">
            Precio neto:{' '}
            <span className="text-purple-400 font-medium tabular-nums">
              {formatCurrency(group.netPriceArs, 'ARS')}
            </span>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Body — desktop table OR mobile cards */}
      {expanded && (
        <div className="border-t border-slate-800">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/30">
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Pack</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Unid.</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Precio ARS</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Precio USD</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Precio EUR</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Desc.</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Plataforma</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody>
                {group.packs.map((pack) => (
                  <PackRow
                    key={pack.id}
                    pack={pack}
                    netPriceArs={group.netPriceArs}
                    onEdit={onEdit}
                    onToast={onToast}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {/* Net price hint shown only on mobile, since the desktop header already includes it */}
            <div className="px-4 py-2.5 bg-slate-800/20 border-b border-slate-800/40">
              <p className="text-[11px] text-slate-500">
                Precio neto del tarotista:{' '}
                <span className="text-purple-400 font-medium tabular-nums">
                  {formatCurrency(group.netPriceArs, 'ARS')}
                </span>
              </p>
            </div>
            {group.packs.map((pack) => (
              <PackMobileCard
                key={pack.id}
                pack={pack}
                netPriceArs={group.netPriceArs}
                onEdit={onEdit}
                onToast={onToast}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Tab root
// ─────────────────────────────────────────────────────────────────────────

export function PacksTab({ config, onToast }: PacksTabProps) {
  const [editingPack, setEditingPack] = useState<ServicePack | null>(null);

  const groups = buildGroups(config);

  // Find net prices for the editing pack — use net_prices directly
  const editingNetPrice = editingPack
    ? (config.net_prices ?? []).find((np) => np.service_kind === editingPack.service_kind)
    : null;

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Package2 className="w-12 h-12 text-slate-600 mb-4" />
        <p className="text-slate-400 font-medium">No se encontraron packs configurados</p>
        <p className="text-slate-500 text-sm mt-1">
          Los packs de servicio aparecerán aquí cuando estén disponibles
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {groups.map((group) => (
          <ServiceGroupCard
            key={group.serviceKind}
            group={group}
            onEdit={setEditingPack}
            onToast={onToast}
          />
        ))}
      </div>

      <EditPackModal
        pack={editingPack}
        netPriceArs={editingNetPrice?.price_ars ?? 0}
        netPriceUsd={editingNetPrice?.price_usd ?? 0}
        netPriceEur={editingNetPrice?.price_eur ?? 0}
        onClose={() => setEditingPack(null)}
        onToast={onToast}
      />
    </>
  );
}
