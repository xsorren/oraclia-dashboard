'use client';

import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { ResponsiveTable, ResponsiveTableRow } from '@/components/common/ResponsiveTable';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import { adminApi } from '@/lib/api/admin';
import { formatDate } from '@/lib/utils/dates';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    Archive,
    CheckCircle2,
    Clock,
    Eye,
    Search,
    User,
    XCircle
} from 'lucide-react';
import { useState } from 'react';

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  open: { label: 'Abierta', icon: Clock, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  claimed: { label: 'Reclamada', icon: Eye, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  answered: { label: 'Respondida', icon: CheckCircle2, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  closed: { label: 'Cerrada', icon: CheckCircle2, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  cancelled: { label: 'Cancelada', icon: XCircle, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  expired: { label: 'Expirada', icon: AlertCircle, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  unknown: { label: 'Desconocido', icon: AlertCircle, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

export default function ConsultasPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'flash-questions', page, search, status],
    queryFn: () => adminApi.getFlashQuestions({ page, limit: 15, search, status }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFlashQuestion({ questionId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flash-questions'] });
      toast('Pregunta archivada correctamente', 'success');
      setQuestionToDelete(null);
    },
    onError: (error) => {
      toast('Error al archivar: ' + error.message, 'error');
      setQuestionToDelete(null);
    }
  });

  const handleDelete = () => {
    if (questionToDelete) {
        deleteMutation.mutate(questionToDelete);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <>
      <Header 
        title="Consultas Flash" 
        subtitle="Gestión de preguntas y respuestas"
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Consultas' }]}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-[2000px] mx-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por contenido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abierta</option>
            <option value="claimed">Reclamada</option>
            <option value="answered">Respondida</option>
            <option value="expired">Expirada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
            <TableSkeleton columns={6} rows={10} />
        ) : (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
                {!data?.data || data.data.length === 0 ? (
                    <EmptyState 
                        icon={Search}
                        title="No se encontraron consultas"
                        description="Intenta ajustar los filtros o la búsqueda para encontrar lo que necesitas."
                    />
                ) : (
                    <ResponsiveTable headers={['Usuario', 'Pregunta', 'Estado', 'Respuesta', 'Fecha', 'Acciones']}>
                        {data.data.map((question: any) => {
                            const statusInfo = statusConfig[question.status] || statusConfig.unknown;
                            const StatusIcon = statusInfo.icon;
                            
                            return (
                                <ResponsiveTableRow key={question.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                                {question.user?.avatar_url ? (
                                                    <img src={question.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="text-sm font-medium text-white">
                                                {question.user?.display_name || 'Desconocido'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-md">
                                            <p className="text-sm text-slate-300 line-clamp-2" title={question.content}>
                                                {question.content}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusInfo.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {statusInfo.label}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {question.answer ? (
                                            <div className="text-xs">
                                                <div className="text-green-500 font-medium mb-1 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Respondida por {question.answer.reader_name}
                                                </div>
                                                <p className="text-slate-400 line-clamp-1">{question.answer.body_text}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-600 italic">Sin respuesta</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-400">
                                            {formatDate(question.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => setQuestionToDelete(question.id)}
                                            className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition"
                                            title="Archivar pregunta"
                                        >
                                            <Archive className="w-4 h-4" />
                                        </button>
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

      <ConfirmModal 
        isOpen={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={handleDelete}
        title="Archivar Consulta"
        message="¿Estás seguro de archivar esta pregunta? La pregunta dejará de aparecer en el feed de la app, pero los datos se conservarán en la base de datos."
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
