'use client';

import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { MobileCard, MobileCardActions, MobileCardField, MobileCardHeader, MobileCardList, ResponsiveTable, ResponsiveTableRow } from '@/components/common/ResponsiveTable';
import { SectionCard } from '@/components/common/SectionCard';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import type { Report, ReportStatus } from '@/lib/api/admin';
import { useReports, useUpdateReportStatus } from '@/lib/hooks/useReportes';
import { formatDate } from '@/lib/utils/dates';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Eye,
    Mail,
    MessageSquare,
    Send,
    Shield,
    XCircle,
    type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type StatusFilter = ReportStatus | 'all';

const statusConfig: Record<ReportStatus, { label: string; icon: LucideIcon; color: string }> = {
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
// Local modal components (scoped to this module)
// ---------------------------------------------------------------------------

interface ReportDetailModalProps {
  report: Report;
  onClose: () => void;
  onEmailReport: (report: Report) => void;
}

function ReportDetailModal({ report, onClose, onEmailReport }: ReportDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Detalle del Reporte</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Reportante</p>
              <p className="text-sm text-white font-medium">{report.reporter_name}</p>
              <p className="text-xs text-slate-400 capitalize">{report.reporter_type}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Reportado</p>
              <Link
                href={`/tarotistas/${report.reported_id}`}
                className="text-sm text-purple-400 hover:text-purple-300 font-medium"
              >
                {report.reported_name}
              </Link>
              <p className="text-xs text-slate-400 capitalize">{report.reported_type}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Estado</p>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[report.status].color}`}
              >
                {statusConfig[report.status].label}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Fecha</p>
              <p className="text-sm text-slate-300">{formatDate(report.created_at)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">Mensaje del Reporte</p>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-200 whitespace-pre-wrap">
                {report.reason || 'Sin mensaje'}
              </p>
            </div>
          </div>
          {report.resolution_notes && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Notas de Resolución</p>
              <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
                <p className="text-sm text-green-300 whitespace-pre-wrap">
                  {report.resolution_notes}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800">
          {report.reporter_email && (
            <button
              onClick={() => onEmailReport(report)}
              className="px-4 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Responder por Email
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

interface EmailComposeModalProps {
  report: Report;
  onClose: () => void;
}

function EmailComposeModal({ report, onClose }: EmailComposeModalProps) {
  const [subject, setSubject] = useState(
    `Re: Tu reporte en Oraclia - ${report.reported_name}`,
  );
  const [body, setBody] = useState(
    `Hola ${report.reporter_name},\n\nGracias por contactarnos respecto a tu reporte sobre ${report.reported_name}.\n\n[Tu mensaje aquí]\n\nSaludos,\nEquipo Oraclia`,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-400" />
            Responder a {report.reporter_name}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <div>
            <p className="text-xs text-slate-500 mb-1">Para</p>
            <p className="text-sm text-white bg-slate-800/50 px-3 py-2 rounded-lg">
              {report.reporter_email}
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Asunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Asunto del email..."
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Mensaje</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              placeholder="Escribe tu respuesta..."
            />
          </div>
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-2">Reporte Original:</p>
            <p className="text-sm text-slate-400 italic line-clamp-3">&quot;{report.reason}&quot;</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            Cancelar
          </button>
          <a
            href={`mailto:${report.reporter_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
            onClick={onClose}
            className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Abrir en Cliente de Email
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ReportesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [emailReport, setEmailReport] = useState<Report | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionConfirmation, setActionConfirmation] = useState<{ reportId: string, status: ReportStatus } | null>(null);
  const limit = 15;

  const { toast } = useToast();

  const { data, isLoading } = useReports({ status: statusFilter, page, limit });

  const updateStatusMutation = useUpdateReportStatus();

  const handleStatusChangeInit = (reportId: string, newStatus: ReportStatus) => {
    setActionConfirmation({ reportId, status: newStatus });
  };

  const handleConfirmAction = () => {
    if (!actionConfirmation) return;
    updateStatusMutation.mutate(
      {
        reportId: actionConfirmation.reportId,
        status: actionConfirmation.status,
        resolution_notes: resolutionNotes || undefined,
      },
      {
        onSuccess: () => {
          setResolutionNotes('');
          setActionConfirmation(null);
          toast('Estado del reporte actualizado', 'success');
        },
        onError: (error: Error) => {
          toast('Error al actualizar: ' + error.message, 'error');
          setActionConfirmation(null);
        },
      },
    );
  };

  const reports = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, pages: 1, limit };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const reviewingCount = reports.filter((r) => r.status === 'reviewing').length;

  return (
    <>
      <Header
        title="Gestión de Reportes"
        subtitle="Administra reportes de usuarios y tarotistas"
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Reportes' }]}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[2000px] mx-auto">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SectionCard padding="none" className="p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-sm text-slate-400">Pendientes</p>
            </div>
            <p className="text-2xl font-bold text-white">{pendingCount}</p>
          </SectionCard>

          <SectionCard padding="none" className="p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm text-slate-400">En Revisión</p>
            </div>
            <p className="text-2xl font-bold text-white">{reviewingCount}</p>
          </SectionCard>

          <SectionCard padding="none" className="p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-sm text-slate-400">Total Reportes</p>
            </div>
            <p className="text-2xl font-bold text-white">{pagination.total}</p>
          </SectionCard>
        </div>

        {/* Filters */}
        <SectionCard padding="none" className="p-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 sm:pb-0">
            {(['all', 'pending', 'reviewing', 'resolved', 'dismissed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  statusFilter === status
                    ? 'bg-purple-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {status === 'all' ? 'Todos' : statusConfig[status].label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Reports List */}
        {isLoading ? (
            <TableSkeleton columns={7} rows={10} />
        ) : (
            <SectionCard padding="none" className="overflow-hidden">
                {!reports || reports.length === 0 ? (
                    <EmptyState 
                        icon={Shield}
                        title="No hay reportes"
                        description={statusFilter !== 'all' ? 'No hay reportes con este estado.' : 'Todo está en orden.'}
                    />
                ) : (
                    <>
                        {/* Mobile Cards */}
                        <MobileCardList>
                            {reports.map((report) => {
                                const StatusIcon = statusConfig[report.status].icon;
                                return (
                                    <MobileCard key={report.id}>
                                        <MobileCardHeader>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {report.reporter_name}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    reportó a <span className="text-purple-400">{report.reported_name}</span>
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusConfig[report.status].color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusConfig[report.status].label}
                                            </span>
                                        </MobileCardHeader>
                                        
                                        <div className="bg-slate-800/50 rounded-lg p-3">
                                            <p className="text-sm text-slate-300 line-clamp-3">
                                                {report.reason || 'Sin mensaje'}
                                            </p>
                                        </div>
                                        
                                        <MobileCardField 
                                            label="Fecha" 
                                            value={formatDate(report.created_at)} 
                                        />
                                        
                                        <MobileCardActions>
                                            <button
                                                onClick={() => setViewReport(report)}
                                                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                Ver
                                            </button>
                                            {report.reporter_email && (
                                                <button
                                                    onClick={() => {
                                                        setEmailReport(report);
                                                    }}
                                                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                    Email
                                                </button>
                                            )}
                                            {report.status !== 'resolved' && (
                                                <button
                                                    onClick={() => handleStatusChangeInit(report.id, 'resolved')}
                                                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-green-400 hover:bg-green-500/10 rounded-lg transition"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Resolver
                                                </button>
                                            )}
                                        </MobileCardActions>
                                    </MobileCard>
                                );
                            })}
                        </MobileCardList>

                        {/* Desktop Table */}
                        <ResponsiveTable headers={['Reportante', 'Reportado', 'Msj', 'Estado', 'Fecha', 'Acciones']}>
                        {reports.map((report) => {
                             const StatusIcon = statusConfig[report.status].icon;
                             return (
                                <ResponsiveTableRow key={report.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-white">
                                                {report.reporter_name}
                                            </span>
                                            <span className="text-xs text-slate-500 capitalize">
                                                {report.reporter_type}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <Link 
                                                href={`/tarotistas/${report.reported_id}`}
                                                className="text-sm font-medium text-purple-400 hover:text-purple-300"
                                            >
                                                {report.reported_name}
                                            </Link>
                                            <span className="text-xs text-slate-500 capitalize">
                                                {report.reported_type}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-[200px]">
                                            <p className="text-sm text-slate-300 line-clamp-2" title={report.reason}>
                                                {report.reason || 'Sin mensaje'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[report.status].color}`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {statusConfig[report.status].label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {formatDate(report.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setViewReport(report)}
                                                className="p-1.5 text-purple-400 hover:bg-purple-500/10 rounded transition"
                                                title="Ver reporte completo"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                            {report.reporter_email && (
                                                <button
                                                    onClick={() => {
                                                        setEmailReport(report);
                                                    }}
                                                    className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded transition"
                                                    title="Responder por email"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                            )}
                                            {report.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusChangeInit(report.id, 'reviewing')}
                                                    className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition"
                                                    title="Marcar en revisión"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}
                                            {report.status !== 'resolved' && (
                                                <button
                                                    onClick={() => handleStatusChangeInit(report.id, 'resolved')}
                                                    className="p-1.5 text-green-400 hover:bg-green-500/10 rounded transition"
                                                    title="Resolver"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {report.status !== 'dismissed' && (
                                                <button
                                                    onClick={() => handleStatusChangeInit(report.id, 'dismissed')}
                                                    className="p-1.5 text-slate-400 hover:bg-slate-500/10 rounded transition"
                                                    title="Desestimar"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </ResponsiveTableRow>
                             );
                        })}
                    </ResponsiveTable>
                    </>
                )}

                <Pagination
                    page={pagination.page}
                    pages={pagination.pages}
                    total={pagination.total}
                    limit={limit}
                    onPageChange={setPage}
                    itemLabel="reportes"
                />
            </SectionCard>
        )}
      </div>

       <ConfirmModal 
        isOpen={!!actionConfirmation}
        onClose={() => setActionConfirmation(null)}
        onConfirm={handleConfirmAction}
        title="Actualizar Estado del Reporte"
        message={actionConfirmation ? `¿Estás seguro de cambiar el estado a "${statusConfig[actionConfirmation.status].label}"?` : ''}
        isLoading={updateStatusMutation.isPending}
        isDestructive={actionConfirmation?.status === 'dismissed'}
      />

      {viewReport && (
        <ReportDetailModal
          report={viewReport}
          onClose={() => setViewReport(null)}
          onEmailReport={(r) => {
            setViewReport(null);
            setEmailReport(r);
          }}
        />
      )}
      {emailReport && (
        <EmailComposeModal
          report={emailReport}
          onClose={() => setEmailReport(null)}
        />
      )}
    </>
  );
}
