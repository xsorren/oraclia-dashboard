'use client';

import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils/cn';
import { useQuery } from '@tanstack/react-query';
import {
    AlertTriangle,
    DollarSign,
    LayoutDashboard,
    LogOut,
    MessageSquare,
    Sparkles,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tarotistas', href: '/tarotistas', icon: Users },
  { name: 'Pagos', href: '/pagos', icon: DollarSign },
  // { name: 'Finanzas', href: '/finanzas', icon: TrendingUp }, // Hidden for now
  { name: 'Reportes', href: '/reportes', icon: AlertTriangle, showBadge: true },
  { name: 'Consultas', href: '/consultas', icon: MessageSquare },
  // { name: 'Configuración', href: '/configuracion', icon: Settings }, // Hidden for now
];

interface SidebarProps {
  onLogout: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ onLogout, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  // Fetch pending reports count
  const { data: pendingCount } = useQuery({
    queryKey: ['admin', 'pending-reports-count'],
    queryFn: () => adminApi.getPendingReportsCount(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 shadow-2xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-amber-500">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Oraclia</h1>
          <p className="text-xs text-slate-400">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const showBadge = item.showBadge && pendingCount && pendingCount > 0;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative',
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-lg shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
              {showBadge && (
                <span className="absolute right-3 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-6 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
