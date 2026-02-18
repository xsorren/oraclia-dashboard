'use client';

import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, ResponsiveTable, ResponsiveTableRow } from '@/components/common/ResponsiveTable';
import { SectionCard } from '@/components/common/SectionCard';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import { useDeleteUser, useUsers } from '@/lib/hooks/useUsers';
import { formatDate } from '@/lib/utils/dates';
import {
    Ban,
    Search,
    Users
} from 'lucide-react';
import { useState } from 'react';

function StatusBadge({ isActive, isBanned }: { isActive: boolean; isBanned: boolean }) {
  if (isBanned) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Baneado
      </span>
    );
  }
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Inactivo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      Activo
    </span>
  );
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string | null } | null>(null);
  const { toast } = useToast();

  const { data: response, isLoading } = useUsers({
    search,
    page,
    limit,
    status: statusFilter,
  });

  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
  const data = response?.data || [];
  const pagination = response?.pagination || { total: 0, page: 1, limit: 10, pages: 0 };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value: 'all' | 'active' | 'banned') => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleBanClick = (id: string, name: string, email: string | null) => {
    setUserToDelete({ id, name, email });
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id, {
        onSuccess: () => {
            toast('Usuario baneado y desactivado correctamente', 'success');
            setUserToDelete(null);
        },
        onError: (error) => {
            toast(error.message || 'Error al banear usuario', 'error');
        }
    });
  };

  return (
    <>
      <Header 
        title="Usuarios" 
        subtitle={`${pagination.total ?? 0} usuarios registrados`}
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Usuarios' }
        ]}
      />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[2000px] mx-auto">
        {/* Filters */}
        <SectionCard className="p-4 sm:p-6" padding="none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="sm:col-span-2">
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
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value as 'all' | 'active' | 'banned')}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="banned">Baneados</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Table */}
        {isLoading ? (
            <TableSkeleton columns={6} rows={10} />
        ) : (
            <SectionCard padding="none" className="overflow-hidden">
                {!data || data.length === 0 ? (
                    <EmptyState 
                        icon={Users}
                        title="No se encontraron usuarios"
                        description={search 
                            ? 'Intenta ajustar los filtros de búsqueda'
                            : 'No hay usuarios registrados'}
                    />
                ) : (
                    <>
                        {/* Mobile List */}
                        <MobileCardList>
                            {data.map((user) => (
                                <MobileCard key={user.id}>
                                    <MobileCardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                                {user.display_name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-medium text-white">{user.display_name || 'Sin nombre'}</h3>
                                                    <StatusBadge isActive={user.is_active} isBanned={user.is_banned} />
                                                </div>
                                                <p className="text-sm text-slate-400 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </MobileCardHeader>
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-500">Registrado</p>
                                            <p className="text-sm text-slate-300">{formatDate(user.created_at)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-500">Último acceso</p>
                                            <p className="text-sm text-slate-300">
                                                {user.last_sign_in ? formatDate(user.last_sign_in) : 'Nunca'}
                                            </p>
                                        </div>
                                    </div>

                                    {!user.is_banned && (
                                        <MobileCardActions>
                                            <button 
                                                onClick={() => handleBanClick(user.id, user.display_name || 'Sin nombre', user.email)}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition text-sm"
                                            >
                                                <Ban className="w-4 h-4" />
                                                Banear y desactivar
                                            </button>
                                        </MobileCardActions>
                                    )}
                                </MobileCard>
                            ))}
                        </MobileCardList>

                        {/* Desktop Table */}
                        <ResponsiveTable
                            headers={['Usuario', 'Email', 'Estado', 'Registrado', 'Último Acceso', 'Acciones']}
                        >
                            {data.map((user) => (
                                <ResponsiveTableRow key={user.id}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                {user.display_name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <span className="font-medium text-white">{user.display_name || 'Sin nombre'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">{user.email || '-'}</td>
                                    <td className="p-4">
                                        <StatusBadge isActive={user.is_active} isBanned={user.is_banned} />
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">{formatDate(user.created_at)}</td>
                                    <td className="p-4 text-slate-400 text-sm">
                                        {user.last_sign_in ? formatDate(user.last_sign_in) : '-'}
                                    </td>
                                    <td className="p-4">
                                        {!user.is_banned ? (
                                            <button 
                                                onClick={() => handleBanClick(user.id, user.display_name || 'Sin nombre', user.email)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                                                title="Banear y desactivar usuario"
                                            >
                                                <Ban className="w-4 h-4" />
                                                Banear
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-600 italic">Ya baneado</span>
                                        )}
                                    </td>
                                </ResponsiveTableRow>
                            ))}
                        </ResponsiveTable>

                        {/* Pagination */}
                        <Pagination
                            page={page}
                            pages={pagination.pages}
                            total={pagination.total}
                            limit={limit}
                            onPageChange={setPage}
                            itemLabel="usuarios"
                        />
                    </>
                )}
            </SectionCard>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Banear y desactivar usuario"
        message={userToDelete
          ? `¿Estás seguro que deseas banear a "${userToDelete.name}"${userToDelete.email ? ` (${userToDelete.email})` : ''}?\n\nEl usuario perderá acceso inmediatamente y su email quedará bloqueado para nuevos registros. Su historial de preguntas, compras y mensajes se conservará.`
          : ''}
        confirmText="Sí, banear"
        cancelText="Cancelar"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
}
