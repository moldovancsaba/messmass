/**
 * OPS-SEC-02: Formula evaluator against production-like datasets
 *
 * WHAT: Run evaluateFormula / evaluateFormulaSafe with stats that resemble production
 *       (many fields, zeros, typical ranges) and capture failure cases (NA).
 * WHY: Regression baseline and safety: ensure formula engine behaves predictably
 *      on real-world data; document failure cases for follow-up.
 */

import { evaluateFormula, evaluateFormulaSafe } from '@/lib/formulaEngine';

type StatsLike = Record<string, number | undefined>;

function productionLikeStats(overrides: Partial<StatsLike> = {}): StatsLike {
  return {
    remoteImages: 45,
    hostessImages: 30,
    selfies: 20,
    indoor: 120,
    outdoor: 80,
    stadium: 500,
    female: 350,
    male: 350,
    genAlpha: 50,
    genYZ: 200,
    genX: 250,
    boomer: 200,
    merched: 80,
    jersey: 25,
    scarf: 15,
    flags: 20,
    baseballCap: 10,
    other: 10,
    approvedImages: 90,
    rejectedImages: 5,
    eventAttendees: 1200,
    eventTicketPurchases: 900,
    eventResultHome: 2,
    eventResultVisitor: 1,
    marketingOptin: 400,
    uniqueUsers: 600,
    totalFans: 700,
    allImages: 95,
    remoteFans: 200,
    ...overrides,
  };
}

describe('Formula engine – production-like data (OPS-SEC-02)', () => {
  describe('evaluateFormula', () => {
    it('returns single variable value', () => {
      const stats = productionLikeStats();
      expect(evaluateFormula('[female]', stats as any)).toBe(350);
      expect(evaluateFormula('[male]', stats as any)).toBe(350);
      expect(evaluateFormula('[stadium]', stats as any)).toBe(500);
    });

    it('returns 0 for missing variable (not NA)', () => {
      const stats = productionLikeStats();
      expect(evaluateFormula('[nonexistent]', stats as any)).toBe(0);
    });

    it('evaluates arithmetic expressions', () => {
      const stats = productionLikeStats();
      expect(evaluateFormula('[female] + [male]', stats as any)).toBe(700);
      expect(evaluateFormula('[female] / [male]', stats as any)).toBe(1);
      expect(evaluateFormula('[indoor] + [outdoor]', stats as any)).toBe(200);
    });

    it('returns NA for division by zero (literal 0 divisor)', () => {
      const stats = productionLikeStats({ male: 0 });
      const result = evaluateFormula('[female] / [male]', stats as any);
      expect(result).toBe('NA');
    });

    it('handles percentage-style formula', () => {
      const stats = productionLikeStats({ female: 100, male: 100 });
      const result = evaluateFormula('([female] / ([female] + [male])) * 100', stats as any);
      expect(typeof result).toBe('number');
      expect(result).toBe(50);
    });

    it('handles sparse stats (partial object)', () => {
      const stats = { female: 10, male: 20 };
      expect(evaluateFormula('[female] + [male]', stats as any)).toBe(30);
      expect(evaluateFormula('[remoteImages]', stats as any)).toBe(0);
    });

    it('handles empty stats', () => {
      const result = evaluateFormula('[female]', {} as any);
      expect(result).toBe(0);
    });

    it('handles formula that becomes numeric after substitution', () => {
      const stats = productionLikeStats();
      expect(evaluateFormula('[female]', stats as any)).toBe(350);
      expect(evaluateFormula('100', stats as any)).toBe(100);
    });
  });

  describe('evaluateFormulaSafe (enriched stats)', () => {
    it('enriches derived metrics and evaluates', () => {
      const stats = { indoor: 50, outdoor: 30 };
      const result = evaluateFormulaSafe('[indoor] + [outdoor]', stats as any);
      expect(result).toBe(80);
    });

    it('returns NA for invalid expression without throwing', () => {
      const stats = productionLikeStats();
      const result = evaluateFormulaSafe('1/0', stats as any);
      expect(result).toBe('NA');
    });
  });

  describe('failure cases captured (NA or edge)', () => {
    const cases: Array<{ name: string; formula: string; stats: StatsLike; expected: number | 'NA' }> = [
      { name: 'division by zero literal', formula: '1/0', stats: productionLikeStats(), expected: 'NA' },
      { name: 'division by zero from var', formula: '[female]/[male]', stats: productionLikeStats({ male: 0 }), expected: 'NA' },
      { name: 'valid percentage', formula: '([female]/([female]+[male]))*100', stats: productionLikeStats({ female: 25, male: 75 }), expected: 25 },
    ];

    cases.forEach(({ name, formula, stats, expected }) => {
      it(name, () => {
        const result = evaluateFormula(formula, stats as any);
        expect(result).toBe(expected);
      });
    });
  });
});
