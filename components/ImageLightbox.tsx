/* WHAT: Full-page image lightbox overlay
 * WHY: Allow users to view images in full detail without leaving the page
 * HOW: Click image to open fullscreen overlay, click outside or ESC to close */

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
  
  return (
    <div 
      className={styles.lightboxOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      {/* WHAT: Single image rendered directly in flexbox overlay
          WHY: No intermediate container = no duplication or positioning issues */}
      <img 
        src={imageUrl} 
        alt={alt}
        className={styles.lightboxImage}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      
      {/* WHAT: Close button for explicit dismissal
          WHY: Visual affordance for closing, especially on mobile */}
      <button 
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close image preview"
      >
        ✕
      </button>
    </div>
  );
}
