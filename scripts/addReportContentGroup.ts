// scripts/addReportContentGroup.ts
// WHAT: Insert a special 'report-content' group (Group N+1) if not exists
// WHY: Allow managing Report Content visibility and title via Clicker Manager

import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'messmass'

async function run() {
  if (!uri) throw new Error('MONGODB_URI is missing')
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  const col = db.collection('variablesGroups')

  const exists = await col.findOne({ specialType: 'report-content' })
  if (exists) {
    console.log('✅ Report Content group already exists (groupOrder=%s)', exists.groupOrder)
    await client.close()
    return
  }

  const all = await col.find({}).project({ groupOrder: 1 }).toArray()
  const maxOrder = all.reduce((m, g) => Math.max(m, g.groupOrder || 0), 0)
  const now = new Date().toISOString()
  const doc = {
    groupOrder: maxOrder + 1,
    titleOverride: '📦 Report Content',
    specialType: 'report-content' as const,
    visibleInClicker: true,
    visibleInManual: true,
    createdAt: now,
    updatedAt: now,
  }
  await col.insertOne(doc as any)
  console.log('✨ Inserted Report Content group at order %d', doc.groupOrder)
  await client.close()
}

run().catch(e => { console.error(e); process.exit(1) })
