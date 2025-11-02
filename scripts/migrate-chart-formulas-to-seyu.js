// scripts/migrate-chart-formulas-to-seyu.js
// What: One-off migration to rewrite chart configuration formulas to SEYU-prefixed tokens
// Why: Standardize references across the system and prepare for multi-organization naming
// Safe by design: only rewrites bracketed tokens; preserves all other text; updates updatedAt timestamp.

/*
Rules implemented:
- Prefix with SEYU and remove underscores by default: [REMOTE_IMAGES] → [SEYUREMOTEIMAGES]
- ALL → TOTAL where applicable (handled through explicit map for ALLIMAGES)
- VISITED → VISIT
- Reorder VISIT* → *VISIT: [VISIT_QR_CODE] → [SEYUQRCODEVISIT], [VISIT_SHORT_URL] → [SEYUSHORTURLVISIT], [VISIT_WEB] → [SEYUWEBVISIT]
- Add FANS or MERCH prefixes where specified:
  - STADIUM → STADIUMFANS
  - MERCHED → MERCHEDFANS
  - SCARF → MERCHSCARF
  - JERSEY → MERCHJERSEY
- Event mappings:
  - EVENT_ATTENDEES → ATTENDEES
  - EVENT_RESULT_HOME → RESULTHOME
  - EVENT_RESULT_VISITOR → RESULTVISITOR
  - EVENT_VALUE_PROPOSITION_VISITED → PROPOSITIONVISIT
  - EVENT_VALUE_PROPOSITION_PURCHASES → PROPOSITIONPURCHASE
- Totals / computed aliases
  - TOTAL_FANS → TOTALFANS
  - REMOTE_FANS → REMOTEFANS
  - ALL_IMAGES / ALLIMAGES → TOTALIMAGES
  - TOTAL_UNDER_40 → TOTALUNDER40
  - TOTAL_OVER_40 → TOTALOVER40

Notes:
- Idempotent: running multiple times yields same formulas.
- Backup: You may export the chartConfigurations collection before running if desired.
*/

const { MongoClient, ObjectId } = require('mongodb')
const path = require('path')
const dotenv = require('dotenv')
const config = require('./config')

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const ORG_PREFIX = 'SEYU'

function stripOrgPrefix(token) {
  const t = token.toUpperCase()
  return t.startsWith(ORG_PREFIX) ? t.slice(ORG_PREFIX.length) : t
}

function toNormalizedBase(token) {
  // Remove org prefix and underscores
  const noOrg = stripOrgPrefix(token)
  return noOrg.replace(/_/g, '')
}

// Explicit token transformations on normalized base (no underscores)
function transformNormalizedBase(base) {
  let b = base

  // Replace VISITED → VISIT
  b = b.replace(/VISITED\b/g, 'VISIT')

  // Reorder VISIT* → *VISIT
  b = b.replace(/^VISIT(.+)$/, '$1VISIT')

  // Add FANS or MERCH prefixes where requested
  if (b === 'STADIUM') b = 'STADIUMFANS'
  if (b === 'MERCHED') b = 'MERCHEDFANS'
  if (b === 'SCARF') b = 'MERCHSCARF'
  if (b === 'JERSEY') b = 'MERCHJERSEY'

  // Event mappings
  if (b === 'EVENTATTENDEES') b = 'ATTENDEES'
  if (b === 'EVENTRESULTHOME') b = 'RESULTHOME'
  if (b === 'EVENTRESULTVISITOR') b = 'RESULTVISITOR'
  if (b === 'EVENTVALUEPROPOSITIONVISITED') b = 'PROPOSITIONVISIT'
  if (b === 'EVENTVALUEPROPOSITIONPURCHASES') b = 'PROPOSITIONPURCHASE'

  // Totals / computed alias normalizations
  if (b === 'TOTALFANS' || b === 'TOTAL_FANS') b = 'TOTALFANS'
  if (b === 'REMOTEFANS' || b === 'REMOTE_FANS') b = 'REMOTEFANS'
  if (b === 'ALLIMAGES' || b === 'ALL_IMAGES') b = 'TOTALIMAGES'
  if (b === 'TOTALUNDER40' || b === 'TOTAL_UNDER_40') b = 'TOTALUNDER40'
  if (b === 'TOTALOVER40' || b === 'TOTAL_OVER_40') b = 'TOTALOVER40'

  return b
}

function transformTokenToSEYU(token) {
  // token is uppercase with underscores, e.g., REMOTE_IMAGES
  // 1) Normalize: remove underscores and org prefix
  const normalized = toNormalizedBase(token)
  // 2) Apply rules/mappings
  const mapped = transformNormalizedBase(normalized)
  // 3) Prefix with ORG
  return `${ORG_PREFIX}${mapped}`
}

function migrateFormula(formula) {
  if (typeof formula !== 'string') return formula
  return formula.replace(/\[([A-Z_]+)\]/g, (_m, token) => {
    const seyu = transformTokenToSEYU(token)
    return `[${seyu}]`
  })
}

async function run() {
  const uri = config.mongodbUri
  const dbName = config.dbName
  const client = new MongoClient(uri)
  const now = new Date().toISOString()

  try {
    await client.connect()
    const db = client.db(dbName)
    const col = db.collection('chart_configurations')

    const docs = await col.find({}).toArray()

    let touched = 0
    for (const doc of docs) {
      if (!Array.isArray(doc.elements)) continue

      let changed = false
      const nextElements = doc.elements.map(el => {
        if (!el || typeof el.formula !== 'string') return el
        const nextFormula = migrateFormula(el.formula)
        if (nextFormula !== el.formula) changed = true
        return { ...el, formula: nextFormula }
      })

      if (changed) {
        await col.updateOne(
          { _id: doc._id },
          { $set: { elements: nextElements, updatedAt: now } }
        )
        touched++
      }
    }

    console.log(`✅ Migration complete. Updated ${touched} chart configuration(s). Timestamp: ${now}`)
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exitCode = 1
  } finally {
    await client.close()
  }
}

if (require.main === module) {
  run()
}
