'use client';

/* WHAT: Comprehensive Design System Manager - Interactive reference for design tokens, components, and patterns
 * WHY: Single source of truth for design standards; addresses deprecated elements and missing documentation
 * HOW: Tab-based UI showcasing typography, tokens, components, utilities, and coding standards
 * REPLACES: Old fragmented style configuration page with comprehensive design reference */

import React, { useState, useEffect } from 'react';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
import styles from './Design.module.css';
import { apiPut } from '@/lib/apiClient';

export default function AdminDesignPage() {
  /* WHAT: Typography font selection state
   * WHY: Allow admin to switch between Inter, Roboto, and Poppins system-wide */
  const [selectedFont, setSelectedFont] = useState<'inter' | 'roboto' | 'poppins'>('inter');
  const [fontLoading, setFontLoading] = useState(false);
  
  /* WHAT: Active tab state for organizing content
   * WHY: Better UX than endless scrolling - organize into logical sections */
  const [activeTab, setActiveTab] = useState<string>('typography');
  
  /* WHAT: Copy feedback state
   * WHY: Show visual confirmation when user copies token/code to clipboard */
  const [copiedText, setCopiedText] = useState<string>('');

  useEffect(() => {
    loadTypographySettings();
  }, []);
  
  const loadTypographySettings = async () => {
    try {
      const response = await fetch('/api/admin/ui-settings');
      const data = await response.json();
      if (data.fontFamily) {
        setSelectedFont(data.fontFamily);
      }
    } catch (error) {
      console.error('Failed to load typography settings:', error);
    }
  };
  
  const saveFont = async (font: 'inter' | 'roboto' | 'poppins') => {
    setFontLoading(true);
    try {
      const data = await apiPut('/api/admin/ui-settings', { fontFamily: font });
      
      if (data.success) {
        setSelectedFont(font);
        document.documentElement.setAttribute('data-font', font);
        document.documentElement.style.fontFamily = `var(--font-${font})`;
        alert(`Font changed to ${font.charAt(0).toUpperCase() + font.slice(1)}! ✨`);
      } else {
        alert('Failed to save font: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save font:', error);
      alert('Failed to save font');
    } finally {
      setFontLoading(false);
    }
  };

  /* WHAT: Copy text to clipboard with visual feedback
   * WHY: Convenient for developers to copy tokens and code examples */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  /* WHAT: Design token catalog from theme.css
   * WHY: Centralized reference for all CSS variables */
  const colorTokens = [
    { category: 'Primary', tokens: [
      { name: '--mm-color-primary-50', value: '#eff6ff' },
      { name: '--mm-color-primary-500', value: '#3b82f6' },
      { name: '--mm-color-primary-900', value: '#1e3a8a' },
    ]},
    { category: 'Secondary', tokens: [
      { name: '--mm-color-secondary-500', value: '#10b981' },
      { name: '--mm-color-secondary-600', value: '#059669' },
    ]},
    { category: 'Semantic', tokens: [
      { name: '--mm-success', value: '#10b981' },
      { name: '--mm-warning', value: '#f59e0b' },
      { name: '--mm-error', value: '#ef4444' },
      { name: '--mm-info', value: '#3b82f6' },
    ]},
  ];

  const buttonVariants = ['primary', 'secondary', 'success', 'danger', 'info'];
  
  const utilityExamples = [
    { category: 'Spacing', classes: ['.p-2', '.p-4', '.m-2', '.m-4', '.gap-2', '.gap-4'] },
    { category: 'Layout', classes: ['.flex', '.grid', '.items-center', '.justify-between'] },
    { category: 'Typography', classes: ['.text-sm', '.text-base', '.font-medium', '.font-bold'] },
  ];

  const tabs = [
    { id: 'typography', label: '🔤 Typography', color: '#8b5cf6' },
    { id: 'tokens', label: '🎨 Design Tokens', color: '#3b82f6' },
    { id: 'components', label: '🧩 Components', color: '#10b981' },
    { id: 'utilities', label: '⚡ Utilities', color: '#f59e0b' },
    { id: 'standards', label: '📋 Standards', color: '#ef4444' },
  ];

  return (
    <div className="page-container">
      <AdminHero
        title="🎨 Design System Manager"
        subtitle="Interactive reference for all design tokens, components, and patterns"
        backLink="/admin"
        badges={[{ text: 'Production Ready', variant: 'success' }]}
      />

      {/* Tab Navigation */}
      <ColoredCard accentColor="#6366f1" hoverable={false} className={styles.tabCard}>
        <div className={styles.tabNav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabActive : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </ColoredCard>

      {/* TYPOGRAPHY TAB */}
      {activeTab === 'typography' && (
        <ColoredCard accentColor="#8b5cf6" hoverable={false}>
          <h2 className={styles.sectionTitle}>🔤 Typography & Fonts</h2>
          <p className={styles.sectionDesc}>
            Select a Google Font for the entire application. Changes apply immediately.
          </p>
          
          <div className="flex gap-4 mb-6 flex-wrap">
            {(['inter', 'roboto', 'poppins'] as const).map((font) => (
              <button
                key={font}
                onClick={() => saveFont(font)}
                disabled={fontLoading}
                className={`btn ${selectedFont === font ? 'btn-primary' : 'btn-secondary'}`}
              >
                {font.charAt(0).toUpperCase() + font.slice(1)}
                {selectedFont === font && ' ✓'}
              </button>
            ))}
          </div>
          
          <div className={styles.fontPreview}>
            <h3 style={{ fontSize: '24px', fontWeight: 600 }}>The Quick Brown Fox</h3>
            <p style={{ fontSize: '16px', lineHeight: 1.5 }}>
              This is body text demonstrating how paragraphs appear with normal spacing.
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Small caption text used for labels and secondary information.
            </p>
          </div>
        </ColoredCard>
      )}

      {/* TOKENS TAB */}
      {activeTab === 'tokens' && (
        <>
          <ColoredCard accentColor="#3b82f6" hoverable={false} className="mb-6">
            <h2 className={styles.sectionTitle}>🎨 Color Tokens</h2>
            
            {colorTokens.map((group) => (
              <div key={group.category} className="mb-6">
                <h3 className={styles.subsectionTitle}>{group.category}</h3>
                <div className={styles.tokenGrid}>
                  {group.tokens.map((token) => (
                    <div key={token.name} className={styles.tokenItem}>
                      <div
                        className={styles.colorSwatch}
                        style={{ backgroundColor: token.value }}
                      />
                      <div className={styles.tokenInfo}>
                        <code className={styles.tokenName}>{token.name}</code>
                        <code className={styles.tokenValue}>{token.value}</code>
                        <button
                          onClick={() => copyToClipboard(token.name)}
                          className={styles.copyBtn}
                          title="Copy token name"
                        >
                          {copiedText === token.name ? '✓' : '📋'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </ColoredCard>

          <ColoredCard accentColor="#8b5cf6" hoverable={false}>
            <h2 className={styles.sectionTitle}>📝 Typography Tokens</h2>
            <p className="mb-4">Font sizes: <code>--mm-text-xs</code> (12px) to <code>--mm-text-4xl</code> (36px)</p>
            <p className="mb-4">Font weights: <code>--mm-font-weight-normal</code> (400) to <code>--mm-font-weight-bold</code> (700)</p>
            <p>Spacing: <code>--mm-space-1</code> (4px) to <code>--mm-space-24</code> (96px)</p>
          </ColoredCard>
        </>
      )}

      {/* COMPONENTS TAB */}
      {activeTab === 'components' && (
        <>
          <ColoredCard accentColor="#10b981" hoverable={false} className="mb-6">
            <h2 className={styles.sectionTitle}>🔘 Button Variants</h2>
            <div className="flex gap-2 flex-wrap mb-4">
              {buttonVariants.map((variant) => (
                <button key={variant} className={`btn btn-${variant}`}>
                  {variant.charAt(0).toUpperCase() + variant.slice(1)}
                </button>
              ))}
            </div>
            <div className={styles.codeBlock}>
              <code>{`<button className="btn btn-primary">Label</button>`}</code>
              <button onClick={() => copyToClipboard(`<button className="btn btn-primary">Label</button>`)} className={styles.copyBtn}>
                📋
              </button>
            </div>
          </ColoredCard>

          <ColoredCard accentColor="#3b82f6" hoverable={false} className="mb-6">
            <h2 className={styles.sectionTitle}>📝 Form Elements</h2>
            <div className="mb-4">
              <label className="form-label">Text Input</label>
              <input type="text" className="form-input" placeholder="Enter text..." />
            </div>
            <div className="mb-4">
              <label className="form-label">Select Dropdown</label>
              <select className="form-select">
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>
            <div className={styles.codeBlock}>
              <code>{`<input type="text" className="form-input" />`}</code>
              <button onClick={() => copyToClipboard(`<input type="text" className="form-input" />`)} className={styles.copyBtn}>
                📋
              </button>
            </div>
          </ColoredCard>

          <ColoredCard accentColor="#ec4899" hoverable={false}>
            <h2 className={styles.sectionTitle}>🎴 ColoredCard Component</h2>
            <p className="mb-4">All cards MUST use ColoredCard component:</p>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
              <ColoredCard accentColor="#3b82f6">
                <h3 className="font-semibold mb-2">Blue Accent</h3>
                <p className="text-sm">For fans and engagement</p>
              </ColoredCard>
              <ColoredCard accentColor="#10b981">
                <h3 className="font-semibold mb-2">Green Accent</h3>
                <p className="text-sm">For success metrics</p>
              </ColoredCard>
              <ColoredCard accentColor="#8b5cf6">
                <h3 className="font-semibold mb-2">Purple Accent</h3>
                <p className="text-sm">For projects</p>
              </ColoredCard>
            </div>

            <div className={styles.codeBlock}>
              <code>{`<ColoredCard accentColor="#3b82f6">Content</ColoredCard>`}</code>
              <button onClick={() => copyToClipboard(`<ColoredCard accentColor="#3b82f6">Content</ColoredCard>`)} className={styles.copyBtn}>
                📋
              </button>
            </div>
          </ColoredCard>
        </>
      )}

      {/* UTILITIES TAB */}
      {activeTab === 'utilities' && (
        <ColoredCard accentColor="#f59e0b" hoverable={false}>
          <h2 className={styles.sectionTitle}>⚡ Utility Classes Reference</h2>
          <p className="mb-6">Reusable utility classes from <code>app/styles/utilities.css</code></p>
          
          {utilityExamples.map((group) => (
            <div key={group.category} className="mb-6">
              <h3 className={styles.subsectionTitle}>{group.category}</h3>
              <div className="flex gap-2 flex-wrap">
                {group.classes.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => copyToClipboard(cls)}
                    className="btn btn-small btn-secondary"
                  >
                    <code>{cls}</code> {copiedText === cls && '✓'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </ColoredCard>
      )}

      {/* STANDARDS TAB */}
      {activeTab === 'standards' && (
        <>
          <ColoredCard accentColor="#ef4444" hoverable={false} className="mb-6">
            <h2 className={styles.sectionTitle}>🚫 Prohibited Patterns</h2>
            
            <div className={styles.warningBox}>
              <h3 className={styles.warningTitle}>⚠️ REMOVED - DO NOT USE</h3>
              <p className="mb-4">The following CSS card classes have been <strong>PERMANENTLY REMOVED</strong>:</p>
              <ul className={styles.prohibitedList}>
                <li><code>.glass-card</code></li>
                <li><code>.admin-card</code></li>
                <li><code>.content-surface</code></li>
                <li><code>.section-card</code></li>
              </ul>
              <p className="mt-4 font-semibold">✅ Migration: Use <code>&lt;ColoredCard&gt;</code> component instead.</p>
            </div>

            <div className={styles.warningBox}>
              <h3 className={styles.warningTitle}>🚫 FORBIDDEN PATTERN</h3>
              <p className="mb-4">The <code>style</code> prop is <strong>PROHIBITED</strong> on DOM elements.</p>
              <p className="mb-2">✅ <strong>Instead use:</strong></p>
              <ul className={styles.approvedList}>
                <li>CSS Modules: <code>import styles from './Component.module.css'</code></li>
                <li>Utility classes: <code>className="flex items-center gap-2"</code></li>
                <li>Design tokens: <code>var(--mm-primary-500)</code></li>
              </ul>
            </div>
          </ColoredCard>

          <ColoredCard accentColor="#10b981" hoverable={false}>
            <h2 className={styles.sectionTitle}>✅ Approved Patterns</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className={styles.subsectionTitle}>1. Component-First Approach</h3>
                <p>Always use React components over plain HTML with CSS classes</p>
                <div className={styles.codeBlock}>
                  <code>{`// ✅ CORRECT\n<ColoredCard accentColor="#3b82f6">Content</ColoredCard>`}</code>
                </div>
              </div>

              <div>
                <h3 className={styles.subsectionTitle}>2. Design Tokens</h3>
                <p>Use CSS variables from theme.css for all values</p>
                <div className={styles.codeBlock}>
                  <code>{`.myClass {\n  color: var(--mm-primary-500);\n  padding: var(--mm-space-4);\n}`}</code>
                </div>
              </div>

              <div>
                <h3 className={styles.subsectionTitle}>3. Utility Classes</h3>
                <p>Leverage existing utility classes for common patterns</p>
                <div className={styles.codeBlock}>
                  <code>{`<div className="flex items-center gap-4 p-4">...</div>`}</code>
                </div>
              </div>
            </div>
          </ColoredCard>
        </>
      )}

      {/* Copy Feedback Toast */}
      {copiedText && (
        <div className={styles.copyToast}>
          ✓ Copied to clipboard!
        </div>
      )}
    </div>
  );
}
