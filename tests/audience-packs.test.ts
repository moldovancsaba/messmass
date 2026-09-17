// tests/audience-packs.test.ts
// WHAT: filterReportByAudiencePack -- the actual enforcement mechanism
//     behind messmass#236's audience packs.
// WHY: The one thing this must get right in both directions: an empty
//     allowlist hides everything (least-privilege default, not
//     "unconfigured means unrestricted"), and no pack at all (the ?pack=
//     query param omitted) leaves a report completely untouched, since
//     every existing report/page/integration must be unaffected unless it
//     explicitly opts in.

import { filterReportByAudiencePack, type AudiencePack } from '@/lib/audiencePacks';
import type { Report } from '@/lib/report-resolver';
import { ObjectId } from 'mongodb';

function report(blockIds: string[]): Report {
  return {
    layout: {
      gridColumns: { desktop: 2, tablet: 2, mobile: 1 },
      blocks: blockIds.map((id, i) => ({ id, title: `Block ${id}`, showTitle: true, order: i, charts: [] })),
    },
  } as unknown as Report;
}

function pack(allowedBlockIds: string[]): AudiencePack {
  return {
    _id: new ObjectId(),
    key: 'sponsor',
    name: 'Sponsor / Agency',
    allowedBlockIds,
    createdAt: '2026-09-17T00:00:00.000Z',
    updatedAt: '2026-09-17T00:00:00.000Z',
  };
}

describe('filterReportByAudiencePack', () => {
  it('with no pack, the report is completely unchanged', () => {
    const original = report(['a', 'b', 'c']);
    expect(filterReportByAudiencePack(original, null)).toBe(original);
  });

  it('an empty allowlist hides every block -- least-privilege by default, not "show everything"', () => {
    const result = filterReportByAudiencePack(report(['a', 'b', 'c']), pack([]));
    expect(result.layout.blocks).toHaveLength(0);
  });

  it('only allowlisted blocks survive', () => {
    const result = filterReportByAudiencePack(report(['a', 'b', 'c']), pack(['a', 'c']));
    expect(result.layout.blocks.map((b) => b.id)).toEqual(['a', 'c']);
  });

  it('an allowlist entry with no matching block in the report is simply absent, not an error', () => {
    const result = filterReportByAudiencePack(report(['a']), pack(['a', 'does-not-exist']));
    expect(result.layout.blocks.map((b) => b.id)).toEqual(['a']);
  });

  it('preserves block order for the ones that remain', () => {
    const result = filterReportByAudiencePack(report(['a', 'b', 'c', 'd']), pack(['d', 'a']));
    expect(result.layout.blocks.map((b) => b.id)).toEqual(['a', 'd']);
  });
});
