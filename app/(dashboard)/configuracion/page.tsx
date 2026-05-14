'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import { cn } from '@/lib/utils/cn';
import { FREE_SERVICE_KINDS, getServiceEmoji, getServiceName } from '@/lib/utils/services';
import { Package2, Settings, Tag } from 'lucide-react';
import { useState } from 'react';
import { NetPriceRow } from './components/NetPriceRow';
import { PacksTab } from './components/PacksTab';

type Tab = 'net-prices' | 'packs';

export default function ConfiguracionPage() {
  const { data: config, isLoading } = useConfiguration();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('net-prices');

  const tabs: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'net-prices',
      label: 'Ganancias del Tarotista',
      icon: <Tag className="w-4 h-4" />,
      description: 'Precio base que recibe el tarotista por cada consulta',
    },
    {
      id: 'packs',
      label: 'Paquetes de Venta',
      icon: <Package2 className="w-4 h-4" />,
      description: 'Precios que pagan los usuarios al comprar servicios',
    },
  ];

  // Services filtered for net prices tab (exclude free ones from editing)
  const editableServices = (config?.services ?? []).filter(
    s => !FREE_SERVICE_KINDS.has(s.slug) && !FREE_SERVICE_KINDS.has(s.kind)
  );
  const freeServices = (config?.services ?? []).filter(
    s => FREE_SERVICE_KINDS.has(s.slug) || FREE_SERVICE_KINDS.has(s.kind)
  );
  const allServices = [...editableServices, ...freeServices];

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

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[2000px] mx-auto">

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Servicios configurados</p>
            <p className="text-2xl font-bold text-white mt-1">{config?.services.length ?? '—'}</p>
            <p className="text-xs text-slate-500 mt-1">
              {config?.services.filter(s => s.is_active).length ?? 0} activos
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Packs disponibles</p>
            <p className="text-2xl font-bold text-white mt-1">{config?.packs.length ?? '—'}</p>
            <p className="text-xs text-slate-500 mt-1">
              {config?.packs.filter(p => p.is_active).length ?? 0} activos
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Monedas soportadas</p>
            <p className="text-2xl font-bold text-white mt-1">3</p>
            <p className="text-xs text-slate-500 mt-1">ARS · USD · EUR</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800">
          <nav className="flex gap-1 -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab description */}
        <p className="text-sm text-slate-400">
          {tabs.find(t => t.id === activeTab)?.description}
        </p>

        {/* Loading state */}
        {isLoading && <TableSkeleton columns={6} rows={8} />}

        {/* Net prices tab */}
        {!isLoading && activeTab === 'net-prices' && (
          <>
            {allServices.length === 0 ? (
              <EmptyState
                icon={Settings}
                title="No se encontraron servicios"
                description="No hay servicios configurados en el sistema"
              />
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                {/* Info banner */}
                <div className="px-6 py-3 bg-purple-500/5 border-b border-purple-500/10 flex items-start gap-2">
                  <Tag className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400">
                    Estos precios son el <span className="text-white font-medium">pago base por consulta</span> que recibe el tarotista,
                    independientemente del pack que compró el usuario. El margen de plataforma se calcula sobre el pack individual (×1).
                  </p>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-800/40 border-b border-slate-800">
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Servicio</th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Precio ARS</th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Precio USD</th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Precio EUR</th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Margen plataforma</th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allServices.map(service => (
                        <NetPriceRow
                          key={service.id}
                          service={service}
                          packs={config?.packs ?? []}
                          onToast={toast}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-800/50">
                  {allServices.map(service => {
                    const isFree = FREE_SERVICE_KINDS.has(service.slug) || FREE_SERVICE_KINDS.has(service.kind);
                    return (
                      <div key={service.id} className="px-4 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getServiceEmoji(service.kind)}</span>
                            <div>
                              <p className="text-sm font-medium text-white">{service.name || getServiceName(service.kind)}</p>
                              <p className="text-xs text-slate-500 font-mono">{service.kind}</p>
                            </div>
                          </div>
                          {service.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                              Inactivo
                            </span>
                          )}
                        </div>
                        {isFree ? (
                          <p className="text-sm text-slate-500 italic">Servicio gratuito</p>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-800/50 rounded-lg px-2 py-2">
                              <p className="text-xs text-slate-500 mb-0.5">ARS</p>
                              <p className="text-sm font-medium text-white">${service.prices?.ARS?.toLocaleString('es-AR') ?? 0}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg px-2 py-2">
                              <p className="text-xs text-slate-500 mb-0.5">USD</p>
                              <p className="text-sm font-medium text-white">${service.prices?.USD ?? 0}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg px-2 py-2">
                              <p className="text-xs text-slate-500 mb-0.5">EUR</p>
                              <p className="text-sm font-medium text-white">€{service.prices?.EUR ?? 0}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  <p className="text-xs text-slate-400">
                    Los packs agrupan uno o varios usos de un servicio con descuentos por volumen.
                    El <span className="text-white font-medium">margen de plataforma</span> se calcula como precio por unidad menos el precio neto del tarotista.
                    Activar/desactivar un pack controla si está disponible para compra.
                  </p>
                </div>

                <PacksTab config={config} onToast={toast} />
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
