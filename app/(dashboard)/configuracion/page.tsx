'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import type { NetPrice } from '@/lib/api/admin';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import { cn } from '@/lib/utils/cn';
import { FREE_SERVICE_KINDS } from '@/lib/utils/services';
import { Package2, Settings, Tag } from 'lucide-react';
import { useState } from 'react';
import { EditNetPriceModal } from './components/EditNetPriceModal';
import { NetPriceMobileCard } from './components/NetPriceMobileCard';
import { NetPriceRow } from './components/NetPriceRow';
import { PacksTab } from './components/PacksTab';

type Tab = 'net-prices' | 'packs';

interface TabConfig {
  id: Tab;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
}

export default function ConfiguracionPage() {
  const { data: config, isLoading } = useConfiguration();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('net-prices');
  const [editingNetPrice, setEditingNetPrice] = useState<NetPrice | null>(null);

  const tabs: TabConfig[] = [
    {
      id: 'net-prices',
      label: 'Ganancias del Tarotista',
      shortLabel: 'Ganancias',
      icon: <Tag className="w-4 h-4" />,
      description:
        'Precio base que recibe el tarotista por cada consulta, independientemente del pack que compró el usuario',
    },
    {
      id: 'packs',
      label: 'Servicios y Paquetes',
      shortLabel: 'Packs',
      icon: <Package2 className="w-4 h-4" />,
      description:
        'Precios que pagan los usuarios al comprar servicios, con variantes por cantidad y descuentos por volumen',
    },
  ];

  // Use net_prices directly — services.kind is a different enum ('global'/'private')
  // and does not match service_net_prices.service_kind
  const netPrices = config?.net_prices ?? [];
  const editableNetPrices = netPrices.filter((np) => !FREE_SERVICE_KINDS.has(np.service_kind));
  const freeNetPrices = netPrices.filter((np) => FREE_SERVICE_KINDS.has(np.service_kind));
  const allNetPrices = [...editableNetPrices, ...freeNetPrices];

  return (
    <>
      <Header
        title="Gestión de Precios"
        subtitle="Configura los precios de los servicios y las ganancias de los tarotistas"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Configuración' },
        ]}
      />

      <div className="p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-[2000px] mx-auto">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 sm:px-5 py-3.5 sm:py-4">
            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Tipos de servicio</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums">
              {netPrices.length || '—'}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
              {editableNetPrices.length} configurables
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 sm:px-5 py-3.5 sm:py-4">
            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Packs disponibles</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums">
              {config?.packs.length ?? '—'}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
              {config?.packs.filter((p) => p.is_active).length ?? 0} activos
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-900/50 border border-slate-800 rounded-xl px-4 sm:px-5 py-3.5 sm:py-4">
            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Monedas soportadas</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums">3</p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">ARS · USD · EUR</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[44px]',
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600',
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab description — hidden on mobile to save vertical space */}
        <p className="hidden sm:block text-sm text-slate-400">
          {tabs.find((t) => t.id === activeTab)?.description}
        </p>

        {/* Loading state */}
        {isLoading && <TableSkeleton columns={6} rows={8} />}

        {/* Net prices tab */}
        {!isLoading && activeTab === 'net-prices' && (
          <>
            {allNetPrices.length === 0 ? (
              <EmptyState
                icon={Settings}
                title="No se encontraron precios"
                description="No hay precios de servicio configurados en el sistema"
              />
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                {/* Info banner */}
                <div className="px-4 sm:px-6 py-3 bg-purple-500/5 border-b border-purple-500/10 flex items-start gap-2">
                  <Tag className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Estos precios son el <span className="text-white font-medium">pago base por consulta</span>{' '}
                    que recibe el tarotista, independientemente del pack que compró el usuario. El margen de
                    plataforma se calcula sobre el pack individual (×1).
                  </p>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-800/40 border-b border-slate-800">
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Servicio
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Precio ARS
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Precio USD
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Precio EUR
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Margen plataforma
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allNetPrices.map((np) => (
                        <NetPriceRow
                          key={np.service_kind}
                          netPrice={np}
                          packs={config?.packs ?? []}
                          onEdit={setEditingNetPrice}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-800/50">
                  {allNetPrices.map((np) => (
                    <NetPriceMobileCard
                      key={np.service_kind}
                      netPrice={np}
                      packs={config?.packs ?? []}
                      onEdit={setEditingNetPrice}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Packs tab */}
        {!isLoading && activeTab === 'packs' && config && (
          <>
            {config.packs.length === 0 ? (
              <EmptyState
                icon={Package2}
                title="No se encontraron packs"
                description="No hay packs de servicio configurados en el sistema"
              />
            ) : (
              <>
                {/* Info banner */}
                <div className="px-4 py-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2">
                  <Package2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Los packs agrupan uno o varios usos de un servicio con descuentos por volumen.
                    El <span className="text-white font-medium">margen de plataforma</span> se calcula como
                    precio por unidad menos el precio neto del tarotista. Activar/desactivar un pack controla si
                    está disponible para compra.
                  </p>
                </div>

                <PacksTab config={config} onToast={toast} />
              </>
            )}
          </>
        )}
      </div>

      {/* Universal net-price modal — used by desktop rows and mobile cards alike */}
      <EditNetPriceModal
        netPrice={editingNetPrice}
        packs={config?.packs ?? []}
        onClose={() => setEditingNetPrice(null)}
        onToast={toast}
      />
    </>
  );
}
