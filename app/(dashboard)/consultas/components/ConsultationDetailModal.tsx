'use client';

import { useConsultationDetail } from '@/lib/hooks/useConsultas';
import { formatDateTime } from '@/lib/utils/dates';
import { CheckCircle2, User, X } from 'lucide-react';

interface Props {
    consultationId: string;
    onClose: () => void;
}

export function ConsultationDetailModal({ consultationId, onClose }: Props) {
    const { data: detailData, isLoading } = useConsultationDetail(consultationId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col flex-shrink">
                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                        <p className="text-slate-400">Cargando detalles...</p>
                    </div>
                ) : !detailData?.data ? (
                    <div className="p-8 text-center text-slate-400">
                        No se pudo obtener el detalle de la consulta.
                        <button onClick={onClose} className="mt-4 text-purple-400 hover:text-purple-300 block w-full">Cerrar</button>
                    </div>
                ) : (
                    (() => {
                        const { session, messages } = detailData.data;
                        return (
                            <>
                                <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                            {session.user?.avatar_url ? (
                                                <img src={session.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{session.user?.display_name || 'Desconocido'}</h3>
                                            <div className="text-xs text-slate-400">{formatDateTime(session.created_at)}</div>
                                        </div>
                                    </div>

                                    {session.reader && (
                                        <div className="flex items-center gap-2 pl-4 border-l border-slate-700 mr-4">
                                            <div className="text-right">
                                                <div className="text-xs text-slate-500">Tarotista</div>
                                                <div className="text-sm font-medium text-purple-400">{session.reader.display_name}</div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-purple-500/20">
                                                {session.reader.avatar_url ? (
                                                    <img src={session.reader.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={onClose}
                                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                                    {messages.map((message) => {
                                        const isReader = message.is_reader;

                                        return (
                                            <div key={message.id} className={`flex flex-col ${isReader ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-center gap-2 mb-1 px-1">
                                                    <span className="text-xs text-slate-500">{formatDateTime(message.created_at)}</span>
                                                    {isReader && <span className="text-[10px] font-medium text-green-400 px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20">Tarotista</span>}
                                                </div>

                                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isReader ? 'bg-purple-600 border-purple-500 text-white rounded-tr-sm mx-1 shadow-lg shadow-purple-900/20' : 'bg-slate-800 border-slate-700 text-slate-200 rounded-tl-sm mx-1'}`}>
                                                    {message.body_text && (
                                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.body_text}</p>
                                                    )}

                                                    {message.attachments && message.attachments.length > 0 && (
                                                        <div className="mt-2 space-y-2">
                                                            {message.attachments.map((att) => {
                                                                if (att.media_kind === 'image' && att.url) {
                                                                    return (
                                                                        <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="block mt-2">
                                                                            <img src={att.url} alt="Adjunto" className="max-w-full h-auto rounded-lg max-h-48 object-cover border border-slate-700/50" />
                                                                        </a>
                                                                    );
                                                                } else if (att.media_kind === 'audio' && att.url) {
                                                                    return (
                                                                        <div key={att.id} className="mt-2 text-slate-900 custom-audio-player">
                                                                            <audio
                                                                                controls
                                                                                src={att.url}
                                                                                className="w-full min-w-[200px]"
                                                                            >
                                                                                Tu navegador no soporta el audio.
                                                                            </audio>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {messages.length === 0 && (
                                        <div className="text-center py-12 text-slate-500 italic">
                                            No se encontraron mensajes en esta sesión.
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-slate-800 bg-slate-800/20 flex items-center justify-between shrink-0">
                                    <div className="text-sm text-slate-400">Servicio: <span className="text-white ml-1">{session.service_kind}</span></div>
                                    <div className="text-sm text-slate-400">Estado: <span className="text-white ml-1 uppercase text-xs">{session.status}</span></div>
                                </div>
                            </>
                        );
                    })()
                )}
            </div>
        </div>
    );
}
