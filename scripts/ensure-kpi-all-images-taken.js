// scripts/ensure-kpi-all-images-taken.js
// Ensures a KPI chart configuration exists for 'all-images-taken' with [SEYUTOTALIMAGES]

const { MongoClient } = require('mongodb')
const config = require('./config')

async function run() {
  const client = new MongoClient(config.mongodbUri)
  const now = new Date().toISOString()
  try {
    await client.connect()
    const db = client.db(config.dbName)
    const col = db.collection('chart_configurations')

    const existing = await col.findOne({ chartId: 'all-images-taken' })
    const setDoc = {
      chartId: 'all-images-taken',
      title: '📸 Total Images',
      type: 'kpi',
      order: 1,
      isActive: true,
      emoji: '📸',
      elements: [
        { id: 'kpi', label: 'Total Images', formula: '[SEYUTOTALIMAGES]', color: '#3b82f6' }
      ],
      showTotal: false,
      totalLabel: undefined,
      updatedAt: now,
    }

    await col.updateOne(
      { chartId: 'all-images-taken' },
      { $set: setDoc, $setOnInsert: { createdAt: now } },
      { upsert: true }
    )

    console.log('✅ Ensured KPI chart: all-images-taken')
  } catch (e) {
    console.error('❌ Failed to ensure KPI chart:', e)
    process.exitCode = 1
  } finally {
    await client.close()
  }
}

if (require.main === module) run()
