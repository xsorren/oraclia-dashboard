'use client';

import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { MobileCard, MobileCardActions, MobileCardField, MobileCardHeader, MobileCardList, ResponsiveTable, ResponsiveTableRow } from '@/components/common/ResponsiveTable';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import type { Currency, PayoutStatus } from '@/types/database';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    Download,
    Eye,
    FileText,
    RefreshCw,
    TrendingUp,
    Upload,
    User,
    Wallet,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

interface MonthlyPayoutData {
  reader_id: string;
  display_name: string;
  avatar_url: string | null;
  sessions_count: number;
  amount: number;
  currency: Currency;
  platform: 'mercadopago' | 'paypal';
  period_start: string | null;
  period_end: string | null;
  payout_status: PayoutStatus | null;
  payout_id: string | null;
  processed_at: string | null;
  receipt_url: string | null;
}

type PlatformFilter = 'all' | 'mercadopago' | 'paypal_usd' | 'paypal_eur';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function PagosMensualesPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  
  // State for modals
  const [payoutToProcess, setPayoutToProcess] = useState<MonthlyPayoutData | null>(null);
  const [statusToUpdate, setStatusToUpdate] = useState<{ payoutId: string; status: PayoutStatus } | null>(null);
  const [payoutForReceipt, setPayoutForReceipt] = useState<string | null>(null);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'monthly-payouts', selectedMonth, selectedYear, platformFilter],
    queryFn: () => adminApi.getMonthlyPayouts({ 
      month: selectedMonth, 
      year: selectedYear,
      platform: platformFilter,
    }),
    staleTime: 1000 * 60 * 2,
  });

  const processPayoutMutation = useMutation({
    mutationFn: (payout: MonthlyPayoutData) => adminApi.processPayout({ 
      readerId: payout.reader_id, 
      month: selectedMonth,
      year: selectedYear,
      currency: payout.currency,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'monthly-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-history'] });
      setPayoutToProcess(null);
      toast('Pago procesado correctamente', 'success');
    },
    onError: (error: Error) => {
      toast('Error al procesar el pago: ' + error.message, 'error');
      setPayoutToProcess(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ payoutId, status }: { payoutId: string; status: PayoutStatus }) => 
      adminApi.updatePayoutStatus({ payoutId, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'monthly-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-history'] });
      setStatusToUpdate(null);
      toast('Estado actualizado correctamente', 'success');
    },
    onError: (error: Error) => {
        toast('Error al actualizar el estado: ' + error.message, 'error');
        setStatusToUpdate(null);
    }
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: ({ payoutId, file }: { payoutId: string; file: File }) => 
      adminApi.uploadPayoutReceipt({ payoutId, file }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'monthly-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-history'] });
      setPayoutForReceipt(null);
      toast('Comprobante subido correctamente', 'success');
    },
    onError: (error: Error) => {
      toast('Error al subir comprobante: ' + error.message, 'error');
      setPayoutForReceipt(null);
    }
  });

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const blob = await adminApi.exportPayouts({
        month: selectedMonth,
        year: selectedYear,
        status: 'all'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pagos_${selectedYear}_${selectedMonth.toString().padStart(2, '0')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast('Archivo CSV descargado correctamente', 'success');
    } catch (error: any) {
      toast('Error al exportar: ' + error.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleUploadReceipt = (payoutId: string) => {
    setPayoutForReceipt(payoutId);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && payoutForReceipt) {
      uploadReceiptMutation.mutate({ payoutId: payoutForReceipt, file });
    }
    event.target.value = '';
  };

  const handleProcessPayout = (payout: MonthlyPayoutData) => {
    setPayoutToProcess(payout);
  };

  const cancelProcessPayout = () => {
    setPayoutToProcess(null);
  };

  const confirmProcessPayout = () => {
    if (payoutToProcess) {
      processPayoutMutation.mutate(payoutToProcess);
    }
  };

  const handleUpdateStatus = (payoutId: string, newStatus: PayoutStatus) => {
    setStatusToUpdate({ payoutId, status: newStatus });
  };
  
  const cancelUpdateStatus = () => {
    setStatusToUpdate(null);
  };

  const confirmUpdateStatus = () => {
    if (statusToUpdate) {
      updateStatusMutation.mutate(statusToUpdate);
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
          <Clock className="w-3 h-3" />
          Pendiente
        </span>
      );
    }

    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Completado
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3" />
            En proceso
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3" />
            Fallido
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <XCircle className="w-3 h-3" />
            Cancelado
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  const getPlatformBadge = (currency: Currency) => {
    if (currency === 'ARS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Wallet className="w-3 h-3" />
          MP
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <CreditCard className="w-3 h-3" />
        PayPal
      </span>
    );
  };

  const byPlatform = data?.by_platform;
  const summary = data?.summary;

  return (
    <>
      <Header 
        title="Pagos Mensuales" 
        subtitle="Gestión de pagos a tarotistas por plataforma"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Pagos', href: '/pagos' },
          { label: 'Mensuales' }
        ]}
      />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[2000px] mx-auto">
        {/* Month/Year Selector */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={handlePreviousMonth}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition flex-shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold text-white truncate">
                    {MONTHS[selectedMonth - 1]} {selectedYear}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">Período de pago</p>
                </div>
              </div>

              <button
                onClick={handleNextMonth}
                disabled={selectedYear > now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth > now.getMonth() + 1)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm hidden sm:inline">Actualizar</span>
              </button>

              <button
                onClick={handleExportCSV}
                disabled={isExporting || isLoading || !data?.data?.length}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg transition disabled:opacity-50"
                title="Exportar a CSV"
              >
                <Download className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
                <span className="text-sm hidden sm:inline">Exportar</span>
              </button>

              <Link
                href="/pagos/historial"
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg transition"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Historial</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Platform Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* MercadoPago Card */}
          <button
            onClick={() => setPlatformFilter(platformFilter === 'mercadopago' ? 'all' : 'mercadopago')}
            className={`text-left bg-gradient-to-br from-sky-900/30 to-slate-900/50 backdrop-blur-sm border rounded-xl p-5 transition-all ${
              platformFilter === 'mercadopago' 
                ? 'border-sky-500 ring-2 ring-sky-500/20' 
                : 'border-sky-800/50 hover:border-sky-600/50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/20 rounded-lg">
                  <Wallet className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">MercadoPago</h3>
                  <p className="text-xs text-sky-300/70">ARS</p>
                </div>
              </div>
              {platformFilter === 'mercadopago' && (
                <span className="text-xs text-sky-400 font-medium">Filtrado</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? '...' : formatCurrency(byPlatform?.mercadopago?.total_amount || 0, 'ARS')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Tarotistas</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-white">
                    {isLoading ? '...' : byPlatform?.mercadopago?.payouts?.length || 0}
                  </p>
                  {(byPlatform?.mercadopago?.pending_count || 0) > 0 && (
                    <span className="text-xs text-orange-400">
                      ({byPlatform?.mercadopago?.pending_count} pend.)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>

          {/* PayPal USD Card */}
          <button
            onClick={() => setPlatformFilter(platformFilter === 'paypal_usd' ? 'all' : 'paypal_usd')}
            className={`text-left bg-gradient-to-br from-blue-900/30 to-slate-900/50 backdrop-blur-sm border rounded-xl p-5 transition-all ${
              platformFilter === 'paypal_usd' 
                ? 'border-blue-500 ring-2 ring-blue-500/20' 
                : 'border-blue-800/50 hover:border-blue-600/50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">PayPal</h3>
                  <p className="text-xs text-blue-300/70">USD</p>
                </div>
              </div>
              {platformFilter === 'paypal_usd' && (
                <span className="text-xs text-blue-400 font-medium">Filtrado</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? '...' : formatCurrency(byPlatform?.paypal_usd?.total_amount || 0, 'USD')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Tarotistas</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-white">
                    {isLoading ? '...' : byPlatform?.paypal_usd?.payouts?.length || 0}
                  </p>
                  {(byPlatform?.paypal_usd?.pending_count || 0) > 0 && (
                    <span className="text-xs text-orange-400">
                      ({byPlatform?.paypal_usd?.pending_count} pend.)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>

          {/* PayPal EUR Card */}
          <button
            onClick={() => setPlatformFilter(platformFilter === 'paypal_eur' ? 'all' : 'paypal_eur')}
            className={`text-left bg-gradient-to-br from-indigo-900/30 to-slate-900/50 backdrop-blur-sm border rounded-xl p-5 transition-all ${
              platformFilter === 'paypal_eur' 
                ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                : 'border-indigo-800/50 hover:border-indigo-600/50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">PayPal</h3>
                  <p className="text-xs text-indigo-300/70">EUR</p>
                </div>
              </div>
              {platformFilter === 'paypal_eur' && (
                <span className="text-xs text-indigo-400 font-medium">Filtrado</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? '...' : formatCurrency(byPlatform?.paypal_eur?.total_amount || 0, 'EUR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Tarotistas</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-white">
                    {isLoading ? '...' : byPlatform?.paypal_eur?.payouts?.length || 0}
                  </p>
                  {(byPlatform?.paypal_eur?.pending_count || 0) > 0 && (
                    <span className="text-xs text-orange-400">
                      ({byPlatform?.paypal_eur?.pending_count} pend.)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm text-slate-400">Total Tarotistas</p>
            </div>
            <p className="text-2xl font-bold text-white">{summary?.total_tarotistas || 0}</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-sm text-slate-400">Pendientes</p>
            </div>
            <p className="text-2xl font-bold text-white">{summary?.pending_count || 0}</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-sm text-slate-400">Procesados</p>
            </div>
            <p className="text-2xl font-bold text-white">{summary?.processed_count || 0}</p>
          </div>
        </div>

        {/* Filter indicator */}
        {platformFilter !== 'all' && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Mostrando:</span>
            <span className={`font-medium ${
              platformFilter === 'mercadopago' ? 'text-sky-400' :
              platformFilter === 'paypal_usd' ? 'text-blue-400' : 'text-indigo-400'
            }`}>
              {platformFilter === 'mercadopago' ? 'MercadoPago (ARS)' :
               platformFilter === 'paypal_usd' ? 'PayPal (USD)' : 'PayPal (EUR)'}
            </span>
            <button 
              onClick={() => setPlatformFilter('all')}
              className="text-slate-500 hover:text-white transition"
            >
              ✕ Limpiar filtro
            </button>
          </div>
        )}

        {/* Payouts Table */}
        {isLoading ? (
          <TableSkeleton columns={6} rows={8} />
        ) : (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg overflow-hidden">
            {!data || !data.data || data.data.length === 0 ? (
              <EmptyState 
                icon={TrendingUp}
                title={`No hay pagos pendientes en ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
                description={platformFilter !== 'all' 
                  ? 'No hay tarotistas con esta moneda para este período' 
                  : 'No se registraron consultas completadas en este período'}
              />
            ) : (
              <>
                {/* Mobile Cards */}
                <MobileCardList>
                  {data.data.map((payout: MonthlyPayoutData) => (
                    <MobileCard key={payout.reader_id}>
                      <MobileCardHeader>
                        <div className="flex items-center gap-3 min-w-0">
                          {payout.avatar_url ? (
                            <img 
                              src={payout.avatar_url} 
                              alt={payout.display_name}
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                              {payout.display_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/tarotistas/${payout.reader_id}`}
                              className="text-sm font-medium text-purple-400 hover:text-purple-300 truncate block"
                            >
                              {payout.display_name}
                            </Link>
                            <p className="text-xs text-slate-500">
                              {payout.sessions_count} consulta{payout.sessions_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(payout.payout_status)}
                      </MobileCardHeader>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <MobileCardField 
                          label="Plataforma" 
                          value={getPlatformBadge(payout.currency)} 
                        />
                        <MobileCardField 
                          label="Monto" 
                          value={<span className="text-lg font-semibold">{formatCurrency(payout.amount, payout.currency)}</span>} 
                        />
                      </div>
                      
                      <MobileCardActions>
                        {!payout.payout_status ? (
                          <button
                            onClick={() => handleProcessPayout(payout)}
                            disabled={processPayoutMutation.isPending}
                            className="flex-1 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-sm font-medium transition disabled:opacity-50"
                          >
                            Procesar Pago
                          </button>
                        ) : (
                          <>
                            {payout.payout_status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(payout.payout_id!, 'completed')}
                                className="flex-1 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-sm transition"
                              >
                                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                                Completar
                              </button>
                            )}
                            {payout.receipt_url && (
                              <button
                                onClick={() => setViewReceiptUrl(payout.receipt_url)}
                                className="flex-1 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg text-sm transition"
                              >
                                <Eye className="w-4 h-4 inline mr-1" />
                                Ver
                              </button>
                            )}
                            {payout.payout_id && (
                              <button
                                onClick={() => handleUploadReceipt(payout.payout_id!)}
                                disabled={uploadReceiptMutation.isPending && payoutForReceipt === payout.payout_id}
                                className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-sm transition disabled:opacity-50"
                              >
                                <Upload className={`w-4 h-4 inline mr-1 ${uploadReceiptMutation.isPending && payoutForReceipt === payout.payout_id ? 'animate-pulse' : ''}`} />
                                Subir
                              </button>
                            )}
                          </>
                        )}
                      </MobileCardActions>
                    </MobileCard>
                  ))}
                </MobileCardList>

                {/* Desktop Table */}
                <ResponsiveTable headers={['Tarotista', 'Plataforma', 'Consultas', 'Monto', 'Estado', 'Acciones']}>
                {data.data.map((payout: MonthlyPayoutData) => (
                  <ResponsiveTableRow key={payout.reader_id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {payout.avatar_url ? (
                          <img 
                            src={payout.avatar_url} 
                            alt={payout.display_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                            {payout.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/tarotistas/${payout.reader_id}`}
                            className="text-sm font-medium text-purple-400 hover:text-purple-300 transition"
                          >
                            {payout.display_name}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {payout.sessions_count} consulta{payout.sessions_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {getPlatformBadge(payout.currency)}
                        <span className="text-xs text-slate-500">{payout.currency}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-slate-300">
                        {payout.sessions_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-semibold text-white">
                        {formatCurrency(payout.amount, payout.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        {getStatusBadge(payout.payout_status)}
                        {payout.processed_at && (
                          <span className="text-xs text-slate-500">
                            {formatDate(payout.processed_at, 'relative')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {!payout.payout_status ? (
                          <button
                            onClick={() => handleProcessPayout(payout)}
                            disabled={processPayoutMutation.isPending}
                            className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded text-xs font-medium transition disabled:opacity-50"
                          >
                            Procesar
                          </button>
                        ) : (
                          <div className="flex gap-1">
                            {payout.payout_status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(payout.payout_id!, 'completed')}
                                className="px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded text-xs transition"
                                title="Marcar como completado"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </button>
                            )}
                            {payout.receipt_url && (
                              <button
                                onClick={() => setViewReceiptUrl(payout.receipt_url)}
                                className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded text-xs transition"
                                title="Ver comprobante"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            )}
                            {payout.payout_id && (
                              <button
                                onClick={() => handleUploadReceipt(payout.payout_id!)}
                                disabled={uploadReceiptMutation.isPending && payoutForReceipt === payout.payout_id}
                                className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded text-xs transition disabled:opacity-50"
                                title={payout.receipt_url ? "Reemplazar comprobante" : "Subir comprobante"}
                              >
                                <Upload className={`w-3 h-3 ${uploadReceiptMutation.isPending && payoutForReceipt === payout.payout_id ? 'animate-pulse' : ''}`} />
                              </button>
                            )}
                            {(payout.payout_status === 'pending' || payout.payout_status === 'failed') && (
                              <button
                                onClick={() => handleUpdateStatus(payout.payout_id!, 'cancelled')}
                                className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded text-xs transition"
                                title="Cancelar"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </ResponsiveTableRow>
                ))}
              </ResponsiveTable>
              </>
            )}
          </div>
        )}
      </div>

      {/* Process Payout Modal */}
      <ConfirmModal 
        isOpen={!!payoutToProcess}
        onClose={cancelProcessPayout}
        onConfirm={confirmProcessPayout}
        title="Procesar Pago"
        message={
          payoutToProcess 
            ? `¿Procesar pago de ${formatCurrency(payoutToProcess.amount, payoutToProcess.currency)} a ${payoutToProcess.display_name} vía ${payoutToProcess.currency === 'ARS' ? 'MercadoPago' : 'PayPal'}?`
            : ''
        }
        isLoading={processPayoutMutation.isPending}
      />

      <ConfirmModal 
        isOpen={!!statusToUpdate}
        onClose={cancelUpdateStatus}
        onConfirm={confirmUpdateStatus}
        title="Actualizar Estado del Pago"
        message={`¿Estás seguro de cambiar el estado de este pago a "${statusToUpdate?.status}"?`}
        isLoading={updateStatusMutation.isPending}
        isDestructive={statusToUpdate?.status === 'cancelled'}
      />

      {/* Hidden file input for receipt upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* View Receipt Modal */}
      {viewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Comprobante de Pago
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-uploads/${viewReceiptUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </a>
                <button
                  onClick={() => setViewReceiptUrl(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[75vh] flex items-center justify-center bg-slate-950">
              {viewReceiptUrl.endsWith('.pdf') ? (
                <iframe
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-uploads/${viewReceiptUrl}`}
                  className="w-full h-[70vh] rounded-lg"
                  title="Comprobante PDF"
                />
              ) : (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-uploads/${viewReceiptUrl}`}
                  alt="Comprobante de pago"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
