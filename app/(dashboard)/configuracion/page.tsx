'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { ResponsiveTable, ResponsiveTableRow } from '@/components/common/ResponsiveTable';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Header } from '@/components/layout/Header';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import { formatCurrency } from '@/lib/utils/currency';
import { Settings, Tag } from 'lucide-react';

export default function ConfiguracionPage() {
    const { data: config, isLoading } = useConfiguration();

    return (
        <>
            <Header
                title="Configuración"
                subtitle="Gestión de servicios y precios de la plataforma"
                breadcrumbs={[
                    { label: 'Inicio', href: '/' },
                    { label: 'Configuración' }
                ]}
            />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[2000px] mx-auto">

                {/* Services & Prices Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Tag className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Servicios y Precios Base</h2>
                    </div>

                    <p className="text-slate-400 max-w-3xl">
                        A continuación se listan los servicios disponibles en la plataforma y sus precios base.
                        Estos precios son utilizados para calcular las ganancias de los tarotistas.
                    </p>

                    {isLoading ? (
                        <TableSkeleton columns={5} rows={5} />
                    ) : (
                        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg overflow-hidden">
                            {!config?.services || config.services.length === 0 ? (
                                <EmptyState
                                    icon={Settings}
                                    title="No se encontraron servicios"
                                    description="No hay servicios configurados en el sistema"
                                />
                            ) : (
                                <ResponsiveTable headers={['Servicio', 'Tipo', 'Precio USD', 'Precio ARS', 'Precio EUR', 'Estado']}>
                                    {config.services.map((service) => (
                                        <ResponsiveTableRow key={service.id}>
                                            <td className="px-6 py-4 font-medium text-white">
                                                <div>
                                                    <p>{service.name}</p>
                                                    <p className="text-xs text-slate-500 font-normal mt-0.5">{service.slug}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {service.kind}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {formatCurrency(service.prices?.USD || 0, 'USD')}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {formatCurrency(service.prices?.ARS || 0, 'ARS')}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {formatCurrency(service.prices?.EUR || 0, 'EUR')}
                                            </td>
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
                                        </ResponsiveTableRow>
                                    ))}
                                </ResponsiveTable>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
