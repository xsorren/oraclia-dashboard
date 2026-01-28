'use client';

import { ArrowLeft, X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Width on desktop. Default: 'md' (max-w-md). Options: 'sm', 'md', 'lg', 'xl', '2xl' */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
};

export function SlideOver({ isOpen, onClose, title, children, size = 'md' }: SlideOverProps) {
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
      {/* Backdrop - only visible on desktop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300 hidden sm:block"
        onClick={onClose}
      />

      {/* Panel - Full screen on mobile, slide-over on desktop */}
      <div className={`absolute inset-0 sm:inset-y-0 sm:right-0 sm:left-auto flex sm:max-w-full sm:pl-10 pointer-events-none`}>
        <div className={`pointer-events-auto w-full ${sizeClasses[size]} transform transition-transform animate-in slide-in-from-right sm:slide-in-from-right duration-300 sm:duration-500`}>
          <div className="flex h-full flex-col overflow-y-auto bg-slate-900 sm:border-l border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="px-4 py-4 sm:py-6 sm:px-6 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center justify-between gap-4">
                {/* Mobile back button */}
                <button
                  type="button"
                  className="sm:hidden rounded-md bg-transparent text-slate-400 hover:text-white focus:outline-none transition-colors -ml-1 p-1"
                  onClick={onClose}
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                <h2 className="text-base sm:text-lg font-semibold text-white leading-6 flex-1 truncate">
                  {title}
                </h2>
                
                {/* Desktop close button */}
                <button
                  type="button"
                  className="hidden sm:flex rounded-md bg-transparent text-slate-400 hover:text-white focus:outline-none transition-colors"
                  onClick={onClose}
                >
                  <span className="sr-only">Cerrar panel</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="relative flex-1 py-4 sm:py-6 px-4 sm:px-6 pb-safe">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
