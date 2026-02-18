'use client';

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    counterRef.current += 1;
    const id = `toast-${counterRef.current}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md transition-all animate-slide-up bg-slate-900/90
              ${t.type === 'success' ? 'border-green-500/50 text-green-400' : ''}
              ${t.type === 'error' ? 'border-red-500/50 text-red-400' : ''}
              ${t.type === 'info' ? 'border-blue-500/50 text-blue-400' : ''}
              ${t.type === 'warning' ? 'border-amber-500/50 text-amber-400' : ''}
            `}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {t.type === 'error' && <XCircle className="w-5 h-5" />}
            {t.type === 'info' && <Info className="w-5 h-5" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm font-medium">{t.message}</span>
            <button
                onClick={() => removeToast(t.id)}
                className="ml-4 hover:bg-white/10 rounded-full p-1"
            >
                <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
