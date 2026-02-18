'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { ResponsiveTable, ResponsiveTableRow } from '@/components/common/ResponsiveTable';
import { SectionCard } from '@/components/common/SectionCard';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Header } from '@/components/layout/Header';
import { usePayoutHistory } from '@/lib/hooks/usePagos';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import type { PayoutStatus } from '@/types/database';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    Download,
    FileText,
    RefreshCw,
    User,
    Wallet,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

type PlatformFilter = 'all' | 'mercadopago' | 'paypal_usd' | 'paypal_eur';

export default function HistorialPagosPage() {
  const searchParams = useSearchParams();
  const readerIdFilter = searchParams.get('reader_id');
  const readerNameFilter = searchParams.get('reader_name');
  
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, isLoading, refetch } = usePayoutHistory({
    page,
    limit,
    platform: platformFilter,
    readerId: readerIdFilter,
  });

  const getStatusBadge = (status: PayoutStatus) => {
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Clock className="w-3 h-3" />
            Pendiente
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
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const getPlatformBadge = (currency: string) => {
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

  const totalPages = data?.pagination.pages ?? 0;
  const byPlatform = data?.by_platform;

  return (
    <>
      <Header 
        title={readerNameFilter ? `Historial: ${readerNameFilter}` : "Historial de Pagos"} 
        subtitle={readerNameFilter ? "Pagos realizados a este tarotista" : "Registro completo de pagos procesados por plataforma"}
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Pagos', href: '/pagos' },
          ...(readerNameFilter ? [{ label: 'Tarotistas', href: '/tarotistas' }] : []),
          { label: readerNameFilter || 'Historial' }
        ]}
      />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[2000px] mx-auto">
        {/* Reader Filter Banner */}
        {readerIdFilter && readerNameFilter && (
          <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300">
                Mostrando pagos de: <span className="font-semibold text-white">{readerNameFilter}</span>
              </span>
            </div>
            <Link
              href="/pagos/historial"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Ver todos
            </Link>
          </div>
        )}

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
                <p className="text-xs text-slate-400">Total Pagado</p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? '...' : formatCurrency(byPlatform?.mercadopago?.total || 0, 'ARS')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Pagos</p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? '...' : byPlatform?.mercadopago?.count || 0}
                </p>
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
                <p className="text-xs text-slate-400">Total Pagado</p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? '...' : formatCurrency(byPlatform?.paypal_usd?.total || 0, 'USD')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Pagos</p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? '...' : byPlatform?.paypal_usd?.count || 0}
                </p>
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
                <p className="text-xs text-slate-400">Total Pagado</p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? '...' : formatCurrency(byPlatform?.paypal_eur?.total || 0, 'EUR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Pagos</p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? '...' : byPlatform?.paypal_eur?.count || 0}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Toolbar */}
        <SectionCard className="p-4" padding="none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter Indicator */}
              {platformFilter !== 'all' && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Filtro:</span>
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
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm hidden sm:inline">Actualizar</span>
              </button>

              <button
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Exportar</span>
              </button>

              <Link
                href="/pagos/mensuales"
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg transition"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Mensuales</span>
              </Link>
            </div>
          </div>
        </SectionCard>

        {/* Payouts Table */}
        {isLoading ? (
          <TableSkeleton columns={7} rows={10} />
        ) : (
          <SectionCard padding="none" className="overflow-hidden">
            {!data || !data.data || data.data.length === 0 ? (
              <EmptyState 
                icon={Calendar}
                title="No hay pagos registrados"
                description={platformFilter !== 'all' 
                  ? 'No hay pagos para esta plataforma' 
                  : 'Los pagos procesados aparecerán aquí'}
              />
            ) : (
              <>
                <ResponsiveTable headers={['ID', 'Tarotista', 'Plataforma', 'Monto', 'Consultas', 'Estado', 'Fecha']}>
                  {data.data.map((payout) => (
                    <ResponsiveTableRow key={payout.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs text-slate-400 font-mono">
                          {payout.id.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/tarotistas/${payout.reader_id}`}
                          className="text-sm font-medium text-purple-400 hover:text-purple-300 transition"
                        >
                          {payout.display_name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          ID: {payout.reader_id.slice(0, 8)}...
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {getPlatformBadge(payout.currency)}
                          <span className="text-xs text-slate-500">{payout.currency}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-white">
                          {formatCurrency(payout.amount, payout.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-slate-300">
                          {payout.sessions_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(payout.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {formatDate(payout.processed_at, 'short')}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <User className="w-3 h-3" />
                          {payout.processed_by}
                        </div>
                      </td>
                    </ResponsiveTableRow>
                  ))}
                </ResponsiveTable>

                {/* Pagination */}
                <Pagination
                  page={page}
                  pages={totalPages}
                  total={data.pagination.total}
                  limit={limit}
                  onPageChange={setPage}
                  itemLabel="pagos"
                />
              </>
            )}
          </SectionCard>
        )}
      </div>
    </>
  );
}
