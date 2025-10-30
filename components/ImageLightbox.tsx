/* WHAT: Image lightbox using React Portal for proper full-screen rendering
 * WHY: Parent page containers create stacking context interference - Portal escapes this
 * HOW: createPortal renders at document.body + CSS flexbox centering (NO JavaScript positioning) */

'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ImageLightbox.module.css';

export interface ImageLightboxProps {
  imageUrl: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ imageUrl, alt, isOpen, onClose }: ImageLightboxProps) {
  /* WHAT: Close lightbox on ESC key press */
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  /* WHAT: Prevent body scroll when lightbox is open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  /* WHAT: Render lightbox at document.body using React Portal
     WHY: Escapes parent page's gray background and stacking context
     HOW: createPortal(JSX, document.body) renders outside React tree */
  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeBtn}>
          ×
        </button>
        
        {/* WHAT: Image with CSS-only centering
            WHY: Flexbox on modal centers perfectly without JavaScript
            HOW: max-width/max-height constraints + object-fit contain */}
        <img 
          src={imageUrl} 
          alt={alt}
          className={styles.image}
        />
      </div>
    </div>,
    document.body
  );
}
