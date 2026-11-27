'use client';
/* eslint-disable @next/next/no-img-element -- crops are content-addressed R2 files of unknown size */

import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { ensureCsrfToken } from '@/lib/apiClient';
import type { BrandEvidenceDoc } from '@/lib/fanmassEvidence';
import EntityWorkspaceTabs from '@/components/admin/EntityWorkspaceTabs';
import WorkspaceHeader from '@/components/admin/WorkspaceHeader';
import BaseModal from '@/components/modals/BaseModal';
import styles from './page.module.css';

type Row = BrandEvidenceDoc & { id: string };
type Candidate = { name: string; kind: 'brand' | 'club' };

function foldSearch(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function PredictiveEntityInput({
  inputId,
  value,
  kind,
  candidates,
  onChange,
  onSelect,
  required = false,
}: {
  inputId: string;
  value: string;
  kind: 'brand' | 'club';
  candidates: Candidate[];
  onChange: (nextName: string) => void;
  onSelect: (nextName: string, nextKind: 'brand' | 'club') => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const listboxId = `${inputId}-listbox`;

  const matches = useMemo(() => {
    const q = foldSearch(value);
    const list = q
      ? candidates.filter((c) => foldSearch(c.name).includes(q))
      : candidates;
    return [...list]
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === kind ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 30);
  }, [candidates, value, kind]);

  const trimmed = value.trim();
  const hasExactMatch =
    trimmed.length > 0 &&
    candidates.some((c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.kind === kind);
  const showDropdown = open && (matches.length > 0 || (trimmed.length > 0 && !hasExactMatch));

  return (
    <div className={styles.combobox}>
      <input
        id={inputId}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? listboxId : undefined}
        aria-autocomplete="list"
        className={styles.input}
        value={value}
        required={required}
        placeholder="Type to search or add new…"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
      />
      {showDropdown && (
        <div id={listboxId} className={styles.dropdown} role="listbox" aria-label="Matching brands and clubs">
          {trimmed.length > 0 && !hasExactMatch && (
            <button
              type="button"
              role="option"
              aria-selected={false}
              className={`${styles.dropdownItem} ${styles.dropdownAddNew}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(trimmed, kind);
                setOpen(false);
              }}
            >
              <span>+ Add new “{trimmed}”</span>
              <span className={styles.dropdownMeta}>{kind}</span>
            </button>
          )}
          {matches.map((item) => (
            <button
              key={`${item.kind}|${item.name}`}
              type="button"
              role="option"
              aria-selected={item.name.toLowerCase() === trimmed.toLowerCase() && item.kind === kind}
              className={styles.dropdownItem}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item.name, item.kind);
                setOpen(false);
              }}
            >
              <span>{item.name}</span>
              <span className={styles.dropdownMeta}>{item.kind}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const FILTERS: Array<[string, string]> = [
  ['needs_review', 'Needs review (weakest first)'],
  ['needs_investigation', 'Needs investigation'],
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

function getStatusBadgeClass(status?: string): string {
  switch (status) {
    case 'confirmed':
      return `${styles.badge} ${styles.badgeConfirmed}`;
    case 'corrected':
      return `${styles.badge} ${styles.badgeCorrected}`;
    case 'needs_investigation':
      return `${styles.badge} ${styles.badgeWarning}`;
    case 'rejected':
      return `${styles.badge} ${styles.badgeRejected}`;
    default:
      return styles.badge;
  }
}

export default function SzrtEvidenceReviewPage() {
  const baseId = useId();
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
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<Row | null>(null);

  useEffect(() => {
    fetch('/api/admin/fanmass-evidence/candidates', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.candidates)) {
          setCandidates(data.candidates);
        }
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ status, limit: String(PAGE), offset: String(offset) });
    if (kind) q.set('kind', kind);
    if (name.trim()) q.set('name', name.trim());
    if (origin.trim()) q.set('origin', origin.trim().toLowerCase());
    try {
      const response = await fetch(`/api/admin/fanmass-evidence?${q.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.error?.message || data?.error || 'Could not load the samples.');
      }
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
    const noteText = (notes[row.id] ?? '').trim();
    if (body.action === 'investigate' && !noteText) {
      setMessage('Add a note explaining what needs investigation before sending it back.');
      return;
    }
    const { ok, data } = await call(`/api/admin/fanmass-evidence/${encodeURIComponent(row.id)}`, 'PATCH', {
      ...body,
      note: noteText,
    });
    setMessage(
      ok
        ? body.action === 'investigate'
          ? 'Sent back for further investigation.'
          : 'Saved. Report figures update on the next publish run.'
        : data?.error?.message || 'Could not save.'
    );
    setEditing(null);
    if (ok) {
      if (body.action === 'correct' && typeof body.name === 'string' && body.name.trim()) {
        const nextName = body.name.trim();
        const nextKind: 'brand' | 'club' = body.kind === 'club' ? 'club' : 'brand';
        setCandidates((prev) =>
          prev.some((c) => c.name.toLowerCase() === nextName.toLowerCase() && c.kind === nextKind)
            ? prev
            : [...prev, { name: nextName, kind: nextKind }].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      await load();
    }
  };

  const confirmRemove = async () => {
    if (!pendingDeleteRow) return;
    const row = pendingDeleteRow;
    setPendingDeleteRow(null);
    const { ok, data } = await call(`/api/admin/fanmass-evidence/${encodeURIComponent(row.id)}`, 'DELETE');
    setMessage(ok ? 'Sample deleted.' : data?.error?.message || 'Could not delete.');
    if (ok) await load();
  };

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return setMessage('Choose the picture that shows it.');
    if (file.size > MAX_IMAGE_BYTES) return setMessage('The picture is too large: at most about 1.4 MB.');
    const { ok, data } = await call('/api/admin/fanmass-evidence', 'POST', {
      ...form,
      crop: await readAsDataUrl(file),
    });
    setMessage(ok ? 'Added. Counts as verified proof from the next publish run.' : data?.error?.message || 'Could not add it.');
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
    <div className={styles.page}>
      <EntityWorkspaceTabs
        ariaLabel="AI Vision & Asset QA navigation"
        tabs={[
          { label: 'AI Event Coverage', href: '/admin/analytics/ai', icon: 'smart_toy' },
          { label: 'Fanmass Proof Review', href: '/admin/fanmass-evidence', icon: 'fact_check' },
          { label: 'Club Logos', href: '/admin/club-logos', icon: 'shield' },
          { label: 'Brand Logos', href: '/admin/brand-assets', icon: 'verified' },
        ]}
      />

      <WorkspaceHeader
        eyebrow="AI Vision Quality Assurance"
        title="Fanmass Proof Review"
        subtitle="Audit, confirm, correct, or reject detected brand and club image crops. Human decisions persist permanently and train subsequent Fanmass runs."
        emoji="🔍"
        primaryAction={
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={() => setAdding((v) => !v)}
          >
            {adding ? 'Close Sample Form' : '+ Add Sample'}
          </button>
        }
      />

      <div className={styles.toolbar}>
        <label className={styles.field}>
          Show
          <select
            className={styles.input}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
          >
            {FILTERS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Kind
          <select
            className={styles.input}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">Brands and clubs</option>
            <option value="brand">Brands</option>
            <option value="club">Clubs</option>
          </select>
        </label>
        <label className={styles.field}>
          Name
          <input
            className={styles.input}
            value={name}
            placeholder="Starts with…"
            onChange={(e) => {
              setName(e.target.value);
              setOffset(0);
            }}
          />
        </label>
        <label className={styles.field}>
          Origin
          <input
            className={styles.input}
            value={origin}
            placeholder="All (e.g. szrt)"
            onChange={(e) => {
              setOrigin(e.target.value);
              setOffset(0);
            }}
          />
        </label>
      </div>

      {adding && (
        <form className={styles.panel} onSubmit={add}>
          <p className={styles.hint}>
            Upload a verified crop showing a brand or club mark. Human-submitted samples count immediately on the next publish run.
          </p>
          <div className={styles.inline}>
            <div className={styles.field}>
              <label htmlFor={`${baseId}-add-name`}>Name</label>
              <PredictiveEntityInput
                inputId={`${baseId}-add-name`}
                value={form.name}
                kind={form.kind === 'club' ? 'club' : 'brand'}
                candidates={candidates}
                required
                onChange={(nextName) => setForm({ ...form, name: nextName })}
                onSelect={(nextName, nextKind) => setForm({ ...form, name: nextName, kind: nextKind })}
              />
            </div>
            <label className={styles.field}>
              Kind
              <select
                className={styles.input}
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                <option value="brand">Brand</option>
                <option value="club">Club</option>
              </select>
            </label>
            <label className={styles.field}>
              Origin (project or event)
              <input
                className={styles.input}
                required
                value={form.origin}
                placeholder="szrt"
                onChange={(e) => setForm({ ...form, origin: e.target.value.toLowerCase() })}
              />
            </label>
            <label className={styles.field}>
              Sport
              <input
                className={styles.input}
                value={form.sport}
                placeholder="Football, Handball…"
                onChange={(e) => setForm({ ...form, sport: e.target.value })}
              />
            </label>
            <label className={styles.field}>
              Text visible (optional)
              <input
                className={styles.input}
                value={form.readText}
                onChange={(e) => setForm({ ...form, readText: e.target.value })}
              />
            </label>
          </div>
          <div className={styles.inline}>
            <label className={styles.field}>
              Picture (JPEG or PNG, up to 1.4 MB)
              <input
                className={styles.input}
                type="file"
                accept="image/jpeg,image/png"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <label className={styles.field}>
              Note (optional)
              <input
                className={styles.input}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </label>
            <button type="submit" className={`${styles.button} ${styles.primary}`}>
              Save Sample
            </button>
          </div>
        </form>
      )}

      {message && (
        <p className={styles.statusBanner} role="status">
          {message}
        </p>
      )}

      {loading ? (
        <p className={styles.status}>Loading proof samples…</p>
      ) : rows.length === 0 ? (
        <p className={styles.status}>No proof samples match the selected filters.</p>
      ) : (
        <ul className={styles.list}>
          {rows.map((row) => {
            const review = row.review;
            const human = row.source === 'human';
            return (
              <li key={row.id} className={styles.card}>
                <div className={styles.cropFrame}>
                  <img src={row.cropUrl} alt={`Crop for ${row.name}`} loading="lazy" />
                </div>
                <div className={styles.body}>
                  <h2 className={styles.name}>
                    <span>{row.name}</span>
                    <span className={styles.badge}>{row.entityKind}</span>
                    <span className={styles.badge}>{row.origin}</span>
                    {review ? (
                      <span className={getStatusBadgeClass(review.status)}>{review.status}</span>
                    ) : (
                      <span className={styles.badge}>{human ? 'added' : 'not reviewed'}</span>
                    )}
                  </h2>
                  {row.readText && <div className={styles.readText}>“{row.readText}”</div>}
                  <div className={styles.facts}>
                    <span>
                      {human
                        ? 'Added by a person'
                        : `${row.tier === 'text_read' ? 'Text read' : 'Model guess'} · ${row.match ?? 'n/a'}`}
                    </span>
                    {!human && <span>Text confidence {pct(row.ocrConfidence)}</span>}
                    {!human && <span>Overall {pct(row.confidence)}</span>}
                    <span>{row.sport}</span>
                    <span>{row.fileKey}</span>
                  </div>
                  {review && (
                    <div className={styles.facts}>
                      <span>
                        {review.status} by {review.by}
                      </span>
                      <span>{new Date(review.at).toLocaleString()}</span>
                      {review.note && <span>“{review.note}”</span>}
                      {review.original && (
                        <span>
                          was: {review.original.name} ({review.original.entityKind})
                        </span>
                      )}
                    </div>
                  )}
                  {editing === row.id ? (
                    <div className={styles.inline}>
                      <div className={styles.field}>
                        <label htmlFor={`${baseId}-edit-${row.id}`}>Correct name</label>
                        <PredictiveEntityInput
                          inputId={`${baseId}-edit-${row.id}`}
                          value={draft.name}
                          kind={draft.kind === 'club' ? 'club' : 'brand'}
                          candidates={candidates}
                          onChange={(nextName) => setDraft({ ...draft, name: nextName })}
                          onSelect={(nextName, nextKind) => setDraft({ ...draft, name: nextName, kind: nextKind })}
                        />
                      </div>
                      <label className={styles.field}>
                        Kind
                        <select
                          className={styles.input}
                          value={draft.kind}
                          onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
                        >
                          <option value="brand">Brand</option>
                          <option value="club">Club</option>
                        </select>
                      </label>
                      <button
                        type="button"
                        className={`${styles.button} ${styles.primary}`}
                        onClick={() => void act(row, { action: 'correct', name: draft.name, kind: draft.kind })}
                      >
                        Save correction
                      </button>
                      <button type="button" className={styles.button} onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className={styles.actions}>
                      <input
                        className={styles.input}
                        aria-label={`Review note for ${row.name}`}
                        placeholder="Note (required to send back)"
                        value={notes[row.id] ?? ''}
                        onChange={(e) => setNotes({ ...notes, [row.id]: e.target.value })}
                      />
                      {review?.status !== 'confirmed' && review?.status !== 'corrected' && !human && (
                        <button
                          type="button"
                          className={styles.button}
                          onClick={() => void act(row, { action: 'confirm' })}
                        >
                          Confirm
                        </button>
                      )}
                      {review?.status !== 'rejected' && (
                        <button
                          type="button"
                          className={`${styles.button} ${styles.danger}`}
                          onClick={() => void act(row, { action: 'reject' })}
                        >
                          Reject
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.button}
                        onClick={() => {
                          setEditing(row.id);
                          setDraft({ name: row.name, kind: row.entityKind, note: '' });
                        }}
                      >
                        Correct…
                      </button>
                      {review?.status !== 'needs_investigation' && (
                        <button
                          type="button"
                          className={styles.button}
                          onClick={() => void act(row, { action: 'investigate' })}
                        >
                          Investigate
                        </button>
                      )}
                      {review && !human && (
                        <button
                          type="button"
                          className={styles.button}
                          onClick={() => void act(row, { action: 'restore' })}
                        >
                          Restore to automatic
                        </button>
                      )}
                      {human && review?.status === 'rejected' && (
                        <button
                          type="button"
                          className={styles.button}
                          onClick={() => void act(row, { action: 'confirm' })}
                        >
                          Bring back
                        </button>
                      )}
                      {human && (
                        <button
                          type="button"
                          className={`${styles.button} ${styles.danger}`}
                          onClick={() => setPendingDeleteRow(row)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.pager}>
        <button
          type="button"
          className={styles.button}
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - PAGE))}
        >
          Previous
        </button>
        <span className={styles.hint}>
          {total === 0 ? '0' : `${offset + 1}–${Math.min(offset + PAGE, total)}`} of {total}
        </span>
        <button
          type="button"
          className={styles.button}
          disabled={offset + PAGE >= total}
          onClick={() => setOffset(offset + PAGE)}
        >
          Next
        </button>
      </div>

      <BaseModal
        isOpen={Boolean(pendingDeleteRow)}
        onClose={() => setPendingDeleteRow(null)}
        ariaLabel="Delete human-added proof sample"
        size="sm"
      >
        <h2 className={styles.name}>Delete Proof Sample</h2>
        <p className={styles.hint}>
          Delete the manually added sample for <strong>{pendingDeleteRow?.name}</strong>? This action cannot be undone.
        </p>
        <div className={styles.modalActions}>
          <button type="button" className={styles.button} onClick={() => setPendingDeleteRow(null)}>
            Cancel
          </button>
          <button type="button" className={`${styles.button} ${styles.danger}`} onClick={() => void confirmRemove()}>
            Delete Sample
          </button>
        </div>
      </BaseModal>
    </div>
  );
}
