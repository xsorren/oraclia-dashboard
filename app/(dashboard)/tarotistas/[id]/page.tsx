'use client';

import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import { getServiceName } from '@/lib/utils/services';
import type { Currency } from '@/types/database';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    TrendingUp,
    Wallet
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TarotistaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tarotistaId = params.id as string;
  const { toast } = useToast();

  const queryClient = useQueryClient();
  
  const [changeCurrencyModal, setChangeCurrencyModal] = useState<Currency | null>(null);
  const [statusModal, setStatusModal] = useState<'active' | 'inactive' | null>(null);

  const { data: tarotista, isLoading } = useQuery({
    queryKey: ['tarotista-detail', tarotistaId],
    queryFn: () => adminApi.getTarotistaDetail({ id: tarotistaId }),
    enabled: !!tarotistaId,
    staleTime: 1000 * 60 * 2,
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: (newCurrency: Currency) =>
      adminApi.updateTarotistaCurrency({ tarotistaId, preferredCurrency: newCurrency }),
    onSuccess: (data) => {
      toast(`Moneda actualizada a ${changeCurrencyModal}. Plataforma: ${data.platform === 'mercadopago' ? 'MercadoPago' : 'PayPal'}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['tarotista-detail', tarotistaId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tarotistas'] });
      setChangeCurrencyModal(null);
    },
    onError: (error: Error) => {
      toast('Error al actualizar moneda: ' + error.message, 'error');
      setChangeCurrencyModal(null);
    },
  });

  const processPayoutMutation = useMutation({
    mutationFn: (params: { readerId: string; currency: Currency }) =>
      adminApi.processPayout(params),
    onSuccess: () => {
      toast('Pago procesado exitosamente', 'success');
      queryClient.invalidateQueries({ queryKey: ['tarotista-detail', tarotistaId] });
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
    onError: (error: Error) => {
      toast('Error al procesar el pago: ' + error.message, 'error');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: 'active' | 'inactive') =>
      adminApi.updateTarotistaStatus({ tarotistaId, status: newStatus }),
    onSuccess: (data) => {
      toast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['tarotista-detail', tarotistaId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tarotistas'] });
      setStatusModal(null);
    },
    onError: (error: Error) => {
      toast('Error: ' + error.message, 'error');
      setStatusModal(null);
    },
  });

  const handleProcessPayout = () => {
    if (!tarotistaId || !tarotista) return;
    const currency = tarotista.preferred_currency || 'USD';
    if (confirm(`¿Estás seguro de procesar el pago de ${formatCurrency(tarotista.pending_payout || 0, currency)} para este tarotista vía ${currency === 'ARS' ? 'MercadoPago' : 'PayPal'}?`)) {
      processPayoutMutation.mutate({
        readerId: tarotistaId,
        currency: currency,
      });
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value as Currency;
    if (newCurrency !== tarotista?.preferred_currency) {
      setChangeCurrencyModal(newCurrency);
    }
  };

  const confirmCurrencyChange = () => {
    if (changeCurrencyModal) {
      updateCurrencyMutation.mutate(changeCurrencyModal);
    }
  };

  const handleToggleStatus = () => {
    if (!tarotista) return;
    const newStatus = tarotista.status === 'active' ? 'inactive' : 'active';
    setStatusModal(newStatus);
  };

  const confirmStatusChange = () => {
    if (statusModal) {
      updateStatusMutation.mutate(statusModal);
    }
  };

  const getPlatformInfo = (currency: Currency) => {
    if (currency === 'ARS') {
      return {
        icon: <Wallet className="w-4 h-4 text-sky-400" />,
        name: 'MercadoPago',
        color: 'sky',
      };
    }
    return {
      icon: <CreditCard className="w-4 h-4 text-blue-400" />,
      name: 'PayPal',
      color: 'blue',
    };
  };

  if (isLoading) {
    return (
      <>
        <Header title="Cargando..." subtitle="Detalles del tarotista" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </div>
      </>
    );
  }

  if (!tarotista) {
    return (
      <>
        <Header title="No encontrado" subtitle="Tarotista no disponible" />
        <div className="p-8">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-lg text-slate-400 mb-4">No se pudo cargar la información del tarotista</p>
            <Link
              href="/tarotistas"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la lista
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={tarotista.full_name}
        subtitle="Perfil y estadísticas del tarotista"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/tarotistas"
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver a la lista</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-amber-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-4xl font-bold flex-shrink-0 mx-auto sm:mx-0">
              {tarotista.full_name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{tarotista.full_name}</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-400">
                    <span className="flex items-center justify-center sm:justify-start gap-1 truncate">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tarotista.email}</span>
                    </span>
                    {tarotista.phone && (
                      <span className="flex items-center justify-center sm:justify-start gap-1">
                        <Phone className="w-4 h-4 shrink-0" />
                        {tarotista.phone}
                      </span>
                    )}
                    {tarotista.country && (
                      <span className="flex items-center justify-center sm:justify-start gap-1">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {tarotista.country}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-center sm:justify-end">
                  {tarotista.status === 'active' ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Inactivo
                    </span>
                  )}
                </div>
              </div>

              {tarotista.bio && (
                <p className="text-slate-300 mb-4 text-sm sm:text-base text-center sm:text-left">{tarotista.bio}</p>
              )}

              {tarotista.specialties && tarotista.specialties.length > 0 && (
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {tarotista.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 sm:px-3 sm:py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs sm:text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Registrado {formatDate(tarotista.created_at, 'short')}
                </span>
                {tarotista.last_consultation_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Última consulta {formatDate(tarotista.last_consultation_at, 'relative')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Platform Card */}
        <div className={`bg-gradient-to-br ${
          tarotista.preferred_currency === 'ARS' 
            ? 'from-sky-900/30 to-slate-900/50 border-sky-800/50' 
            : 'from-blue-900/30 to-slate-900/50 border-blue-800/50'
        } backdrop-blur-sm border rounded-xl p-4 sm:p-6`}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`p-2 sm:p-3 rounded-lg shrink-0 ${
                tarotista.preferred_currency === 'ARS' ? 'bg-sky-500/20' : 'bg-blue-500/20'
              }`}>
                {tarotista.preferred_currency === 'ARS' ? (
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
                ) : (
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {tarotista.preferred_currency === 'ARS' ? 'MercadoPago' : 'PayPal'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Recibe pagos en <span className="font-medium text-white">{tarotista.preferred_currency}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label className="text-sm text-slate-400">Cambiar moneda:</label>
              <select
                value={tarotista.preferred_currency}
                onChange={handleCurrencyChange}
                disabled={updateCurrencyMutation.isPending}
                className={`flex-1 sm:flex-none px-3 py-2 border rounded-lg text-white text-sm focus:outline-none focus:ring-2 disabled:opacity-50 ${
                  tarotista.preferred_currency === 'ARS' 
                    ? 'bg-sky-900/50 border-sky-700 focus:ring-sky-500' 
                    : 'bg-blue-900/50 border-blue-700 focus:ring-blue-500'
                }`}
              >
                <option value="ARS">ARS (MercadoPago)</option>
                <option value="USD">USD (PayPal)</option>
                <option value="EUR">EUR (PayPal)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Total Ganado</p>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-white">
              {formatCurrency(tarotista.total_earned, tarotista.preferred_currency)}
            </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Pendiente</p>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-white">
              {formatCurrency(tarotista.pending_payout, tarotista.preferred_currency)}
            </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Consultas</p>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-white">
              {tarotista.consultations_count}
            </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Promedio</p>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-white">
              {tarotista.consultations_count > 0
                ? formatCurrency(tarotista.total_earned / tarotista.consultations_count, tarotista.preferred_currency)
                : formatCurrency(0, tarotista.preferred_currency)}
            </p>
          </div>
        </div>

        {/* Recent Activity & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Consultations */}
          <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Consultas Recientes</h3>
            {tarotista.recent_consultations && tarotista.recent_consultations.length > 0 ? (
              <div className="space-y-3">
                {tarotista.recent_consultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base text-white font-medium truncate">{getServiceName(consultation.service_kind)}</p>
                      <p className="text-xs sm:text-sm text-slate-400">
                        {formatDate(consultation.completed_at, 'short')}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm sm:text-base text-purple-400 font-semibold">
                        {formatCurrency(consultation.net_price, tarotista.preferred_currency)}
                      </p>
                      <p className="text-xs text-slate-500">{tarotista.preferred_currency}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-slate-400">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-sm sm:text-base">No hay consultas recientes</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              {tarotista.pending_payout > 0 && (
                <button
                  onClick={handleProcessPayout}
                  disabled={processPayoutMutation.isPending}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg font-medium text-sm sm:text-base transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processPayoutMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span className="truncate">
                    {processPayoutMutation.isPending ? 'Procesando...' : `Procesar (${formatCurrency(tarotista.pending_payout, tarotista.preferred_currency)})`}
                  </span>
                </button>
              )}

              <Link 
                href={`/pagos/historial?reader_id=${tarotistaId}&reader_name=${encodeURIComponent(tarotista.full_name)}`}
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg font-medium text-sm sm:text-base transition text-center block"
              >
                Ver Historial Completo
              </Link>

              {tarotista.status === 'active' ? (
                <button 
                  onClick={handleToggleStatus}
                  disabled={updateStatusMutation.isPending}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg font-medium text-sm sm:text-base transition disabled:opacity-50"
                >
                  Desactivar Cuenta
                </button>
              ) : (
                <button 
                  onClick={handleToggleStatus}
                  disabled={updateStatusMutation.isPending}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg font-medium text-sm sm:text-base transition disabled:opacity-50"
                >
                  Activar Cuenta
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Performance Chart Placeholder */}
        {tarotista.monthly_stats && tarotista.monthly_stats.length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Rendimiento Mensual</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tarotista.monthly_stats.map((stat, index) => (
                <div key={index} className="text-center p-4 bg-slate-800/30 rounded-lg">
                  <p className="text-xs text-slate-400 mb-2">{stat.month}</p>
                  <p className="text-lg font-bold text-white mb-1">{stat.consultations}</p>
                  <p className="text-xs text-purple-400">{formatCurrency(stat.earnings, tarotista.preferred_currency)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Change Currency Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!changeCurrencyModal}
        onClose={() => setChangeCurrencyModal(null)}
        onConfirm={confirmCurrencyChange}
        title="Cambiar Moneda de Pago"
        message={
          changeCurrencyModal 
            ? `¿Cambiar la moneda de pago de ${tarotista.full_name} a ${changeCurrencyModal}?\n\nEsto significa que los futuros pagos se realizarán vía ${changeCurrencyModal === 'ARS' ? 'MercadoPago' : 'PayPal'}.`
            : ''
        }
        isLoading={updateCurrencyMutation.isPending}
      />

      {/* Change Status Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!statusModal}
        onClose={() => setStatusModal(null)}
        onConfirm={confirmStatusChange}
        title={statusModal === 'active' ? 'Activar Cuenta' : 'Desactivar Cuenta'}
        message={
          statusModal === 'active'
            ? `¿Activar la cuenta de ${tarotista.full_name}?\n\nPodrá recibir nuevas consultas.`
            : `¿Desactivar la cuenta de ${tarotista.full_name}?\n\nNo podrá recibir nuevas consultas y se liberarán las consultas pendientes que tenga reclamadas.`
        }
        isLoading={updateStatusMutation.isPending}
      />
    </>
  );
}
