'use client';

import React from 'react';
import styles from './SharePopup.module.css';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

/**
 * WHAT: Modal component for confirmation dialogs
 * WHY: Replaces window.confirm() with proper in-page modal for better UX
 * HOW: Reuses SharePopup styles for consistency
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className={styles.closeBtn}>
          ×
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerEmoji}>{isDangerous ? '⚠️' : '❓'}</div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{message}</p>
        </div>

        <div className={styles.content}>
          <div className="modal-actions">
            <button
              onClick={onClose}
              className="btn-modal-cancel"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={isDangerous ? 'btn-modal-danger' : 'btn-modal-confirm'}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
