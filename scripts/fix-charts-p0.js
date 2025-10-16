// scripts/fix-charts-p0.js
// P0 fixes for production chart configurations in MongoDB Atlas
// - Fix engagement formulas
// - Fix Remote vs Event (use fans, not images)
// - Rename merchandise total label
// - Correct value-prop-conversion-rate formula
// - Deactivate duplicate/misleading 'faces' KPI

const { MongoClient } = require('mongodb');
const config = require('./config');

const MONGODB_URI = config.mongodbUri; // From .env.local
const DATABASE_NAME = config.dbName;
const COLLECTION_NAME = 'chartConfigurations';

function nowIso() { return new Date().toISOString(); }

async function main() {
  let client;
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const col = db.collection(COLLECTION_NAME);

    // 1) Fix engagement chart formulas
    console.log('\n▶ Updating engagement chart formulas');
    await col.updateOne(
      { chartId: 'engagement' },
      {
        $set: {
          'elements.0': {
            id: 'engaged',
            label: 'Engaged',
            formula: '([SEYUTOTALFANS]) / [SEYUATTENDEES] * 100',
            color: '#1b1f3c',
            description: 'Fan Engagement %: fans / attendees'
          },
          'elements.1': {
            id: 'interactive',
            label: 'Interactive',
            formula: '([SEYUSOCIALVISIT] + [SEYUPROPOSITIONVISIT] + [SEYUPROPOSITIONPURCHASE]) / ([SEYUTOTALIMAGES]) * 100',
            color: '#00a37c',
            description: 'Interaction % per image: (social + VP visits + purchases) / total images'
          },
          'elements.2': {
            id: 'front-runners',
            label: 'Front-runners',
            formula: '[SEYUMERCHEDFANS] / ([SEYUTOTALFANS]) * 100',
            color: '#2d5780',
            description: 'Merched fans as % of all fans'
          },
          'elements.3': {
            id: 'fanaticals',
            label: 'Fanaticals',
            formula: '([SEYUFLAGS] + [SEYUMERCHSCARF]) / [SEYUMERCHEDFANS] * 100',
            color: '#b82786',
            description: 'Flags & scarfs among merched fans (%)'
          },
          'elements.4': {
            id: 'casuals',
            label: 'Casuals',
            formula: '(([SEYUTOTALFANS]) - [SEYUMERCHEDFANS]) / ([SEYUTOTALFANS]) * 100',
            color: '#0086c7',
            description: 'Non‑merched fans as % of all fans'
          },
          updatedAt: nowIso(),
        }
      }
    );

    // 2) Fix Remote vs Event (fans vs stadium)
    console.log('▶ Updating Remote vs Event pie formulas');
    await col.updateOne(
      { chartId: 'Remote vs Event' },
      {
        $set: {
          'elements.0': {
            id: 'event',
            label: 'Event',
            formula: '[SEYUSTADIUMFANS]',
            color: '#3b82f6',
            description: 'On-site (stadium) fans'
          },
          'elements.1': {
            id: 'remote',
            label: 'Remote',
            formula: '[SEYUREMOTEFANS]',
            color: '#f97316',
            description: 'Remote fans (indoor + outdoor)'
          },
          updatedAt: nowIso(),
        }
      }
    );

    // 3) Rename merchandise total label to "Total items" (avoid revenue implication)
    console.log('▶ Updating merchandise total label');
    await col.updateOne(
      { chartId: 'merchandise' },
      { $set: { totalLabel: 'Total items', updatedAt: nowIso() } }
    );

    // 4) Correct VP conversion formula token
    console.log('▶ Correcting value-prop-conversion-rate formula');
    await col.updateOne(
      { chartId: 'value-prop-conversion-rate' },
      {
        $set: {
          'elements.0.formula': '[SEYUPROPOSITIONPURCHASE] / [SEYUPROPOSITIONVISIT] * 100',
          updatedAt: nowIso(),
        }
      }
    );

    // 5) Deactivate duplicate/misleading "faces" KPI (retain faces-per-image KPI)
    console.log('▶ Deactivating faces KPI');
    await col.updateOne(
      { chartId: 'faces' },
      { $set: { isActive: false, updatedAt: nowIso() } }
    );

    console.log('\n✅ P0 fixes applied.');
  } catch (err) {
    console.error('❌ Error applying P0 fixes:', err);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('✅ Database connection closed');
    }
  }
}

main();
