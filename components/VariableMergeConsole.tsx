'use client';

// WHAT: Operator console to review and apply variable merges on /admin/kyc.
// WHY: The variable audit found casing/word-order duplicates and report/data
//     name mismatches. This lists each candidate with a recommendation; the
//     operator selects merges, previews (dry-run), then applies.
// DESIGN: GDS only — ColoredCard, FormModal, UnifiedCheckboxField, CSS module
//     with design tokens. Accessible: labelled controls, keyboard-usable,
//     role=alert errors.

import React, { useEffect, useMemo, useState } from 'react';
import ColoredCard from '@/components/ColoredCard';
import { FormModal } from '@/components/modals';
import UnifiedCheckboxField from '@/components/UnifiedCheckboxField';
import MaterialIcon from '@/components/MaterialIcon';
import { apiPost } from '@/lib/apiClient';
import styles from './VariableMergeConsole.module.css';

type ConflictRule = 'copy' | 'sum' | 'prefer-canonical';

interface Candidate {
  id: string;
  canonical: string;
  legacy: string[];
  kind: 'casing' | 'token-reorder' | 'name-mismatch';
  counts: { canonicalOnly: number; legacyOnly: number; both: number; conflict: number };
  usedInReports: string[];
  recommendation: { rule: ConflictRule; safe: boolean; note: string };
}

interface MergeResult {
  dryRun: boolean;
  applied: number;
  changes: Array<{ canonical: string; legacy: string[]; rule: ConflictRule; eventsTouched: number }>;
  conflicts: Array<{ projectId: string; canonical: string; legacy: string; canonicalValue: unknown; legacyValue: unknown }>;
}

const KIND_LABEL: Record<Candidate['kind'], string> = {
  casing: 'Casing duplicate',
  'token-reorder': 'Word-order duplicate',
  'name-mismatch': 'Report/data name mismatch',
};

function Pill({ children, tone }: { children: React.ReactNode; tone?: 'primary' | 'good' | 'warn' }) {
  return (
    <span className={styles.pill} data-tone={tone}>
      {children}
    </span>
  );
}

interface VariableInfo {
  name: string;
  events: number;
}

export default function VariableMergeConsole() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [variables, setVariables] = useState<VariableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [rules, setRules] = useState<Record<string, ConflictRule>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MergeResult | null>(null);
  const [resultMode, setResultMode] = useState<'preview' | 'applied'>('preview');

  // Custom rename / merge form: source -> target (new or existing).
  const [customSource, setCustomSource] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [customRule, setCustomRule] = useState<ConflictRule>('copy');

  async function load() {
    try {
      const res = await fetch('/api/admin/variables/merge-candidates', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load merge candidates');
      setCandidates(data.candidates);
      setVariables(data.variables || []);
      const r: Record<string, ConflictRule> = {};
      for (const c of data.candidates as Candidate[]) r[c.id] = c.recommendation.rule;
      setRules(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selectedMerges = useMemo(
    () =>
      candidates
        .filter((c) => selected[c.id])
        .map((c) => ({ canonical: c.canonical, legacy: c.legacy, rule: rules[c.id] || 'copy' })),
    [candidates, selected, rules],
  );

  async function run(dryRun: boolean, mergesOverride?: Array<{ canonical: string; legacy: string[]; rule: ConflictRule }>) {
    const merges = mergesOverride ?? selectedMerges;
    if (merges.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const data = await apiPost('/api/admin/variables/merge', { merges, dryRun });
      if (!data.success) throw new Error(data.error || 'Merge failed');
      setResult(data.result);
      setResultMode(dryRun ? 'preview' : 'applied');
      // a real apply changes the data — refresh candidates so the list stays accurate
      if (!dryRun) await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Merge failed');
    } finally {
      setBusy(false);
    }
  }

  const customValid = customSource.trim() !== '' && customTarget.trim() !== '' && customSource.trim() !== customTarget.trim();
  const customMerge = () => [{ canonical: customTarget.trim(), legacy: [customSource.trim()], rule: customRule }];
  const targetExists = variables.some((v) => v.name === customTarget.trim());

  const safeCount = candidates.filter((c) => c.recommendation.safe).length;
  const selectAllSafe = () => {
    const next: Record<string, boolean> = {};
    for (const c of candidates) if (c.recommendation.safe) next[c.id] = true;
    setSelected(next);
  };

  if (loading) return <div>Loading merge candidates…</div>;

  return (
    <ColoredCard accentColor="#7c3aed" hoverable={false}>
      <h2 className={styles.heading}>🔀 Variable Merges</h2>
      <p className={styles.intro}>
        {candidates.length} candidate group(s) — {safeCount} safe (no value conflicts). Select the
        merges to apply, preview the exact changes, then apply. Every applied change is backed up to{' '}
        <code>variable_migration_backup</code>.
      </p>

      {error && (
        <div role="alert" className={styles.errorText}>
          {error}
        </div>
      )}

      {/* Custom rename / merge: rename a variable to a NEW name, or merge into any name. */}
      <div className={styles.customForm}>
        <span className={styles.customTitle}>Rename / merge a variable</span>
        <label className={styles.customField}>
          <span>From</span>
          <input
            list="mm-var-list"
            value={customSource}
            onChange={(e) => setCustomSource(e.target.value)}
            placeholder="existing variable"
            aria-label="Source variable to rename or merge from"
          />
        </label>
        <MaterialIcon name="arrow_forward" />
        <label className={styles.customField}>
          <span>To</span>
          <input
            list="mm-var-list"
            value={customTarget}
            onChange={(e) => setCustomTarget(e.target.value)}
            placeholder="new or existing name"
            aria-label="Target variable name (new or existing)"
          />
        </label>
        <label className={styles.ruleLabel}>
          Rule{' '}
          <select value={customRule} onChange={(e) => setCustomRule(e.target.value as ConflictRule)} aria-label="Conflict rule for the custom merge">
            <option value="copy">copy (fill empty)</option>
            <option value="prefer-canonical">prefer target</option>
            <option value="sum">sum</option>
          </select>
        </label>
        <span className={styles.customHint}>
          {customTarget.trim() && (targetExists ? 'merge into existing' : 'rename → new name')}
        </span>
        <button className="btn btn-small btn-secondary" type="button" disabled={busy || !customValid} onClick={() => run(true, customMerge())}>
          Preview
        </button>
        <button className="btn btn-small btn-primary" type="button" disabled={busy || !customValid} onClick={() => run(false, customMerge())}>
          Apply
        </button>
      </div>
      <datalist id="mm-var-list">
        {variables.map((v) => (
          <option key={v.name} value={v.name}>{`${v.name} (${v.events})`}</option>
        ))}
      </datalist>

      <div className={styles.toolbar}>
        <button className="btn btn-small btn-secondary" onClick={selectAllSafe} type="button">
          Select all safe ({safeCount})
        </button>
        <button className="btn btn-small btn-secondary" onClick={() => setSelected({})} type="button">
          Clear
        </button>
        <span className={styles.spacer} />
        <button
          className="btn btn-small btn-secondary"
          onClick={() => run(true)}
          disabled={busy || selectedMerges.length === 0}
          type="button"
        >
          Preview{selectedMerges.length ? ` (${selectedMerges.length})` : ''}
        </button>
        <button
          className="btn btn-small btn-primary"
          onClick={() => run(false)}
          disabled={busy || selectedMerges.length === 0}
          type="button"
        >
          Apply selected
        </button>
      </div>

      <div className={styles.list}>
        {candidates.map((c) => (
          <div key={c.id} className={styles.row} data-selected={selected[c.id] ? 'true' : 'false'}>
            <UnifiedCheckboxField
              id={`merge-${c.id}`}
              label={`Merge into ${c.canonical}`}
              checked={!!selected[c.id]}
              onChange={(v: boolean) => setSelected((prev) => ({ ...prev, [c.id]: v }))}
            />
            <div className={styles.rowMain}>
              <div className={styles.pillRow}>
                {c.legacy.map((l) => (
                  <Pill key={l}>{l}</Pill>
                ))}
                <MaterialIcon name="arrow_forward" />
                <Pill tone="primary">{c.canonical}</Pill>
                <Pill tone={c.recommendation.safe ? 'good' : 'warn'}>
                  {c.recommendation.safe ? 'safe' : `${c.counts.conflict} conflicts`}
                </Pill>
                <Pill>{KIND_LABEL[c.kind]}</Pill>
                {c.usedInReports.length > 0 && <Pill>reports: {c.usedInReports.join(', ')}</Pill>}
              </div>
              <div className={styles.note}>
                {c.recommendation.note} · fills {c.counts.legacyOnly} · already-match {c.counts.both}
              </div>
            </div>
            <label className={styles.ruleLabel}>
              Rule{' '}
              <select
                value={rules[c.id] || 'copy'}
                onChange={(e) => setRules((prev) => ({ ...prev, [c.id]: e.target.value as ConflictRule }))}
                aria-label={`Conflict rule for merging into ${c.canonical}`}
              >
                <option value="copy">copy (fill empty)</option>
                <option value="prefer-canonical">prefer canonical</option>
                <option value="sum">sum</option>
              </select>
            </label>
          </div>
        ))}
        {candidates.length === 0 && (
          <div className={styles.emptyText}>
            No merge candidates found — the variable set is already normalized. 🎉
          </div>
        )}
      </div>

      {result && (
        <FormModal
          isOpen
          onClose={() => setResult(null)}
          title={resultMode === 'preview' ? 'Merge preview (no changes made)' : 'Merge applied'}
          onSubmit={() => setResult(null)}
          submitText="Close"
        >
          <p>
            {resultMode === 'preview'
              ? `Dry run: ${result.changes.reduce((a, c) => a + c.eventsTouched, 0)} event(s) would change across ${result.changes.length} merge(s). No data was modified.`
              : `Applied: ${result.applied} event(s) changed across ${result.changes.length} merge(s). Backups saved to variable_migration_backup.`}
          </p>
          <ul>
            {result.changes.map((ch, i) => (
              <li key={i}>
                <code>{ch.legacy.join(', ')}</code> → <code>{ch.canonical}</code> ({ch.rule}):{' '}
                {ch.eventsTouched} event(s)
              </li>
            ))}
          </ul>
          {result.conflicts.length > 0 && (
            <div className={styles.conflictNote}>
              ⚠️ {result.conflicts.length} value conflict(s) handled by the chosen rule (both names held
              different values). The prior values are in the backup collection.
            </div>
          )}
        </FormModal>
      )}
    </ColoredCard>
  );
}
