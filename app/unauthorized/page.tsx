import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="text-center px-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/50 mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Acceso Denegado</h1>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          No tienes permisos de administrador para acceder a este panel.
        </p>
        <Link
          href="/login"
          className="inline-block bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-purple-700 hover:to-amber-600 transition-all shadow-lg shadow-purple-500/20"
        >
          Volver al Login
        </Link>
      </div>
    </div>
  );
}
