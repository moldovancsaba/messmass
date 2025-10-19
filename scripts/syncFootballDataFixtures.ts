// scripts/syncFootballDataFixtures.ts
// WHAT: Background/manual sync for Football-Data.org fixtures
// WHY: Populate local cache and match fixtures to partners for planning workflows

import 'dotenv/config';
import { importFixtures, matchFixturesToPartners, autoCreateDraftsFromFixtures } from '@/lib/fixtureImporter';
import { nowIsoMs } from '@/lib/footballDataApi';

function addDays(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const from = d.toISOString().slice(0, 10); // YYYY-MM-DD
  const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  end.setUTCHours(23, 59, 59, 999);
  const to = end.toISOString().slice(0, 10);
  return `${from}|${to}`;
}

async function run() {
  const start = Date.now();
  const [dateFrom, dateTo] = addDays(30).split('|');

  // Default competition targets (free-tier common comps)
  const competitions: Array<string | number> = ['PL', 'PD', 'SA', 'BL1', 'FL1', 'BSA', 'CL'];

  const results: any[] = [];
  for (const c of competitions) {
    const res = await importFixtures(c, { status: 'SCHEDULED', dateFrom, dateTo });
    results.push({ competition: c, ...res });
    // Small gap to respect rate limiting across competitions
    await new Promise((r) => setTimeout(r, 500));
  }

  const matching = await matchFixturesToPartners();

  // Auto-create draft projects for fixtures where home partner exists
  let drafts = { created: 0 } as any;
  try {
    drafts = await autoCreateDraftsFromFixtures();
  } catch (e) {
    drafts = { created: 0, error: (e as Error).message };
  }

  const duration = Date.now() - start;
  console.log(JSON.stringify({
    jobType: 'football_data_sync',
    status: 'success',
    startTime: nowIsoMs(),
    endTime: nowIsoMs(),
    duration,
    results,
    matching,
    drafts,
  }, null, 2));
}

run().catch((err) => {
  console.error('❌ Football-Data sync failed', err);
  process.exit(1);
});
