// tests/ai-variable-hint.test.ts
// WHAT: The fill-rate hint shown next to AI variables in the chart-formula picker.
// WHY: This hint is the only thing standing between an author and a report built on
//     a variable populated on 2 of 155 events. It must inform without blocking, and
//     must say nothing at all rather than something misleading when data is absent.

// Mirrors the logic in components/ChartAlgorithmManager.tsx. Kept as a pure
// function here because the component is a large client module that pulls in the
// formula engine and the whole admin surface.
interface AiVariableFill {
  name: string;
  eventsWithValue: number;
  eventsTotalConnected: number;
  fillRate: number;
}

const AI_SPARSE_THRESHOLD = 50;

function aiFillHint(row: AiVariableFill | undefined): { text: string; sparse: boolean } | null {
  if (!row || row.eventsTotalConnected <= 0) return null;
  const sparse = row.fillRate < AI_SPARSE_THRESHOLD;
  return {
    sparse,
    text: sparse
      ? `AI · filled on only ${row.eventsWithValue} of ${row.eventsTotalConnected} events — may render empty`
      : `AI · filled on ${row.eventsWithValue} of ${row.eventsTotalConnected} events`,
  };
}

describe('aiFillHint', () => {
  it('says nothing for a non-AI variable', () => {
    // Non-AI variables must look exactly as they did before.
    expect(aiFillHint(undefined)).toBeNull();
  });

  it('says nothing when there are no connected events', () => {
    // "0 of 0 events" would be noise, not information.
    expect(aiFillHint({ name: 'fanmassPeople', eventsWithValue: 0, eventsTotalConnected: 0, fillRate: 0 })).toBeNull();
  });

  it('reports a well-populated variable without alarm', () => {
    const hint = aiFillHint({ name: 'fanmassPeople', eventsWithValue: 155, eventsTotalConnected: 155, fillRate: 100 });
    expect(hint).not.toBeNull();
    expect(hint!.sparse).toBe(false);
    expect(hint!.text).toContain('155 of 155');
  });

  it('cautions on a sparse variable, in words', () => {
    // The real case: merch variables sit at 1.3% on the current estate.
    const hint = aiFillHint({ name: 'fanmassMerchJersey', eventsWithValue: 2, eventsTotalConnected: 155, fillRate: 1.3 });
    expect(hint!.sparse).toBe(true);
    expect(hint!.text).toContain('only 2 of 155');
    expect(hint!.text).toContain('may render empty');
  });

  it('treats the threshold itself as acceptable', () => {
    const hint = aiFillHint({ name: 'fanmassX', eventsWithValue: 50, eventsTotalConnected: 100, fillRate: 50 });
    expect(hint!.sparse).toBe(false);
  });

  it('always states the denominator so the share is unambiguous', () => {
    const hint = aiFillHint({ name: 'fanmassX', eventsWithValue: 7, eventsTotalConnected: 20, fillRate: 35 });
    expect(hint!.text).toMatch(/7 of 20 events/);
  });
});
