'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js App Router error boundary for the (dashboard) segment.
 * Catches unhandled errors from both Server and Client Components in
 * any dashboard page, preventing a full-page crash.
 */
export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Log to console (or swap for an error-tracking service like Sentry)
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-md w-full">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-8 text-center space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-red-500/10 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">
              Algo salió mal
            </h2>
            <p className="text-sm text-slate-400">
              Ocurrió un error inesperado en esta sección del panel.
              Puedes intentar recargar o volver más tarde.
            </p>
          </div>

          {/* Error detail (dev-only hint) */}
          {process.env.NODE_ENV !== 'production' && error.message && (
            <pre className="text-left text-xs text-red-300/70 bg-slate-950/60 border border-red-500/10 rounded-lg p-3 overflow-auto max-h-32 whitespace-pre-wrap break-all">
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium rounded-lg transition"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
