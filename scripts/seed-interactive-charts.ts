/**
 * Seed / Sync Interactive & Fanmass Report Chart Algorithms
 *
 * Ensures every Interactive / Fanmass calculation (EMV, opt-in rate, vetting
 * approval rate, consent share, journey completion rate, smiling rate, gender
 * split, age distribution, brand/club exposure, merchandise breakdown, content
 * safety) is registered in `chart_configurations` and its underlying variables
 * are present in `variables_metadata` for /admin/charts.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { MongoClient } from 'mongodb';
import { INTERACTIVE_REPORT_CHART_ALGORITHMS } from '../lib/interactiveReportEmv';
import { ensureFanmassAnalyticsVariables, FANMASS_PHOTO_VARIABLE_NAMES } from '../lib/fanmassAnalyticsVariables';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set');
    process.exit(1);
  }

  const client = await MongoClient.connect(uri);
  try {
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const now = new Date().toISOString();

    await ensureFanmassAnalyticsVariables(db, FANMASS_PHOTO_VARIABLE_NAMES);

    // Ensure Camera counter variables used by interactive report formulas exist in variables_metadata
    const cameraVars = [
      { name: 'camera_images_taken', label: 'Camera: Images taken', type: 'count', category: 'Camera photo stats' },
      { name: 'camera_images_approved', label: 'Camera: Images approved', type: 'count', category: 'Camera photo stats' },
      { name: 'camera_images_rejected', label: 'Camera: Images rejected', type: 'count', category: 'Camera photo stats' },
      { name: 'camera_consents_accepted', label: 'Camera: Consents accepted', type: 'count', category: 'Camera photo stats' },
      { name: 'camera_journey_opens', label: 'Camera: Journey opens', type: 'count', category: 'Camera photo stats' },
      { name: 'camera_journeys_completed', label: 'Camera: Journeys completed', type: 'count', category: 'Camera photo stats' },
    ];
    await db.collection('variables_metadata').bulkWrite(
      cameraVars.map((v, idx) => ({
        updateOne: {
          filter: { name: v.name },
          update: {
            $set: {
              label: v.label,
              type: v.type,
              category: v.category,
              isSystem: true,
              derived: false,
              flags: { visibleInClicker: false, editableInManual: false },
              order: 850 + idx,
              updatedAt: now,
            },
            $setOnInsert: { name: v.name, createdAt: now },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    const col = db.collection('chart_configurations');
    let inserted = 0;
    let updated = 0;

    for (const chart of INTERACTIVE_REPORT_CHART_ALGORITHMS) {
      const existing = await col.findOne({ chartId: chart.chartId });
      if (!existing) {
        await col.insertOne({
          ...chart,
          createdAt: now,
          updatedAt: now,
          createdBy: 'interactive-algorithms-seed',
        });
        inserted++;
      } else if (chart.chartId === 'brand-earned-media-value' && !existing.elements?.[0]?.parameters) {
        await col.updateOne(
          { chartId: chart.chartId },
          {
            $set: {
              elements: chart.elements,
              updatedAt: now,
            },
          },
        );
        updated++;
      }
    }

    console.log(`✅ Interactive chart algorithms synced: ${inserted} inserted, ${updated} parameterized.`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
