'use client';

import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  isLoading = false,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
        window.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
    }
    return () => {
        window.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden scale-100 opacity-100 transition-all">
        <div className="p-6">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button 
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition"
                    disabled={isLoading}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <p className="text-slate-300 text-sm mb-8 leading-relaxed">
                {message}
            </p>

            <div className="flex gap-3 justify-end">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`
                        px-4 py-2 text-sm font-medium text-white rounded-lg transition shadow-lg disabled:opacity-50 flex items-center gap-2
                        ${isDestructive 
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                            : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'}
                    `}
                >
                    {isLoading && (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {confirmText}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
