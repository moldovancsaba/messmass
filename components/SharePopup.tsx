'use client';

import React, { useState, useEffect } from 'react';
import { PageType } from '@/lib/pagePassword';
import { apiPost } from '@/lib/apiClient';
import styles from './SharePopup.module.css';

interface SharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  pageType: PageType;
  customTitle?: string;
}

interface ShareableData {
  url: string;
  password: string;
  pageType: PageType;
}

export default function SharePopup({ isOpen, onClose, pageId, pageType, customTitle }: SharePopupProps) {
  const [shareableData, setShareableData] = useState<ShareableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'url' | 'password' | null>(null);
  // WHAT: Optional recipient name/email field for user convenience
  // WHY: Users want to track who they're sharing links with when copying the URL and password
  const [recipientInfo, setRecipientInfo] = useState<string>('');

  useEffect(() => {
    // Always regenerate when popup opens or the target page changes.
    if (isOpen) {
      setShareableData(null);
      setCopiedField(null);
      setRecipientInfo(''); // Reset recipient field when popup opens
      generateShareableLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pageId, pageType]);

  const generateShareableLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // WHAT: Use apiPost() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header
      const data = await apiPost('/api/page-passwords', {
        pageId,
        pageType,
        regenerate: false // Don't regenerate existing passwords
      });

      if (data.success) {
        setShareableData({
          url: data.shareableLink.url,
          password: data.shareableLink.password,
          pageType: data.shareableLink.pageType
        });
      } else {
        setError(data.error || 'Failed to generate shareable link');
      }
    } catch (error) {
      console.error('Failed to generate shareable link:', error);
      setError('Failed to generate shareable link');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: 'url' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const getPageTypeDisplay = () => {
    switch (pageType) {
      case 'stats':
        return 'Statistics Page';
      case 'edit':
        return 'Edit Page';
      case 'filter':
        return 'Filter Page';
      default:
        return 'Page';
    }
  };

  const getTitle = () => {
    if (customTitle) return customTitle;
    return `Share ${getPageTypeDisplay()}`;
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
          <div className={styles.headerEmoji}>🔗</div>
          <h2 className={styles.title}>
            {getTitle()}
          </h2>
          <p className={styles.subtitle}>
            Share this protected {getPageTypeDisplay().toLowerCase()} with the password below
          </p>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingEmoji}>⏳</div>
            <p>Generating shareable link...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <div className={styles.errorEmoji}>❌</div>
            <p className={styles.errorText}>{error}</p>
            <button onClick={generateShareableLink} className={styles.retryBtn}>
              Try Again
            </button>
          </div>
        ) : shareableData ? (
          <div className={styles.content}>
            {/* WHAT: Optional recipient name/email input field
                WHY: Allows user to note who they're sharing with before copying URL/password */}
            {/* Recipient Info Section */}
            <div className={styles.section}>
              <label className={styles.label}>
                👤 Recipient Name or Email <span className={styles.labelOptional}>(optional)</span>
              </label>
              <input
                type="text"
                value={recipientInfo}
                onChange={(e) => setRecipientInfo(e.target.value)}
                placeholder="e.g., John Doe or john@example.com"
                className={`${styles.input} ${styles.inputEditable}`}
              />
              <p className={styles.helpText}>
                For your reference only - helps you remember who you shared this link with
              </p>
            </div>

            {/* URL Section */}
            <div className={styles.section}>
              <label className={styles.label}>
                🔗 Shareable URL
              </label>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  value={shareableData.url}
                  readOnly
                  className={styles.input}
                />
                <button
                  onClick={() => copyToClipboard(shareableData.url, 'url')}
                  className={`${styles.copyBtn} ${copiedField === 'url' ? styles.copyBtnCopied : ''}`}
                >
                  {copiedField === 'url' ? '✅ Copied!' : '📋 Copy'}
                </button>
                {/* WHAT: Quick access to the shared page.
                    WHY: Users asked for a direct Visit button alongside Copy to open in a new tab. */}
                <button
                  onClick={() => {
                    try {
                      window.open(shareableData.url, '_blank', 'noopener,noreferrer');
                    } catch (e) {
                      // Fallback: set location if popup blocked
                      window.location.href = shareableData.url;
                    }
                  }}
                  className={styles.visitBtn}
                  title="Open the shared page in a new tab"
                >
                  🔎 Visit
                </button>
              </div>
            </div>

            {/* Password Section */}
            <div className={styles.section}>
              <label className={styles.label}>
                🔐 Access Password
              </label>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  value={shareableData.password}
                  readOnly
                  className={`${styles.input} ${styles.inputMonospace}`}
                />
                <button
                  onClick={() => copyToClipboard(shareableData.password, 'password')}
                  className={`${styles.copyBtn} ${styles.copyBtnPassword} ${copiedField === 'password' ? styles.copyBtnCopied : ''}`}
                >
                  {copiedField === 'password' ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className={styles.instructions}>
              <p className={styles.instructionsTitle}>📝 Instructions:</p>
              <ol className={styles.instructionsList}>
                <li className={styles.instructionItem}>Share the URL with the intended recipient</li>
                <li className={styles.instructionItem}>Provide them with the password separately (for security)</li>
                <li>They can use either this password or the admin password to access the page</li>
              </ol>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
