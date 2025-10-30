/* WHAT: Full-page image lightbox using SharePopup structure
 * WHY: SharePopup centers perfectly - reuse its proven approach
 * HOW: Same overlay + modal structure, but with image instead of text content */

'use client';

import React, { useEffect } from 'react';
import styles from './ImageLightbox.module.css';

export interface ImageLightboxProps {
  imageUrl: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ imageUrl, alt, isOpen, onClose }: ImageLightboxProps) {
  /* WHAT: Close lightbox on ESC key press
     WHY: Standard UX pattern for modal dismissal */
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
  
  /* WHAT: Prevent body scroll when lightbox is open
     WHY: User should not be able to scroll background content */
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
  
  /* WHAT: Use exact same structure as SharePopup (overlay > modal)
     WHY: SharePopup centers perfectly, so copy its approach exactly */
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close button - same as SharePopup */}
        <button onClick={onClose} className={styles.closeBtn}>
          ×
        </button>
        
        {/* Image content - replaces SharePopup's text content */}
        <img 
          src={imageUrl} 
          alt={alt}
          className={styles.image}
        />
      </div>
    </div>
  );
}
