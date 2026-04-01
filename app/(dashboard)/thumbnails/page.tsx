'use client';

import { SectionCard } from '@/components/common/SectionCard';
import { Header } from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThumbnailsPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  const getSignedAvatarUrl = async (path: string): Promise<string | null> => {
    const edgeFnUrl = process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!edgeFnUrl || !anonKey) return null;
    try {
      const res = await fetch(`${edgeFnUrl}/media-get-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anonKey}` },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.signedUrl ?? null;
    } catch {
      return null;
    }
  };

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reader_intro_video')
      .select('*, reader_profiles(profiles(display_name, avatar_url))') as { data: any[] | null; error: any };
    
    if (data) {
      const patchedData = await Promise.all(
        data.map(async (v) => {
          const avatarUrl = v.reader_profiles?.profiles?.avatar_url;
          if (avatarUrl && !avatarUrl.startsWith('http')) {
            const signedUrl = await getSignedAvatarUrl(avatarUrl);
            if (signedUrl) {
              v.reader_profiles.profiles.avatar_url = signedUrl;
            }
          }
          return v;
        })
      );
      setVideos(patchedData);
    } else {
      console.error(error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (readerId: string, file: File) => {
    try {
      setUploading(prev => ({ ...prev, [readerId]: true }));

      const edgeFnUrl = process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL;
      if (!edgeFnUrl) throw new Error('Configuración de entorno incompleta');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No hay sesión activa');

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${edgeFnUrl}/admin-dashboard/upload-thumbnail/${readerId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message || json?.message || `Error ${res.status}`);
      }

      alert('Miniatura cargada con éxito');
      fetchVideos();
    } catch (error: any) {
      console.error(error);
      alert('Error: ' + error.message);
    } finally {
      setUploading(prev => ({ ...prev, [readerId]: false }));
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-8">
      <Header title="Gestión de Miniaturas" />
      
      <SectionCard className="mt-8">
        <div className="flex flex-col gap-6 p-4">
          <p className="text-gray-600 dark:text-gray-400">
            Carga manual de miniaturas para los videos de los tarotistas.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Tarotista</th>
                  <th scope="col" className="px-6 py-3">Video Path</th>
                  <th scope="col" className="px-6 py-3">Estado Miniatura</th>
                  <th scope="col" className="px-6 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">Cargando...</td>
                  </tr>
                ) : videos.map((video) => (
                  <tr key={video.reader_id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      <div className="flex flex-col items-center gap-2">
                        {video.reader_profiles?.profiles?.avatar_url ? (
                          <img 
                            src={video.reader_profiles.profiles.avatar_url}
                            alt={video.reader_profiles?.profiles?.display_name || ''}
                            className="w-32 h-32 object-cover rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-sm border border-gray-200 dark:border-gray-700">
                            Sin Foto
                          </div>
                        )}
                        <span className="text-center font-bold">{video.reader_profiles?.profiles?.display_name || 'Desconocido'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 truncate max-w-xs" title={video.storage_path}>
                      {video.storage_path}
                    </td>
                    <td className="px-6 py-4">
                      {video.thumbnail_path ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold px-2 py-1 bg-green-100 rounded-full">
                          Subida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold px-2 py-1 bg-red-100 rounded-full">
                          Faltante
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <label 
                        className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-center text-white rounded-lg focus:ring-4 focus:outline-none ${uploading[video.reader_id] ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand cursor-pointer hover:bg-brand-overlay focus:ring-brand'}`}
                      >
                        {uploading[video.reader_id] ? (
                          'Subiendo...'
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Subir JPEG
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/jpeg, image/jpg" 
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleUpload(video.reader_id, e.target.files[0]);
                                }
                              }}
                            />
                          </>
                        )}
                      </label>
                    </td>
                  </tr>
                ))}
                
                {!loading && videos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">No se encontraron videos grabados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>
    </main>
  );
}