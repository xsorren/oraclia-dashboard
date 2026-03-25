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
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setResolvedSrc(null);
      return;
    }

    if (src.startsWith('http')) {
      setResolvedSrc(src);
      return;
    }

    // Relative path → sign via edge function
    const edgeFnUrl = process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!edgeFnUrl || !anonKey) return;

    fetch(`${edgeFnUrl}/media-get-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify({ path: src }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.signedUrl) setResolvedSrc(json.signedUrl);
      })
      .catch(() => {/* silently ignore */});
  }, [src]);

  if (!resolvedSrc) {
    return <>{fallback ?? null}</>;
  }

  return <img src={resolvedSrc} alt={alt} className={className} />;
}
