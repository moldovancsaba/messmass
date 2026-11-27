// app/admin/club-logos/page.tsx
// WHAT: Centralized Club, National Team & Federation Logo Management Console (`/admin/club-logos`).
// WHY: Single source of truth in Entities (before Brand Logos) automatically synced across Events,
//      Partners, Organizations, Project Partners, AI Reports, Classic Reports, and Camera.

'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ensureCsrfToken } from '@/lib/apiClient';
import styles from './page.module.css';

interface ClubAssetItem {
  _id?: string;
  name: string;
  canonicalSlug: string;
  aliases: string[];
  logoUrl: string;
  darkLogoUrl?: string;
  isVectorSvg?: boolean;
  entityKind: 'club' | 'national_team' | 'federation';
  sport?: string | null;
  country?: string | null;
  emoji?: string;
  partnerId?: string | null;
  organizationId?: string | null;
  sightings?: number;
  isDiscovered?: boolean;
}

export default function ClubLogosAdminPage() {
  const [assets, setAssets] = useState<ClubAssetItem[]>([]);
  const [unconfigured, setUnconfigured] = useState<ClubAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | 'club' | 'national_team' | 'federation'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'svg' | 'raster' | 'missing'>('all');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit / Upload Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Partial<ClubAssetItem> | null>(null);
  const [aliasesInput, setAliasesInput] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Merge Modal
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSources, setMergeSources] = useState<string[]>([]);
  const [targetClubName, setTargetClubName] = useState('');

  // Move to Brand Modal
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [movingClubName, setMovingClubName] = useState('');
  const [targetBrandName, setTargetBrandName] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/club-logos', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setAssets(json.assets || []);
        setUnconfigured(json.unconfigured || []);
      }
    } catch (err) {
      console.error('Failed to load club logos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allItems = useMemo(() => [...assets, ...unconfigured], [assets, unconfigured]);

  const availableSports = useMemo(() => {
    const s = new Set<string>();
    for (const item of allItems) {
      if (item.sport) s.add(item.sport);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [allItems]);

  const matchesFilters = (item: ClubAssetItem) => {
    if (kindFilter !== 'all' && item.entityKind !== kindFilter) return false;
    if (sportFilter !== 'all' && (item.sport || '').toLowerCase() !== sportFilter.toLowerCase()) return false;
    if (formatFilter === 'svg' && !item.isVectorSvg) return false;
    if (formatFilter === 'raster' && (!item.logoUrl || item.isVectorSvg)) return false;
    if (formatFilter === 'missing' && item.logoUrl) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.canonicalSlug.toLowerCase().includes(q) ||
      (item.country || '').toLowerCase().includes(q) ||
      (item.aliases || []).some((a) => a.toLowerCase().includes(q))
    );
  };

  const filteredConfigured = useMemo(
    () => assets.filter(matchesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assets, searchQuery, kindFilter, formatFilter, sportFilter]
  );

  const filteredUnconfigured = useMemo(
    () => unconfigured.filter(matchesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unconfigured, searchQuery, kindFilter, formatFilter, sportFilter]
  );

  const candidateMergeTargets = useMemo(() => {
    const q = targetClubName.trim().toLowerCase();
    const names = allItems
      .map((x) => x.name)
      .filter((n) => n && !mergeSources.includes(n));
    if (!q) return names.slice(0, 40);
    return names.filter((n) => n.toLowerCase().includes(q)).slice(0, 40);
  }, [allItems, mergeSources, targetClubName]);

  const toggleSelectSlug = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const openEditModal = (club: Partial<ClubAssetItem>) => {
    setEditingClub({
      name: club.name || '',
      canonicalSlug: club.canonicalSlug || '',
      logoUrl: club.logoUrl || '',
      entityKind: club.entityKind || 'club',
      sport: club.sport || '',
      country: club.country || '',
      emoji: club.emoji || '🏟️',
      partnerId: club.partnerId || null,
      organizationId: club.organizationId || null,
    });
    setAliasesInput((club.aliases || []).filter((a) => a.toLowerCase() !== (club.name || '').toLowerCase()).join(', '));
    setUploadFile(null);
    setFilePreview(club.logoUrl || '');
    setModalOpen(true);
  };

  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub?.name?.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      const csrf = await ensureCsrfToken();
      const form = new FormData();
      form.append('name', editingClub.name.trim());
      if (editingClub.canonicalSlug) form.append('canonicalSlug', editingClub.canonicalSlug);
      if (editingClub.logoUrl) form.append('logoUrl', editingClub.logoUrl.trim());
      form.append('entityKind', editingClub.entityKind || 'club');
      if (editingClub.sport) form.append('sport', editingClub.sport);
      if (editingClub.country) form.append('country', editingClub.country);
      if (editingClub.emoji) form.append('emoji', editingClub.emoji);
      if (editingClub.partnerId) form.append('partnerId', editingClub.partnerId);
      if (editingClub.organizationId) form.append('organizationId', editingClub.organizationId);
      if (aliasesInput.trim()) form.append('aliases', aliasesInput.trim());
      if (uploadFile) form.append('file', uploadFile);

      const res = await fetch('/api/club-logos', {
        method: 'POST',
        headers: csrf ? { 'x-csrf-token': csrf } : undefined,
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save club logo');
      }
      setModalOpen(false);
      setFeedback({
        type: 'success',
        text: `Saved "${editingClub.name}" and synced across ${json.syncedPartners || 0} Partner(s) & ${json.syncedOrganizations || 0} Organization(s).`,
      });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const openMergeModal = (names: string[]) => {
    setMergeSources(names);
    setTargetClubName('');
    setMergeModalOpen(true);
  };

  const handleExecuteMerge = async () => {
    if (!targetClubName.trim() || mergeSources.length === 0) return;
    setSaving(true);
    setFeedback(null);
    try {
      const csrf = await ensureCsrfToken();
      const res = await fetch('/api/club-logos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
        },
        body: JSON.stringify({
          action: 'merge',
          sourceClubs: mergeSources,
          targetClub: targetClubName.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Merge failed');
      }
      setMergeModalOpen(false);
      setSelectedSlugs(new Set());
      setFeedback({ type: 'success', text: `Merged ${mergeSources.length} club entry/entries into "${targetClubName.trim()}".` });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Merge failed' });
    } finally {
      setSaving(false);
    }
  };

  const openMoveToBrandModal = (clubName: string) => {
    setMovingClubName(clubName);
    setTargetBrandName(clubName);
    setBrandModalOpen(true);
  };

  const handleMoveToBrand = async () => {
    if (!movingClubName) return;
    setSaving(true);
    setFeedback(null);
    try {
      const csrf = await ensureCsrfToken();
      const res = await fetch('/api/club-logos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
        },
        body: JSON.stringify({
          action: 'move_to_brand',
          clubName: movingClubName,
          targetBrandName: targetBrandName.trim() || movingClubName,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Move to Brand failed');
      }
      setBrandModalOpen(false);
      setFeedback({ type: 'success', text: `Moved "${movingClubName}" into Brand Logos as "${json.movedToBrand}".` });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Move to Brand failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string, name: string) => {
    if (!confirm(`Remove "${name}" from Club Logos? (A backup snapshot will be saved automatically.)`)) return;
    try {
      const csrf = await ensureCsrfToken();
      const res = await fetch(`/api/club-logos/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: csrf ? { 'x-csrf-token': csrf } : undefined,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Delete failed');
      }
      setFeedback({ type: 'success', text: `Removed "${name}" from Club Logos.` });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Delete failed' });
    }
  };

  const kindLabel = (k: ClubAssetItem['entityKind']) => {
    if (k === 'national_team') return '🏳️ National Team';
    if (k === 'federation') return '🏆 Federation / League';
    return '🏟️ Sports Club';
  };

  const renderCard = (item: ClubAssetItem) => {
    const isChecked = selectedSlugs.has(item.canonicalSlug);
    const nonTrivialAliases = (item.aliases || []).filter((a) => a.toLowerCase() !== item.name.toLowerCase());
    return (
      <div
        key={item.canonicalSlug}
        className={`${styles.card} ${isChecked ? styles.cardSelected : ''}`}
      >
        <div className={styles.cardTop}>
          <div className={styles.cardCheckWrap}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggleSelectSlug(item.canonicalSlug)}
              className={styles.checkbox}
              title="Select for batch merge"
            />
            <div>
              <h3 className={styles.clubName}>
                {item.emoji ? `${item.emoji} ` : ''}
                {item.name}
              </h3>
              <span className={styles.clubSlug}>/{item.canonicalSlug}</span>
            </div>
          </div>
          <div className={styles.badgesCol}>
            {item.logoUrl ? (
              <span className={item.isVectorSvg ? styles.badgeSvg : styles.badgeRaster}>
                {item.isVectorSvg ? 'Vector SVG' : 'Raster'}
              </span>
            ) : (
              <span className={styles.badgeRaster}>Missing Logo</span>
            )}
            <span className={styles.badgeKind}>{kindLabel(item.entityKind)}</span>
          </div>
        </div>

        {(item.sport || item.country || nonTrivialAliases.length > 0 || (item.sightings ?? 0) > 0) && (
          <div className={styles.metaStrip}>
            {item.sport && <span><strong>Sport:</strong> {item.sport} · </span>}
            {item.country && <span><strong>Country:</strong> {item.country} · </span>}
            {(item.sightings ?? 0) > 0 && <span><strong>AI Sightings:</strong> {item.sightings} · </span>}
            {nonTrivialAliases.length > 0 && (
              <div><strong>Aliases:</strong> {nonTrivialAliases.slice(0, 5).join(', ')}</div>
            )}
          </div>
        )}

        <div className={styles.logoPreviewArea}>
          {item.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.logoUrl} alt={item.name} className={styles.logoImg} loading="lazy" />
          ) : (
            <div className={styles.noLogoPlaceholder}>
              <span>🛡️ No crest uploaded yet</span>
              <small>Click Upload Logo to store in R2</small>
            </div>
          )}
        </div>

        <div className={styles.cardActions}>
          <button type="button" onClick={() => openEditModal(item)} className={styles.editBtn}>
            {item.logoUrl ? '✏️ Edit Logo' : '⬆️ Upload Logo'}
          </button>
          <button
            type="button"
            onClick={() => openMergeModal([item.name])}
            className={styles.actionBtn}
            title="Merge into another canonical club"
          >
            🔗 Merge
          </button>
          <button
            type="button"
            onClick={() => openMoveToBrandModal(item.name)}
            className={styles.actionBtn}
            title="Move commercial sponsor to Brand Logos"
          >
            🏷️ Move to Brand
          </button>
          {item._id && (
            <button
              type="button"
              onClick={() => handleDelete(item.canonicalSlug, item.name)}
              className={styles.deleteBtn}
              title="Remove entry"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    );
  };

  const selectedClubNames = useMemo(() => {
    const map = new Map(allItems.map((i) => [i.canonicalSlug, i.name]));
    return Array.from(selectedSlugs).map((s) => map.get(s) || s);
  }, [allItems, selectedSlugs]);

  const svgTotal = useMemo(() => assets.filter((a) => a.isVectorSvg).length, [assets]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>🛡️ Club Logos &amp; Sports Crest Registry</h1>
          <p className={styles.subtitle}>
            Centralized single source of truth for sports club crests, national team emblems, and federation logos. Every upload stores permanently in Cloudflare R2 and propagates automatically to Events, Partners, Organizations, Project Partners, AI Reports, and Camera.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/resources/partners" target="_blank" className={styles.secondaryBtn}>
            🌐 Public Catalog ↗
          </Link>
          <Link href="/admin/brand-assets" className={styles.secondaryBtn}>
            🏷️ Brand Logos
          </Link>
          <Link href="/admin/club-clusters" className={styles.secondaryBtn}>
            🔗 Club Clusters
          </Link>
          <button type="button" onClick={loadData} className={styles.secondaryBtn}>
            🔄 Refresh
          </button>
          <button type="button" onClick={() => openEditModal({ name: '', entityKind: 'club' })} className={styles.primaryBtn}>
            ➕ Register Club / Nation
          </button>
        </div>
      </div>

      <div className={styles.statsBar}>
        <span className={styles.statPill}>Configured Crests: {assets.length}</span>
        <span className={styles.statPill}>Official Vector SVGs: {svgTotal}</span>
        <span className={styles.statPill}>Missing Logos: {unconfigured.length}</span>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchWrap}>
          <input
            type="text"
            placeholder="Search clubs, national teams, federations, countries, or aliases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as any)}
          className={styles.selectInput}
          aria-label="Entity type filter"
        >
          <option value="all">All Entity Types</option>
          <option value="club">🏟️ Sports Clubs</option>
          <option value="national_team">🏳️ National Teams</option>
          <option value="federation">🏆 Federations &amp; Leagues</option>
        </select>

        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value as any)}
          className={styles.selectInput}
          aria-label="Logo format filter"
        >
          <option value="all">All Logo Formats</option>
          <option value="svg">Vector SVG Only</option>
          <option value="raster">Raster (PNG/WebP/JPG)</option>
          <option value="missing">Missing Logo Only</option>
        </select>

        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className={styles.selectInput}
          aria-label="Sport filter"
        >
          <option value="all">All Sports</option>
          {availableSports.map((sp) => (
            <option key={sp} value={sp}>
              {sp}
            </option>
          ))}
        </select>
      </div>

      {feedback && (
        <div className={feedback.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {feedback.text}
        </div>
      )}

      {selectedSlugs.size > 0 && (
        <div className={styles.batchBar}>
          <span>
            <strong>{selectedSlugs.size}</strong> club(s) selected for batch merge
          </span>
          <div className={styles.headerActions}>
            <button type="button" onClick={() => setSelectedSlugs(new Set())} className={styles.secondaryBtn}>
              Clear Selection
            </button>
            <button type="button" onClick={() => openMergeModal(selectedClubNames)} className={styles.primaryBtn}>
              🔗 Merge {selectedSlugs.size} Selected
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className={styles.subtitle}>Loading centralized Club Logos registry...</p>
      ) : (
        <>
          {formatFilter !== 'missing' && (
            <>
              <div className={styles.sectionHeader}>
                <span>Official Club, Nation &amp; Federation Logos ({filteredConfigured.length})</span>
                <span className={styles.sectionBadge}>Synced Across All Entities &amp; Reports</span>
              </div>
              <div className={styles.grid}>{filteredConfigured.map(renderCard)}</div>
            </>
          )}

          {filteredUnconfigured.length > 0 && (
            <>
              <div className={styles.sectionHeader}>
                <span>Clubs &amp; Partners Missing Official Logo ({filteredUnconfigured.length})</span>
                <span className={styles.sectionBadge}>Upload SVG to Activate Everywhere</span>
              </div>
              <div className={styles.grid}>{filteredUnconfigured.map(renderCard)}</div>
            </>
          )}
        </>
      )}

      {/* Upload / Edit Modal */}
      {modalOpen && editingClub && (
        <div className={styles.modalBackdrop} onClick={() => setModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingClub.canonicalSlug ? `Edit Logo: ${editingClub.name}` : 'Register Official Club / Nation Logo'}
            </h2>
            <form onSubmit={handleSaveClub}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Official Name *</label>
                <input
                  type="text"
                  required
                  value={editingClub.name || ''}
                  onChange={(e) => setEditingClub({ ...editingClub, name: e.target.value })}
                  className={styles.searchInput}
                  placeholder="e.g., Ferencvárosi TC, Germany, UEFA"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Entity Type</label>
                <select
                  value={editingClub.entityKind || 'club'}
                  onChange={(e) => setEditingClub({ ...editingClub, entityKind: e.target.value as any })}
                  className={styles.selectInput}
                >
                  <option value="club">🏟️ Sports Club</option>
                  <option value="national_team">🏳️ National Team / Nation</option>
                  <option value="federation">🏆 Federation / League</option>
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Upload Official SVG / PNG File (Stored in Cloudflare R2)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,image/svg+xml,image/png,image/webp,image/jpeg"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setUploadFile(f);
                    if (f) setFilePreview(URL.createObjectURL(f));
                  }}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Or Paste Public HTTPS Logo URL</label>
                <input
                  type="url"
                  value={editingClub.logoUrl || ''}
                  onChange={(e) => {
                    setEditingClub({ ...editingClub, logoUrl: e.target.value });
                    if (!uploadFile) setFilePreview(e.target.value);
                  }}
                  className={styles.searchInput}
                  placeholder="https://..."
                />
              </div>

              {filePreview && (
                <div className={styles.logoPreviewArea}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={filePreview} alt="Logo preview" className={styles.logoImg} />
                </div>
              )}

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Sport (optional)</label>
                <input
                  type="text"
                  value={editingClub.sport || ''}
                  onChange={(e) => setEditingClub({ ...editingClub, sport: e.target.value })}
                  className={styles.searchInput}
                  placeholder="Football, Handball, Basketball, Ice Hockey, Multi-Sport..."
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Country (optional)</label>
                <input
                  type="text"
                  value={editingClub.country || ''}
                  onChange={(e) => setEditingClub({ ...editingClub, country: e.target.value })}
                  className={styles.searchInput}
                  placeholder="Hungary, Germany, England..."
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Trained Aliases (comma-separated)</label>
                <input
                  type="text"
                  value={aliasesInput}
                  onChange={(e) => setAliasesInput(e.target.value)}
                  className={styles.searchInput}
                  placeholder="e.g., ftc, fradi, ferencvaros"
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setModalOpen(false)} className={styles.secondaryBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={styles.primaryBtn}>
                  {saving ? 'Saving & Syncing...' : 'Save & Sync Everywhere'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {mergeModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setMergeModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Merge Club Variants</h2>
            <p className={styles.subtitle}>
              Merging: <strong>{mergeSources.join(', ')}</strong>
            </p>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Canonical Target Club Name *</label>
              <input
                type="text"
                value={targetClubName}
                onChange={(e) => setTargetClubName(e.target.value)}
                className={styles.searchInput}
                placeholder="Type or select canonical club..."
              />
              <div className={styles.suggestionList}>
                {candidateMergeTargets.map((cand) => (
                  <button
                    key={cand}
                    type="button"
                    onClick={() => setTargetClubName(cand)}
                    className={styles.suggestionChip}
                  >
                    {cand}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setMergeModalOpen(false)} className={styles.secondaryBtn}>
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !targetClubName.trim()}
                onClick={handleExecuteMerge}
                className={styles.primaryBtn}
              >
                {saving ? 'Merging...' : 'Confirm Merge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move to Brand Modal */}
      {brandModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setBrandModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Move Entity to Brand Logos</h2>
            <p className={styles.subtitle}>
              Reclassify <strong>{movingClubName}</strong> out of Sports Clubs and into Commercial Brand Logos.
            </p>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Target Brand Name *</label>
              <input
                type="text"
                value={targetBrandName}
                onChange={(e) => setTargetBrandName(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setBrandModalOpen(false)} className={styles.secondaryBtn}>
                Cancel
              </button>
              <button type="button" disabled={saving} onClick={handleMoveToBrand} className={styles.primaryBtn}>
                {saving ? 'Moving...' : 'Move to Brand Logos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
