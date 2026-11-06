// components/report/ImageLightboxModal.tsx
// WHAT: High-resolution full-screen image inspection modal
// WHY: Allow clients, sponsors, and executives to inspect venue photos, scoreboards, and QR codes
// HOW: Accessible portal modal with escape key, click-outside dismiss, and zoom affordance

'use client';

import React, { useEffect, useCallback } from 'react';
import styles from './ImageLightboxModal.module.css';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
  title?: string;
}

export default function ImageLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  altText,
  title,
}: ImageLightboxModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || altText || 'Image Preview'}
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close Preview"
        >
          ✕
        </button>
        {title && <div className={styles.modalTitle}>{title}</div>}
        <div className={styles.imageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={altText}
            className={styles.modalImage}
          />
        </div>
      </div>
    </div>
  );
}
