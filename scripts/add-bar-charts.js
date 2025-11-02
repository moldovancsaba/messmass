// scripts/add-bar-charts.js
// WHAT: Insert 5 new Bar Chart Configurations (exactly 5 elements each) into 'chartConfigurations'.
// WHY: Provide actionable multi-category insights that are editable in Admin → Charts.
// RULES:
// - Reuse scripts/config.js for env
// - Bar charts must have exactly 5 elements (API validation)
// - Use AVAILABLE_VARIABLES from lib/chartConfigTypes.ts
// - Insert only if chartId is new
// - Assign order after current max; ISO 8601 timestamps with ms
// - Include descriptions per documentation standards

const { MongoClient } = require('mongodb')
const config = require('./config')

async function main() {
  const client = new MongoClient(config.mongodbUri)
  const now = new Date().toISOString()
  try {
    console.log('🔗 Connecting to MongoDB...')
    await client.connect()
    const db = client.db(config.dbName)
    const collection = db.collection('chart_configurations')

    const existing = await collection.find({}, { projection: { order: 1, chartId: 1 } }).toArray()
    const maxOrder = existing.reduce((m, d) => Math.max(m, Number(d.order || 0)), 0)
    const existingIds = new Set(existing.map(d => d.chartId))

    const BARS = [
      // 1) Merchandise Items Mix (Counts)
      {
        chartId: 'merch-items-mix',
        title: 'Merch Items Mix (Counts)',
        emoji: '🛒',
        elements: [
          { id: 'jersey', label: 'Jersey', formula: '[JERSEY]', color: '#7b68ee', description: 'Number of jerseys' },
          { id: 'scarf', label: 'Scarf', formula: '[SCARF]', color: '#ff6b9d', description: 'Number of scarfs' },
          { id: 'flags', label: 'Flags', formula: '[FLAGS]', color: '#ffa726', description: 'Number of flags' },
          { id: 'baseball-cap', label: 'Baseball Cap', formula: '[BASEBALL_CAP]', color: '#66bb6a', description: 'Number of caps' },
          { id: 'other', label: 'Other', formula: '[OTHER]', color: '#ef5350', description: 'Other merch items' }
        ]
      },
      // 2) Social Platform Visits
      {
        chartId: 'social-platform-visits',
        title: 'Social Platform Visits',
        emoji: '📱',
        elements: [
          { id: 'facebook', label: 'Facebook', formula: '[VISIT_FACEBOOK]', color: '#1877f2', description: 'Facebook referral visits' },
          { id: 'instagram', label: 'Instagram', formula: '[VISIT_INSTAGRAM]', color: '#e1306c', description: 'Instagram referral visits' },
          { id: 'youtube', label: 'YouTube', formula: '[VISIT_YOUTUBE]', color: '#ff0000', description: 'YouTube referral visits' },
          { id: 'tiktok', label: 'TikTok', formula: '[VISIT_TIKTOK]', color: '#69c9d0', description: 'TikTok referral visits' },
          { id: 'x', label: 'X (Twitter)', formula: '[VISIT_X]', color: '#111111', description: 'X (Twitter) referral visits' }
        ]
      },
      // 3) Fan Distribution Extended
      {
        chartId: 'fan-distribution-extended',
        title: 'Fan Distribution Extended',
        emoji: '👥',
        elements: [
          { id: 'indoor', label: 'Indoor', formula: '[INDOOR]', color: '#3b82f6', description: 'Fans in indoor areas' },
          { id: 'outdoor', label: 'Outdoor', formula: '[OUTDOOR]', color: '#f97316', description: 'Fans in outdoor areas' },
          { id: 'stadium', label: 'Stadium', formula: '[STADIUM]', color: '#22c55e', description: 'Fans at stadium' },
          { id: 'merched', label: 'Merched', formula: '[MERCHED]', color: '#8b5cf6', description: 'Fans wearing merch' },
          { id: 'non-merched', label: 'Non‑Merched', formula: '([INDOOR] + [OUTDOOR] + [STADIUM]) - [MERCHED]', color: '#9ca3af', description: 'Fans without merch' }
        ]
      },
      // 4) Content Pipeline Overview
      {
        chartId: 'content-pipeline',
        title: 'Content Pipeline Overview',
        emoji: '🧵',
        elements: [
          { id: 'remote', label: 'Remote', formula: '[REMOTE_IMAGES]', color: '#0ea5e9', description: 'Remote images by fans' },
          { id: 'hostess', label: 'Hostess', formula: '[HOSTESS_IMAGES]', color: '#a78bfa', description: 'Hostess-captured images' },
          { id: 'selfies', label: 'Selfies', formula: '[SELFIES]', color: '#f59e0b', description: 'Selfies captured' },
          { id: 'approved', label: 'Approved', formula: '[APPROVED_IMAGES]', color: '#22c55e', description: 'Approved assets' },
          { id: 'rejected', label: 'Rejected', formula: '[REJECTED_IMAGES]', color: '#ef4444', description: 'Rejected assets' }
        ]
      },
      // 5) Activation Funnel Overview
      {
        chartId: 'activation-funnel',
        title: 'Activation Funnel Overview',
        emoji: '🧭',
        elements: [
          { id: 'images-total', label: 'Total Images', formula: '([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES])', color: '#06b6d4', description: 'Total created content' },
          { id: 'social', label: 'Social Interactions', formula: '[SOCIAL_VISIT]', color: '#8b5cf6', description: 'Total social visits' },
          { id: 'direct-other', label: 'Direct/QR/Web', formula: '[VISIT_QR_CODE] + [VISIT_SHORT_URL] + [VISIT_WEB]', color: '#22c55e', description: 'Direct, QR, short URL & web visits' },
          { id: 'vp-visits', label: 'VP Visits', formula: '[EVENT_VALUE_PROPOSITION_VISITED]', color: '#fbbf24', description: 'Visits to value proposition' },
          { id: 'purchases', label: 'Purchases', formula: '[EVENT_VALUE_PROPOSITION_PURCHASES]', color: '#ef4444', description: 'Completed purchases' }
        ]
      }
    ]

    let next = maxOrder + 1
    const toInsert = BARS
      .filter(c => !existingIds.has(c.chartId))
      .map(c => ({
        chartId: c.chartId,
        title: c.title,
        type: 'bar',
        order: next++,
        isActive: true,
        emoji: c.emoji,
        elements: c.elements,
        showTotal: true,
        totalLabel: 'Total',
        createdAt: now,
        updatedAt: now,
        createdBy: 'script:add-bar-charts'
      }))

    if (toInsert.length === 0) {
      console.log('ℹ️ All target bar chartIds already exist. No inserts executed.')
      return
    }

    const res = await collection.insertMany(toInsert)
    console.log(`✅ Inserted ${res.insertedCount} bar chart configuration(s).`)
    toInsert.forEach(c => console.log(`• [${c.order}] ${c.chartId} — ${c.title}`))
  } catch (err) {
    console.error('❌ Failed to insert bar charts:', err)
    process.exitCode = 1
  } finally {
    await client.close()
    console.log('🔌 MongoDB connection closed.')
  }
}

main()

