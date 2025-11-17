// scripts/alignClickerManagerToKyc.ts
// WHAT: Align existing Clicker Manager (variablesGroups) with KYC variables (variables_metadata)
// WHY: Make prepared groups visible in Clicker by enabling flags and resolving name mismatches
// HOW:
//   1) Load groups and variables
//   2) Resolve each group variable name to metadata (supports with/without "stats." prefix)
//   3) Enable flags.visibleInClicker = true (and legacy root visibleInClicker = true) for those variables
//   4) Force groups.visibleInClicker = true so groups render in Clicker mode

import { MongoClient, Document } from 'mongodb'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'messmass'

function stripStatsPrefix(name: string) {
  return name.startsWith('stats.') ? name.slice(6) : name
}

function addStatsPrefix(name: string) {
  return name.startsWith('stats.') ? name : `stats.${name}`
}

async function run() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set')
    process.exit(1)
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(MONGODB_DB)

  const groupsCol = db.collection('variablesGroups')
  const metaCol = db.collection('variables_metadata')

  const groups = await groupsCol.find({}).sort({ groupOrder: 1 }).toArray()
  const variables = await metaCol.find({}).toArray()

  const names = new Set<string>(variables.map((v: any) => v.name))
  // Also prepare convenience sets for both forms
  const namesNoPrefix = new Set<string>(
    variables.map((v: any) => stripStatsPrefix(String(v.name || '')))
  )
  const namesWithPrefix = new Set<string>(
    variables.map((v: any) => addStatsPrefix(String(v.name || '')))
  )

  const toEnable = new Set<string>() // canonical metadata names as stored in DB
  const unresolved: Array<{ groupOrder: number; varName: string }> = []

  for (const g of groups) {
    const vars: string[] = Array.isArray(g.variables) ? g.variables : []
    for (const raw of vars) {
      const varName = String(raw)

      // Resolution order: exact → strip → add
      if (names.has(varName)) {
        toEnable.add(varName)
        continue
      }
      const stripped = stripStatsPrefix(varName)
      if (names.has(stripped)) {
        toEnable.add(stripped)
        continue
      }
      const added = addStatsPrefix(varName)
      if (names.has(added)) {
        toEnable.add(added)
        continue
      }

      // As a last resort, map via the precomputed sets
      if (namesNoPrefix.has(stripped)) {
        // Find the exact canonical name from variables list
        const found = variables.find((v: any) => stripStatsPrefix(v.name) === stripped)
        if (found?.name) {
          toEnable.add(found.name)
          continue
        }
      }

      unresolved.push({ groupOrder: g.groupOrder, varName })
    }
  }

  // Enable flags for resolved variables
  let updatedVars = 0
  for (const name of toEnable) {
    const res = await metaCol.updateOne(
      { name },
      {
        $set: {
          'flags.visibleInClicker': true,
          // Backward-compat for legacy schema
          visibleInClicker: true,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          // If somehow missing, ensure createdAt exists
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: false }
    )
    if (res.matchedCount > 0) updatedVars++
  }

  // Force groups to be visible in Clicker
  const groupsRes = await groupsCol.updateMany(
    {},
    { $set: { visibleInClicker: true, updatedAt: new Date().toISOString() } }
  )

  // Summary
  console.log('\n✨ Alignment complete!')
  console.log(`  Groups updated (visibleInClicker=true): ${groupsRes.modifiedCount}`)
  console.log(`  Variables enabled for Clicker: ${updatedVars}`)
  if (unresolved.length > 0) {
    console.log(`\n⚠️ Unresolved variables (${unresolved.length}):`)
    unresolved.slice(0, 50).forEach((u) => {
      console.log(`  Group ${u.groupOrder}: ${u.varName}`)
    })
    if (unresolved.length > 50) {
      console.log(`  ... and ${unresolved.length - 50} more`)
    }
  } else {
    console.log('  ✅ All group variables resolved to metadata')
  }

  await client.close()
}

run().catch((e) => {
  console.error('❌ Error:', e)
  process.exit(1)
})
