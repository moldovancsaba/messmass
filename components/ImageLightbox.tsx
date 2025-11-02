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
  // WHAT: Default to white with 85% opacity (matches DEFAULT_PAGE_STYLE_ENHANCED)
  // WHY: System default page background is #ffffff, not black
  const [overlayBg, setOverlayBg] = React.useState<string>('rgba(255, 255, 255, 0.85)');
  
  /* WHAT: Extract page background color and apply 85% opacity
   * WHY: Match page style background with same transparency as original black overlay
   * HOW: Read computed background from page container, convert to rgba with alpha 0.85 */
  useEffect(() => {
    if (!isOpen) return;
    
    // Try to find the page container with background style
    const pageContainer = document.querySelector('[style*="background"]') as HTMLElement;
    if (pageContainer) {
      const bgStyle = pageContainer.style.background;
      
      // WHAT: Convert gradient/solid background to transparent version
      // WHY: Maintain page aesthetic while allowing overlay transparency
      if (bgStyle.includes('linear-gradient')) {
        // Replace opacity in gradient stops with 0.85
        const transparentGradient = bgStyle.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/g, 'rgba($1, $2, $3, 0.85)');
        setOverlayBg(transparentGradient);
      } else if (bgStyle.includes('rgb')) {
        // Convert rgb/rgba to rgba with 0.85 opacity
        const match = bgStyle.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          setOverlayBg(`rgba(${match[1]}, ${match[2]}, ${match[3]}, 0.85)`);
        }
      } else if (bgStyle.match(/^#[0-9a-f]{6}$/i)) {
        // Convert hex to rgba
        const r = parseInt(bgStyle.slice(1, 3), 16);
        const g = parseInt(bgStyle.slice(3, 5), 16);
        const b = parseInt(bgStyle.slice(5, 7), 16);
        setOverlayBg(`rgba(${r}, ${g}, ${b}, 0.85)`);
      }
    }
  }, [isOpen]);
  
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
    <div className={styles.overlay} style={{ background: overlayBg }} onClick={onClose}>
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
