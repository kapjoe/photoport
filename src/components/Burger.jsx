'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import s from "./page.module.css"


export default function Modal({ isOpen, isClosing, onClose, children }) {
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

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isClosing ? "tr": "trans"}`}>
      {/* Затемнение фона */}
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={onClose}
      />
      
      {/* Контент модалки */}
      <div className={s.bg_block}>
        {children}
      </div>
    </div>,
    document.body
  );
}