'use client';

import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, ResponsiveTable, ResponsiveTableRow } from '@/components/common/ResponsiveTable';
import { SectionCard } from '@/components/common/SectionCard';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { useToast } from '@/components/ui/Toast';
import { useDeleteFlashQuestion, useFlashQuestions, useResetFlashQuestion } from '@/lib/hooks/useConsultas';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/dates';
import type { LucideIcon } from 'lucide-react';
import {
    AlertCircle,
    Archive,
    CheckCircle2,
    Clock,
    Eye,
    Image as ImageIcon,
    MessageSquare,
    RotateCcw,
    Search,
    User,
    XCircle
} from 'lucide-react';
import { useState } from 'react';

const statusConfig: Record<string, { label: string; icon: LucideIcon; color: string }> = {
    open: { label: 'Abierta', icon: Clock, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    claimed: { label: 'Reclamada', icon: Eye, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    answered: { label: 'Respondida', icon: CheckCircle2, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    closed: { label: 'Cerrada', icon: CheckCircle2, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    cancelled: { label: 'Cancelada', icon: XCircle, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    expired: { label: 'Expirada', icon: AlertCircle, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    unknown: { label: 'Desconocido', icon: AlertCircle, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

export function FlashQuestionsTab() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
    const [questionToReset, setQuestionToReset] = useState<string | null>(null);

    const { toast } = useToast();
    const { data, isLoading } = useFlashQuestions({ page, limit: 15, search, status });
    const deleteMutation = useDeleteFlashQuestion();
    const resetMutation = useResetFlashQuestion();

    const handleDelete = () => {
        if (!questionToDelete) return;
        deleteMutation.mutate(questionToDelete, {
            onSuccess: () => {
                toast('Pregunta archivada correctamente', 'success');
                setQuestionToDelete(null);
            },
            onError: (error) => {
                toast('Error al archivar: ' + (error as Error).message, 'error');
                setQuestionToDelete(null);
            },
        });
    };

    const handleReset = () => {
        if (!questionToReset) return;
        resetMutation.mutate(questionToReset, {
            onSuccess: () => {
                toast('Pregunta reseteada a estado abierta', 'success');
                setQuestionToReset(null);
            },
            onError: (error) => {
                toast('Error al resetear: ' + (error as Error).message, 'error');
                setQuestionToReset(null);
            },
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
    };

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Filters */}
            <SectionCard padding="none" className="flex flex-col sm:flex-row gap-4 p-4">
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
            </SectionCard>

            {/* Content */}
            {isLoading ? (
                <TableSkeleton columns={6} rows={10} />
            ) : (
                <SectionCard padding="none" className="overflow-hidden">
                    {!data?.data || data.data.length === 0 ? (
                        <EmptyState
                            icon={Search}
                            title="No se encontraron consultas flash"
                            description="Intenta ajustar los filtros o la búsqueda para encontrar lo que necesitas."
                        />
                    ) : (
                        <>
                            {/* Mobile Cards */}
                            <MobileCardList>
                                {data.data.map((question) => {
                                    const statusInfo = statusConfig[question.status] || statusConfig.unknown;
                                    const StatusIcon = statusInfo.icon;

                                    return (
                                        <MobileCard key={question.id}>
                                            <MobileCardHeader>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {question.user?.avatar_url ? (
                                                            <img src={question.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium text-white truncate">
                                                            {question.user?.display_name || 'Desconocido'}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {formatRelativeTime(question.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium flex-shrink-0 ${statusInfo.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    <span className="hidden xs:inline">{statusInfo.label}</span>
                                                </div>
                                            </MobileCardHeader>

                                            <div className="bg-slate-900/50 rounded-lg p-3 -mx-1">
                                                <div className="flex items-start gap-2">
                                                    <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-slate-300 line-clamp-3">
                                                        {question.content}
                                                    </p>
                                                </div>
                                            </div>

                                            {question.answer && (
                                                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 -mx-1 flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 text-green-500 text-xs font-medium mb-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Respondida por {question.answer.reader_name}
                                                    </div>
                                                    <p className="text-sm text-slate-400 line-clamp-2">{question.answer.body_text}</p>

                                                    {/* Attachment Preview (Mobile) */}
                                                    {question.answer.image_url && (
                                                        <div className="mt-2 rounded-lg overflow-hidden border border-slate-700 bg-slate-800/50 flex items-center gap-2 p-2">
                                                            <img
                                                                src={question.answer.image_url}
                                                                alt="Carta"
                                                                className="w-10 h-10 object-cover rounded bg-slate-800"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                }}
                                                            />
                                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                                <ImageIcon className="w-3 h-3" />
                                                                Imagen adjunta
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <MobileCardActions>
                                                {question.status === 'claimed' && (
                                                    <button
                                                        onClick={() => setQuestionToReset(question.id)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition text-sm"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                        Resetear
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setQuestionToDelete(question.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition text-sm"
                                                >
                                                    <Archive className="w-4 h-4" />
                                                    Archivar
                                                </button>
                                            </MobileCardActions>
                                        </MobileCard>
                                    );
                                })}
                            </MobileCardList>

                            {/* Desktop Table */}
                            <ResponsiveTable headers={['Usuario', 'Pregunta', 'Estado', 'Respuesta', 'Fecha', 'Acciones']}>
                                {data.data.map((question) => {
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
                                                        <p className="text-slate-400 line-clamp-1 mb-1">{question.answer.body_text}</p>

                                                        {question.answer.image_url && (
                                                            <a href={question.answer.image_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors">
                                                                <ImageIcon className="w-3 h-3" />
                                                                <span>Ver imagen</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-600 italic">Sin respuesta</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-400">
                                                    {formatDateTime(question.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    {question.status === 'claimed' && (
                                                        <button
                                                            onClick={() => setQuestionToReset(question.id)}
                                                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition"
                                                            title="Resetear a abierta"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setQuestionToDelete(question.id)}
                                                        className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition"
                                                        title="Archivar pregunta"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
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

            <ConfirmModal
                isOpen={!!questionToDelete}
                onClose={() => setQuestionToDelete(null)}
                onConfirm={handleDelete}
                title="Archivar Consulta"
                message="¿Estás seguro de archivar esta pregunta? La pregunta dejará de aparecer en el feed de la app, pero los datos se conservarán en la base de datos."
                isDestructive
                isLoading={deleteMutation.isPending}
            />

            <ConfirmModal
                isOpen={!!questionToReset}
                onClose={() => setQuestionToReset(null)}
                onConfirm={handleReset}
                title="Resetear Pregunta Flash"
                message="¿Estás seguro de resetear esta pregunta? Se cambiará el estado de 'reclamada' a 'abierta' y se quitará el tarotista asignado. La pregunta volverá a estar disponible en el feed para que otro tarotista la tome."
                confirmText="Sí, resetear"
                cancelText="Cancelar"
                isLoading={resetMutation.isPending}
            />
        </div>
    );
}
