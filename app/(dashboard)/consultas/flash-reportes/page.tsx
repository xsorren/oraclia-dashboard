'use client';

import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import {
    MobileCard,
    MobileCardActions,
    MobileCardField,
    MobileCardHeader,
    MobileCardList,
    ResponsiveTable,
    ResponsiveTableRow,
} from '@/components/common/ResponsiveTable';
import { SectionCard } from '@/components/common/SectionCard';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import type { FlashReport, ReportStatus } from '@/lib/hooks/useFlashReports';
import {
    useBanUserFromFlashReport,
    useFlashReports,
    useUpdateFlashReport,
} from '@/lib/hooks/useFlashReports';
import { formatDate } from '@/lib/utils/dates';
import {
    Ban,
    CheckCircle2,
    Clock,
    Eye,
    Flag,
    User,
    XCircle,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

type StatusFilter = ReportStatus | 'all';

const reportStatusConfig: Record<ReportStatus, { label: string; icon: LucideIcon; color: string }> = {
    pending: {
        label: 'Pendiente',
        icon: Clock,
        color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    },
    reviewing: {
        label: 'Revisando',
        icon: Eye,
        color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    },
    resolved: {
        label: 'Resuelto',
        icon: CheckCircle2,
        color: 'bg-green-500/10 text-green-500 border-green-500/20',
    },
    dismissed: {
        label: 'Desestimado',
        icon: XCircle,
        color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    },
};

// ---------------------------------------------------------------------------
// Question detail modal
// ---------------------------------------------------------------------------

interface QuestionDetailModalProps {
    report: FlashReport;
    onClose: () => void;
    onBan: (report: FlashReport) => void;
    onUpdateStatus: (report: FlashReport, status: ReportStatus) => void;
    isUpdating: boolean;
}

function QuestionDetailModal({
    report,
    onClose,
    onBan,
    onUpdateStatus,
    isUpdating,
}: QuestionDetailModalProps) {
    const statusInfo = reportStatusConfig[report.status];
    const StatusIcon = statusInfo.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-red-400" />
                        <h3 className="text-lg font-semibold text-white">Reporte Flash</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Question */}
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Pregunta Flash reportada</p>
                        <div className="bg-slate-800/60 rounded-lg px-4 py-3 border border-slate-700">
                            <p className="text-sm text-slate-200 leading-relaxed">{report.question_content}</p>
                            <p className="text-xs text-slate-500 mt-2">
                                Enviada {formatDate(report.question_created_at)} Â· Estado: {report.question_status}
                            </p>
                        </div>
                    </div>

                    {/* Reported user */}
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Usuario reportado</p>
                        <div className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-4 py-3 border border-slate-700">
                            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {report.reported_avatar ? (
                                    <img src={report.reported_avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{report.reported_name}</p>
                                {report.reported_email && (
                                    <p className="text-xs text-slate-400 truncate">{report.reported_email}</p>
                                )}
                            </div>
                            {report.reported_is_banned && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">
                                    <Ban className="w-3 h-3" /> Baneado
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Report details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Reportado por</p>
                            <p className="text-sm text-white font-medium">{report.reporter_name}</p>
                            <p className="text-xs text-slate-500">Tarotista</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Motivo</p>
                            <p className="text-sm text-white font-medium">{report.reason}</p>
                        </div>
                        {report.description && (
                            <div className="col-span-2">
                                <p className="text-xs text-slate-500 mb-1">DescripciÃ³n</p>
                                <p className="text-sm text-slate-300 leading-relaxed">{report.description}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Estado</p>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Fecha</p>
                            <p className="text-sm text-slate-300">{formatDate(report.created_at)}</p>
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-slate-800 space-y-3">
                    {/* Status updates */}
                    {report.status === 'pending' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onUpdateStatus(report, 'reviewing')}
                                disabled={isUpdating}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm font-medium rounded-lg border border-blue-500/30 transition disabled:opacity-50"
                            >
                                <Eye className="w-4 h-4" />
                                Marcar revisando
                            </button>
                            <button
                                onClick={() => onUpdateStatus(report, 'dismissed')}
                                disabled={isUpdating}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition disabled:opacity-50"
                            >
                                <XCircle className="w-4 h-4" />
                                Desestimar
                            </button>
                        </div>
                    )}
                    {report.status === 'reviewing' && (
                        <button
                            onClick={() => onUpdateStatus(report, 'resolved')}
                            disabled={isUpdating}
                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-sm font-medium rounded-lg border border-green-500/30 transition disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Marcar como resuelto
                        </button>
                    )}
                    {/* Ban action */}
                    {!report.reported_is_banned && (
                        <button
                            onClick={() => onBan(report)}
                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-lg border border-red-500/20 transition"
                        >
                            <Ban className="w-4 h-4" />
                            Banear / eliminar usuario
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FlashReportesPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selectedReport, setSelectedReport] = useState<FlashReport | null>(null);
    const [reportToBan, setReportToBan] = useState<FlashReport | null>(null);

    const { toast } = useToast();

    const { data, isLoading } = useFlashReports({
        status: statusFilter,
        page,
        limit,
    });

    const { mutate: updateReport, isPending: isUpdating } = useUpdateFlashReport();
    const { mutate: banUser, isPending: isBanning } = useBanUserFromFlashReport();

    const reports = data?.data ?? [];
    const pagination = data?.pagination ?? { total: 0, page: 1, limit, pages: 0 };

    const handleStatusFilter = (value: StatusFilter) => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleUpdateStatus = (report: FlashReport, newStatus: ReportStatus) => {
        updateReport(
            { reportId: report.id, status: newStatus },
            {
                onSuccess: () => {
                    toast(`Reporte marcado como ${reportStatusConfig[newStatus].label.toLowerCase()}`, 'success');
                    setSelectedReport((prev) =>
                        prev?.id === report.id ? { ...prev, status: newStatus } : prev
                    );
                },
                onError: (err) => toast((err as Error).message || 'Error al actualizar', 'error'),
            }
        );
    };

    const handleBanConfirm = () => {
        if (!reportToBan) return;
        banUser(reportToBan.reported_id, {
            onSuccess: () => {
                toast(`Usuario "${reportToBan.reported_name}" baneado correctamente`, 'success');
                updateReport({ reportId: reportToBan.id, status: 'resolved', resolution_notes: 'Usuario baneado por el administrador' });
                setReportToBan(null);
                setSelectedReport(null);
            },
            onError: (err) => {
                toast((err as Error).message || 'Error al banear usuario', 'error');
                setReportToBan(null);
            },
        });
    };

    return (
        <>
            <Header
                title="Reportes Flash"
                subtitle={`${pagination.total} reportes de preguntas Flash`}
                breadcrumbs={[
                    { label: 'Inicio', href: '/' },
                    { label: 'Flash', href: '/consultas' },
                    { label: 'Reportes' },
                ]}
            />

            <div className="p-6 space-y-6">
                <SectionCard padding="none">
                    <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800">
                            <Flag className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">Reportes de preguntas Flash</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Reportes enviados por tarotistas sobre preguntas del feed pÃºblico.
                                Puedes ver la consulta, revisar el perfil del usuario y banearlo si corresponde.
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {(['all', 'pending', 'reviewing', 'resolved', 'dismissed'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleStatusFilter(s)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                                        statusFilter === s
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
                                    }`}
                                >
                                    {s === 'all'
                                        ? 'Todos'
                                        : reportStatusConfig[s as ReportStatus].label}
                                </button>
                            ))}
                        </div>

                        {isLoading ? (
                            <TableSkeleton columns={7} rows={8} />
                        ) : reports.length === 0 ? (
                            <EmptyState
                                icon={Flag}
                                title="Sin reportes"
                                description={
                                    statusFilter === 'all'
                                        ? 'Aún no hay reportes de preguntas Flash.'
                                        : `No hay reportes con estado "${reportStatusConfig[statusFilter as ReportStatus]?.label ?? statusFilter}".`
                                }
                            />
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block">
                                    <ResponsiveTable
                                        headers={['Pregunta', 'Usuario reportado', 'Tarotista', 'Motivo', 'Estado', 'Fecha', 'Acciones']}
                                    >
                                        {reports.map((report) => {
                                            const statusInfo = reportStatusConfig[report.status];
                                            const StatusIcon = statusInfo.icon;
                                            return (
                                                <ResponsiveTableRow key={report.id}>
                                                    {/* Pregunta */}
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-slate-300 max-w-xs truncate">
                                                            {report.question_content}
                                                        </p>
                                                    </td>
                                                    {/* Usuario reportado */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                {report.reported_avatar ? (
                                                                    <img src={report.reported_avatar} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User className="w-4 h-4 text-slate-400" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{report.reported_name}</p>
                                                                {report.reported_is_banned && (
                                                                    <span className="text-xs text-red-400 flex items-center gap-0.5">
                                                                        <Ban className="w-3 h-3" /> Baneado
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Tarotista */}
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-slate-300">{report.reporter_name}</p>
                                                    </td>
                                                    {/* Motivo */}
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-slate-300 max-w-[140px] truncate" title={report.reason}>
                                                            {report.reason}
                                                        </p>
                                                    </td>
                                                    {/* Estado */}
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {statusInfo.label}
                                                        </span>
                                                    </td>
                                                    {/* Fecha */}
                                                    <td className="px-6 py-4 text-sm text-slate-400">
                                                        {formatDate(report.created_at)}
                                                    </td>
                                                    {/* Acciones */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setSelectedReport(report)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                Ver
                                                            </button>
                                                            {!report.reported_is_banned && (
                                                                <button
                                                                    onClick={() => setReportToBan(report)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition"
                                                                >
                                                                    <Ban className="w-3.5 h-3.5" />
                                                                    Banear
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </ResponsiveTableRow>
                                            );
                                        })}
                                    </ResponsiveTable>
                                </div>

                                {/* Mobile cards */}
                                <MobileCardList>
                                    {reports.map((report) => {
                                        const statusInfo = reportStatusConfig[report.status];
                                        const StatusIcon = statusInfo.icon;
                                        return (
                                            <MobileCard key={report.id}>
                                                <MobileCardHeader>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{report.reported_name}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">Motivo: {report.reason}</p>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusInfo.label}
                                                    </span>
                                                </MobileCardHeader>
                                                <MobileCardField label="Pregunta" value={report.question_content} />
                                                <MobileCardField label="Tarotista" value={report.reporter_name} />
                                                <MobileCardField label="Fecha" value={formatDate(report.created_at)} />
                                                {report.reported_is_banned && (
                                                    <MobileCardField label="Estado usuario" value="Baneado" />
                                                )}
                                                <MobileCardActions>
                                                    <button
                                                        onClick={() => setSelectedReport(report)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-700"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> Ver detalle
                                                    </button>
                                                    {!report.reported_is_banned && (
                                                        <button
                                                            onClick={() => setReportToBan(report)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-medium rounded-lg border border-red-500/20"
                                                        >
                                                            <Ban className="w-3.5 h-3.5" /> Banear
                                                        </button>
                                                    )}
                                                </MobileCardActions>
                                            </MobileCard>
                                        );
                                    })}
                                </MobileCardList>

                                <div className="mt-4">
                                    <Pagination
                                        page={pagination.page}
                                        pages={pagination.pages}
                                        total={pagination.total}
                                        limit={limit}
                                        onPageChange={setPage}
                                        itemLabel="reportes"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </SectionCard>
            </div>

            {/* Detail modal */}
            {selectedReport && (
                <QuestionDetailModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                    onBan={(r) => setReportToBan(r)}
                    onUpdateStatus={handleUpdateStatus}
                    isUpdating={isUpdating}
                />
            )}

            {/* Ban confirm modal */}
            <ConfirmModal
                isOpen={!!reportToBan}
                onClose={() => setReportToBan(null)}
                onConfirm={handleBanConfirm}
                title="Banear usuario"
                message={
                    reportToBan
                        ? `Â¿EstÃ¡s seguro de que quieres banear y desactivar la cuenta de "${reportToBan.reported_name}"? Esta acciÃ³n no se puede revertir fÃ¡cilmente.`
                        : ''
                }
                confirmText={isBanning ? 'Baneando...' : 'SÃ­, banear'}
                isDestructive
                isLoading={isBanning}
            />
        </>
    );
}

