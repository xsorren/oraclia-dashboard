'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { ResponsiveTable, ResponsiveTableRow } from '@/components/common/ResponsiveTable';
import { SectionCard } from '@/components/common/SectionCard';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Header } from '@/components/layout/Header';
import { useFinances, useFinancesSummary } from '@/lib/hooks/useFinances';
import { formatCurrency } from '@/lib/utils/currency';
import { getMonthName } from '@/lib/utils/dates';
import { formatServicePrice, getServiceDisplay } from '@/lib/utils/services';
import type { Currency } from '@/types/database';
import {
    AlertTriangle,
    ArrowDownRight,
    CreditCard,
    DollarSign,
    Receipt,
    TrendingUp,
    Wallet
} from 'lucide-react';
import { useState } from 'react';

export default function FinanzasPage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedCurrency, setSelectedCurrency] = useState<Currency | 'ALL'>('ALL');

    // Fetch summary for general overview (no currency filter)
    const { data: summary, isLoading: isLoadingSummary } = useFinancesSummary({ month, year });
    
    // Fetch details only when a specific currency is selected
    const { data: currencyDetails, isLoading: isLoadingDetails } = useFinances({ 
        month, 
        year, 
        currency: selectedCurrency !== 'ALL' ? selectedCurrency : undefined 
    });

    const isLoading = isLoadingSummary || (selectedCurrency !== 'ALL' && isLoadingDetails);

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // Get platform summary from real payments
    const platformSummary = summary?.platform_summary;
    const mercadopago = platformSummary?.mercadopago;
    const paypalUSD = platformSummary?.paypal?.usd;
    const paypalEUR = platformSummary?.paypal?.eur;

    return (
        <>
            <Header
                title="Finanzas"
                subtitle={`Reporte financiero de ${getMonthName(month - 1)} ${year}`}
                breadcrumbs={[
                    { label: 'Inicio', href: '/' },
                    { label: 'Finanzas' }
                ]}
            />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[2000px] mx-auto">
                {/* Controls */}
                <SectionCard padding="none" className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Mes
                            </label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {months.map((m) => (
                                    <option key={m} value={m}>{getMonthName(m - 1)}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Año
                            </label>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Vista
                            </label>
                            <select
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value as Currency | 'ALL')}
                                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="ALL">📊 Resumen General</option>
                                <option value="ARS">🇦🇷 ARS (MercadoPago)</option>
                                <option value="USD">🇺🇸 USD (PayPal)</option>
                                <option value="EUR">🇪🇺 EUR (PayPal)</option>
                            </select>
                        </div>
                    </div>
                </SectionCard>

                {/* Multi-Currency Overview (shown when ALL selected) */}
                {selectedCurrency === 'ALL' && (
                    <>
                        {/* Platform Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* MercadoPago Card */}
                            <div className="bg-gradient-to-br from-sky-900/30 to-slate-900/50 backdrop-blur-sm border border-sky-800/50 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-sky-500/20 rounded-lg">
                                        <Wallet className="w-6 h-6 text-sky-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">MercadoPago</h3>
                                        <p className="text-sm text-sky-300/70">Pagos en Pesos Argentinos</p>
                                    </div>
                                    {mercadopago?.payments_count && mercadopago.payments_count > 0 && (
                                        <div className="ml-auto flex items-center gap-1 text-xs text-sky-300/60">
                                            <Receipt className="w-3 h-3" />
                                            {mercadopago.payments_count} pago{mercadopago.payments_count !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Ingresos</p>
                                        <p className="text-lg font-bold text-green-400">
                                            {isLoading ? '...' : formatCurrency(mercadopago?.revenue || 0, 'ARS')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Gastos</p>
                                        <p className="text-lg font-bold text-red-400">
                                            {isLoading ? '...' : formatCurrency(mercadopago?.expenses || 0, 'ARS')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Beneficio</p>
                                        <p className="text-lg font-bold text-sky-400">
                                            {isLoading ? '...' : formatCurrency(mercadopago?.profit || 0, 'ARS')}
                                        </p>
                                    </div>
                                </div>

                                {(mercadopago?.revenue || 0) > 0 && (
                                    <div className="mt-4 pt-4 border-t border-sky-800/30">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400">Margen</span>
                                            <span className="text-sky-400 font-semibold">
                                                {(((mercadopago?.profit || 0) / (mercadopago?.revenue || 1)) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* PayPal Card */}
                            <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/50 backdrop-blur-sm border border-blue-800/50 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-blue-500/20 rounded-lg">
                                        <CreditCard className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">PayPal</h3>
                                        <p className="text-sm text-blue-300/70">Pagos en USD y EUR</p>
                                    </div>
                                    {((paypalUSD?.payments_count || 0) + (paypalEUR?.payments_count || 0)) > 0 && (
                                        <div className="ml-auto flex items-center gap-1 text-xs text-blue-300/60">
                                            <Receipt className="w-3 h-3" />
                                            {(paypalUSD?.payments_count || 0) + (paypalEUR?.payments_count || 0)} pago{((paypalUSD?.payments_count || 0) + (paypalEUR?.payments_count || 0)) !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                                
                                {/* USD Section */}
                                <div className="bg-slate-800/30 rounded-lg p-3 mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-slate-300">🇺🇸 USD</span>
                                        {paypalUSD?.payments_count && paypalUSD.payments_count > 0 && (
                                            <span className="text-xs text-slate-500">{paypalUSD.payments_count} pago{paypalUSD.payments_count !== 1 ? 's' : ''}</span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <p className="text-xs text-slate-500">Ingresos</p>
                                            <p className="text-sm font-semibold text-green-400">
                                                {isLoading ? '...' : formatCurrency(paypalUSD?.revenue || 0, 'USD')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Gastos</p>
                                            <p className="text-sm font-semibold text-red-400">
                                                {isLoading ? '...' : formatCurrency(paypalUSD?.expenses || 0, 'USD')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Beneficio</p>
                                            <p className="text-sm font-semibold text-blue-400">
                                                {isLoading ? '...' : formatCurrency(paypalUSD?.profit || 0, 'USD')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* EUR Section */}
                                <div className="bg-slate-800/30 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-slate-300">🇪🇺 EUR</span>
                                        {paypalEUR?.payments_count && paypalEUR.payments_count > 0 && (
                                            <span className="text-xs text-slate-500">{paypalEUR.payments_count} pago{paypalEUR.payments_count !== 1 ? 's' : ''}</span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <p className="text-xs text-slate-500">Ingresos</p>
                                            <p className="text-sm font-semibold text-green-400">
                                                {isLoading ? '...' : formatCurrency(paypalEUR?.revenue || 0, 'EUR')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Gastos</p>
                                            <p className="text-sm font-semibold text-red-400">
                                                {isLoading ? '...' : formatCurrency(paypalEUR?.expenses || 0, 'EUR')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Beneficio</p>
                                            <p className="text-sm font-semibold text-indigo-400">
                                                {isLoading ? '...' : formatCurrency(paypalEUR?.profit || 0, 'EUR')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Summary Cards per Currency */}
                        <h2 className="text-xl font-bold text-white mt-6">Resumen por Moneda</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { currency: 'ARS' as Currency, data: mercadopago, platform: 'MercadoPago' },
                                { currency: 'USD' as Currency, data: paypalUSD, platform: 'PayPal' },
                                { currency: 'EUR' as Currency, data: paypalEUR, platform: 'PayPal' },
                            ].map(({ currency: curr, data, platform }) => {
                                const margin = (data?.revenue || 0) > 0 ? ((data?.profit || 0) / (data?.revenue || 1)) * 100 : 0;
                                
                                return (
                                    <button
                                        key={curr}
                                        onClick={() => setSelectedCurrency(curr)}
                                        className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-4 hover:border-purple-500/50 transition-all text-left group"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-slate-300">{curr}</span>
                                            <span className="text-xs text-slate-500">{platform}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white mb-1">
                                            {isLoading ? '...' : formatCurrency(data?.profit || 0, curr)}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-green-400">+{isLoading ? '...' : formatCurrency(data?.revenue || 0, curr)}</span>
                                            <span className="text-slate-500">•</span>
                                            <span className="text-slate-400">Margen {margin.toFixed(1)}%</span>
                                        </div>
                                        {(data?.payments_count || 0) > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                                                <Receipt className="w-3 h-3" />
                                                {data?.payments_count} pago{data?.payments_count !== 1 ? 's' : ''} recibido{data?.payments_count !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                        <p className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                            Ver detalles →
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Single Currency View (when specific currency selected) */}
                {selectedCurrency !== 'ALL' && currencyDetails && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <SectionCard padding="md">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-500/10 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Ingresos Totales</p>
                                        <h3 className="text-2xl font-bold text-white">
                                            {isLoading ? '...' : formatCurrency(currencyDetails.total_revenue, selectedCurrency)}
                                        </h3>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard padding="md">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-500/10 rounded-lg">
                                        <ArrowDownRight className="w-6 h-6 text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Gastos (Pagos a Tarotistas)</p>
                                        <h3 className="text-2xl font-bold text-white">
                                            {isLoading ? '...' : formatCurrency(currencyDetails.total_expenses, selectedCurrency)}
                                        </h3>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard padding="md">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-500/10 rounded-lg">
                                        <Wallet className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Beneficio Neto</p>
                                        <h3 className="text-2xl font-bold text-white">
                                            {isLoading ? '...' : formatCurrency(currencyDetails.total_revenue - currencyDetails.total_expenses, selectedCurrency)}
                                        </h3>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard padding="md">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Margen de Beneficio</p>
                                        <h3 className="text-2xl font-bold text-white">
                                            {isLoading ? '...' : `${currencyDetails.total_revenue > 0 
                                                ? (((currencyDetails.total_revenue - currencyDetails.total_expenses) / currencyDetails.total_revenue) * 100).toFixed(1) 
                                                : '0.0'}%`}
                                        </h3>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* Platform Info */}
                        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 flex items-center gap-3">
                            {selectedCurrency === 'ARS' ? (
                                <Wallet className="w-5 h-5 text-sky-400" />
                            ) : (
                                <CreditCard className="w-5 h-5 text-blue-400" />
                            )}
                            <span className="text-sm text-slate-300">
                                Pagos procesados vía <strong className={selectedCurrency === 'ARS' ? 'text-sky-400' : 'text-blue-400'}>
                                    {selectedCurrency === 'ARS' ? 'MercadoPago' : 'PayPal'}
                                </strong>
                            </span>
                        </div>

                        {/* Breakdown Table */}
                        <h2 className="text-xl font-bold text-white">Desglose por Servicio</h2>

                        {isLoading ? (
                            <TableSkeleton columns={5} rows={5} />
                        ) : (
                            <SectionCard padding="none" className="overflow-hidden">
                                {currencyDetails.profit_by_service.length === 0 ? (
                                    <EmptyState
                                        icon={AlertTriangle}
                                        title="No hay datos financieros"
                                        description="No se registraron transacciones para este período"
                                    />
                                ) : (
                                    <ResponsiveTable headers={['Servicio', 'Ingresos', 'Gastos', 'Beneficio', 'Margen']}>
                                        {currencyDetails.profit_by_service.map((item) => (
                                            <ResponsiveTableRow key={item.service_kind}>
                                                <td className="px-6 py-4 font-medium text-white">
                                                    {getServiceDisplay(item.service_kind)}
                                                </td>
                                                <td className="px-6 py-4 text-green-400">
                                                    {formatServicePrice(item.revenue, selectedCurrency, item.service_kind, formatCurrency)}
                                                </td>
                                                <td className="px-6 py-4 text-red-400">
                                                    {formatServicePrice(item.expenses, selectedCurrency, item.service_kind, formatCurrency)}
                                                </td>
                                                <td className="px-6 py-4 text-purple-400 font-bold">
                                                    {formatServicePrice(item.profit, selectedCurrency, item.service_kind, formatCurrency)}
                                                </td>
                                                <td className="px-6 py-4 text-blue-400">
                                                    {item.margin.toFixed(1)}%
                                                </td>
                                            </ResponsiveTableRow>
                                        ))}
                                    </ResponsiveTable>
                                )}
                            </SectionCard>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
