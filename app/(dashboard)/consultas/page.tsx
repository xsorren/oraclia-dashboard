'use client';

import { Header } from '@/components/layout/Header';
import { MessageCircle, Zap } from 'lucide-react';
import { useState } from 'react';
import { FlashQuestionsTab } from './components/FlashQuestionsTab';
import { PrivateConsultationsTab } from './components/PrivateConsultationsTab';

export default function ConsultasPage() {
    const [activeTab, setActiveTab] = useState<'flash' | 'privadas'>('flash');

    return (
        <>
            <Header
                title="Consultas"
                subtitle="Gestión de preguntas flash y sesiones privadas"
                breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Consultas' }]}
            />

            <div className="p-4 sm:p-6 lg:p-8 max-w-[2000px] mx-auto w-full">
                {/* Tabs switcher */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl w-full max-w-sm mb-6 border border-slate-700">
                    <button
                        onClick={() => setActiveTab('flash')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'flash'
                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <Zap className="w-4 h-4" />
                        Flash
                    </button>
                    <button
                        onClick={() => setActiveTab('privadas')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'privadas'
                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Privadas
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'flash' ? (
                    <FlashQuestionsTab />
                ) : (
                    <PrivateConsultationsTab />
                )}
            </div>
        </>
    );
}
