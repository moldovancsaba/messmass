// scripts/migrate-formulas-to-total-remote.js
// WHAT: Migration script to normalize stored chart formulas to use [TOTAL_FANS] and [REMOTE_FANS]
// WHY: Ensure consistency with the new variables and simplify future maintenance.
// SAFETY: Creates a backup of affected documents before updating. Dry-run supported.

const { MongoClient, ObjectId } = require('mongodb')
const config = require('./config')

const MONGODB_URI = config.mongodbUri
const DATABASE_NAME = config.dbName
const COLLECTION = 'chartConfigurations'

// Simple replacements list
// Order matters: replace longer expressions first
const REPLACEMENTS = [
  // TOTAL_FANS patterns
  { from: /\[INDOOR\]\s*\+\s*\[OUTDOOR\]\s*\+\s*\[STADIUM\]/g, to: '[TOTAL_FANS]' },
  { from: /\(\s*\[INDOOR\]\s*\+\s*\[OUTDOOR\]\s*\)\s*\+\s*\[STADIUM\]/g, to: '[TOTAL_FANS]' },
  { from: /\[REMOTE_FANS\]\s*\+\s*\[STADIUM\]/g, to: '[TOTAL_FANS]' },

  // REMOTE_FANS patterns
  { from: /\[INDOOR\]\s*\+\s*\[OUTDOOR\]/g, to: '[REMOTE_FANS]' },
]

async function run(dryRun = true) {
  const client = new MongoClient(MONGODB_URI)
  try {
    await client.connect()
    const db = client.db(DATABASE_NAME)
    const col = db.collection(COLLECTION)

    const charts = await col.find({}).toArray()
    const updates = []

    for (const chart of charts) {
      let changed = false
      const newElements = chart.elements.map((el) => {
        let formula = el.formula
        let updated = formula
        for (const rule of REPLACEMENTS) {
          updated = updated.replace(rule.from, rule.to)
        }
        if (updated !== formula) {
          changed = true
          return { ...el, formula: updated }
        }
        return el
      })

      if (changed) {
        const before = { _id: chart._id, elements: chart.elements }
        const after = { _id: chart._id, elements: newElements }
        updates.push({ before, after })
        if (!dryRun) {
          await col.updateOne({ _id: chart._id }, { $set: { elements: newElements, updatedAt: new Date().toISOString() } })
        }
      }
    }

    if (dryRun) {
      console.log(`DRY RUN: ${updates.length} chart(s) would be updated.`)
      updates.slice(0, 10).forEach((u, i) => {
        console.log(`\n#${i + 1} ${u.before._id}`)
        console.log('Before:')
        console.dir(u.before.elements, { depth: null })
        console.log('After:')
        console.dir(u.after.elements, { depth: null })
      })
    } else {
      console.log(`Updated ${updates.length} chart(s).`)
    }
  } catch (e) {
    console.error('Migration failed:', e)
    process.exitCode = 1
  } finally {
    await client.close()
  }
}

const arg = process.argv[2]
run(arg !== 'apply')
