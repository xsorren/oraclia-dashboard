'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js App Router global error boundary.
 * Catches errors thrown inside the root layout itself (e.g. Providers crashing),
 * which the per-segment error.tsx cannot handle.
 *
 * Must render its own <html> and <body> because the root layout is bypassed.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="es">
      <body className="bg-slate-950 text-white antialiased">
        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="max-w-md w-full">
            <div className="bg-slate-900/50 border border-red-500/20 rounded-xl p-8 text-center space-y-5">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="p-4 bg-red-500/10 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              </div>

              {/* Heading */}
              <div className="space-y-2">
                <h1 className="text-xl font-semibold text-white">
                  Error crítico de la aplicación
                </h1>
                <p className="text-sm text-slate-400">
                  Ocurrió un error en el núcleo del panel. Puedes intentar
                  recargar o contactar soporte si el problema persiste.
                </p>
              </div>

              {/* Error detail (dev only) */}
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
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
