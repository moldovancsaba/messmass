'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageHero from '@/components/AdminPageHero';
import { PageStyle } from '@/lib/pageStyleTypes';

export default function AdminDesignPage() {
  const router = useRouter();
  const [pageStyles, setPageStyles] = useState<PageStyle[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states for page style
  const [styleForm, setStyleForm] = useState({
    name: 'New Style',
    backgroundGradient: '0deg, #ffffffff 0%, #ffffffff 100%',
    headerBackgroundGradient: '0deg, #f8fafc 0%, #f1f5f9 100%',
    titleBubble: {
      backgroundColor: '#6366f1',
      textColor: '#ffffff'
    }
  });

  useEffect(() => {
    loadPageStyles();
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
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Page Background Gradient
              </label>
              <input
                type="text"
                value={styleForm.backgroundGradient}
                onChange={(e) => setStyleForm({ ...styleForm, backgroundGradient: e.target.value })}
                placeholder="0deg, #ffffffff 0%, #ffffffff 100%"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
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
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
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
                  style={{
                    width: '100%',
                    height: '3rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
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
                  style={{
                    width: '100%',
                    height: '3rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
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
                <div key={style._id} style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#1f2937' }}>{style.name}</h4>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        background: style.titleBubble.backgroundColor,
                        borderRadius: '50%',
                        border: '2px solid #e5e7eb'
                      }}></div>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Created {new Date(style.createdAt || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
