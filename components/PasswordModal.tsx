'use client';

import React, { useRef, useState } from 'react';
import { copyTextToClipboard } from '@/lib/clipboard';
import styles from './SharePopup.module.css';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
  title: string;
  subtitle?: string;
  userEmail?: string;
  userId: string;
}

/**
 * WHAT: Modal component for displaying generated passwords with copy and email functionality
 * WHY: Replaces window.confirm() and window.alert() with proper in-page modals
 * HOW: Reuses SharePopup styles for consistency across the app
 */
export default function PasswordModal({
  isOpen,
  onClose,
  password,
  title,
  subtitle,
  userEmail,
  userId
}: PasswordModalProps) {
  const [copied, setCopied] = useState(false);
  // WHAT: The browser refused to copy; the password is selected in its box instead.
  const [copyFailed, setCopyFailed] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const copyToClipboard = async () => {
    if (await copyTextToClipboard(password)) {
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    // The Clipboard API is unavailable or refused. The password is already on
    // screen in a read-only box: select it so Ctrl/Cmd+C finishes the job.
    passwordInputRef.current?.select();
    setCopied(false);
    setCopyFailed(true);
    setTimeout(() => setCopyFailed(false), 4000);
  };

  const sendViaEmail = async () => {
    if (!userId || userId === 'new') {
        setEmailError('User ID not available. Please refresh and try again.');
        return;
    }

    setSendingEmail(true);
    setEmailError(null);
    try {
      const response = await fetch(`/api/admin/local-users/${userId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 5000);
      } else {
        setEmailError(data.error || 'Failed to send email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setEmailError('An unexpected error occurred');
    } finally {
      setSendingEmail(false);
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

        <div className={styles.body}>
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
                  ref={passwordInputRef}
                  type="text"
                  value={password}
                  readOnly
                  className={`${styles.input} ${styles.inputMonospace}`}
                />
                <button
                  onClick={copyToClipboard}
                  className={`${styles.copyBtn} ${styles.copyBtnPassword} ${copied ? styles.copyBtnCopied : ''}`}
                >
                  {copied ? '✅ Copied!' : copyFailed ? '⚠️ Press Ctrl/Cmd+C' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* Email Section */}
            <div className={styles.section}>
              <button
                onClick={sendViaEmail}
                disabled={sendingEmail || userId === 'new'}
                className={`${styles.visitBtn} ${styles.wFull}`}
                title={userId === 'new' ? 'Email sending is available for existing users only' : 'Send password via email'}
              >
                {sendingEmail ? '⌛ Sending...' : emailSent ? '✅ Email Sent Successfully!' : '📧 Send via email'}
              </button>
              {emailError && (
                <p className="text-error text-xs mt-2 text-center">
                  ⚠️ {emailError}
                </p>
              )}
              {userId === 'new' && (
                <p className="text-gray-500 text-xs mt-2 text-center italic">
                  * Email sending will be available after the first regeneration
                </p>
              )}
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
    </div>
  );
}
