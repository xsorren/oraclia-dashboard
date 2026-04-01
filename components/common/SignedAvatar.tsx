'use client';

import { useEffect, useState } from 'react';

interface SignedAvatarProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Renderiza una foto de perfil cuya ruta puede ser:
 * - Una URL completa (http/https) → se usa directamente.
 * - Una ruta relativa en el bucket media-uploads (privado) →
 *   se firma via edge function media-get-url y se usa la URL firmada.
 */
export function SignedAvatar({ src, alt, className, fallback }: SignedAvatarProps) {
  // Pair the signed URL with the src it was signed for, to avoid stale results
  const [signingResult, setSigningResult] = useState<{ src: string; signedUrl: string } | null>(null);

  useEffect(() => {
    // http URLs are handled through derivation below — no setState needed here
    if (!src || src.startsWith('http')) return;

    const edgeFnUrl = process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!edgeFnUrl || !anonKey) return;

    let cancelled = false;
    fetch(`${edgeFnUrl}/media-get-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify({ path: src }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.signedUrl) setSigningResult({ src, signedUrl: json.signedUrl });
      })
      .catch(() => {/* silently ignore */});

    return () => { cancelled = true; };
  }, [src]);

  // Derive the resolved URL without any synchronous setState:
  // - Full http URLs used directly
  // - Relative paths use signed URL only if it matches the current src (avoids stale)
  const resolvedSrc = src?.startsWith('http')
    ? src
    : signingResult !== null && signingResult.src === src ? signingResult.signedUrl : null;

  if (!resolvedSrc) {
    return <>{fallback ?? null}</>;
  }

  return <img src={resolvedSrc} alt={alt} className={className} />;
}
