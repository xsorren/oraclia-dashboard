'use client';

import { ChatViewer } from '@/components/chat/ChatViewer';
import { EmptyState } from '@/components/common/EmptyState';
import { ResponsiveTable, ResponsiveTableRow } from '@/components/common/ResponsiveTable';
import { SlideOver } from '@/components/common/SlideOver';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import { adminApi } from '@/lib/api/admin';
import { formatDate } from '@/lib/utils/dates';
import { getServiceEmoji, getServiceName } from '@/lib/utils/services';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Eye,
    MessageCircle,
    Search,
    User,
    XCircle
} from 'lucide-react';
import { useState } from 'react';

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  open: { label: 'Pendiente', icon: Clock, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  claimed: { label: 'En proceso', icon: Eye, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  answered: { label: 'Respondida', icon: CheckCircle2, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  closed: { label: 'Cerrada', icon: CheckCircle2, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  cancelled: { label: 'Cancelada', icon: XCircle, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  expired: { label: 'Expirada', icon: AlertCircle, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  unknown: { label: 'Desconocido', icon: AlertCircle, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const serviceOptions = [
    { value: 'privada_3cartas', label: 'Privada 3 Cartas' },
    { value: 'extensa_5cartas', label: 'Extensa 5 Cartas' },
    { value: 'lectura_solos_solas', label: 'Lectura Solos/Solas' },
    { value: 'lectura_amores_pasados', label: 'Amores Pasados' },
    { value: 'lectura_amores_nuevos', label: 'Amores Nuevos' },
    { value: 'lectura_almas_gemelas', label: 'Almas Gemelas' },
    { value: 'ritual', label: 'Ritual' },
    { value: 'carta_astral', label: 'Carta Astral' },
    { value: 'sesion_reiki', label: 'Reiki' },
    { value: 'registros_akashicos', label: 'Registros Akáshicos' },
    { value: 'sesion_numerologia', label: 'Numerología' },
    { value: 'analisis_suenos', label: 'Sueños' },
];

export default function ConsultasPrivadasPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [serviceKind, setServiceKind] = useState('all');
  
  // Selection State
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null);

  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'private-consultations', page, search, status, serviceKind],
    queryFn: () => adminApi.getPrivateConsultations({ 
      page, limit: 15, search, status, serviceKind 
    }),
  });

  // Query for details when selected
  const { data: detailData, isLoading: isLoadingDetail } = useQuery({
      queryKey: ['admin', 'consultation-detail', selectedConsultation],
      queryFn: () => adminApi.getConsultationDetail(selectedConsultation!),
      enabled: !!selectedConsultation
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <>
      <Header 
        title="Consultas Privadas" 
        subtitle="Gestión de sesiones 1:1"
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Consultas' }, { label: 'Privadas' }]}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-[2000px] mx-auto">
        {/* Filters */}
        <div className="flex flex-col xl:flex-row gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>

          <div className="flex flex-col sm:flex-row gap-4">
            <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[180px]"
            >
                <option value="all">Todos los estados</option>
                <option value="open">Pendientes</option>
                <option value="answered">Respondidas</option>
                <option value="expired">Expiradas</option>
                <option value="cancelled">Canceladas</option>
            </select>

            <select
                value={serviceKind}
                onChange={(e) => { setServiceKind(e.target.value); setPage(1); }}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[200px]"
            >
                <option value="all">Todos los servicios</option>
                {serviceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
            <TableSkeleton columns={6} rows={10} />
        ) : (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
                {!data?.data || data.data.length === 0 ? (
                    <EmptyState 
                        icon={MessageCircle}
                        title="No se encontraron consultas privadas"
                        description="Intenta ajustar los filtros o la búsqueda para encontrar lo que necesitas."
                    />
                ) : (
                    <ResponsiveTable headers={['Cliente', 'Tarotista', 'Servicio', 'Estado', 'Último Mensaje', 'Fecha']}>
                        {data.data.map((consultation: any) => {
                            const statusInfo = statusConfig[consultation.status] || statusConfig.unknown;
                            const StatusIcon = statusInfo.icon;
                            
                            return (
                                <ResponsiveTableRow 
                                    key={consultation.id}
                                    className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => setSelectedConsultation(consultation.id)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                                {consultation.user?.avatar_url ? (
                                                    <img src={consultation.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">
                                                    {consultation.user?.display_name || 'Desconocido'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {consultation.message_count} msgs
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {consultation.reader ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                                    {consultation.reader.avatar_url ? (
                                                        <img src={consultation.reader.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-3 h-3 text-slate-400" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-slate-300">{consultation.reader.display_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-500 italic">Sin asignar</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2" title={getServiceName(consultation.service_kind)}>
                                            <span className="text-lg">{getServiceEmoji(consultation.service_kind)}</span>
                                            <span className="text-sm text-slate-300 truncate max-w-[150px]">
                                                {getServiceName(consultation.service_kind)}
                                            </span>
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
                                            <div className="max-w-xs">
                                                <div className="text-xs text-slate-500 mb-0.5">
                                                    {consultation.last_message.sender_type === 'reader' ? 'Tarotista' : 'Usuario'}:
                                                </div>
                                                <p className="text-sm text-slate-300 line-clamp-1">
                                                    {consultation.last_message.body_text}
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-600 italic">Sin mensajes</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-400">
                                            {formatDate(consultation.created_at)}
                                        </div>
                                    </td>
                                </ResponsiveTableRow>
                            );
                        })}
                    </ResponsiveTable>
                )}

                {/* Pagination */}
                {data?.pagination && data.pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
                        <p className="text-sm text-slate-400">
                            Página {data.pagination.page} de {data.pagination.pages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={data.pagination.page === 1}
                                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                                disabled={data.pagination.page === data.pagination.pages}
                                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Detail Slide Over */}
      <SlideOver
        isOpen={!!selectedConsultation}
        onClose={() => setSelectedConsultation(null)}
        title="Detalle de Consulta"
      >
        {isLoadingDetail && !detailData ? (
             <div className="flex flex-col items-center justify-center py-12 space-y-4">
                 <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                 <p className="text-sm text-slate-400">Cargando conversación...</p>
             </div>
        ) : detailData?.data ? (
            <div className="space-y-6">
                {/* Meta Info */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Servicio</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{getServiceEmoji(detailData.data.session.service_kind)}</span>
                                <span className="font-medium text-white">{getServiceName(detailData.data.session.service_kind)}</span>
                            </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full border text-xs font-medium ${statusConfig[detailData.data.session.status]?.color}`}>
                            {statusConfig[detailData.data.session.status]?.label}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
                        <div>
                            <span className="text-xs text-slate-500 block mb-1">Cliente</span>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
                                     {detailData.data.session.user?.avatar_url ? (
                                        <img src={detailData.data.session.user.avatar_url} className="w-full h-full object-cover" />
                                     ) : <User size={12} className="text-purple-400"/>}
                                </div>
                                <span className="text-sm text-slate-300 truncate">{detailData.data.session.user?.display_name || 'Desconocido'}</span>
                            </div>
                        </div>
                         <div>
                            <span className="text-xs text-slate-500 block mb-1">Tarotista</span>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center overflow-hidden">
                                     {detailData.data.session.reader?.avatar_url ? (
                                        <img src={detailData.data.session.reader.avatar_url} className="w-full h-full object-cover" />
                                     ) : <User size={12} className="text-blue-400"/>}
                                </div>
                                <span className="text-sm text-slate-300 truncate">{detailData.data.session.reader?.display_name || 'Sin asignar'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <ChatViewer 
                    session={detailData.data.session}
                    messages={detailData.data.messages}
                />
            </div>
        ) : (
            <EmptyState title="Error" description="No se pudo cargar el detalle" icon={AlertCircle} />
        )}
      </SlideOver>
    </>
  );
}
