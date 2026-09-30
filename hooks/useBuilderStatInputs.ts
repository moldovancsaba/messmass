/* WHAT: The inputs of the Builder-mode chart editors (ChartBuilderKPI, Bar,
 *     Pie, ValueChain): one text per formula variable, kept in step with the
 *     event's stats, and committed on blur only when the operator changed it.
 * WHY: Leaving an input used to save a value whenever the stat was not a
 *     number -- also when nothing had been typed. For a nested token such as
 *     [fanmass.peopleCount] (fanmass owns those values; formulas read them
 *     from stats.fanmass) that saved a flat 'fanmass.peopleCount': 0, which
 *     PUT /api/projects refuses, and every later save of that device was held
 *     behind it. For a stat this editor's copy did not have yet (a fanmass
 *     mirror synced after the editor loaded), it wrote 0 over the stored
 *     value. A server change arriving while an input was focused also
 *     replaced what was being typed.
 * HOW: A nested (dotted) variable is shown read-only, from its nested value.
 *     The text an input shows when it gains focus is remembered; on blur the
 *     input commits only if its text differs from that. The focused input is
 *     not overwritten when the stats change; left unchanged, it shows the
 *     stored value again on blur. */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// WHAT: May the builder write this variable? Not a nested token: those are
//     owned by the integration that fills them, and cannot be stored as one
//     stat key anyway.
export function isBuilderEditableVariable(name: string): boolean {
  return !name.includes('.');
}

// WHAT: The value a formula variable reads: a flat stat, or a nested one for
//     a dotted token ([fanmass.peopleCount] -> stats.fanmass.peopleCount).
export function readBuilderStat(stats: Record<string, unknown>, name: string): unknown {
  if (Object.prototype.hasOwnProperty.call(stats, name)) return stats[name];
  if (!name.includes('.')) return undefined;
  return name.split('.').reduce<unknown>(
    (node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined),
    stats
  );
}

const textOf = (value: unknown, empty: string) =>
  value !== undefined && value !== null && typeof value !== 'object' ? String(value) : empty;

export function useBuilderStatInputs(stats: Record<string, unknown>, variables: string[], emptyText: string) {
  // The callers build `variables` anew on every render; compared by value, so
  // the sync below runs when the list or the stats change, not on every render.
  const variablesKey = variables.join('\u0000');
  const keys = useMemo(() => (variablesKey ? variablesKey.split('\u0000') : []), [variablesKey]);

  const [texts, setTexts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const key of variables) initial[key] = textOf(readBuilderStat(stats, key), emptyText);
    return initial;
  });
  // The input being edited and the text it showed when it gained focus.
  const focusedRef = useRef<{ key: string; text: string } | null>(null);

  // A stored value changed (a save, a re-fetch): show it, except in the input
  // being typed in. The state is left as it is when nothing differs.
  useEffect(() => {
    setTexts((prev) => {
      let next: Record<string, string> | null = null;
      for (const key of keys) {
        if (focusedRef.current?.key === key) continue;
        const text = textOf(readBuilderStat(stats, key), emptyText);
        if (prev[key] !== text) {
          next = next ?? { ...prev };
          next[key] = text;
        }
      }
      return next ?? prev;
    });
  }, [stats, keys, emptyText]);

  const setText = useCallback((key: string, text: string) => {
    setTexts((prev) => ({ ...prev, [key]: text }));
  }, []);

  const onFocus = useCallback(
    (key: string) => {
      focusedRef.current = { key, text: texts[key] ?? emptyText };
    },
    [texts, emptyText]
  );

  // The text to commit when `key` loses focus, or null when the operator did
  // not change it (or it is not editable).
  // WHAT: Left unchanged, the input shows the stored value again.
  // WHY: The sync above skips the focused input, so a newer value that
  //     arrived while it had focus was never shown: the input kept the older
  //     text, the next focus took that as its starting point, and typing the
  //     stored-over number back in counted as no change and saved nothing.
  //     Same rule as ReportTextSlot in components/ReportContentManager.tsx.
  const takeEdit = useCallback(
    (key: string): string | null => {
      const focused = focusedRef.current;
      focusedRef.current = null;
      if (!focused || focused.key !== key) return null;
      const text = texts[key] ?? emptyText;
      if (isBuilderEditableVariable(key) && text !== focused.text) return text;
      const stored = textOf(readBuilderStat(stats, key), emptyText);
      if (text !== stored) setTexts((prev) => ({ ...prev, [key]: stored }));
      return null;
    },
    [texts, stats, emptyText]
  );

  return { texts, setText, onFocus, takeEdit };
}

// WHAT: The number a numeric builder input commits, or null for none: its
//     text parsed (empty is 0, never below 0 unless allowed), and nothing when
//     that is the number already stored.
export function numericBuilderValue(text: string, current: unknown, allowNegative = false): number | null {
  const parsed = text === '' ? 0 : parseFloat(text);
  if (!Number.isFinite(parsed)) return null;
  const value = allowNegative ? parsed : Math.max(0, parsed);
  if (typeof current === 'number' && current === value) return null;
  return value;
}
