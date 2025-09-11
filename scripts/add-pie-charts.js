// scripts/add-pie-charts.js
// WHAT: Insert 10 new Pie Chart Configurations (each with exactly 2 elements) into 'chartConfigurations'.
// WHY: Provide creative A/B breakdowns that surface actionable insights, editable in Admin → Charts.
// RULES CONSIDERED:
// - Reuse scripts/config.js to load MongoDB env
// - Pie charts must have exactly 2 elements (per API validation rules)
// - Use AVAILABLE_VARIABLES names from lib/chartConfigTypes.ts
// - Insert only if chartId does not exist
// - Order assigned after current max
// - ISO 8601 timestamps with milliseconds
// - Include explanatory descriptions per project documentation standards

const { MongoClient } = require('mongodb')
const config = require('./config')

async function main() {
  const client = new MongoClient(config.mongodbUri)
  const now = new Date().toISOString()
  try {
    console.log('🔗 Connecting to MongoDB...')
    await client.connect()
    const db = client.db(config.dbName)
    const collection = db.collection('chartConfigurations')

    const existing = await collection.find({}, { projection: { order: 1, chartId: 1 } }).toArray()
    const maxOrder = existing.reduce((m, d) => Math.max(m, Number(d.order || 0)), 0)
    const existingIds = new Set(existing.map(d => d.chartId))

    // 10 two-segment pie charts
    const PIES = [
      {
        chartId: 'merch-vs-nonmerch',
        title: 'Merch vs Non‑Merch Fans',
        emoji: '🧢',
        elements: [
          { id: 'merched', label: 'Merched', formula: '[MERCHED]', color: '#10b981', description: 'Fans wearing any merchandise' },
          { id: 'non-merched', label: 'Non‑Merched', formula: '([INDOOR] + [OUTDOOR] + [STADIUM]) - [MERCHED]', color: '#9ca3af', description: 'Fans without visible merchandise' }
        ]
      },
      {
        chartId: 'hostess-vs-fan-images',
        title: 'Hostess vs Fan Images',
        emoji: '📸',
        elements: [
          { id: 'hostess-images', label: 'Hostess', formula: '[HOSTESS_IMAGES]', color: '#8b5cf6', description: 'Photos captured by hostesses' },
          { id: 'fan-images', label: 'Fan‑Captured', formula: '[REMOTE_IMAGES] + [SELFIES]', color: '#f59e0b', description: 'Remote shots and selfies created by fans' }
        ]
      },
      {
        chartId: 'approval-split',
        title: 'Approved vs Rejected Images',
        emoji: '✅',
        elements: [
          { id: 'approved', label: 'Approved', formula: '[APPROVED_IMAGES]', color: '#22c55e', description: 'Images approved after moderation' },
          { id: 'rejected', label: 'Rejected', formula: '[REJECTED_IMAGES]', color: '#ef4444', description: 'Images rejected during moderation' }
        ]
      },
      {
        chartId: 'indoor-vs-outdoor',
        title: 'Indoor vs Outdoor Fans',
        emoji: '🏟️',
        elements: [
          { id: 'indoor', label: 'Indoor', formula: '[INDOOR]', color: '#3b82f6', description: 'Fans counted from indoor areas' },
          { id: 'outdoor', label: 'Outdoor', formula: '[OUTDOOR]', color: '#f97316', description: 'Fans counted from outdoor areas' }
        ]
      },
      {
        chartId: 'apparel-vs-accessories',
        title: 'Apparel vs Accessories',
        emoji: '🎽',
        elements: [
          { id: 'apparel', label: 'Apparel', formula: '[JERSEY]', color: '#7b68ee', description: 'Jerseys sold (items)' },
          { id: 'accessories', label: 'Accessories', formula: '[SCARF] + [FLAGS] + [BASEBALL_CAP] + [OTHER]', color: '#06b6d4', description: 'Scarfs, flags, caps, and other merch (items)' }
        ]
      },
      {
        chartId: 'social-vs-direct',
        title: 'Social vs Direct Traffic',
        emoji: '🌐',
        elements: [
          { id: 'social', label: 'Social', formula: '[SOCIAL_VISIT]', color: '#0ea5e9', description: 'Visits from social media platforms' },
          { id: 'direct-other', label: 'Direct/Other', formula: '[VISIT_QR_CODE] + [VISIT_SHORT_URL] + [VISIT_WEB]', color: '#a78bfa', description: 'QR, short URL, and web sources' }
        ]
      },
      {
        chartId: 'vp-funnel',
        title: 'Value Prop: Buyers vs Browsers',
        emoji: '💳',
        elements: [
          { id: 'purchases', label: 'Purchases', formula: '[EVENT_VALUE_PROPOSITION_PURCHASES]', color: '#10b981', description: 'Completed value proposition purchases' },
          { id: 'browsers', label: 'Browsers', formula: '[EVENT_VALUE_PROPOSITION_VISITED] - [EVENT_VALUE_PROPOSITION_PURCHASES]', color: '#f59e0b', description: 'Visited but did not purchase' }
        ]
      },
      {
        chartId: 'match-result-share',
        title: 'Match Result Share',
        emoji: '⚽',
        elements: [
          { id: 'home', label: 'Home', formula: '[EVENT_RESULT_HOME]', color: '#22c55e', description: 'Home team result' },
          { id: 'visitor', label: 'Visitor', formula: '[EVENT_RESULT_VISITOR]', color: '#ef4444', description: 'Visitor team result' }
        ]
      },
      {
        chartId: 'engaged-share',
        title: 'Engaged vs Not Engaged',
        emoji: '🤝',
        elements: [
          { id: 'engaged', label: 'Engaged', formula: '([INDOOR] + [OUTDOOR] + [STADIUM])', color: '#10b981', description: 'Fans interacting (indoor + outdoor + stadium)' },
          { id: 'not-engaged', label: 'Not Engaged', formula: '[EVENT_ATTENDEES] - ([INDOOR] + [OUTDOOR] + [STADIUM])', color: '#9ca3af', description: 'Attendees not captured as fans' }
        ]
      },
      {
        chartId: 'qr-vs-short',
        title: 'QR vs Short URL',
        emoji: '🔗',
        elements: [
          { id: 'qr', label: 'QR Code', formula: '[VISIT_QR_CODE]', color: '#3b82f6', description: 'Visits from QR codes' },
          { id: 'short-url', label: 'Short URL', formula: '[VISIT_SHORT_URL]', color: '#f59e0b', description: 'Visits from short links' }
        ]
      }
    ]

    let next = maxOrder + 1
    const toInsert = PIES
      .filter(c => !existingIds.has(c.chartId))
      .map(c => ({
        chartId: c.chartId,
        title: c.title,
        type: 'pie',
        order: next++,
        isActive: true,
        emoji: c.emoji,
        elements: c.elements,
        createdAt: now,
        updatedAt: now,
        createdBy: 'script:add-pie-charts'
      }))

    if (toInsert.length === 0) {
      console.log('ℹ️ All target pie chartIds already exist. No inserts executed.')
      return
    }

    const res = await collection.insertMany(toInsert)
    console.log(`✅ Inserted ${res.insertedCount} pie chart configuration(s).`)
    toInsert.forEach(c => console.log(`• [${c.order}] ${c.chartId} — ${c.title}`))
  } catch (err) {
    console.error('❌ Failed to insert pie charts:', err)
    process.exitCode = 1
  } finally {
    await client.close()
    console.log('🔌 MongoDB connection closed.')
  }
}

main()

