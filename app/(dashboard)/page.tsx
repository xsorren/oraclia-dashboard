'use client';

import { StatsCard } from '@/components/dashboard/StatsCard';
import { Header } from '@/components/layout/Header';
import { useOverview } from '@/lib/hooks/useOverview';
import { usePendingPayouts } from '@/lib/hooks/usePendingPayouts';
import { formatCurrency } from '@/lib/utils/currency';
import { CreditCard, DollarSign, MessageSquare, RefreshCw, TrendingUp, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { Currency } from '@/types/database';

export default function DashboardPage() {
  const [currency, setCurrency] = useState<Currency>('USD');
  
  const { data: overview, isLoading: isLoadingOverview, refetch: refetchOverview } = useOverview({ currency });
  const { data: pendingPayouts, isLoading: isLoadingPayouts } = usePendingPayouts({ currency });
  
  // Fetch data for all currencies to show platform summary
  const { data: overviewARS } = useOverview({ currency: 'ARS' });
  const { data: overviewUSD } = useOverview({ currency: 'USD' });
  const { data: overviewEUR } = useOverview({ currency: 'EUR' });

  const handleRefresh = () => {
    refetchOverview();
  };

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Vista general del negocio"
        breadcrumbs={[{ label: 'Inicio' }]}
      />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-[2000px] mx-auto">
        {/* Currency Selector & Refresh */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm text-slate-400 font-medium whitespace-nowrap">Moneda:</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="flex-1 sm:flex-none px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="USD">USD ($)</option>
              <option value="ARS">ARS ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoadingOverview}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingOverview ? 'animate-spin' : ''}`} />
            <span className="text-sm">Actualizar</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatsCard
            title="Ingresos Brutos"
            value={isLoadingOverview ? '...' : formatCurrency(overview?.gross_revenue ?? 0, currency)}
            icon={<DollarSign className="w-6 h-6 text-purple-400" />}
            isLoading={isLoadingOverview}
          />
          <StatsCard
            title="Pagos a Tarotistas"
            value={isLoadingOverview ? '...' : formatCurrency(overview?.tarotista_expenses ?? 0, currency)}
            icon={<Users className="w-6 h-6 text-amber-400" />}
            subtitle={isLoadingPayouts ? 'Cargando...' : `${pendingPayouts?.count ?? 0} pagos pendientes`}
            isLoading={isLoadingOverview}
          />
          <StatsCard
            title="Ganancia Neta"
            value={isLoadingOverview ? '...' : formatCurrency(overview?.net_profit ?? 0, currency)}
            icon={<TrendingUp className="w-6 h-6 text-green-400" />}
            trend={overview ? {
              value: Math.round(overview.profit_margin),
              label: 'margen del mes'
            } : undefined}
            isLoading={isLoadingOverview}
          />
          <StatsCard
            title="Consultas del Mes"
            value={isLoadingOverview ? '...' : (overview?.consultations_count ?? 0).toString()}
            icon={<MessageSquare className="w-6 h-6 text-blue-400" />}
            isLoading={isLoadingOverview}
          />
        </div>

        {/* Platform Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* MercadoPago Summary */}
          <Link href="/finanzas" className="block">
            <div className="bg-gradient-to-br from-sky-900/30 to-slate-900/50 backdrop-blur-sm border border-sky-800/50 rounded-xl p-5 hover:border-sky-600/50 transition-all group">
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
                <span className="text-xs text-slate-500 group-hover:text-sky-400 transition-colors">Ver detalles →</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Ingresos</p>
                  <p className="text-lg font-bold text-green-400">
                    {formatCurrency(overviewARS?.gross_revenue ?? 0, 'ARS')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Beneficio</p>
                  <p className="text-lg font-bold text-sky-400">
                    {formatCurrency(overviewARS?.net_profit ?? 0, 'ARS')}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* PayPal Summary */}
          <Link href="/finanzas" className="block">
            <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/50 backdrop-blur-sm border border-blue-800/50 rounded-xl p-5 hover:border-blue-600/50 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">PayPal</h3>
                    <p className="text-xs text-blue-300/70">USD & EUR</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 group-hover:text-blue-400 transition-colors">Ver detalles →</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">USD</p>
                  <p className="text-sm font-semibold text-green-400">
                    {formatCurrency(overviewUSD?.net_profit ?? 0, 'USD')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">EUR</p>
                  <p className="text-sm font-semibold text-indigo-400">
                    {formatCurrency(overviewEUR?.net_profit ?? 0, 'EUR')}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Top Tarotistas */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Tarotistas del Mes</h3>
            {isLoadingOverview ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              </div>
            ) : overview?.top_tarotistas && overview.top_tarotistas.length > 0 ? (
              <div className="space-y-3">
                {overview.top_tarotistas.map((tarotista, index) => (
                  <div key={tarotista.reader_id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{tarotista.display_name}</p>
                        <p className="text-sm text-slate-400">{tarotista.sessions_count} consultas</p>
                      </div>
                    </div>
                    <p className="text-purple-400 font-semibold">
                      {formatCurrency(tarotista.amount, currency)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Resumen Financiero</h3>
            {isLoadingOverview ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              </div>
            ) : overview ? (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Ingresos Totales</span>
                    <span className="text-purple-400 font-semibold text-lg">
                      {formatCurrency(overview.gross_revenue, currency)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Pagos a Tarotistas</span>
                    <span className="text-amber-400 font-semibold text-lg">
                      {formatCurrency(overview.tarotista_expenses, currency)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((overview.tarotista_expenses / overview.gross_revenue) * 100, 100)}%` 
                      }} 
                    />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Ganancia Neta</span>
                    <span className="text-green-400 font-semibold text-lg">
                      {formatCurrency(overview.net_profit, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-slate-500">Margen</span>
                    <span className="text-green-400 font-medium">
                      {overview.profit_margin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {pendingPayouts && pendingPayouts.count > 0 && (
                  <div className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Pagos Pendientes</p>
                        <p className="text-orange-400 font-semibold text-lg mt-1">
                          {pendingPayouts.count} {pendingPayouts.count === 1 ? 'tarotista' : 'tarotistas'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs">Total pendiente</p>
                        <p className="text-orange-400 font-semibold text-lg mt-1">
                          {formatCurrency(pendingPayouts.total_pending, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
