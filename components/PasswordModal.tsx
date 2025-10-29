'use client';

import React, { useState } from 'react';
import styles from './SharePopup.module.css';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
  title: string;
  subtitle?: string;
  userEmail?: string;
}

/**
 * WHAT: Modal component for displaying generated passwords with copy functionality
 * WHY: Replaces window.confirm() and window.alert() with proper in-page modals
 * HOW: Reuses SharePopup styles for consistency across the app
 */
export default function PasswordModal({
  isOpen,
  onClose,
  password,
  title,
  subtitle,
  userEmail
}: PasswordModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = password;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className={styles.closeBtn}>
          ×
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerEmoji}>🔐</div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div className={styles.content}>
          {/* User Email (if provided) */}
          {userEmail && (
            <div className={styles.section}>
              <label className={styles.label}>
                👤 User Email
              </label>
              <input
                type="text"
                value={userEmail}
                readOnly
                className={styles.input}
              />
            </div>
          )}

          {/* Password Section */}
          <div className={styles.section}>
            <label className={styles.label}>
              🔐 Access Password
            </label>
            <div className={styles.inputGroup}>
              <input
                type="text"
                value={password}
                readOnly
                className={`${styles.input} ${styles.inputMonospace}`}
              />
              <button
                onClick={copyToClipboard}
                className={`${styles.copyBtn} ${styles.copyBtnPassword} ${copied ? styles.copyBtnCopied : ''}`}
              >
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className={styles.instructions}>
            <p className={styles.instructionsTitle}>📝 Instructions:</p>
            <ol className={styles.instructionsList}>
              <li className={styles.instructionItem}>
                Copy this password and share it securely with the user
              </li>
              <li className={styles.instructionItem}>
                This password is shown only once - make sure to save it
              </li>
              <li className={styles.instructionItem}>
                The user can log in using their email and this password
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
