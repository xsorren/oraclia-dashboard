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
  const kindToNetPrice = new Map<string, { ars: number; usd: number; eur: number }>();
  for (const svc of config.services) {
    kindToNetPrice.set(svc.kind, {
      ars: svc.prices?.ARS ?? 0,
      usd: svc.prices?.USD ?? 0,
      eur: svc.prices?.EUR ?? 0,
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

interface PackRowProps {
  pack: ServicePack;
  netPriceArs: number;
  onEdit: (pack: ServicePack) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function PackRow({ pack, netPriceArs, onEdit, onToast }: PackRowProps) {
  const { mutate: updateStatus, isPending } = useUpdatePackStatus();

  const discountPct = pack.metadata?.discount_pct
    ? Number(pack.metadata.discount_pct)
    : null;

  const marginArs =
    pack.quantity_units > 0 && pack.price_ars > 0
      ? pack.price_ars / pack.quantity_units - netPriceArs
      : null;
  const marginPct =
    marginArs !== null && pack.price_ars > 0
      ? Math.round((marginArs / (pack.price_ars / pack.quantity_units)) * 100)
      : null;

  function handleToggle() {
    updateStatus(
      { packId: pack.id, isActive: !pack.is_active },
      {
        onSuccess: (res) => onToast(res.message || 'Estado actualizado', 'success'),
        onError: (err) => onToast(err.message || 'Error al actualizar estado', 'error'),
      }
    );
  }

  return (
    <tr className="border-b border-slate-800/30 hover:bg-slate-800/10 transition-colors">
      {/* Pack name */}
      <td className="px-5 py-3.5">
        <div>
          <p className="text-sm text-white font-medium">{pack.name}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{pack.sku}</p>
        </div>
      </td>

      {/* Unidades */}
      <td className="px-5 py-3.5 text-center">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 text-sm font-bold">
          ×{pack.quantity_units}
        </span>
      </td>

      {/* Precio ARS */}
      <td className="px-5 py-3.5">
        <div>
          <span className="text-sm text-slate-200 font-medium">{formatCurrency(pack.price_ars, 'ARS')}</span>
          {pack.quantity_units > 1 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {formatCurrency(pack.price_ars / pack.quantity_units, 'ARS')}/u
            </p>
          )}
        </div>
      </td>

      {/* Precio USD */}
      <td className="px-5 py-3.5">
        <div>
          <span className="text-sm text-slate-200 font-medium">{formatCurrency(pack.price_usd, 'USD')}</span>
          {pack.quantity_units > 1 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {formatCurrency(pack.price_usd / pack.quantity_units, 'USD')}/u
            </p>
          )}
        </div>
      </td>

      {/* Precio EUR */}
      <td className="px-5 py-3.5">
        <div>
          <span className="text-sm text-slate-200 font-medium">{formatCurrency(pack.price_eur, 'EUR')}</span>
          {pack.quantity_units > 1 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {formatCurrency(pack.price_eur / pack.quantity_units, 'EUR')}/u
            </p>
          )}
        </div>
      </td>

      {/* Descuento */}
      <td className="px-5 py-3.5 text-center">
        {discountPct ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            -{discountPct}%
          </span>
        ) : (
          <span className="text-slate-600 text-xs">—</span>
        )}
      </td>

      {/* Margen plataforma */}
      <td className="px-5 py-3.5">
        {marginArs !== null ? (
          <div>
            <span className={`text-sm font-medium ${marginArs >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
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

      {/* Estado */}
      <td className="px-5 py-3.5">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
            pack.is_active ? 'bg-purple-600' : 'bg-slate-700'
          }`}
          title={pack.is_active ? 'Desactivar pack' : 'Activar pack'}
        >
          {isPending ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            </span>
          ) : (
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                pack.is_active ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          )}
        </button>
      </td>

      {/* Editar */}
      <td className="px-5 py-3.5">
        <button
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

interface ServiceGroupCardProps {
  group: ServiceGroup;
  onEdit: (pack: ServicePack) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function ServiceGroupCard({ group, onEdit, onToast }: ServiceGroupCardProps) {
  const [expanded, setExpanded] = useState(true);
  const activePacks = group.packs.filter(p => p.is_active).length;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getServiceEmoji(group.serviceKind)}</span>
          <div>
            <h3 className="text-sm font-semibold text-white">{getServiceName(group.serviceKind)}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{group.serviceKind}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-1 bg-slate-800 rounded-md">
              {group.packs.length} packs
            </span>
            <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md border border-green-500/20">
              {activePacks} activos
            </span>
          </div>
          <div className="hidden sm:block text-xs text-slate-400">
            Precio neto: <span className="text-purple-400 font-medium">{formatCurrency(group.netPriceArs, 'ARS')}</span>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Packs table */}
      {expanded && (
        <div className="border-t border-slate-800 overflow-x-auto">
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
              {group.packs.map(pack => (
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
      )}
    </div>
  );
}

export function PacksTab({ config, onToast }: PacksTabProps) {
  const [editingPack, setEditingPack] = useState<ServicePack | null>(null);

  const groups = buildGroups(config);

  // Find net prices for the editing pack's service
  const editingService = editingPack
    ? config.services.find(s => s.kind === editingPack.service_kind)
    : null;

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Package2 className="w-12 h-12 text-slate-600 mb-4" />
        <p className="text-slate-400 font-medium">No se encontraron packs configurados</p>
        <p className="text-slate-500 text-sm mt-1">Los packs de servicio aparecerán aquí cuando estén disponibles</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {groups.map(group => (
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
        netPriceArs={editingService?.prices?.ARS ?? 0}
        netPriceUsd={editingService?.prices?.USD ?? 0}
        netPriceEur={editingService?.prices?.EUR ?? 0}
        onClose={() => setEditingPack(null)}
        onToast={onToast}
      />
    </>
  );
}
