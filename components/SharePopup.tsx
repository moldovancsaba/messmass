'use client';

import React, { useState, useEffect } from 'react';
import { PageType } from '@/lib/pagePassword';
import { apiDelete, apiGet, apiPost } from '@/lib/apiClient';
import BaseModal from './modals/BaseModal';
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
  isProtected: boolean;
}

export default function SharePopup({ isOpen, onClose, pageId, pageType, customTitle }: SharePopupProps) {
  const [shareableData, setShareableData] = useState<ShareableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // WHAT: Separate from isLoading (the initial status fetch) so the
  //     Add/Remove/Generate buttons show their own busy state without
  //     re-showing the full-dialog loading spinner.
  const [isMutatingPassword, setIsMutatingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'url' | 'password' | null>(null);
  // WHAT: Whether the password on screen was minted in this dialog session.
  // WHY: It is the only moment it can ever be shown. Everything about the UI has
  //     to distinguish "here is your password, copy it now" from "a password
  //     exists but cannot be displayed", because those need opposite actions.
  const [justGenerated, setJustGenerated] = useState(false);
  // WHAT: Optional recipient name/email field for user convenience
  // WHY: Users want to track who they're sharing links with when copying the URL and password
  const [recipientInfo, setRecipientInfo] = useState<string>('');

  useEffect(() => {
    // Always refetch when popup opens or the target page changes.
    if (isOpen) {
      setShareableData(null);
      setCopiedField(null);
      setJustGenerated(false);
      setRecipientInfo(''); // Reset recipient field when popup opens
      fetchStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pageId, pageType]);

  // WHAT: Read-only -- the public URL and whether a password currently
  //     protects it. Never creates or changes anything.
  // WHY: This used to be a POST that unconditionally minted a password the
  //     moment the dialog opened, silently password-protecting every
  //     previously-public page anyone ever clicked Share on.
  const fetchStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGet(`/api/page-passwords?pageId=${encodeURIComponent(pageId)}&pageType=${encodeURIComponent(pageType)}`);

      if (data.success) {
        setShareableData({ url: data.url, password: '', pageType, isProtected: data.isProtected });
      } else {
        setError(data.error || 'Failed to load share status');
      }
    } catch (error) {
      console.error('Failed to load share status:', error);
      setError('Failed to load share status');
    } finally {
      setIsLoading(false);
    }
  };

  // WHAT: Explicit action -- mints (or replaces) a password. Only ever
  //     called from a button click, never automatically.
  const generateShareableLink = async (regenerate: boolean = false) => {
    setIsMutatingPassword(true);
    setError(null);

    try {
      // WHAT: Use apiPost() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header
      const data = await apiPost('/api/page-passwords', {
        pageId,
        pageType,
        regenerate
      });

      if (data.success) {
        setShareableData({
          url: data.shareableLink.url,
          password: data.shareableLink.password,
          pageType: data.shareableLink.pageType,
          isProtected: true
        });
        setJustGenerated(Boolean(data.shareableLink.password));
      } else {
        setError(data.error || 'Failed to generate shareable link');
      }
    } catch (error) {
      console.error('Failed to generate shareable link:', error);
      setError('Failed to generate shareable link');
    } finally {
      setIsMutatingPassword(false);
    }
  };

  // WHAT: Removes password protection entirely, making the page public again.
  const removePasswordProtection = async () => {
    setIsMutatingPassword(true);
    setError(null);

    try {
      const data = await apiDelete(`/api/page-passwords?pageId=${encodeURIComponent(pageId)}&pageType=${encodeURIComponent(pageType)}`);

      if (data.success) {
        setShareableData((current) => (current ? { ...current, password: '', isProtected: false } : current));
        setJustGenerated(false);
      } else {
        setError(data.error || 'Failed to remove password protection');
      }
    } catch (error) {
      console.error('Failed to remove password protection:', error);
      setError('Failed to remove password protection');
    } finally {
      setIsMutatingPassword(false);
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
      case 'event-report':
        return 'Event Report';
      case 'partner-report':
        return 'Partner Report';
      case 'organization-report':
        return 'Organization Report';
      case 'edit':
        return 'Edit Page';
      case 'partner-edit':
        return 'Partner Edit';
      case 'organization-edit':
        return 'Organization Edit';
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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      ariaLabel={getTitle()}
    >
      {/* Header section - matches FormModal structure */}
      <div className={styles.header}>
        <div className={styles.headerEmoji}>🔗</div>
        <h2 className={styles.title}>{getTitle()}</h2>
        <div className={styles.subtitle}>
          {shareableData?.isProtected
            ? `Share this ${getPageTypeDisplay().toLowerCase()} with the password below`
            : `This ${getPageTypeDisplay().toLowerCase()} is public — anyone with the URL can view it`}
        </div>
      </div>

      {/* Body section - matches FormModal structure */}
      <div className={styles.body}>
      {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingEmoji}>⏳</div>
            <p>Loading share link…</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <div className={styles.errorEmoji}>❌</div>
            <p className={styles.errorText}>{error}</p>
            <button onClick={() => fetchStatus()} className={styles.retryBtn}>
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

            {/* Password Section
                WHAT: Three states -- public (no record at all), protected with a
                    freshly-minted plaintext to show once, and protected with a
                    hash that cannot be re-read.
                WHY: The password is held only as a bcrypt hash, so this dialog can
                    either show one it just minted or offer to mint a new one. It
                    must never imply a password is retrievable. */}
            <div className={styles.section}>
              <label className={styles.label}>
                🔐 Access Password
              </label>

              {!shareableData.isProtected ? (
                <>
                  <p className={styles.helpText}>
                    No password is set — anyone with the URL above can view this
                    {' '}{getPageTypeDisplay().toLowerCase()} without signing in.
                  </p>
                  <button
                    type="button"
                    onClick={() => generateShareableLink(true)}
                    className={styles.retryBtn}
                    disabled={isMutatingPassword}
                  >
                    🔒 Add password protection
                  </button>
                </>
              ) : shareableData.password ? (
                <>
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
                  {justGenerated && (
                    <p className={styles.helpText}>
                      ⚠️ Copy this now — it is shown once and cannot be retrieved later.
                      Any password issued for this page before now has stopped working.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => removePasswordProtection()}
                    className={styles.retryBtn}
                    disabled={isMutatingPassword}
                  >
                    🔓 Remove password protection
                  </button>
                </>
              ) : (
                <>
                  <p className={styles.helpText}>
                    This page has a password, but it cannot be displayed — only a
                    one-way hash is stored, so nobody, including an admin, can read
                    it back. Generate a new one to share access, or remove
                    protection to make the page public.
                  </p>
                  <button
                    type="button"
                    onClick={() => generateShareableLink(true)}
                    className={styles.retryBtn}
                    disabled={isMutatingPassword}
                  >
                    🔄 Generate new password
                  </button>
                  <button
                    type="button"
                    onClick={() => removePasswordProtection()}
                    className={styles.retryBtn}
                    disabled={isMutatingPassword}
                  >
                    🔓 Remove password protection
                  </button>
                </>
              )}
            </div>

            {/* Instructions */}
            <div className={styles.instructions}>
              <p className={styles.instructionsTitle}>📝 Instructions:</p>
              <ol className={styles.instructionsList}>
                <li className={styles.instructionItem}>Share the URL with the intended recipient</li>
                {shareableData.isProtected ? (
                  <>
                    <li className={styles.instructionItem}>Provide them with the password separately (for security)</li>
                    <li className={styles.instructionItem}>Generating a new password immediately revokes the previous one</li>
                    <li>They can use this password to access the page; signed-in admins bypass the prompt</li>
                  </>
                ) : (
                  <li>No password is needed — the URL alone is enough for anyone to view this page</li>
                )}
              </ol>
            </div>
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
}
