'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageHero from '@/components/AdminPageHero';
import { PageStyle } from '@/lib/pageStyleTypes';

export default function AdminDesignPage() {
  const router = useRouter();
  const [pageStyles, setPageStyles] = useState<PageStyle[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Global, Admin, Project, Hashtag forms
  const [styleForm, setStyleForm] = useState({
    name: 'New Style',
    backgroundGradient: '0deg, #ffffffff 0%, #ffffffff 100%',
    headerBackgroundGradient: '0deg, #f8fafc 0%, #f1f5f9 100%',
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
    titleBubble: { backgroundColor: '#6366f1', textColor: '#ffffff' }
  });

  useEffect(() => {
    loadPageStyles();
    loadGlobalStyle();
    loadAdminStyle();
    loadHashtagAssignments();
  }, []);

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
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(99, 102, 241, 0.3)',
            borderTop: '4px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Loading design settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminPageHero 
        title="Design Manager"
        subtitle="Manage page styles and visual design"
        icon="🎨"
        showSearch={false}
        badges={[
          { text: `${pageStyles.length} Styles`, variant: 'primary' }
        ]}
        backLink="/admin"
      />

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '2rem', color: '#1f2937' }}>Page Style Configuration</h2>

        {/* Global Default Style */}
        <div style={{ background: 'rgba(248, 250, 252, 0.8)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Default (Global) Style</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select value={globalStyleId} onChange={(e) => setGlobalStyleId(e.target.value)} className="form-input">
              <option value="">— Use System Default —</option>
              {pageStyles.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <button onClick={saveGlobalStyle} className="btn btn-secondary">Save Default</button>
          </div>
        </div>

        {/* Admin Page Style */}
        <div style={{ background: 'rgba(248, 250, 252, 0.8)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Admin Page Style</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select value={adminStyleId} onChange={(e) => setAdminStyleId(e.target.value)} className="form-input">
              <option value="">— Use Default/Global —</option>
              {pageStyles.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <button onClick={saveAdminStyle} className="btn btn-secondary">Save Admin Style</button>
          </div>
        </div>
        
        {/* Per-Project Style */}
        <div style={{ background: 'rgba(248, 250, 252, 0.8)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Project Style</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
            <input placeholder="Project ID or Slug" value={projectIdentifier} onChange={(e) => setProjectIdentifier(e.target.value)} className="form-input" />
            <select value={projectStyleId} onChange={(e) => setProjectStyleId(e.target.value)} className="form-input">
              <option value="">— Use Default/Global —</option>
              {pageStyles.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <button onClick={saveProjectStyle} className="btn btn-secondary">Apply to Project</button>
          </div>
        </div>

        {/* Per-Hashtag Style */}
        <div style={{ background: 'rgba(248, 250, 252, 0.8)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Hashtag Style</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
            <input placeholder="Hashtag (e.g. country:romania or romania)" value={hashtag} onChange={(e) => setHashtag(e.target.value)} className="form-input" />
            <select value={hashtagStyleId} onChange={(e) => setHashtagStyleId(e.target.value)} className="form-input">
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
        <div style={{
          background: 'rgba(248, 250, 252, 0.8)',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem'
        }}>
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

            <button
              onClick={handleCreateStyle}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                justifySelf: 'start'
              }}
            >
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
                      <button className="btn btn-secondary btn-small" onClick={() => startEdit(style)}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => deleteStyle(style._id)}>Delete</button>
                      <button className="btn btn-primary btn-small" onClick={() => setAsGlobal(style._id)} title="Set as Global Default">Set as Global</button>
                      <button className="btn btn-success btn-small" onClick={() => setAsAdmin(style._id)} title="Set as Admin Pages Style">Set as Admin</button>
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
