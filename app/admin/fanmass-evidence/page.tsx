'use client';
/* eslint-disable @next/next/no-img-element -- crops are content-addressed R2 files of unknown size */

// Review page of the global evidence library: the proof behind every brand and club figure Fanmass produces, for any
// project or event. Using it is optional: nothing waits for a person. But a person can always look at every sample,
// confirm or reject it, correct the name or kind it was matched to, add a sample of their own, or delete one they
// added. A decision is stored with who and when, wins over later deliveries, reaches the report figures on the next
// Fanmass publish run, and teaches the whole system: Fanmass applies it to every later analysis.

import React, { useCallback, useEffect, useState } from 'react';
import { ensureCsrfToken } from '@/lib/apiClient';
import type { BrandEvidenceDoc } from '@/lib/fanmassEvidence';
import styles from './page.module.css';

type Row = BrandEvidenceDoc & { id: string };

const FILTERS: Array<[string, string]> = [
  ['needs_review', 'Needs review (weakest first)'],
  ['confirmed', 'Confirmed'],
  ['corrected', 'Corrected'],
  ['rejected', 'Rejected'],
  ['human', 'Added by a person'],
  ['all', 'All'],
];
const PAGE = 20;
const MAX_IMAGE_BYTES = 1_400_000;
const pct = (v: number | null) => (v === null ? 'n/a' : `${Math.round(v * 100)}%`);

async function call(url: string, method: string, body?: unknown): Promise<{ ok: boolean; data: any }> {
  const csrf = await ensureCsrfToken();
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok && data?.success !== false, data };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.readAsDataURL(file);
  });
}

export default function SzrtEvidenceReviewPage() {
  const [status, setStatus] = useState('needs_review');
  const [kind, setKind] = useState('');
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', kind: 'brand', note: '' });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', kind: 'brand', origin: 'szrt', sport: '', readText: '', note: '' });
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ status, limit: String(PAGE), offset: String(offset) });
    if (kind) q.set('kind', kind);
    if (name.trim()) q.set('name', name.trim());
    if (origin.trim()) q.set('origin', origin.trim().toLowerCase());
    try {
      const response = await fetch(`/api/admin/fanmass-evidence?${q.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || data?.success === false) throw new Error(data?.error?.message || data?.error || 'Could not load the samples.');
      setRows(data.rows);
      setTotal(data.total);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load the samples.');
    } finally {
      setLoading(false);
    }
  }, [status, kind, name, origin, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (row: Row, body: Record<string, unknown>) => {
    const { ok, data } = await call(`/api/admin/fanmass-evidence/${encodeURIComponent(row.id)}`, 'PATCH', { ...body, note: notes[row.id] ?? '' });
    setMessage(ok ? 'Saved. The report figures follow on the next publish run (within 20 minutes).' : data?.error?.message || 'Could not save.');
    setEditing(null);
    if (ok) await load();
  };

  const remove = async (row: Row) => {
    if (!window.confirm('Delete this sample you added? This cannot be undone.')) return;
    const { ok, data } = await call(`/api/admin/fanmass-evidence/${encodeURIComponent(row.id)}`, 'DELETE');
    setMessage(ok ? 'Deleted.' : data?.error?.message || 'Could not delete.');
    if (ok) await load();
  };

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return setMessage('Choose the picture that shows it.');
    if (file.size > MAX_IMAGE_BYTES) return setMessage('The picture is too large: at most about 1.4 MB.');
    const { ok, data } = await call('/api/admin/fanmass-evidence', 'POST', { ...form, crop: await readAsDataUrl(file) });
    setMessage(ok ? 'Added. It counts as proof from the next publish run.' : data?.error?.message || 'Could not add it.');
    if (ok) {
      setAdding(false);
      setFile(null);
      setForm({ name: '', kind: 'brand', origin: 'szrt', sport: '', readText: '', note: '' });
      setStatus('human');
      setOffset(0);
      await load();
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Fanmass proof review</h1>
      <p className={styles.lead}>
        Every brand and club figure Fanmass produces, for any project or event, rests on a sample: the crop of the picture where
        its name was read. Reviewing is optional and nothing waits for it, but you can always correct the machine here. Your
        decision is stored with your name and the time, a later delivery never overrides it, the report figures follow it on the
        next publish run, and it teaches the whole system: Fanmass applies it to every later analysis, whatever the project.
      </p>

      <div className={styles.toolbar}>
        <label className={styles.field}>Show
          <select className={styles.input} value={status} onChange={(e) => { setStatus(e.target.value); setOffset(0); }}>
            {FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className={styles.field}>Kind
          <select className={styles.input} value={kind} onChange={(e) => { setKind(e.target.value); setOffset(0); }}>
            <option value="">Brands and clubs</option>
            <option value="brand">Brands</option>
            <option value="club">Clubs</option>
          </select>
        </label>
        <label className={styles.field}>Name
          <input className={styles.input} value={name} placeholder="Starts with…" onChange={(e) => { setName(e.target.value); setOffset(0); }} />
        </label>
        <label className={styles.field}>Origin
          <input className={styles.input} value={origin} placeholder="All (e.g. szrt)" onChange={(e) => { setOrigin(e.target.value); setOffset(0); }} />
        </label>
        <button type="button" className={`${styles.button} ${styles.primary}`} onClick={() => setAdding((v) => !v)}>
          {adding ? 'Close' : 'Add a sample'}
        </button>
      </div>

      {adding && (
        <form className={styles.panel} onSubmit={add}>
          <p className={styles.hint}>Add a proof yourself: a picture that shows the brand or club, and its name. It counts as proof once added.</p>
          <div className={styles.inline}>
            <label className={styles.field}>Name
              <input className={styles.input} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className={styles.field}>Kind
              <select className={styles.input} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                <option value="brand">Brand</option>
                <option value="club">Club</option>
              </select>
            </label>
            <label className={styles.field}>Origin (project or event)
              <input className={styles.input} required value={form.origin} placeholder="szrt" onChange={(e) => setForm({ ...form, origin: e.target.value.toLowerCase() })} />
            </label>
            <label className={styles.field}>Sport
              <input className={styles.input} value={form.sport} placeholder="Football, Handball…" onChange={(e) => setForm({ ...form, sport: e.target.value })} />
            </label>
            <label className={styles.field}>Text visible (optional)
              <input className={styles.input} value={form.readText} onChange={(e) => setForm({ ...form, readText: e.target.value })} />
            </label>
          </div>
          <div className={styles.inline}>
            <label className={styles.field}>Picture (JPEG or PNG, up to 1.4 MB)
              <input className={styles.input} type="file" accept="image/jpeg,image/png" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <label className={styles.field}>Note (optional)
              <input className={styles.input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
            <button type="submit" className={`${styles.button} ${styles.primary}`}>Add</button>
          </div>
        </form>
      )}

      {message && <p className={styles.status} role="status">{message}</p>}
      {loading ? <p className={styles.status}>Loading…</p> : rows.length === 0 ? <p className={styles.status}>Nothing here.</p> : (
        <ul className={styles.list}>
          {rows.map((row) => {
            const review = row.review;
            const human = row.source === 'human';
            return (
              <li key={row.id} className={styles.card}>
                <div className={styles.cropFrame}><img src={row.cropUrl} alt={`Crop for ${row.name}`} loading="lazy" /></div>
                <div className={styles.body}>
                  <h2 className={styles.name}>{row.name} <span className={styles.badge}>{row.entityKind}</span>{' '}
                    <span className={styles.badge}>{row.origin}</span>{' '}
                    {review ? <span className={styles.badge}>{review.status}</span> : <span className={styles.badge}>{human ? 'added' : 'not reviewed'}</span>}</h2>
                  {row.readText && <div className={styles.readText}>“{row.readText}”</div>}
                  <div className={styles.facts}>
                    <span>{human ? 'Added by a person' : `${row.tier === 'text_read' ? 'Text read' : 'Model guess'} · ${row.match ?? 'n/a'}`}</span>
                    {!human && <span>Text confidence {pct(row.ocrConfidence)}</span>}
                    {!human && <span>Overall {pct(row.confidence)}</span>}
                    <span>{row.sport}</span>
                    <span>{row.fileKey}</span>
                  </div>
                  {review && (
                    <div className={styles.facts}>
                      <span>{review.status} by {review.by}</span><span>{new Date(review.at).toLocaleString()}</span>
                      {review.note && <span>“{review.note}”</span>}
                      {review.original && <span>was: {review.original.name} ({review.original.entityKind})</span>}
                    </div>
                  )}
                  {editing === row.id ? (
                    <div className={styles.inline}>
                      <label className={styles.field}>Correct name
                        <input className={styles.input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                      </label>
                      <label className={styles.field}>Kind
                        <select className={styles.input} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>
                          <option value="brand">Brand</option>
                          <option value="club">Club</option>
                        </select>
                      </label>
                      <button type="button" className={`${styles.button} ${styles.primary}`} onClick={() => act(row, { action: 'correct', name: draft.name, kind: draft.kind })}>Save correction</button>
                      <button type="button" className={styles.button} onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className={styles.actions}>
                      <input className={styles.input} aria-label="Note" placeholder="Note (optional)" value={notes[row.id] ?? ''} onChange={(e) => setNotes({ ...notes, [row.id]: e.target.value })} />
                      {review?.status !== 'confirmed' && review?.status !== 'corrected' && !human && <button type="button" className={styles.button} onClick={() => act(row, { action: 'confirm' })}>Confirm</button>}
                      {review?.status !== 'rejected' && <button type="button" className={`${styles.button} ${styles.danger}`} onClick={() => act(row, { action: 'reject' })}>Reject</button>}
                      <button type="button" className={styles.button} onClick={() => { setEditing(row.id); setDraft({ name: row.name, kind: row.entityKind, note: '' }); }}>Correct…</button>
                      {review && !human && <button type="button" className={styles.button} onClick={() => act(row, { action: 'restore' })}>Restore to automatic</button>}
                      {human && review?.status === 'rejected' && <button type="button" className={styles.button} onClick={() => act(row, { action: 'confirm' })}>Bring back</button>}
                      {human && <button type="button" className={`${styles.button} ${styles.danger}`} onClick={() => remove(row)}>Delete</button>}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.pager}>
        <button type="button" className={styles.button} disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Previous</button>
        <span className={styles.hint}>{total === 0 ? '0' : `${offset + 1}–${Math.min(offset + PAGE, total)}`} of {total}</span>
        <button type="button" className={styles.button} disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>Next</button>
      </div>
    </main>
  );
}
