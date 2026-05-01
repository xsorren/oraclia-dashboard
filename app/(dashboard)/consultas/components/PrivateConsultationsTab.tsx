'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { MobileCard, MobileCardHeader, MobileCardList, ResponsiveTable, ResponsiveTableRow } from '@/components/common/ResponsiveTable';
import { SectionCard } from '@/components/common/SectionCard';
import { SignedAvatar } from '@/components/common/SignedAvatar';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { usePrivateConsultations } from '@/lib/hooks/useConsultas';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/dates';
import type { LucideIcon } from 'lucide-react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Eye,
    MessageSquare,
    User,
    XCircle
} from 'lucide-react';
import { useState } from 'react';
import { ConsultationDetailModal } from './ConsultationDetailModal';

const statusConfig: Record<string, { label: string; icon: LucideIcon; color: string }> = {
    open: { label: 'Abierta', icon: Clock, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    claimed: { label: 'Reclamada', icon: Eye, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    answered: { label: 'Respondida', icon: CheckCircle2, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    closed: { label: 'Cerrada', icon: CheckCircle2, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    cancelled: { label: 'Cancelada', icon: XCircle, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    expired: { label: 'Expirada', icon: AlertCircle, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    unknown: { label: 'Desconocido', icon: AlertCircle, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const serviceKinds: Record<string, string> = {
    all: 'Todos los servicios',
    privada_3cartas: 'Privada 3 Cartas',
    extensa_5cartas: 'Extensa 5 Cartas',
    lectura_solos_solas: 'Solos y Solas',
    lectura_amores_pasados: 'Amores Pasados',
    lectura_amores_nuevos: 'Amores Nuevos',
    lectura_almas_gemelas: 'Almas Gemelas',
    lectura_global: 'Lectura Global',
    ritual: 'Ritual',
    carta_astral: 'Carta Astral',
    sesion_reiki: 'Sesión Reiki',
    registros_akashicos: 'Registros Akáshicos',
    sesion_numerologia: 'Sesión Numerología',
    analisis_suenos: 'Análisis de Sueños'
};

export function PrivateConsultationsTab() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('all');
    const [serviceKind, setServiceKind] = useState('all');
    const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);

    const { data, isLoading } = usePrivateConsultations({ page, limit: 15, search: '', status, serviceKind });

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Filters */}
            <SectionCard padding="none" className="flex flex-col sm:flex-row gap-4 p-4">
                <select
                    value={serviceKind}
                    onChange={(e) => { setServiceKind(e.target.value); setPage(1); }}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    {Object.entries(serviceKinds).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>

                <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="all">Todos los estados</option>
                    <option value="open">Abierta</option>
                    <option value="claimed">Reclamada</option>
                    <option value="answered">Respondida</option>
                    <option value="closed">Cerrada</option>
                    <option value="cancelled">Cancelada</option>
                </select>
            </SectionCard>

            {/* Content */}
            {isLoading ? (
                <TableSkeleton columns={6} rows={10} />
            ) : (
                <SectionCard padding="none" className="overflow-hidden">
                    {!data?.data || data.data.length === 0 ? (
                        <EmptyState
                            icon={MessageSquare}
                            title="No se encontraron consultas privadas"
                            description="Intenta ajustar los filtros para encontrar lo que necesitas."
                        />
                    ) : (
                        <>
                            {/* Mobile Cards */}
                            <MobileCardList>
                                {data.data.map((consultation) => {
                                    const statusInfo = statusConfig[consultation.status] || statusConfig.unknown;
                                    const StatusIcon = statusInfo.icon;

                                    return (
                                        <MobileCard
                                            key={consultation.id}
                                            className="cursor-pointer hover:bg-slate-800/80 transition-colors"
                                            onClick={() => setSelectedConsultationId(consultation.id)}
                                        >
                                            <MobileCardHeader>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        <SignedAvatar
                                                            src={consultation.user?.avatar_url}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            fallback={<User className="w-5 h-5 text-slate-400" />}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium text-white truncate">
                                                            {consultation.user?.display_name || 'Sin nombre'}
                                                        </div>
                                                        {consultation.user?.email && (
                                                            <div className="text-xs text-slate-400 truncate">
                                                                {consultation.user.email}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-purple-400 mt-0.5">
                                                            {serviceKinds[consultation.service_kind] || consultation.service_kind}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-medium flex-shrink-0 ${statusInfo.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        <span className="hidden xs:inline">{statusInfo.label}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {formatRelativeTime(consultation.created_at)}
                                                    </div>
                                                </div>
                                            </MobileCardHeader>

                                            {consultation.last_message && (
                                                <div className="bg-slate-900/50 rounded-lg p-3 -mx-1 mt-2">
                                                    <div className="flex items-start gap-2">
                                                        {consultation.last_message.sender_type === 'reader' ? (
                                                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                                        ) : (
                                                            <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <p className="text-sm text-slate-300 line-clamp-2 italic">
                                                            {consultation.last_message.body_text || '(Audio / Archivo adjunto)'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="text-xs text-slate-500 mt-2 text-right">
                                                {consultation.message_count} {consultation.message_count === 1 ? 'mensaje' : 'mensajes'}
                                            </div>
                                        </MobileCard>
                                    );
                                })}
                            </MobileCardList>

                            {/* Desktop Table */}
                            <ResponsiveTable headers={['Usuario', 'Servicio', 'Estado', 'Último Mensaje', 'Fecha']}>
                                {data.data.map((consultation) => {
                                    const statusInfo = statusConfig[consultation.status] || statusConfig.unknown;
                                    const StatusIcon = statusInfo.icon;

                                    return (
                                        <ResponsiveTableRow
                                            key={consultation.id}
                                            className="cursor-pointer hover:bg-slate-800/80 transition-colors"
                                            onClick={() => setSelectedConsultationId(consultation.id)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                                        <SignedAvatar
                                                            src={consultation.user?.avatar_url}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            fallback={<User className="w-4 h-4 text-slate-400" />}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">
                                                            {consultation.user?.display_name || 'Sin nombre'}
                                                        </div>
                                                        {consultation.user?.email && (
                                                            <div className="text-xs text-slate-400 truncate max-w-[200px]">
                                                                {consultation.user.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-purple-400 font-medium">
                                                    {serviceKinds[consultation.service_kind] || consultation.service_kind}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {consultation.message_count} {consultation.message_count === 1 ? 'mensaje' : 'mensajes'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusInfo.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {statusInfo.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {consultation.last_message ? (
                                                    <div className="text-sm">
                                                        <div className={`flex items-center gap-1 mb-1 font-medium ${consultation.last_message.sender_type === 'reader' ? 'text-green-400' : 'text-purple-400'}`}>
                                                            {consultation.last_message.sender_type === 'reader' ? (
                                                                <><CheckCircle2 className="w-3 h-3" /> Tarotista</>
                                                            ) : (
                                                                <><User className="w-3 h-3" /> Usuario</>
                                                            )}
                                                        </div>
                                                        <p className="text-slate-400 line-clamp-1 italic max-w-xs">{consultation.last_message.body_text || '(Audio / Archivo adjunto)'}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-600 italic">No hay mensajes</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-sm text-slate-400">
                                                    {formatDateTime(consultation.created_at)}
                                                </div>
                                            </td>
                                        </ResponsiveTableRow>
                                    );
                                })}
                            </ResponsiveTable>
                        </>
                    )}

                    {data?.pagination && (
                        <Pagination
                            page={data.pagination.page}
                            pages={data.pagination.pages}
                            total={data.pagination.total}
                            limit={15}
                            onPageChange={setPage}
                            itemLabel="consultas"
                        />
                    )}
                </SectionCard>
            )}

            {selectedConsultationId && (
                <ConsultationDetailModal
                    consultationId={selectedConsultationId}
                    onClose={() => setSelectedConsultationId(null)}
                />
            )}
        </div>
    );
}
