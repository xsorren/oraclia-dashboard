'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ImageViewerProps {
  src: string;
  alt?: string;
}

export function ImageViewer({ src, alt }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Thumbnail */}
      <div 
        onClick={() => setIsOpen(true)}
        className="relative group cursor-zoom-in overflow-hidden rounded-lg w-full max-w-[200px] aspect-[3/4] border border-slate-700/50"
      >
        <img 
          src={src} 
          alt={alt || 'Adjunto'} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      {/* Lightbox Portal */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
          >
            <X size={24} />
          </button>
          
          <img 
            src={src} 
            alt={alt} 
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" 
          />
          
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setIsOpen(false)} 
          />
        </div>,
        document.body
      )}
    </>
  );
}
