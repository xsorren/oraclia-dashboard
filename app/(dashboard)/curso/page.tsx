'use client';

import { SectionCard } from '@/components/common/SectionCard';
import { Header } from '@/components/layout/Header';
import { adminApi, type CourseAdminData, type SignedCourseVideoUpload } from '@/lib/api/admin';
import { CheckCircle2, Film, Loader2, RotateCcw, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
const PENDING_COMMIT_KEY = 'oraclia:course-video-pending-commit';

interface PendingCommit {
  lessonId: string;
  storagePath: string;
  durationSeconds: number;
  sizeBytes: number;
  fileName: string;
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration);
      URL.revokeObjectURL(url);
      if (!Number.isFinite(duration) || duration < 5) reject(new Error('No se pudo leer la duración del MP4'));
      else resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('El archivo no es un MP4 reproducible'));
    };
    video.src = url;
  });
}

async function putSignedVideo(
  signed: SignedCourseVideoUpload,
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
): Promise<void> {
  if (!signed.upload_url) throw new Error('Storage no devolvió la URL firmada');
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    signal.addEventListener('abort', abort, { once: true });
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new Error('Falló la conexión durante la carga a Storage'));
    xhr.onabort = () => reject(new DOMException('Carga cancelada', 'AbortError'));
    xhr.onload = () => {
      signal.removeEventListener('abort', abort);
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Storage rechazó la carga (HTTP ${xhr.status})`));
    };
    const form = new FormData();
    form.append('cacheControl', '3600');
    form.append('', file);
    xhr.open('PUT', signed.upload_url);
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.send(form);
  });
}

function savePendingCommit(value: PendingCommit | null) {
  try {
    if (value) sessionStorage.setItem(PENDING_COMMIT_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(PENDING_COMMIT_KEY);
  } catch {
    // La recuperación es una mejora; el commit inmediato sigue funcionando sin Storage API del browser.
  }
}

function readPendingCommit(): PendingCommit | null {
  try {
    const value = sessionStorage.getItem(PENDING_COMMIT_KEY);
    return value ? JSON.parse(value) as PendingCommit : null;
  } catch {
    return null;
  }
}
export default function CourseAdminPage() {
  const [data, setData] = useState<CourseAdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [pendingCommit, setPendingCommit] = useState<PendingCommit | null>(() => readPendingCommit());
  const uploadAbortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await adminApi.getCourse());
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'No se pudo cargar el curso' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    adminApi.getCourse()
      .then((course) => { if (active) setData(course); })
      .catch((error: unknown) => { if (active) setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'No se pudo cargar el curso' }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; uploadAbortRef.current?.abort(); };
  }, []);

  const moduleById = useMemo(
    () => new Map((data?.modules ?? []).map((module) => [module.id, module])),
    [data?.modules],
  );

  const videos = useMemo(
    () => (data?.lessons ?? []).filter((lesson) => lesson.lesson_kind === 'video'),
    [data?.lessons],
  );

  const uploadLesson = useCallback(async (lessonId: string, file: File) => {
    if (file.type !== 'video/mp4') {
      setMessage({ kind: 'error', text: 'Solo se admite video/mp4.' });
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setMessage({ kind: 'error', text: 'El archivo supera 2 GiB.' });
      return;
    }

    setUploadingId(lessonId);
    setProgress(0);
    setMessage(null);
    const controller = new AbortController();
    uploadAbortRef.current = controller;
    try {
      const [durationSeconds, signed] = await Promise.all([
        readVideoDuration(file),
        adminApi.signCourseVideo({ lessonId, file }),
      ]);
      await putSignedVideo(signed, file, setProgress, controller.signal);
      const commit: PendingCommit = {
        lessonId,
        storagePath: signed.storage_path,
        durationSeconds,
        sizeBytes: file.size,
        fileName: file.name,
      };
      savePendingCommit(commit);
      setPendingCommit(commit);
      await adminApi.commitCourseVideo(commit);
      savePendingCommit(null);
      setPendingCommit(null);
      setMessage({ kind: 'success', text: 'Video subido y confirmado. Poster pendiente: se usa course.png.' });
      setLoading(true);
      await load();
    } catch (error) {
      const cancelled = error instanceof DOMException && error.name === 'AbortError';
      setMessage({ kind: 'error', text: cancelled ? 'Carga cancelada. El video anterior no fue modificado.' : error instanceof Error ? error.message : 'Falló la carga del video' });
    } finally {
      uploadAbortRef.current = null;
      setUploadingId(null);
      setProgress(0);
    }
  }, [load]);

  const retryCommit = useCallback(async () => {
    if (!pendingCommit) return;
    setUploadingId(pendingCommit.lessonId);
    setProgress(100);
    setMessage(null);
    try {
      await adminApi.commitCourseVideo(pendingCommit);
      savePendingCommit(null);
      setPendingCommit(null);
      setMessage({ kind: 'success', text: 'El video que ya estaba en Storage fue confirmado correctamente.' });
      setLoading(true);
      await load();
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'No se pudo confirmar el video' });
    } finally {
      setUploadingId(null);
      setProgress(0);
    }
  }, [load, pendingCommit]);

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-8 dark:bg-gray-900">
      <Header title="Curso de Tarot" />

      <SectionCard className="mt-8">
        <div className="space-y-5 p-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
              {data?.course.title ?? 'Curso de Tarot de Oraclia'}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              PUT directo al bucket privado course-videos · máximo 2 GiB · solo MP4.
            </p>
          </div>

          {message ? (
            <div
              role="status"
              className={`rounded-lg border px-4 py-3 text-sm ${
                message.kind === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
              }`}
            >
              {message.text}
            </div>
          ) : null}

          {pendingCommit ? <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between dark:text-amber-200"><span>El archivo <strong>{pendingCommit.fileName}</strong> llegó a Storage, pero falta confirmar sus metadatos.</span><button type="button" disabled={Boolean(uploadingId)} onClick={() => void retryCommit()} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 font-semibold text-white disabled:opacity-60"><RotateCcw className="h-4 w-4" /> Reintentar confirmación</button></div> : null}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Cargando clases…
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-[640px] w-full text-left text-sm">
                <thead className="bg-gray-100 text-xs uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Módulo / clase</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Carga</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((lesson, index) => {
                    const relation = Array.isArray(lesson.course_lesson_media)
                      ? lesson.course_lesson_media[0]
                      : lesson.course_lesson_media;
                    const uploaded = Boolean(relation?.storage_path);
                    const busy = uploadingId === lesson.id;
                    return (
                      <tr key={lesson.id} className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                        <td className="px-4 py-4 font-mono text-gray-500">{index + 1}</td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-950 dark:text-white">{lesson.title}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{moduleById.get(lesson.module_id)?.title}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 ${uploaded ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {uploaded ? <CheckCircle2 className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                            {uploaded ? 'Subido' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2"><label className={`inline-flex min-w-32 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white ${busy ? 'cursor-wait bg-gray-500' : 'cursor-pointer bg-purple-600 hover:bg-purple-500'}`}>
                            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {progress}%</> : <><Upload className="h-4 w-4" /> {uploaded ? 'Reemplazar' : 'Subir MP4'}</>}
                            <input
                              type="file"
                              accept="video/mp4"
                              disabled={Boolean(uploadingId)}
                              className="sr-only"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.currentTarget.value = '';
                                if (file && (!uploaded || window.confirm(`¿Reemplazar el video actual de “${lesson.title}”?`))) void uploadLesson(lesson.id, file);
                              }}
                            />
                          </label>{busy ? <button type="button" onClick={() => uploadAbortRef.current?.abort()} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-red-300 px-2 text-xs font-semibold text-red-700 hover:bg-red-50"><X className="h-3.5 w-3.5" /> Cancelar</button> : null}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>
    </main>
  );
}
