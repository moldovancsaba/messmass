'use client';

/* WHAT: Comprehensive Design System Manager - Interactive reference for design tokens, components, and patterns
 * WHY: Single source of truth for design standards; addresses deprecated elements and missing documentation
 * HOW: Tab-based UI showcasing typography, tokens, components, utilities, and coding standards
 * REPLACES: Old fragmented style configuration page with comprehensive design reference */

import React, { useState, useEffect } from 'react';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
import PageStyleEditor from '@/components/PageStyleEditor';
import styles from './Design.module.css';
import { apiPut } from '@/lib/apiClient';
import { PageStyleEnhanced } from '@/lib/pageStyleTypesEnhanced';

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
  
  /* WHAT: Page Styles state
   * WHY: Manage customizable theming system with list of styles and CRUD operations */
  const [pageStyles, setPageStyles] = useState<PageStyleEnhanced[]>([]);
  const [stylesLoading, setStylesLoading] = useState(false);
  const [stylesError, setStylesError] = useState<string>('');
  
  /* WHAT: Modal state for style editor
   * WHY: Control visibility and editing mode of PageStyleEditor */
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<PageStyleEnhanced | undefined>(undefined);
  const [editorLoading, setEditorLoading] = useState(false);

  useEffect(() => {
    loadTypographySettings();
    if (activeTab === 'page-styles') {
      loadPageStyles();
    }
  }, [activeTab]);

  // WHAT: Auto-reload when page becomes visible (e.g., returning from another tab)
  // WHY: Ensures any changes made elsewhere are synced without manual refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadTypographySettings();
        if (activeTab === 'page-styles') {
          loadPageStyles();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTab]);
  
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
  
  /* WHAT: Load page styles from API
   * WHY: Fetch all custom theme configurations for management */
  const loadPageStyles = async () => {
    setStylesLoading(true);
    setStylesError('');
    try {
      const response = await fetch('/api/page-styles-enhanced');
      const data = await response.json();
      
      if (data.success) {
        setPageStyles(data.styles || []);
      } else {
        setStylesError(data.error || 'Failed to load styles');
      }
    } catch (error) {
      console.error('Failed to load page styles:', error);
      setStylesError('Network error loading styles');
    } finally {
      setStylesLoading(false);
    }
  };
  
  /* WHAT: Open editor for creating new style
   * WHY: Allow admin to add new theme */
  const handleCreateStyle = () => {
    setEditingStyle(undefined);
    setIsEditorOpen(true);
  };
  
  /* WHAT: Open editor for editing existing style
   * WHY: Allow admin to modify theme configuration */
  const handleEditStyle = (style: PageStyleEnhanced) => {
    setEditingStyle(style);
    setIsEditorOpen(true);
  };
  
  /* WHAT: Save style (create or update)
   * WHY: Persist theme configuration to database */
  const handleSaveStyle = async (styleData: Omit<PageStyleEnhanced, '_id' | 'createdAt' | 'updatedAt' | 'projectIds'>) => {
    setEditorLoading(true);
    try {
      const url = editingStyle 
        ? `/api/page-styles-enhanced?styleId=${editingStyle._id}`
        : '/api/page-styles-enhanced';
      const method = editingStyle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(styleData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(editingStyle ? '✅ Style updated!' : '✅ Style created!');
        setIsEditorOpen(false);
        setEditingStyle(undefined);
        loadPageStyles(); // Reload list
      } else {
        alert('❌ Error: ' + (data.error || 'Failed to save style'));
      }
    } catch (error) {
      console.error('Failed to save style:', error);
      alert('❌ Network error saving style');
    } finally {
      setEditorLoading(false);
    }
  };
  
  /* WHAT: Delete style
   * WHY: Remove unused themes */
  const handleDeleteStyle = async (styleId: string, styleName: string) => {
    if (!confirm(`Are you sure you want to delete "${styleName}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/page-styles-enhanced?styleId=${styleId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Style deleted!');
        loadPageStyles();
      } else {
        alert('❌ Error: ' + (data.error || 'Failed to delete style'));
      }
    } catch (error) {
      console.error('Failed to delete style:', error);
      alert('❌ Network error deleting style');
    }
  };
  
  /* WHAT: Set style as global default
   * WHY: Apply theme to all projects without specific style */
  const handleSetGlobalDefault = async (styleId: string, styleName: string) => {
    if (!confirm(`Set "${styleName}" as the global default theme?\n\nThis will apply to all projects that don't have a specific style assigned.`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/page-styles-enhanced/set-global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Global default updated!');
        loadPageStyles(); // Refresh to show updated badges
      } else {
        alert('❌ Error: ' + (data.error || 'Failed to set global default'));
      }
    } catch (error) {
      console.error('Failed to set global default:', error);
      alert('❌ Network error setting global default');
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
    { id: 'page-styles', label: '🎨 Page Styles', color: '#ec4899' },
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
      
      {/* PAGE STYLES TAB */}
      {activeTab === 'page-styles' && (
        <>
          <ColoredCard accentColor="#ec4899" hoverable={false} className="mb-6">
            <h2 className={styles.sectionTitle}>🎨 Page Styles Configuration</h2>
            <p className={styles.sectionDesc}>
              Create and manage custom themes for different projects. Customize backgrounds, typography, and color schemes.
            </p>
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-gray-600">
                  {pageStyles.length} {pageStyles.length === 1 ? 'style' : 'styles'} configured
                </p>
              </div>
              <button className="btn btn-primary" onClick={handleCreateStyle}>
                ➕ Create New Style
              </button>
            </div>
          </ColoredCard>
          
          {/* WHAT: Edit Global Default Button - Direct access to edit the global theme
              WHY: User requested dedicated button for easier access */}
          {!stylesLoading && pageStyles.some(s => s.isGlobalDefault) && (
            <div className="mb-6">
              <ColoredCard accentColor="#3b82f6" hoverable={false}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">🌐 Global Default Style</h3>
                    <p className="text-sm text-gray-600">
                      This style is applied to all projects that don't have a specific style assigned.
                    </p>
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      const globalStyle = pageStyles.find(s => s.isGlobalDefault);
                      if (globalStyle) handleEditStyle(globalStyle);
                    }}
                  >
                    ✏️ Edit Global Default
                  </button>
                </div>
              </ColoredCard>
            </div>
          )}
          
          {/* Loading State */}
          {stylesLoading && (
            <ColoredCard accentColor="#3b82f6" hoverable={false}>
              <div className="text-center py-8">
                <p className="text-lg">Loading styles...</p>
              </div>
            </ColoredCard>
          )}
          
          {/* Error State */}
          {stylesError && (
            <ColoredCard accentColor="#ef4444" hoverable={false}>
              <div className={styles.warningBox}>
                <h3 className={styles.warningTitle}>⚠️ Error Loading Styles</h3>
                <p>{stylesError}</p>
                <button onClick={loadPageStyles} className="btn btn-secondary mt-4">
                  🔄 Retry
                </button>
              </div>
            </ColoredCard>
          )}
          
          {/* Styles List */}
          {!stylesLoading && !stylesError && pageStyles.length === 0 && (
            <ColoredCard accentColor="#6b7280" hoverable={false}>
              <div className="text-center py-12">
                <p className="text-xl mb-2">🎨</p>
                <p className="text-lg font-medium mb-2">No custom styles yet</p>
                <p className="text-sm text-gray-600 mb-4">
                  Create your first custom theme to personalize your project pages
                </p>
                <button className="btn btn-primary" onClick={handleCreateStyle}>
                  ➕ Create First Style
                </button>
              </div>
            </ColoredCard>
          )}
          
          {!stylesLoading && !stylesError && pageStyles.length > 0 && (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {pageStyles.map((style) => (
                <ColoredCard
                  key={style._id}
                  accentColor={style.colorScheme.primary}
                  hoverable
                >
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{style.name}</h3>
                      {style.isGlobalDefault && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                          🌐 Global
                        </span>
                      )}
                    </div>
                    {style.description && (
                      <p className="text-sm text-gray-600 mb-3">{style.description}</p>
                    )}
                  </div>
                  
                  {/* Color Scheme Preview */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Color Scheme:</p>
                    <div className="flex gap-2">
                      <div
                        className={styles.miniColorSwatch}
                        style={{ backgroundColor: style.colorScheme.primary }}
                        title="Primary"
                      />
                      <div
                        className={styles.miniColorSwatch}
                        style={{ backgroundColor: style.colorScheme.secondary }}
                        title="Secondary"
                      />
                      <div
                        className={styles.miniColorSwatch}
                        style={{ backgroundColor: style.colorScheme.success }}
                        title="Success"
                      />
                    </div>
                  </div>
                  
                  {/* Typography */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Typography:</p>
                    <p className="text-sm font-medium capitalize">{style.typography.fontFamily}</p>
                  </div>
                  
                  {/* Projects Count */}
                  {style.projectIds && style.projectIds.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500">
                        📊 Used by {style.projectIds.length} {style.projectIds.length === 1 ? 'project' : 'projects'}
                      </p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-small btn-secondary flex-1"
                        onClick={() => handleEditStyle(style)}
                      >
                        ✏️ Edit
                      </button>
                      {!style.isGlobalDefault && style._id && (
                        <button 
                          className="btn btn-small btn-danger"
                          onClick={() => handleDeleteStyle(style._id!, style.name)}
                          title="Delete style"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    {!style.isGlobalDefault && style._id && (
                      <button 
                        className="btn btn-small btn-info"
                        onClick={() => handleSetGlobalDefault(style._id!, style.name)}
                      >
                        🌐 Set as Global Default
                      </button>
                    )}
                  </div>
                </ColoredCard>
              ))}
            </div>
          )}
        </>
      )}

      {/* Copy Feedback Toast */}
      {copiedText && (
        <div className={styles.copyToast}>
          ✓ Copied to clipboard!
        </div>
      )}
      
      {/* Page Style Editor Modal */}
      {isEditorOpen && (
        <PageStyleEditor
          style={editingStyle}
          onSave={handleSaveStyle}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingStyle(undefined);
          }}
          isLoading={editorLoading}
        />
      )}
    </div>
  );
}
