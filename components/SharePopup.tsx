'use client';

import React, { useState, useEffect } from 'react';
import { PageType } from '@/lib/pagePassword';

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

  useEffect(() => {
    if (isOpen && !shareableData) {
      generateShareableLink();
    }
  }, [isOpen, pageId, pageType]);

  const generateShareableLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/page-passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          pageType,
          regenerate: false // Don't regenerate existing passwords
        })
      });

      const data = await response.json();

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
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '0.5rem',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#374151';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
          <h2 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: '1.5rem', 
            fontWeight: '700',
            color: '#1f2937'
          }}>
            {getTitle()}
          </h2>
          <p style={{ 
            margin: 0, 
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            Share this protected {getPageTypeDisplay().toLowerCase()} with the password below
          </p>
        </div>

        {isLoading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p>Generating shareable link...</p>
          </div>
        ) : error ? (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center',
            color: '#dc2626'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
            <p style={{ margin: 0 }}>{error}</p>
            <button
              onClick={generateShareableLink}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Try Again
            </button>
          </div>
        ) : shareableData ? (
          <div>
            {/* URL Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                🔗 Shareable URL
              </label>
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem',
                alignItems: 'stretch'
              }}>
                <input
                  type="text"
                  value={shareableData.url}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    background: '#f9fafb',
                    color: '#374151'
                  }}
                />
                <button
                  onClick={() => copyToClipboard(shareableData.url, 'url')}
                  style={{
                    padding: '0.75rem 1rem',
                    background: copiedField === 'url' ? '#10b981' : '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    minWidth: '80px'
                  }}
                >
                  {copiedField === 'url' ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* Password Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                🔐 Access Password
              </label>
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem',
                alignItems: 'stretch'
              }}>
                <input
                  type="text"
                  value={shareableData.password}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    background: '#f9fafb',
                    color: '#374151',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  onClick={() => copyToClipboard(shareableData.password, 'password')}
                  style={{
                    padding: '0.75rem 1rem',
                    background: copiedField === 'password' ? '#10b981' : '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    minWidth: '80px'
                  }}
                >
                  {copiedField === 'password' ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.875rem',
              color: '#1e40af'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>📝 Instructions:</p>
              <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}>Share the URL with the intended recipient</li>
                <li style={{ marginBottom: '0.25rem' }}>Provide them with the password separately (for security)</li>
                <li>They can use either this password or the admin password to access the page</li>
              </ol>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
