'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PagosPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to monthly payments page
    router.replace('/pagos/mensuales');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-slate-400">Redirigiendo a pagos mensuales...</p>
      </div>
    </div>
  );
}
