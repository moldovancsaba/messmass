'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminHero from '@/components/AdminHero';
import { PageStyle } from '@/lib/pageStyleTypes';

export default function AdminDesignPage() {
  const router = useRouter();
  const [pageStyles, setPageStyles] = useState<PageStyle[]>([]);
  const [loading, setLoading] = useState(true);
  
  /* What: Font selection state for Typography section
     Why: Allow admin to switch between Inter, Roboto, and Poppins */
  const [selectedFont, setSelectedFont] = useState<'inter' | 'roboto' | 'poppins'>('inter');
  const [fontLoading, setFontLoading] = useState(false);
  
  // Global, Admin, Project, Hashtag forms
  const [styleForm, setStyleForm] = useState({
    name: 'New Style',
    backgroundGradient: '0deg, #ffffffff 0%, #ffffffff 100%',
    headerBackgroundGradient: '0deg, #f8fafc 0%, #f1f5f9 100%',
    contentBackgroundColor: 'rgba(255,255,255,0.95)',
    titleBubble: {
      backgroundColor: '#6366f1',
      textColor: '#ffffff'
    }
  });
  const [globalStyleId, setGlobalStyleId] = useState<string>('');
  const [adminStyleId, setAdminStyleId] = useState<string>('');
  const [projectIdentifier, setProjectIdentifier] = useState<string>(''); // id or slug
  const [projectStyleId, setProjectStyleId] = useState<string>('');
  const [hashtag, setHashtag] = useState<string>('');
  const [hashtagStyleId, setHashtagStyleId] = useState<string>('');
  const [hashtagAssignments, setHashtagAssignments] = useState<{ _id: string; styleId: string; updatedAt: string }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    backgroundGradient: '',
    headerBackgroundGradient: '',
    contentBackgroundColor: 'rgba(255,255,255,0.95)',
    titleBubble: { backgroundColor: '#6366f1', textColor: '#ffffff' }
  });

  useEffect(() => {
    loadPageStyles();
    loadGlobalStyle();
    loadAdminStyle();
    loadHashtagAssignments();
    loadTypographySettings();
  }, []);
  
  /* What: Load current typography settings from database
     Why: Display currently selected font on page load */
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
  
  /* What: Save font selection to database and set cookie
     Why: Persist font choice across sessions and apply immediately */
  const saveFont = async (font: 'inter' | 'roboto' | 'poppins') => {
    setFontLoading(true);
    try {
      const response = await fetch('/api/admin/ui-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fontFamily: font }),
      });
      
      const data = await response.json();
      if (data.success) {
        setSelectedFont(font);
        
        /* What: Apply font immediately without reload by updating HTML data attribute
           Why: Better UX - instant visual feedback */
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

  const loadPageStyles = async () => {
    try {
      const response = await fetch('/api/page-styles');
      const data = await response.json();
      if (data.success) {
        setPageStyles(data.styles);
      }
    } catch (error) {
      console.error('Failed to load page styles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalStyle = async () => {
    try {
      const res = await fetch('/api/admin/global-style');
      const data = await res.json();
      if (data.success && data.globalStyle) setGlobalStyleId(data.globalStyle._id);
    } catch (e) {
      console.error('Failed to load global style', e);
    }
  };

  const loadAdminStyle = async () => {
    try {
      const res = await fetch('/api/admin/admin-style');
      const data = await res.json();
      if (data.success && data.adminStyle) setAdminStyleId(data.adminStyle._id);
    } catch (e) {
      console.error('Failed to load admin style', e);
    }
  };

  const loadHashtagAssignments = async () => {
    try {
      const res = await fetch('/api/admin/hashtag-style');
      const data = await res.json();
      if (data.success && data.assignments) setHashtagAssignments(data.assignments);
    } catch (e) {
      console.error('Failed to load hashtag style assignments', e);
    }
  };
  
  const handleCreateStyle = async () => {
    try {
      const response = await fetch('/api/page-styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(styleForm)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadPageStyles();
        // Reset form
        setStyleForm({
          name: 'New Style',
          backgroundGradient: '0deg, #ffffffff 0%, #ffffffff 100%',
          headerBackgroundGradient: '0deg, #f8fafc 0%, #f1f5f9 100%',
          contentBackgroundColor: 'rgba(255,255,255,0.95)',
          titleBubble: {
            backgroundColor: '#6366f1',
            textColor: '#ffffff'
          }
        });
      } else {
        alert('Failed to create style: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create style:', error);
      alert('Failed to create style');
    }
  };

  const startEdit = (style: PageStyle) => {
    setEditingId(style._id || null);
    setEditForm({
      name: style.name,
      backgroundGradient: style.backgroundGradient,
      headerBackgroundGradient: style.headerBackgroundGradient,
      contentBackgroundColor: (style as any).contentBackgroundColor || 'rgba(255,255,255,0.95)',
      titleBubble: { ...style.titleBubble }
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch('/api/page-styles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: editingId, ...editForm })
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        await loadPageStyles();
      } else {
        alert('Failed to update style: ' + (data.error || ''));
      }
    } catch (e) {
      console.error('Failed to update style', e);
      alert('Failed to update style');
    }
  };

  const deleteStyle = async (id?: string) => {
    if (!id) return;
    if (!confirm('Delete this style?')) return;
    try {
      const res = await fetch(`/api/page-styles?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadPageStyles();
      } else {
        alert('Failed to delete style: ' + (data.error || ''));
      }
    } catch (e) {
      console.error('Failed to delete style', e);
      alert('Failed to delete style');
    }
  };

  // Quick actions: set a style as Global or Admin
  const setAsGlobal = async (id?: string) => {
    if (!id) return;
    try {
      const res = await fetch('/api/admin/global-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleId: id })
      });
      const data = await res.json();
      if (!data.success) return alert('Failed to set global style');
      setGlobalStyleId(id);
    } catch (e) {
      console.error('Failed to set global style', e);
      alert('Failed to set global style');
    }
  };

  const setAsAdmin = async (id?: string) => {
    if (!id) return;
    try {
      const res = await fetch('/api/admin/admin-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleId: id })
      });
      const data = await res.json();
      if (!data.success) return alert('Failed to set admin style');
      setAdminStyleId(id);
    } catch (e) {
      console.error('Failed to set admin style', e);
      alert('Failed to set admin style');
    }
  };

  const saveGlobalStyle = async () => {
    const res = await fetch('/api/admin/global-style', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ styleId: globalStyleId || 'null' })
    });
    const data = await res.json();
    if (!data.success) alert('Failed to save global style');
  };

  const saveAdminStyle = async () => {
    const res = await fetch('/api/admin/admin-style', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ styleId: adminStyleId || 'null' })
    });
    const data = await res.json();
    if (!data.success) alert('Failed to save admin style');
  };

  const saveProjectStyle = async () => {
    if (!projectIdentifier) return alert('Provide a project ID or slug');
    const res = await fetch('/api/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: projectIdentifier, styleId: projectStyleId || 'null' })
    });
    const data = await res.json();
    if (!data.success) alert('Failed to save project style: ' + (data.error || ''));
  };

  const saveHashtagStyle = async () => {
    if (!hashtag) return alert('Provide a hashtag');
    const res = await fetch('/api/admin/hashtag-style', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashtag, styleId: hashtagStyleId || 'null' })
    });
    const data = await res.json();
    if (data.success) loadHashtagAssignments();
    else alert('Failed to save hashtag style');
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="glass-card">
          <div className="loading-spinner">
            <div className="spinner" />
            <div>Loading design settings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* WHAT: Use UnifiedAdminHero to avoid nested admin-container wrappers.
          WHY: Standardize header across admin pages and prevent duplicate backgrounds. */}
      <AdminHero 
        title="Design Manager"
        subtitle="Manage page styles and visual design"
        badges={[
          { text: `${pageStyles.length} Styles`, variant: 'primary' }
        ]}
        backLink="/admin"
      />

      {/* Page content */}
      <div className="content-surface">
            {/* What: Typography/Font Selection Section
                Why: Allow admin to choose and preview Google Fonts system-wide */}
            <div className="section-card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderLeft: '4px solid var(--mm-color-primary-600)' }}>
              <h2 style={{ marginBottom: '1rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔤</span>
                Typography & Fonts
              </h2>
              <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
                Select a Google Font for the entire application. Changes apply immediately and persist across sessions.
              </p>
              
              {/* Font Selection Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {(['inter', 'roboto', 'poppins'] as const).map((font) => (
                  <button
                    key={font}
                    onClick={() => saveFont(font)}
                    disabled={fontLoading}
                    className="btn"
                    style={{
                      background: selectedFont === font ? 'var(--mm-color-primary-600)' : 'var(--mm-white)',
                      color: selectedFont === font ? 'var(--mm-white)' : 'var(--mm-gray-700)',
                      border: selectedFont === font ? 'none' : '2px solid var(--mm-border-color-default)',
                      fontFamily: `var(--font-${font})`,
                      minWidth: '120px',
                      fontWeight: selectedFont === font ? 600 : 500,
                      opacity: fontLoading ? 0.6 : 1,
                      cursor: fontLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {font.charAt(0).toUpperCase() + font.slice(1)}
                    {selectedFont === font && ' ✓'}
                  </button>
                ))}
              </div>
              
              {/* Font Preview */}
              <div style={{ 
                background: 'var(--mm-white)', 
                borderRadius: 'var(--mm-radius-lg)', 
                padding: '1.5rem',
                border: '1px solid var(--mm-border-color-default)',
                fontFamily: `var(--font-${selectedFont})`,
              }}>
                <h3 style={{ fontSize: 'var(--mm-font-size-3xl)', fontWeight: 'var(--mm-font-weight-bold)', marginBottom: '0.5rem', color: 'var(--mm-gray-900)' }}>
                  The Quick Brown Fox
                </h3>
                <h4 style={{ fontSize: 'var(--mm-font-size-2xl)', fontWeight: 'var(--mm-font-weight-semibold)', marginBottom: '0.5rem', color: 'var(--mm-gray-800)' }}>
                  Section Heading (24px)
                </h4>
                <p style={{ fontSize: 'var(--mm-font-size-base)', lineHeight: 'var(--mm-line-height-md)', marginBottom: '0.5rem', color: 'var(--mm-gray-600)' }}>
                  This is body text at 16px. It demonstrates how paragraphs will appear throughout the application with normal line height and readable spacing.
                </p>
                <p style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-500)' }}>
                  Small caption text (14px) - used for labels and secondary information.
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--mm-font-size-xs)', color: 'var(--mm-gray-400)', fontWeight: 'var(--mm-font-weight-medium)' }}>UPPERCASE LABEL (12PX)</span>
                  <span style={{ fontSize: 'var(--mm-font-size-4xl)', fontWeight: 'var(--mm-font-weight-bold)', color: 'var(--mm-color-primary-600)' }}>42</span>
                  <span style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-500)' }}>← Large number display</span>
                </div>
              </div>
            </div>
            
            <h2 style={{ marginBottom: '2rem', color: '#1f2937' }}>Page Style Configuration</h2>

            {/* Global Default Style */}
            <div className="section-card">
              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Default (Global) Style</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <select value={globalStyleId} onChange={(e) => setGlobalStyleId(e.target.value)} className="form-select">
                  <option value="">— Use System Default —</option>
                  {pageStyles.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                <button onClick={saveGlobalStyle} className="btn btn-secondary">Save Default</button>
              </div>
            </div>

            {/* Admin Page Style */}
            <div className="section-card">
              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Admin Page Style</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <select value={adminStyleId} onChange={(e) => setAdminStyleId(e.target.value)} className="form-select">
                  <option value="">— Use Default/Global —</option>
                  {pageStyles.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                <button onClick={saveAdminStyle} className="btn btn-secondary">Save Admin Style</button>
              </div>
            </div>

            {/* Content Surface Color */}
            <div className="section-card">
              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Main Content Surface Color</h3>
              <p style={{ marginBottom: '0.75rem', color: '#6b7280' }}>
                This controls the background color of the main content block on all pages (admin and public), matching the Admin main block width. It’s applied via the --content-bg CSS variable.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: '#374151', fontWeight: 600 }}>Content Background</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. rgba(255,255,255,0.95) or #ffffff"
                  value={(styleForm as any)?.contentBackgroundColor || ''}
                  onChange={(e) => setStyleForm({ ...(styleForm as any), contentBackgroundColor: e.target.value })}
                />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', background: (styleForm as any)?.contentBackgroundColor || 'rgba(255,255,255,0.95)' }} />
                </span>
              </div>
            </div>
            
            {/* Per-Project Style */}
            <div className="section-card">
              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Project Style</h3>
              <div className="flex-row gap-4">
                <input placeholder="Project ID or Slug" value={projectIdentifier} onChange={(e) => setProjectIdentifier(e.target.value)} className="form-input" />
                <select value={projectStyleId} onChange={(e) => setProjectStyleId(e.target.value)} className="form-select">
                  <option value="">— Use Default/Global —</option>
                  {pageStyles.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                <button onClick={saveProjectStyle} className="btn btn-secondary">Apply to Project</button>
              </div>
            </div>

            {/* Per-Hashtag Style */}
            <div className="section-card">
              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Hashtag Style</h3>
              <div className="flex-row gap-4">
                <input placeholder="Hashtag (e.g. country:romania or romania)" value={hashtag} onChange={(e) => setHashtag(e.target.value)} className="form-input" />
                <select value={hashtagStyleId} onChange={(e) => setHashtagStyleId(e.target.value)} className="form-select">
                  <option value="">— Use Default/Global —</option>
                  {pageStyles.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                <button onClick={saveHashtagStyle} className="btn btn-secondary">Apply to Hashtag</button>
              </div>

              {/* List existing hashtag assignments */}
              <div style={{ marginTop: '1rem' }}>
                {hashtagAssignments.length === 0 ? (
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No hashtag-specific styles set.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {hashtagAssignments.map((a) => (
                      <div key={a._id} style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>#{a._id}</strong> → {pageStyles.find(s => s._id === a.styleId)?.name || a.styleId}</span>
                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{new Date(a.updatedAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Create New Style Form */}
            <div className="section-card">
              <h3 style={{ marginBottom: '1.5rem', color: '#374151' }}>Create New Style</h3>
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Style Name
                  </label>
                  <input
                    type="text"
                    value={styleForm.name}
                    onChange={(e) => setStyleForm({ ...styleForm, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Page Background Gradient (angle, stops)
                  </label>
                  <input
                    type="text"
                    value={styleForm.backgroundGradient}
                    onChange={(e) => setStyleForm({ ...styleForm, backgroundGradient: e.target.value })}
                    placeholder="0deg, #ffffffff 0%, #ffffffff 100%"
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Header Background Gradient
                  </label>
                  <input
                    type="text"
                    value={styleForm.headerBackgroundGradient}
                    onChange={(e) => setStyleForm({ ...styleForm, headerBackgroundGradient: e.target.value })}
                    placeholder="0deg, #f8fafc 0%, #f1f5f9 100%"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Title Bubble Background
                    </label>
                    <input
                      type="color"
                      value={styleForm.titleBubble.backgroundColor}
                      onChange={(e) => setStyleForm({
                        ...styleForm,
                        titleBubble: { ...styleForm.titleBubble, backgroundColor: e.target.value }
                      })}
                      className="form-color-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Title Text Color
                    </label>
                    <input
                      type="color"
                      value={styleForm.titleBubble.textColor}
                      onChange={(e) => setStyleForm({
                        ...styleForm,
                        titleBubble: { ...styleForm.titleBubble, textColor: e.target.value }
                      })}
                      className="form-color-input"
                    />
                  </div>
                </div>

                <button className="btn btn-success" onClick={handleCreateStyle}>
                  Create Style
                </button>
              </div>
            </div>

            {/* Existing Styles */}
            <div>
              <h3 style={{ marginBottom: '1.5rem', color: '#374151' }}>Existing Styles ({pageStyles.length})</h3>
              {pageStyles.length === 0 ? (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No styles created yet</p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {pageStyles.map((style) => (
                    <div key={style._id} className="style-item">
                      <div className="style-item-header">
                        <h4 style={{ margin: 0, color: '#1f2937' }}>{style.name}</h4>
                        <div className="flex-row">
                          <div style={{
                            width: '30px',
                            height: '30px',
                            background: style.titleBubble.backgroundColor,
                            borderRadius: '50%',
                            border: '2px solid #e5e7eb'
                          }}></div>
                          <button className="btn btn-sm btn-secondary" onClick={() => startEdit(style)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteStyle(style._id)}>Delete</button>
                          <button className="btn btn-sm btn-primary" onClick={() => setAsGlobal(style._id)} title="Set as Global Default">Set as Global</button>
                          <button className="btn btn-sm btn-success" onClick={() => setAsAdmin(style._id)} title="Set as Admin Pages Style">Set as Admin</button>
                        </div>
                      </div>

                      {editingId === style._id && (
                        <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
                          <input className="form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                          <input className="form-input" value={editForm.backgroundGradient} onChange={(e) => setEditForm({ ...editForm, backgroundGradient: e.target.value })} />
                          <input className="form-input" value={editForm.headerBackgroundGradient} onChange={(e) => setEditForm({ ...editForm, headerBackgroundGradient: e.target.value })} />
                          <div className="grid-3">
                            <div>
                              <label className="form-label">Title Bubble Background</label>
                              <input type="color" className="form-color-input" value={editForm.titleBubble.backgroundColor}
                                onChange={(e) => setEditForm({ ...editForm, titleBubble: { ...editForm.titleBubble, backgroundColor: e.target.value } })} />
                            </div>
                            <div>
                              <label className="form-label">Title Text Color</label>
                              <input type="color" className="form-color-input" value={editForm.titleBubble.textColor}
                                onChange={(e) => setEditForm({ ...editForm, titleBubble: { ...editForm.titleBubble, textColor: e.target.value } })} />
                            </div>
                            <div>
                              <label className="form-label">Content Background (Color)</label>
                              <input className="form-input" value={(editForm as any).contentBackgroundColor}
                                onChange={(e) => setEditForm({ ...(editForm as any), contentBackgroundColor: e.target.value })} />
                            </div>
                          </div>
                          <div className="flex-row">
                            <button className="btn btn-success" onClick={saveEdit}>Save</button>
                            <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
    </div>
  );
}
