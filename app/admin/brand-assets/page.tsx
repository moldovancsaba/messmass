// app/admin/brand-assets/page.tsx
// WHAT: Unified Brand Asset & Official Logo Management Console for {messmass}.
// WHY: Single source of truth for original brand logos. When updated here, all
//      interactive partner reports automatically reflect the official asset.

'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState, useEffect, useRef } from 'react';
import { ensureCsrfToken } from '@/lib/apiClient';
import styles from './page.module.css';

interface BrandAsset {
  _id?: string;
  name: string;
  canonicalSlug: string;
  aliases: string[];
  logoUrl: string;
  darkLogoUrl?: string;
  category?: string;
  accentColor?: string;
  updatedAt?: string;
  isDiscovered?: boolean;
}

export default function BrandAssetsAdminPage() {
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [unconfigured, setUnconfigured] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Partial<BrandAsset> | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/brand-assets');
      if (res.ok) {
        const json = await res.json();
        setAssets(json.assets || []);
        setUnconfigured(json.unconfigured || []);
      }
    } catch (err) {
      console.error('Failed to load brand assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditModal = (brand: Partial<BrandAsset>) => {
    setEditingBrand({
      name: brand.name || '',
      canonicalSlug: brand.canonicalSlug || '',
      aliases: brand.aliases || [],
      logoUrl: brand.logoUrl || '',
      darkLogoUrl: brand.darkLogoUrl || '',
      accentColor: brand.accentColor || '#1e3a8a',
    });
    setUploadFile(null);
    setFilePreview(brand.logoUrl || '');
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand?.name) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', editingBrand.name);
      formData.append('accentColor', editingBrand.accentColor || '');
      formData.append('aliases', (editingBrand.aliases || []).join(','));

      if (uploadFile) {
        formData.append('file', uploadFile);
      } else if (editingBrand.logoUrl) {
        formData.append('logoUrl', editingBrand.logoUrl);
      }

      if (editingBrand.darkLogoUrl) {
        formData.append('darkLogoUrl', editingBrand.darkLogoUrl);
      }

      const csrfToken = await ensureCsrfToken();
      const headers: Record<string, string> = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const res = await fetch('/api/brand-assets', {
        method: 'POST',
        body: formData,
        headers,
      });

      if (res.ok) {
        setModalOpen(false);
        setSuccessMsg(`Official logo for "${editingBrand.name}" saved! All reports updated automatically.`);
        setTimeout(() => setSuccessMsg(''), 5000);
        await loadData();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Failed to save brand asset');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving brand asset');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to remove this brand asset?')) return;
    try {
      const csrfToken = await ensureCsrfToken();
      const headers: Record<string, string> = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const res = await fetch(`/api/brand-assets/${slug}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>🏷️ Brand Logos & Unified Asset Registry</h1>
          <p className={styles.subtitle}>
            Upload and manage authentic, official brand logos. When an official logo is saved or replaced here,
            every interactive partner report and computer vision stream references this single source of truth automatically.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button onClick={loadData} className={styles.refreshBtn}>
            🔄 Refresh
          </button>
          <button
            onClick={() => openEditModal({ name: '' })}
            className={styles.primaryBtn}
          >
            ➕ Register New Brand
          </button>
        </div>
      </div>

      {successMsg && <div className={styles.alertBanner}>✅ {successMsg}</div>}

      {/* Section 1: Configured Official Brand Logos */}
      <div className={styles.sectionTitle}>
        <span>Official Brand Logos ({assets.length})</span>
        <span className={styles.sectionBadge}>Unified Live Source</span>
      </div>

      {loading ? (
        <div className={styles.subtitle}>Loading official brand registry from MongoDB Atlas...</div>
      ) : assets.length === 0 ? (
        <div className={styles.alertBanner} style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}>
          No official brand logos uploaded yet. Click on any discovered brand below or &quot;Register New Brand&quot; to upload the authentic logo file!
        </div>
      ) : (
        <div className={styles.grid}>
          {assets.map((asset) => (
            <div key={asset.canonicalSlug} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.brandMeta}>
                  <h3 className={styles.brandName}>{asset.name}</h3>
                  <span className={styles.brandSlug}>/{asset.canonicalSlug}</span>
                </div>
                <span className={`${styles.categoryTag} ${styles.categoryPartner}`}>
                  Official Asset
                </span>
              </div>

              {/* Logo Preview (Crisp Contain) */}
              <div className={styles.logoPreviewArea}>
                {asset.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={asset.logoUrl}
                    alt={asset.name}
                    className={styles.logoImg}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.noLogoPlaceholder}>
                    <span>📷 No logo file</span>
                    <small>Using typographic fallback</small>
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                <button
                  onClick={() => openEditModal(asset)}
                  className={styles.uploadActionBtn}
                >
                  ✏️ Replace / Edit Logo
                </button>
                <button
                  onClick={() => handleDelete(asset.canonicalSlug)}
                  className={styles.deleteBtn}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section 2: Discovered Brands in Reports (Needing Official Logo) */}
      {unconfigured.length > 0 && (
        <>
          <div className={styles.sectionTitle} style={{ marginTop: '48px' }}>
            <span>Brands Discovered in Event Photos ({unconfigured.length})</span>
            <span className={styles.sectionBadge} style={{ background: '#fef3c7', color: '#92400e' }}>
              Pending Official Logo Upload
            </span>
          </div>
          <p className={styles.subtitle} style={{ marginBottom: '16px' }}>
            These brands were automatically identified by the Fanmass Vision model across the 11,312 fan selfies.
            Upload their official high-res logo file to promote them into the unified asset registry.
          </p>

          <div className={styles.grid}>
            {unconfigured.map((item) => (
              <div key={item.canonicalSlug} className={styles.card} style={{ background: '#fafafa' }}>
                <div className={styles.cardTop}>
                  <div className={styles.brandMeta}>
                    <h3 className={styles.brandName}>{item.name}</h3>
                    <span className={styles.brandSlug}>Discovered in reports</span>
                  </div>
                  <span className={`${styles.categoryTag} ${styles.categoryApparel}`}>
                    Pending Logo
                  </span>
                </div>

                <div className={styles.logoPreviewArea} style={{ background: '#ffffff' }}>
                  <div className={styles.noLogoPlaceholder}>
                    <span style={{ fontSize: '20px' }}>📁</span>
                    <strong>Original Logo Needed</strong>
                    <small>Currently displayed as text wordmark</small>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    onClick={() => openEditModal(item)}
                    className={styles.primaryBtn}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    ⬆️ Upload Official Logo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Upload / Edit Modal */}
      {modalOpen && editingBrand && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingBrand.canonicalSlug ? `Configure Logo: ${editingBrand.name}` : 'Register New Brand Asset'}
              </h2>
              <button onClick={() => setModalOpen(false)} className={styles.closeModalBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Brand Name *</label>
                <input
                  type="text"
                  required
                  value={editingBrand.name || ''}
                  onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  placeholder="e.g. Tippmix, Szerencsejáték Zrt, Nike, Puma"
                  className={styles.input}
                />
              </div>

              {/* Upload Official Logo File */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Upload Official Logo File (PNG, SVG, WEBP)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/svg+xml,image/webp,image/jpeg"
                  style={{ display: 'none' }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.fileDropArea}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>📤</div>
                  <strong>Click to select high-resolution official logo file</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                    Original vector SVG or transparent high-res PNG recommended
                  </p>
                </div>
              </div>

              {/* Or Direct Logo URL */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Or Paste Official Logo URL</label>
                <input
                  type="url"
                  value={editingBrand.logoUrl || ''}
                  onChange={(e) => {
                    setEditingBrand({ ...editingBrand, logoUrl: e.target.value });
                    if (!uploadFile) setFilePreview(e.target.value);
                  }}
                  placeholder="https://.../official-logo.png"
                  className={styles.input}
                />
              </div>

              {/* Live Preview */}
              {filePreview && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Logo Preview (Original Rendering)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className={styles.logoPreviewArea}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={filePreview} alt="Preview Light" className={styles.logoImg} />
                    </div>
                    <div className={`${styles.logoPreviewArea} ${styles.logoPreviewDark}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={filePreview} alt="Preview Dark" className={styles.logoImg} />
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>Brand Accent Color (Hex, optional)</label>
                <input
                  type="text"
                  value={editingBrand.accentColor || ''}
                  onChange={(e) => setEditingBrand({ ...editingBrand, accentColor: e.target.value })}
                  placeholder="#88ca45 or #1e3a8a"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Aliases (comma-separated, for automatic vision matching)</label>
                <input
                  type="text"
                  value={(editingBrand.aliases || []).join(', ')}
                  onChange={(e) =>
                    setEditingBrand({
                      ...editingBrand,
                      aliases: e.target.value.split(',').map((s) => s.trim().toLowerCase()),
                    })
                  }
                  placeholder="e.g. tippmix, tippmixpro"
                  className={styles.input}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.saveBtn}
                >
                  {saving ? 'Saving & Updating Reports...' : 'Save & Publish to Reports'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
