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
  const [audience, setAudience] = useState<Audience>('all');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [result, setResult] = useState<NotificationsBroadcastResult | null>(null);

  const recipientsLabel = useMemo(() => {
    if (audience === 'users') return 'Usuarios';
    if (audience === 'tarotistas') return 'Tarotistas';
    return 'Todos';
  }, [audience]);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast('El título es obligatorio', 'warning');
      return;
    }

    if (!body.trim()) {
      toast('El mensaje es obligatorio', 'warning');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    try {
      const response = await sendBroadcast.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        topic: 'admin_broadcast',
        audience,
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
        subtitle="Envía un mensaje push en pocos pasos"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Notificaciones' },
        ]}
      />

      <div className="w-full p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <SectionCard>
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Enviar notificación</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-sm text-slate-300">
              Completa estos 3 campos y envía. El sistema configura automáticamente los parámetros técnicos.
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: 🎁 Promo especial disponible"
              />
              <p className="mt-1 text-xs text-slate-400">Máximo 200 caracteres</p>
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
              <p className="mt-1 text-xs text-slate-400">Máximo 500 caracteres</p>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Audiencia</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as Audience)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos</option>
                <option value="users">Solo usuarios</option>
                <option value="tarotistas">Solo tarotistas</option>
              </select>
              <p className="mt-1 text-xs text-slate-400">Elige a quién se enviará este mensaje.</p>
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
            <h3 className="text-white font-semibold mb-3">Resumen del envío</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 text-sm">
              <div className="min-w-0 bg-slate-800/70 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400">ID de campaña</p>
                <p className="text-white font-medium break-all">{result.campaign_id}</p>
              </div>
              <div className="min-w-0 bg-slate-800/70 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400">Audiencia</p>
                <p className="text-white font-medium">{result.audience === 'all' ? 'Todos' : result.audience === 'users' ? 'Usuarios' : 'Tarotistas'}</p>
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
