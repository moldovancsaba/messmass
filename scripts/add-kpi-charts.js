// scripts/add-kpi-charts.js
// WHAT: Insert new KPI Chart Configurations into the 'chartConfigurations' collection.
// WHY: Provide creative KPIs based on available stats/variables, so they are editable in Admin → Charts.
// - Reuses scripts/config.js to load MONGODB_URI and DB name from .env.local
// - Inserts only if a chartId does not already exist (no duplicates)
// - Orders are assigned after the current max order
// - Timestamps use ISO 8601 with milliseconds (project standard)
// - Includes descriptive comments for each KPI per team documentation rules

const { MongoClient } = require('mongodb')
const config = require('./config')

async function main() {
  /**
   * Connect to MongoDB using centralized script config
   * Strategic: Reuse existing config loader to avoid drift with app env handling
   */
  const client = new MongoClient(config.mongodbUri)
  const now = new Date().toISOString() // ISO 8601 with milliseconds
  try {
    console.log('🔗 Connecting to MongoDB...')
    await client.connect()
    const db = client.db(config.dbName)

    // Use the canonical collection name used by API routes
    const collection = db.collection('chart_configurations')

    // Compute next order index based on existing documents
    const existing = await collection.find({}, { projection: { order: 1, chartId: 1 } }).toArray()
    const maxOrder = existing.reduce((max, doc) => Math.max(max, Number(doc.order || 0)), 0)

    // Helper to see if a chartId exists already
    const existingIds = new Set(existing.map((d) => d.chartId))

    // Define new KPI charts (exactly 1 element each per API validation)
    // Each KPI focuses on a valuable derivation from available variables
    const KPIS = [
      {
        chartId: 'remote-fan-share',
        title: 'Remote Fan Share',
        type: 'kpi',
        emoji: '🏠',
        elements: [
          {
            id: 'remote-fan-share-value',
            label: 'Remote fans / All fans (%)',
            // (indoor + outdoor) / (indoor + outdoor + stadium) * 100
            formula: '([INDOOR] + [OUTDOOR]) / ([INDOOR] + [OUTDOOR] + [STADIUM]) * 100',
            color: '#3b82f6',
            description: 'Proportion of fans participating remotely. Useful for remote activation strategy.'
          }
        ]
      },
      {
        chartId: 'merch-adoption-rate',
        title: 'Merch Adoption Rate',
        type: 'kpi',
        emoji: '🧢',
        elements: [
          {
            id: 'merch-adoption-rate-value',
            label: 'Merched fans / All fans (%)',
            formula: '[MERCHED] / ([INDOOR] + [OUTDOOR] + [STADIUM]) * 100',
            color: '#10b981',
            description: 'Percentage of fans wearing merchandise. Core signal for fan loyalty and sales potential.'
          }
        ]
      },
      {
        chartId: 'image-approval-rate',
        title: 'Image Approval Rate',
        type: 'kpi',
        emoji: '✅',
        elements: [
          {
            id: 'image-approval-rate-value',
            label: 'Approved / (Approved + Rejected) (%)',
            formula: '[APPROVED_IMAGES] / ([APPROVED_IMAGES] + [REJECTED_IMAGES]) * 100',
            color: '#8b5cf6',
            description: 'Image quality/compliance funnel health. Indicates moderation performance and usable asset share.'
          }
        ]
      },
      {
        chartId: 'content-capture-rate',
        title: 'Content Capture Rate',
        type: 'kpi',
        emoji: '📸',
        elements: [
          {
            id: 'content-capture-rate-value',
            label: 'Images per 100 attendees',
            formula: '([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES]) / [EVENT_ATTENDEES] * 100',
            color: '#f59e0b',
            description: 'How actively the audience creates content relative to attendance. Normalizes content across event sizes.'
          }
        ]
      },
      {
        chartId: 'youth-audience-share',
        title: 'Youth Audience Share',
        type: 'kpi',
        emoji: '🧑‍🤝‍🧑',
        elements: [
          {
            id: 'youth-audience-share-value',
            label: 'Under 40 / All attendees (%)',
            formula: '([GEN_ALPHA] + [GEN_YZ]) / ([GEN_ALPHA] + [GEN_YZ] + [GEN_X] + [BOOMER]) * 100',
            color: '#06b6d4',
            description: 'Share of younger demographics. Key for brand targeting and premium youth sponsorship inventory.'
          }
        ]
      },
      {
        chartId: 'value-prop-conversion-rate',
        title: 'Value Prop Conversion Rate',
        type: 'kpi',
        emoji: '💳',
        elements: [
          {
            id: 'value-prop-conversion-rate-value',
            label: 'Purchases / VP Visits (%)',
            formula: '[EVENT_VALUE_PROPOSITION_PURCHASES] / [EVENT_VALUE_PROPOSITION_VISITED] * 100',
            color: '#ef4444',
            description: 'Down-funnel conversion efficiency of the campaign value proposition.'
          }
        ]
      },
      {
        chartId: 'social-per-image',
        title: 'Social Interactions per Image',
        type: 'kpi',
        emoji: '💬',
        elements: [
          {
            id: 'social-per-image-value',
            label: 'Social visits / Images',
            formula: '[SOCIAL_VISIT] / ([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES])',
            color: '#3b82f6',
            description: 'Average social interaction density per created image. Signals virality and social pull.'
          }
        ]
      },
      {
        chartId: 'items-per-merched-fan',
        title: 'Items per Merched Fan',
        type: 'kpi',
        emoji: '🎽',
        elements: [
          {
            id: 'items-per-merched-fan-value',
            label: 'Merch items / Merched fans',
            formula: '([JERSEY] + [SCARF] + [FLAGS] + [BASEBALL_CAP] + [OTHER]) / [MERCHED]',
            color: '#7b68ee',
            description: 'Average number of merch items per merched fan. Indicates depth of merch adoption.'
          }
        ]
      }
    ]

    // Build list with order, timestamps, and activity default
    let next = maxOrder + 1
    const toInsert = KPIS
      .filter((k) => !existingIds.has(k.chartId))
      .map((k) => ({
        chartId: k.chartId,
        title: k.title,
        type: 'kpi', // enforced by design here
        order: next++,
        isActive: true,
        elements: k.elements,
        emoji: k.emoji,
        createdAt: now,
        updatedAt: now,
        createdBy: 'script:add-kpi-charts'
      }))

    if (toInsert.length === 0) {
      console.log('ℹ️ All target KPI chartIds already exist. No inserts executed.')
      return
    }

    const res = await collection.insertMany(toInsert)
    console.log(`✅ Inserted ${res.insertedCount} KPI chart configuration(s).`)

    // Print a brief summary
    toInsert.forEach((c) => {
      console.log(`• [${c.order}] ${c.chartId} — ${c.title}`)
    })
  } catch (err) {
    console.error('❌ Failed to insert KPI charts:', err)
    process.exitCode = 1
  } finally {
    await client.close()
    console.log('🔌 MongoDB connection closed.')
  }
}

main()

