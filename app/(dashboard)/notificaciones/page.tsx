'use client';

import { ConfirmModal } from '@/components/common/ConfirmModal';
import { SectionCard } from '@/components/common/SectionCard';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import {
    useSendNotificationsBroadcast,
    type NotificationsBroadcastResult,
} from '@/lib/hooks/useNotifications';
import { Bell, Send } from 'lucide-react';
import { useMemo, useState } from 'react';

type Audience = 'all' | 'users' | 'tarotistas';

export default function NotificacionesPage() {
  const { toast } = useToast();
  const sendBroadcast = useSendNotificationsBroadcast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [topic, setTopic] = useState('admin_broadcast');
  const [audience, setAudience] = useState<Audience>('all');
  const [batchSize, setBatchSize] = useState('500');
  const [dataJson, setDataJson] = useState('{}');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [result, setResult] = useState<NotificationsBroadcastResult | null>(null);

  const recipientsLabel = useMemo(() => {
    if (audience === 'users') return 'Usuarios';
    if (audience === 'tarotistas') return 'Tarotistas';
    return 'Todos';
  }, [audience]);

  const parseDataJson = (): Record<string, unknown> => {
    const trimmed = dataJson.trim();
    if (!trimmed) return {};

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      throw new Error('El JSON debe ser un objeto.');
    } catch {
      throw new Error('El campo "Data (JSON)" no tiene un JSON válido.');
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast('El título es obligatorio', 'warning');
      return;
    }

    if (!body.trim()) {
      toast('El mensaje es obligatorio', 'warning');
      return;
    }

    const trimmedTopic = topic.trim();
    if (trimmedTopic && !/^[a-z0-9._-]+$/i.test(trimmedTopic)) {
      toast('Topic inválido. Usa solo letras, números, punto, guion o guion bajo', 'warning');
      return;
    }

    const parsedBatch = Number(batchSize);
    if (!Number.isInteger(parsedBatch) || parsedBatch < 100 || parsedBatch > 1000) {
      toast('Batch size debe ser un número entre 100 y 1000', 'warning');
      return;
    }

    try {
      parseDataJson();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'JSON inválido', 'error');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    try {
      const parsedData = parseDataJson();
      const parsedBatch = Number(batchSize);

      const response = await sendBroadcast.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        topic: topic.trim() || undefined,
        audience,
        batch_size: parsedBatch,
        data: parsedData,
      });

      setResult(response);
      setIsConfirmOpen(false);
      toast('Campaña enviada correctamente', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Error al enviar notificaciones', 'error');
    }
  };

  return (
    <>
      <Header
        title="Notificaciones"
        subtitle="Envío de notificaciones push personalizadas"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Notificaciones' },
        ]}
      />

      <div className="w-full p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <SectionCard>
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Nueva campaña push</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: 🎁 Promo especial disponible"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Mensaje</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Escribe el contenido de la notificación..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Topic</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="admin_broadcast"
                />
                <p className="mt-1 text-xs text-slate-400">Formato: letras, números, punto, guion o guion bajo.</p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Audiencia</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as Audience)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Todos</option>
                  <option value="users">Usuarios</option>
                  <option value="tarotistas">Tarotistas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Batch size</label>
                <input
                  type="number"
                  min={100}
                  max={1000}
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Data (JSON)</label>
              <textarea
                value={dataJson}
                onChange={(e) => setDataJson(e.target.value)}
                rows={6}
                className="w-full px-3 py-2.5 font-mono text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder='{"action":"open_app"}'
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleSubmit}
                disabled={sendBroadcast.isPending}
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-lg transition"
              >
                <Send className="w-4 h-4" />
                Enviar notificación
              </button>
            </div>
          </div>
        </SectionCard>

        {result && (
          <SectionCard>
            <h3 className="text-white font-semibold mb-3">Resultado de campaña</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 text-sm">
              <div className="min-w-0 bg-slate-800/70 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400">Campaña</p>
                <p className="text-white font-medium break-all">{result.campaign_id}</p>
              </div>
              <div className="min-w-0 bg-slate-800/70 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400">Audiencia</p>
                <p className="text-white font-medium">{result.audience}</p>
              </div>
              <div className="min-w-0 bg-slate-800/70 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400">Topic</p>
                <p className="text-white font-medium break-all">{result.topic}</p>
              </div>
              <div className="min-w-0 bg-slate-800/70 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400">Destinatarios</p>
                <p className="text-white font-medium">{result.recipients_total}</p>
              </div>
              <div className="min-w-0 bg-slate-800/70 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400">Enviadas</p>
                <p className="text-green-400 font-semibold">{result.sent}</p>
              </div>
              <div className="min-w-0 bg-slate-800/70 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400">Fallidas</p>
                <p className="text-red-400 font-semibold">{result.failed}</p>
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div className="mt-4 bg-red-950/30 border border-red-700/40 rounded-lg p-3">
                <p className="text-red-300 font-medium mb-1">Errores</p>
                <ul className="text-red-200 text-sm space-y-1">
                  {result.errors.map((error, idx) => (
                    <li key={`${error}-${idx}`}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSend}
        isLoading={sendBroadcast.isPending}
        title="Confirmar envío"
        message={`Se enviará esta notificación a ${recipientsLabel}. ¿Deseas continuar?`}
        confirmText="Enviar"
      />
    </>
  );
}
