'use client';

import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function SlideOver({ isOpen, onClose, title, children }: SlideOverProps) {
  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div className="pointer-events-auto w-screen max-w-md transform transition-transform animate-in slide-in-from-right duration-300 sm:duration-500">
          <div className="flex h-full flex-col overflow-y-scroll bg-slate-900 border-l border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="px-4 py-6 sm:px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold text-white leading-6">
                  {title}
                </h2>
                <div className="ml-3 flex h-7 items-center">
                  <button
                    type="button"
                    className="rounded-md bg-transparent text-slate-400 hover:text-white focus:outline-none transition-colors"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar panel</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="relative flex-1 py-6 px-4 sm:px-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
