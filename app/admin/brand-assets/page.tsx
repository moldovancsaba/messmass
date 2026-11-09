// app/admin/brand-assets/page.tsx
// WHAT: Unified Brand Asset & Official Logo Management Console for {messmass}.
// WHY: Single source of truth for original brand logos. Provides deduplication,
//      brand merging with alias retraining, and brand-to-club reclassification.

'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ensureCsrfToken } from '@/lib/apiClient';
import { INTERACTIVE_REPORT_THEME } from '@/lib/theme/interactiveReportPalette';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());

  // Edit/Upload Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Partial<BrandAsset> | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');

  // Merge Modal
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSources, setMergeSources] = useState<string[]>([]);
  const [targetBrandName, setTargetBrandName] = useState<string>('');
  const [targetSearchQuery, setTargetSearchQuery] = useState<string>('');

  // Reclassify / Move to Club Modal
  const [clubModalOpen, setClubModalOpen] = useState(false);
  const [movingBrand, setMovingBrand] = useState<string>('');
  const [targetClubName, setTargetClubName] = useState<string>('');

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

  const allAvailableBrands = useMemo(() => {
    const list: string[] = [];
    for (const a of assets) {
      if (a.name && !list.includes(a.name)) list.push(a.name);
    }
    for (const u of unconfigured) {
      if (u.name && !list.includes(u.name)) list.push(u.name);
    }
    return list.sort((a, b) => a.localeCompare(b));
  }, [assets, unconfigured]);

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.toLowerCase().trim();
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.canonicalSlug.toLowerCase().includes(q) ||
        (a.aliases && a.aliases.some((al) => al.toLowerCase().includes(q)))
    );
  }, [assets, searchQuery]);

  const filteredUnconfigured = useMemo(() => {
    if (!searchQuery.trim()) return unconfigured;
    const q = searchQuery.toLowerCase().trim();
    return unconfigured.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.canonicalSlug.toLowerCase().includes(q) ||
        (u.aliases && u.aliases.some((al) => al.toLowerCase().includes(q)))
    );
  }, [unconfigured, searchQuery]);

  // Open Edit / Upload Modal
  const openEditModal = (brand: Partial<BrandAsset>) => {
    setEditingBrand({
      name: brand.name || '',
      canonicalSlug: brand.canonicalSlug || '',
      aliases: brand.aliases || [],
      logoUrl: brand.logoUrl || '',
      darkLogoUrl: brand.darkLogoUrl || '',
      accentColor: brand.accentColor || INTERACTIVE_REPORT_THEME.blueDark,
    });
    setUploadFile(null);
    setFilePreview(brand.logoUrl || '');
    setModalOpen(true);
  };

  // Open Merge Modal for a single brand
  const openMergeModal = (sourceName: string) => {
    setMergeSources([sourceName]);
    setTargetBrandName('');
    setTargetSearchQuery('');
    setMergeModalOpen(true);
  };

  // Open Merge Modal for batch selection
  const openBatchMergeModal = () => {
    const names: string[] = [];
    for (const slug of selectedSlugs) {
      const found = assets.find((a) => a.canonicalSlug === slug) || unconfigured.find((u) => u.canonicalSlug === slug);
      if (found) names.push(found.name);
    }
    if (names.length === 0) return;
    setMergeSources(names);
    setTargetBrandName('');
    setTargetSearchQuery('');
    setMergeModalOpen(true);
  };

  // Open Move to Club Modal
  const openMoveToClubModal = (brandName: string) => {
    setMovingBrand(brandName);
    setTargetClubName(brandName);
    setClubModalOpen(true);
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

  // Execute Merge Request
  const handleExecuteMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBrandName.trim() || mergeSources.length === 0) return;

    try {
      setSaving(true);
      const csrfToken = await ensureCsrfToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const res = await fetch('/api/brand-assets', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'merge',
          targetBrand: targetBrandName.trim(),
          sourceBrands: mergeSources,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setMergeModalOpen(false);
        setSelectedSlugs(new Set());
        setSuccessMsg(
          json.message ||
            `Successfully merged into "${targetBrandName}". All sightings and future vision detections are unified.`
        );
        setTimeout(() => setSuccessMsg(''), 6000);
        await loadData();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Failed to merge brands');
      }
    } catch (err) {
      console.error('Merge error:', err);
      alert('Error executing brand merge');
    } finally {
      setSaving(false);
    }
  };

  // Execute Move to Club Request
  const handleExecuteMoveToClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingBrand.trim()) return;

    try {
      setSaving(true);
      const csrfToken = await ensureCsrfToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const res = await fetch('/api/brand-assets', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'move-to-club',
          brandName: movingBrand.trim(),
          clubName: (targetClubName || movingBrand).trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setClubModalOpen(false);
        setSuccessMsg(
          json.message ||
            `Successfully reclassified "${movingBrand}" as a sports club. Vision model trained for future sightings.`
        );
        setTimeout(() => setSuccessMsg(''), 6000);
        await loadData();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Failed to reclassify as club');
      }
    } catch (err) {
      console.error('Reclassify error:', err);
      alert('Error reclassifying brand');
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

  const toggleSelectSlug = (slug: string) => {
    const next = new Set(selectedSlugs);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setSelectedSlugs(next);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>🏷️ Brand Logos &amp; Unified Asset Registry</h1>
          <p className={styles.subtitle}>
            Upload official brand logos, merge duplicate brand detections into canonical records, and reclassify misplaced sports clubs. Merges train the AI vision model so all recognized aliases unify automatically.
          </p>
        </div>

        <div className={styles.headerActions}>
          {/* Quick Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search brands or aliases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchBar}
            />
            <span style={{ position: 'absolute', left: '10px', top: '8px', fontSize: '13px', color: INTERACTIVE_REPORT_THEME.slateLight }}>
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '7px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: INTERACTIVE_REPORT_THEME.slateLight,
                }}
              >
                ✕
              </button>
            )}
          </div>

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
        <span>Official Brand Logos ({filteredAssets.length})</span>
        <span className={styles.sectionBadge}>Unified Live Source</span>
      </div>

      {loading ? (
        <div className={styles.subtitle}>Loading official brand registry from MongoDB Atlas...</div>
      ) : filteredAssets.length === 0 ? (
        <div className={styles.alertBanner} style={{ background: INTERACTIVE_REPORT_THEME.slateSubtleBg, borderColor: INTERACTIVE_REPORT_THEME.slateLightBorder, color: INTERACTIVE_REPORT_THEME.slateMuted }}>
          {searchQuery
            ? `No official brand logos match "${searchQuery}".`
            : 'No official brand logos uploaded yet. Click on any discovered brand below or "Register New Brand" to upload the authentic logo file!'}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredAssets.map((asset) => {
            const isChecked = selectedSlugs.has(asset.canonicalSlug);
            return (
              <div
                key={asset.canonicalSlug}
                className={styles.card}
                style={{
                  borderColor: isChecked ? INTERACTIVE_REPORT_THEME.blueAccent : undefined,
                  boxShadow: isChecked ? `0 0 0 2px ${INTERACTIVE_REPORT_THEME.blueAccent}` : undefined,
                }}
              >
                <div className={styles.cardTop}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectSlug(asset.canonicalSlug)}
                      style={{ marginTop: '4px', cursor: 'pointer', width: '16px', height: '16px' }}
                      title="Select for batch merge"
                    />
                    <div className={styles.brandMeta}>
                      <h3 className={styles.brandName}>{asset.name}</h3>
                      <span className={styles.brandSlug}>/{asset.canonicalSlug}</span>
                    </div>
                  </div>
                  <span className={`${styles.categoryTag} ${styles.categoryPartner}`}>
                    Official Asset
                  </span>
                </div>

                {/* Aliases Pill Strip */}
                {asset.aliases && asset.aliases.length > 1 && (
                  <div style={{ fontSize: '11px', color: INTERACTIVE_REPORT_THEME.slateMuted, margin: '4px 0 8px 0', lineHeight: 1.3 }}>
                    <span style={{ fontWeight: 600 }}>Trained Aliases:</span>{' '}
                    {asset.aliases.filter((al) => al.toLowerCase() !== asset.name.toLowerCase()).join(', ')}
                  </div>
                )}

                {/* Logo Preview */}
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

                {/* Action Buttons: Edit, Merge, Move to Club, Delete */}
                <div className={styles.cardActions} style={{ flexWrap: 'wrap', gap: '6px' }}>
                  <button
                    onClick={() => openEditModal(asset)}
                    className={styles.uploadActionBtn}
                    style={{ flex: 1 }}
                  >
                    ✏️ Edit Logo
                  </button>
                  <button
                    onClick={() => openMergeModal(asset.name)}
                    className={styles.actionBtnSecondary}
                    title="Merge duplicate brand into another canonical brand"
                  >
                    🔗 Merge
                  </button>
                  <button
                    onClick={() => openMoveToClubModal(asset.name)}
                    className={styles.actionBtnClub}
                    title="Move this entity to Sports Clubs & Jerseys"
                  >
                    🏟️ Move to Club
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
            );
          })}
        </div>
      )}

      {/* Section 2: Discovered Brands in Reports (Needing Official Logo or Merge) */}
      {filteredUnconfigured.length > 0 && (
        <>
          <div className={styles.sectionTitle} style={{ marginTop: '48px' }}>
            <span>Brands Discovered in Event Photos ({filteredUnconfigured.length})</span>
            <span className={styles.sectionBadge} style={{ background: INTERACTIVE_REPORT_THEME.amberBg, color: INTERACTIVE_REPORT_THEME.amberText }}>
              Pending Official Logo or Merge
            </span>
          </div>
          <p className={styles.subtitle} style={{ marginBottom: '16px' }}>
            These brands were automatically extracted by the Fanmass Vision model from the 11,312 fan selfies.
            You can <strong>Upload an Official Logo</strong>, <strong>Merge</strong> duplicates into a primary brand, or <strong>Move to Club</strong> if it is actually a sports team.
          </p>

          <div className={styles.grid}>
            {filteredUnconfigured.map((item) => {
              const isChecked = selectedSlugs.has(item.canonicalSlug);
              return (
                <div
                  key={item.canonicalSlug}
                  className={styles.card}
                  style={{
                    background: INTERACTIVE_REPORT_THEME.grayBg,
                    borderColor: isChecked ? INTERACTIVE_REPORT_THEME.blueAccent : undefined,
                    boxShadow: isChecked ? `0 0 0 2px ${INTERACTIVE_REPORT_THEME.blueAccent}` : undefined,
                  }}
                >
                  <div className={styles.cardTop}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectSlug(item.canonicalSlug)}
                        style={{ marginTop: '4px', cursor: 'pointer', width: '16px', height: '16px' }}
                        title="Select for batch merge"
                      />
                      <div className={styles.brandMeta}>
                        <h3 className={styles.brandName}>{item.name}</h3>
                        <span className={styles.brandSlug}>Discovered in selfies</span>
                      </div>
                    </div>
                    <span className={`${styles.categoryTag} ${styles.categoryApparel}`}>
                      Pending Logo
                    </span>
                  </div>

                  <div className={styles.logoPreviewArea} style={{ background: INTERACTIVE_REPORT_THEME.white }}>
                    <div className={styles.noLogoPlaceholder}>
                      <span style={{ fontSize: '20px' }}>📁</span>
                      <strong>Original Logo Needed</strong>
                      <small>Currently displayed as text wordmark</small>
                    </div>
                  </div>

                  <div className={styles.cardActions} style={{ flexWrap: 'wrap', gap: '6px' }}>
                    <button
                      onClick={() => openEditModal(item)}
                      className={styles.primaryBtn}
                      style={{ flex: '1 1 100%', justifyContent: 'center' }}
                    >
                      ⬆️ Upload Logo
                    </button>
                    <button
                      onClick={() => openMergeModal(item.name)}
                      className={styles.actionBtnSecondary}
                      style={{ flex: 1, justifyContent: 'center' }}
                      title="Merge into an existing brand"
                    >
                      🔗 Merge into...
                    </button>
                    <button
                      onClick={() => openMoveToClubModal(item.name)}
                      className={styles.actionBtnClub}
                      style={{ flex: 1, justifyContent: 'center' }}
                      title="Move this entity to Sports Clubs & Jerseys"
                    >
                      🏟️ Move to Club
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Floating Batch Merge Toolbar */}
      {selectedSlugs.size >= 1 && (
        <div className={styles.batchToolbar}>
          <span>
            <strong>{selectedSlugs.size}</strong> brand(s) selected
          </span>
          <button onClick={openBatchMergeModal} className={styles.batchBtn}>
            🔗 Merge Selected ({selectedSlugs.size}) into...
          </button>
          <button onClick={() => setSelectedSlugs(new Set())} className={styles.batchDeselectBtn}>
            ✕ Deselect All
          </button>
        </div>
      )}

      {/* 1. Upload / Edit Brand Modal */}
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
                <div onClick={() => fileInputRef.current?.click()} className={styles.fileDropArea}>
                  <span style={{ fontSize: '24px' }}>📤</span>
                  <strong>Click to select high-resolution official logo file</strong>
                  <small>Original vector SVG or transparent high-res PNG recommended</small>
                </div>
              </div>

              {/* Direct URL Fallback */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Or Paste Official Logo CDN URL</label>
                <input
                  type="url"
                  value={editingBrand.logoUrl || ''}
                  onChange={(e) => {
                    setEditingBrand({ ...editingBrand, logoUrl: e.target.value });
                    setFilePreview(e.target.value);
                  }}
                  placeholder="https://pub-....r2.dev/logos/brand.svg"
                  className={styles.input}
                />
              </div>

              {/* Logo Preview */}
              {filePreview && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Logo Preview (Original Rendering)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className={styles.previewBoxLight}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={filePreview} alt="Preview Light" className={styles.previewImg} />
                    </div>
                    <div className={styles.previewBoxDark}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={filePreview} alt="Preview Dark" className={styles.previewImg} />
                    </div>
                  </div>
                </div>
              )}

              {/* Accent Color */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Brand Accent Color (Hex, optional)</label>
                <input
                  type="text"
                  value={editingBrand.accentColor || ''}
                  onChange={(e) => setEditingBrand({ ...editingBrand, accentColor: e.target.value })}
                  placeholder="e.g. 1e3a8a"
                  className={styles.input}
                />
              </div>

              {/* Aliases */}
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
                  placeholder="e.g. szrt, szerencsejatek, szerencsejáték"
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
                  disabled={saving || !editingBrand.name}
                  className={styles.saveBtn}
                >
                  {saving ? 'Saving & Updating Reports...' : 'Save Official Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Merge Duplicate Brands Modal */}
      {mergeModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🔗 Merge Duplicate Brand Records</h2>
              <button onClick={() => setMergeModalOpen(false)} className={styles.closeModalBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteMerge} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: INTERACTIVE_REPORT_THEME.slateSubtleBg, padding: '12px 16px', borderRadius: '8px', border: `1px solid ${INTERACTIVE_REPORT_THEME.slateLightBorder}`, fontSize: '13px', lineHeight: 1.5, color: INTERACTIVE_REPORT_THEME.slateMedium }}>
                <div style={{ fontWeight: 700, color: INTERACTIVE_REPORT_THEME.slateDark, marginBottom: '4px' }}>
                  🧠 AI Retraining &amp; Data Unification
                </div>
                Merging unifies all past selfie sightings, exposure rates, and photo presence under the primary target brand. The source name(s) will be permanently saved as aliases, automatically retraining the vision pipeline to map future detections to the target.
              </div>

              {/* Source Brands Being Merged */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Source Brand(s) to be Merged ({mergeSources.length})</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: INTERACTIVE_REPORT_THEME.white, padding: '8px', borderRadius: '8px', border: `1px solid ${INTERACTIVE_REPORT_THEME.slateBorder}` }}>
                  {mergeSources.map((src) => (
                    <span
                      key={src}
                      style={{
                        background: INTERACTIVE_REPORT_THEME.redBg,
                        color: INTERACTIVE_REPORT_THEME.redText,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>

              {/* Target Brand Input / Selector */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Primary Target Brand to Keep *</label>
                <input
                  type="text"
                  required
                  placeholder="Type target brand name or select below (e.g. Szerencsejáték Zrt.)..."
                  value={targetBrandName}
                  onChange={(e) => setTargetBrandName(e.target.value)}
                  className={styles.input}
                  style={{ marginBottom: '8px', fontWeight: 600 }}
                />

                {/* Quick Selection List */}
                <div style={{ fontSize: '11px', color: INTERACTIVE_REPORT_THEME.slateMuted, fontWeight: 600, marginBottom: '4px' }}>
                  Or select an existing canonical brand:
                </div>
                <div style={{ maxHeight: '140px', overflowY: 'auto', border: `1px solid ${INTERACTIVE_REPORT_THEME.slateLightBorder}`, borderRadius: '8px', background: INTERACTIVE_REPORT_THEME.white }}>
                  {allAvailableBrands
                    .filter((b) => !mergeSources.includes(b))
                    .map((b) => (
                      <div
                        key={b}
                        onClick={() => setTargetBrandName(b)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          background: targetBrandName === b ? INTERACTIVE_REPORT_THEME.blueLight : 'transparent',
                          color: targetBrandName === b ? INTERACTIVE_REPORT_THEME.bluePrimaryStrong : INTERACTIVE_REPORT_THEME.slateText,
                          fontWeight: targetBrandName === b ? 700 : 500,
                          borderBottom: `1px solid ${INTERACTIVE_REPORT_THEME.grayBorder}`,
                        }}
                      >
                        {targetBrandName === b ? '✓ ' : ''}{b}
                      </div>
                    ))}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setMergeModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !targetBrandName.trim()}
                  className={styles.saveBtn}
                  style={{ background: INTERACTIVE_REPORT_THEME.bluePrimary }}
                >
                  {saving ? 'Merging & Retraining...' : `Confirm Merge into "${targetBrandName || 'Target'}"`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Reclassify / Move Brand to Club Modal */}
      {clubModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🏟️ Move Entity to Sports Clubs</h2>
              <button onClick={() => setClubModalOpen(false)} className={styles.closeModalBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteMoveToClub} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: INTERACTIVE_REPORT_THEME.pinkBg, padding: '12px 16px', borderRadius: '8px', border: `1px solid ${INTERACTIVE_REPORT_THEME.pinkBorder}`, fontSize: '13px', lineHeight: 1.5, color: INTERACTIVE_REPORT_THEME.pinkText }}>
                <div style={{ fontWeight: 700, color: INTERACTIVE_REPORT_THEME.pinkDark, marginBottom: '4px' }}>
                  🏟️ Entity Reclassification (Brand ➔ Sports Club)
                </div>
                If &quot;<strong>{movingBrand}</strong>&quot; is actually a sports club, team, or jersey crest (rather than a corporate sponsor), moving it here will transfer all sightings into the <strong>Club Allegiance &amp; Jersey Detection Matrix</strong> and instruct the AI vision worker to classify it as a sports club in all future photos.
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Official Sports Club Name *</label>
                <input
                  type="text"
                  required
                  value={targetClubName}
                  onChange={(e) => setTargetClubName(e.target.value)}
                  placeholder="e.g. Hydro Fehérvár AV19, Soproni KC, DVTK"
                  className={styles.input}
                  style={{ fontWeight: 600 }}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setClubModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !targetClubName.trim()}
                  className={styles.saveBtn}
                  style={{ background: INTERACTIVE_REPORT_THEME.pinkDeep }}
                >
                  {saving ? 'Reclassifying...' : `Move to Sports Clubs ➔`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
