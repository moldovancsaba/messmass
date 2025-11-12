'use client';

// components/ReportContentManager.tsx
// WHAT: Manage reportImageN and reportTextN slots (1..500) from a single Clicker tab
// WHY: Bulk upload images to ImgBB, bulk add texts, keep stable slot references for charts
// HOW: Reuses existing /api/upload-image endpoint and EditorDashboard saveProject()

import React, { useMemo, useRef, useState } from 'react';
import styles from './ReportContentManager.module.css';

interface ReportContentManagerProps {
  stats: Record<string, any>; // project.stats
  onCommit: (newStats: Record<string, any>) => void; // Persist all changes at once
  maxSlots?: number; // default 500
}

// Helper: compute next free index for a prefix
function findNextFreeIndex(stats: Record<string, any>, prefix: 'reportImage' | 'reportText', maxSlots: number) {
  for (let i = 1; i <= maxSlots; i++) {
    const key = `${prefix}${i}`;
    const val = stats[key];
    if (!val || (typeof val === 'string' && val.length === 0)) return i;
  }
  return null; // full
}

// Helper: get occupied slot entries for a prefix
function getOccupied(stats: Record<string, any>, prefix: 'reportImage' | 'reportText', maxSlots: number) {
  const items: { index: number; value: string }[] = [];
  for (let i = 1; i <= maxSlots; i++) {
    const key = `${prefix}${i}`;
    const val = stats[key];
    if (typeof val === 'string' && val.length > 0) items.push({ index: i, value: val });
  }
  return items;
}

// WHAT: Auto-generate chart blocks for report content (images & texts)
// WHY: Streamline workflow - upload in Clicker → immediately available in Visualization editor
// HOW: Detect new/changed reportImage*/reportText* slots, create matching chart algorithms via API
async function autoGenerateChartBlocks(newStats: Record<string, any>, oldStats: Record<string, any>) {
  try {
    const changes: Array<{ type: 'image' | 'text'; index: number; value: string }> = [];
    
    // WHAT: Detect new or changed image slots
    // WHY: Only create/update chart blocks for modified content
    for (const key of Object.keys(newStats)) {
      if (key.startsWith('reportImage') && newStats[key] !== oldStats[key]) {
        const index = parseInt(key.replace('reportImage', ''));
        if (!isNaN(index) && newStats[key]) {
          changes.push({ type: 'image', index, value: String(newStats[key]) });
        }
      } else if (key.startsWith('reportText') && newStats[key] !== oldStats[key]) {
        const index = parseInt(key.replace('reportText', ''));
        if (!isNaN(index) && newStats[key]) {
          changes.push({ type: 'text', index, value: String(newStats[key]) });
        }
      }
    }
    
    if (changes.length === 0) return;
    
    // WHAT: Call API to auto-generate chart blocks for each change
    // WHY: Creates chart_algorithms documents that appear in Visualization editor
    console.log(`🎨 Auto-generating ${changes.length} chart blocks...`);
    
    for (const change of changes) {
      await fetch('/api/auto-generate-chart-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: change.type,
          index: change.index,
          value: change.value
        })
      });
    }
    
    console.log('✅ Chart blocks auto-generated successfully');
  } catch (error) {
    console.warn('⚠️  Failed to auto-generate chart blocks:', error);
    // WHAT: Non-blocking error - content is saved, just chart blocks may need manual creation
    // WHY: Don't interrupt user workflow if chart block creation fails
  }
}

export default function ReportContentManager({ stats, onCommit, maxSlots = 500 }: ReportContentManagerProps) {
  // UI state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'images' | 'texts'>('images');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textBulkRef = useRef<HTMLTextAreaElement>(null);

  const occupiedImages = useMemo(() => getOccupied(stats, 'reportImage', maxSlots), [stats, maxSlots]);
  const occupiedTexts = useMemo(() => getOccupied(stats, 'reportText', maxSlots), [stats, maxSlots]);

  // ACTION: Bulk upload images → assign to next free slots
  const handleBulkUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const newStats = { ...stats };
      for (let f = 0; f < files.length; f++) {
        const next = findNextFreeIndex(newStats, 'reportImage', maxSlots);
        if (!next) break; // no space
        const file = files[f];
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 32 * 1024 * 1024) continue; // ImgBB 32MB limit
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
        const data = await res.json();
        if (!data?.success || !data?.url) throw new Error(data?.error || 'Upload failed');
        newStats[`reportImage${next}`] = String(data.url);
      }
      onCommit(newStats);
      // WHAT: Auto-generate chart blocks for newly uploaded images
      // WHY: Make images immediately available in Report Template editor without manual Chart Algorithm creation
      await autoGenerateChartBlocks(newStats, stats);
    } catch (e: any) {
      setError(e?.message || 'Bulk upload failed');
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ACTION: Replace image at a specific slot
  const replaceImageAt = async (slotIndex: number, file: File) => {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data?.success || !data?.url) throw new Error(data?.error || 'Upload failed');
      const newStats = { ...stats, [`reportImage${slotIndex}`]: String(data.url) };
      onCommit(newStats);
      // WHAT: Auto-generate chart block for replaced image
      // WHY: Keep chart blocks in sync with image slots
      await autoGenerateChartBlocks(newStats, stats);
    } catch (e: any) {
      setError(e?.message || 'Replace failed');
    } finally {
      setBusy(false);
    }
  };

  // ACTION: Clear a slot (keep hole)
  const clearSlot = (prefix: 'reportImage' | 'reportText', slotIndex: number) => {
    const newStats = { ...stats, [`${prefix}${slotIndex}`]: '' };
    onCommit(newStats);
  };

  // ACTION: Swap two slots
  const [swapA, setSwapA] = useState('');
  const [swapB, setSwapB] = useState('');
  const doSwap = (prefix: 'reportImage' | 'reportText') => {
    const a = Math.max(1, Math.min(maxSlots, parseInt(swapA) || 0));
    const b = Math.max(1, Math.min(maxSlots, parseInt(swapB) || 0));
    if (!a || !b || a === b) return;
    const keyA = `${prefix}${a}`;
    const keyB = `${prefix}${b}`;
    const newStats: Record<string, any> = { ...stats };
    const tmp = newStats[keyA] || '';
    newStats[keyA] = newStats[keyB] || '';
    newStats[keyB] = tmp;
    onCommit(newStats);
  };

  // ACTION: Compact indices (advanced)
  const compact = (prefix: 'reportImage' | 'reportText') => {
    if (!confirm(`This will re-number non-empty ${prefix} slots starting from 1. Existing references like [stats.${prefix}N] may change. Continue?`)) return;
    const values = getOccupied(stats, prefix, maxSlots).map((x) => x.value);
    const newStats: Record<string, any> = { ...stats };
    // Clear all
    for (let i = 1; i <= maxSlots; i++) newStats[`${prefix}${i}`] = '';
    // Reassign sequentially
    for (let i = 0; i < values.length; i++) newStats[`${prefix}${i + 1}`] = values[i];
    onCommit(newStats);
  };

  // ACTION: Bulk add texts (each non-empty line → next free slot)
  const handleBulkAddTexts = async () => {
    if (!textBulkRef.current) return;
    const lines = textBulkRef.current.value.split(/\r?\n/).map((l) => l);
    const items = lines.filter((l) => l.trim().length > 0);
    if (items.length === 0) return;
    const newStats = { ...stats } as Record<string, any>;
    let assigned = 0;
    for (const item of items) {
      const next = findNextFreeIndex(newStats, 'reportText', maxSlots);
      if (!next) break;
      newStats[`reportText${next}`] = item; // store raw string (markdown optional in chart)
      assigned++;
    }
    onCommit(newStats);
    // WHAT: Auto-generate chart blocks for newly added texts
    // WHY: Make texts immediately available in Report Template editor
    await autoGenerateChartBlocks(newStats, stats);
    if (textBulkRef.current) textBulkRef.current.value = '';
  };

  // ACTION: Update single text slot
  const saveTextAt = async (slotIndex: number, value: string) => {
    const newStats = { ...stats, [`reportText${slotIndex}`]: value };
    onCommit(newStats);
    // WHAT: Auto-generate chart block for updated text
    // WHY: Keep chart blocks in sync with text slots
    await autoGenerateChartBlocks(newStats, stats);
  };

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Report Content</h3>
          <div className={styles.controlsRow}>
            <button className={`btn btn-small ${tab === 'images' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('images')}>
              🖼️ Images
            </button>
            <button className={`btn btn-small ${tab === 'texts' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('texts')}>
              📝 Texts
            </button>
          </div>
        </div>
        <div className={styles.note}>
          {busy ? 'Processing…' : error ? `⚠️ ${error}` : 'Manage unlimited slots. Deleting keeps holes; use Compact to re-number.'}
        </div>
      </div>

      {/* Images Section */}
      {tab === 'images' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>Image Slots (reportImage1…{maxSlots})</h4>
            <div className={styles.controlsRow}>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleBulkUpload(e.target.files)} style={{ display: 'none' }} />
              <button className="btn btn-small btn-primary" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                📤 Bulk Upload to Next Free Slots
              </button>
              <div className={styles.inlineRow}>
                <input className="form-input" placeholder="Swap A" value={swapA} onChange={(e) => setSwapA(e.target.value)} style={{ width: '80px' }} />
                <input className="form-input" placeholder="Swap B" value={swapB} onChange={(e) => setSwapB(e.target.value)} style={{ width: '80px' }} />
                <button className="btn btn-small btn-secondary" onClick={() => doSwap('reportImage')} disabled={busy}>↔️ Swap</button>
              </div>
              <button className="btn btn-small btn-danger" onClick={() => compact('reportImage')} disabled={busy}>
                🧹 Compact Indices
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {occupiedImages.map(({ index, value }) => (
              <div key={index} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.slotBadge}>reportImage{index}</span>
                  <div className={styles.controlsRow}>
                    <label className="btn btn-small btn-secondary">
                      Replace
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) replaceImageAt(index, file);
                        }}
                      />
                    </label>
                    <button className="btn btn-small btn-secondary" onClick={() => clearSlot('reportImage', index)}>Clear</button>
                  </div>
                </div>
                <img src={value} alt={`reportImage${index}`} className={styles.thumb} />
                <div className={styles.note}>{value}</div>
              </div>
            ))}
          </div>
          {occupiedImages.length === 0 && (
            <div className={styles.note}>No images yet. Use Bulk Upload to start filling slots.</div>
          )}
        </div>
      )}

      {/* Texts Section */}
      {tab === 'texts' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>Text Slots (reportText1…{maxSlots})</h4>
            <div className={styles.controlsRow}>
              <button className="btn btn-small btn-danger" onClick={() => compact('reportText')} disabled={busy}>🧹 Compact Indices</button>
              <div className={styles.inlineRow}>
                <input className="form-input" placeholder="Swap A" value={swapA} onChange={(e) => setSwapA(e.target.value)} style={{ width: '80px' }} />
                <input className="form-input" placeholder="Swap B" value={swapB} onChange={(e) => setSwapB(e.target.value)} style={{ width: '80px' }} />
                <button className="btn btn-small btn-secondary" onClick={() => doSwap('reportText')} disabled={busy}>↔️ Swap</button>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.inlineRow}>
              <textarea ref={textBulkRef} className="form-input" placeholder="Paste texts here — one non-empty line per slot (reportTextN)" style={{ minHeight: '96px' }}></textarea>
            </div>
            <div className={styles.inlineRow}>
              <button className="btn btn-small btn-primary" onClick={handleBulkAddTexts} disabled={busy}>➕ Add Lines to Next Free Slots</button>
              <span className={styles.note}>Tip: Use Clear on individual slots to keep holes without re-numbering.</span>
            </div>
          </div>

          <div className={styles.separator} />

          <div className={styles.grid}>
            {occupiedTexts.map(({ index, value }) => (
              <div key={index} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.slotBadge}>reportText{index}</span>
                  <div className={styles.controlsRow}>
                    <button className="btn btn-small btn-secondary" onClick={() => clearSlot('reportText', index)}>Clear</button>
                  </div>
                </div>
                <textarea
                  className="form-input"
                  defaultValue={value}
                  onBlur={(e) => saveTextAt(index, e.currentTarget.value)}
                  style={{ minHeight: '96px' }}
                />
              </div>
            ))}
          </div>
          {occupiedTexts.length === 0 && (
            <div className={styles.note}>No texts yet. Paste lines above to start filling slots.</div>
          )}
        </div>
      )}
    </div>
  );
}