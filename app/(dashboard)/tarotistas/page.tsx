'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { MobileCard, MobileCardActions, MobileCardField, MobileCardHeader, MobileCardList, ResponsiveTable, ResponsiveTableRow } from '@/components/common/ResponsiveTable';
import { SectionCard } from '@/components/common/SectionCard';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Header } from '@/components/layout/Header';
import { useTarotistas } from '@/lib/hooks/useTarotistas';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import {
    CreditCard,
    Search,
    UserCheck,
    UserX,
    Users2,
    Wallet
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type StatusFilter = 'active' | 'inactive' | 'all';
type CurrencyFilter = 'all' | 'ARS' | 'USD' | 'EUR';

export default function TarotistasPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [country, setCountry] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data: response, isLoading } = useTarotistas({
    search,
    status: status === 'all' ? 'all' : status,
    page,
    limit,
  });

  const data = response?.data || [];
  const pagination = response?.pagination || { total: 0, page: 1, limit: 10, pages: 0 };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on new search
  };

  const handleStatusFilter = (value: StatusFilter) => {
    setStatus(value);
    setPage(1);
  };

  const handleCountryFilter = (value: string) => {
    setCountry(value);
    setPage(1);
  };

  const handleCurrencyFilter = (value: CurrencyFilter) => {
    setCurrencyFilter(value);
    setPage(1);
  };

  // Filter by country and currency on frontend since API doesn't support it yet
  let filteredData = country === 'all' 
    ? data 
    : data.filter(t => t.country === country);

  if (currencyFilter !== 'all') {
    filteredData = filteredData.filter(t => t.preferred_currency === currencyFilter);
  }

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

  return (
    <>
      <Header 
        title="Tarotistas" 
        subtitle={`${pagination.total} tarotistas registrados`}
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Tarotistas' }
        ]}
      />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[2000px] mx-auto">
        {/* Filters and Search */}
        <SectionCard className="p-4 sm:p-6" padding="none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Nombre o email..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusFilter(e.target.value as typeof status)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                País
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryFilter(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos</option>
                <option value="US">Estados Unidos</option>
                <option value="AR">Argentina</option>
                <option value="ES">España</option>
                <option value="MX">México</option>
                <option value="CO">Colombia</option>
              </select>
            </div>

            {/* Currency/Platform Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Plataforma de Pago
              </label>
              <select
                value={currencyFilter}
                onChange={(e) => handleCurrencyFilter(e.target.value as CurrencyFilter)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todas</option>
                <option value="ARS">MercadoPago (ARS)</option>
                <option value="USD">PayPal (USD)</option>
                <option value="EUR">PayPal (EUR)</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Table */}
        {isLoading ? (
            <TableSkeleton columns={8} rows={10} />
        ) : (
            <SectionCard padding="none" className="overflow-hidden">
                {!filteredData || filteredData.length === 0 ? (
                    <EmptyState 
                        icon={Users2}
                        title="No se encontraron tarotistas"
                        description={search || status !== 'all' || country !== 'all'
                            ? 'Intenta ajustar los filtros de búsqueda'
                            : 'No hay tarotistas registrados en el sistema'}
                    />
                ) : (
                    <>
                        {/* Mobile Cards */}
                        <MobileCardList>
                            {filteredData.map((tarotista) => (
                                <MobileCard key={tarotista.id}>
                                    <MobileCardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                                {tarotista.display_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {tarotista.display_name}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    ID: {tarotista.id.slice(0, 8)}...
                                                </p>
                                            </div>
                                        </div>
                                        {tarotista.is_active ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 shrink-0">
                                                <UserCheck className="w-3 h-3" />
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20 shrink-0">
                                                <UserX className="w-3 h-3" />
                                                Inactivo
                                            </span>
                                        )}
                                    </MobileCardHeader>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        <MobileCardField 
                                            label="Plataforma" 
                                            value={getPlatformBadge(tarotista.preferred_currency)} 
                                        />
                                        <MobileCardField 
                                            label="País" 
                                            value={tarotista.country || '-'} 
                                        />
                                        <MobileCardField 
                                            label="Rating" 
                                            value={tarotista.avg_rating ? `⭐ ${tarotista.avg_rating.toFixed(1)}` : '-'} 
                                        />
                                        <MobileCardField 
                                            label="Pendiente" 
                                            value={
                                                tarotista.pending_payout > 0 
                                                    ? <span className="text-orange-400">{formatCurrency(tarotista.pending_payout, tarotista.preferred_currency)}</span>
                                                    : '-'
                                            } 
                                        />
                                    </div>
                                    
                                    <MobileCardActions>
                                        <Link
                                            href={`/tarotistas/${tarotista.id}`}
                                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition"
                                        >
                                            Ver detalle
                                        </Link>
                                    </MobileCardActions>
                                </MobileCard>
                            ))}
                        </MobileCardList>

                        {/* Desktop Table */}
                        <ResponsiveTable headers={['Tarotista', 'Estado', 'Plataforma', 'País', 'Rating', 'Pago Pendiente', 'Fecha Registro', 'Acciones']}>
                        {filteredData.map((tarotista) => (
                            <ResponsiveTableRow key={tarotista.id}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {tarotista.display_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                {tarotista.display_name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                ID: {tarotista.id.slice(0, 8)}...
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {tarotista.is_active ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                            <UserCheck className="w-3 h-3" />
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                            <UserX className="w-3 h-3" />
                                            Inactivo
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {getPlatformBadge(tarotista.preferred_currency)}
                                        <span className="text-xs text-slate-500">{tarotista.preferred_currency}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-300">
                                    {tarotista.country || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-purple-400 text-center">
                                    {tarotista.avg_rating ? `⭐ ${tarotista.avg_rating.toFixed(1)}` : '-'}
                                    <p className="text-xs text-slate-500">{tarotista.ratings_count} reviews</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {tarotista.pending_payout > 0 ? (
                                        <span className="text-orange-400 font-medium text-sm">
                                            {formatCurrency(tarotista.pending_payout, tarotista.preferred_currency)}
                                        </span>
                                    ) : (
                                        <span className="text-slate-500 text-sm">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-400 text-right">
                                    {tarotista.created_at ? formatDate(tarotista.created_at, 'short') : '-'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <Link
                                        href={`/tarotistas/${tarotista.id}`}
                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition"
                                    >
                                        Ver detalle
                                    </Link>
                                </td>
                            </ResponsiveTableRow>
                        ))}
                    </ResponsiveTable>
                    </>
                )}

                <Pagination
                    page={page}
                    pages={pagination.pages}
                    total={pagination.total}
                    limit={limit}
                    onPageChange={setPage}
                    itemLabel="tarotistas"
                />
            </SectionCard>
        )}
      </div>
    </>
  );
}
