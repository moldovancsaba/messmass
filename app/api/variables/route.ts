// app/api/variables/route.ts
// WHAT: API to expose variables to Admin → Variables UI.
// WHY: Centralizes variable metadata and dynamically adds text variables for hashtag categories.
// - Includes base stats, derived, and text variables
// - Pulls hashtag categories from DB to generate per-category variables on the fly

import { NextResponse } from 'next/server'
import { getAllVariableDefinitions } from '@/lib/variablesRegistry'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const db = await (await import('@/lib/db')).getDb()

    // Load hashtag categories if the collection exists
    const categoriesCol = db.collection('hashtagCategories')
    const categories = await categoriesCol.find({}, { projection: { name: 1 } }).toArray()
    const simplified = categories.map((c: any) => ({ name: c.name }))

    const variables = getAllVariableDefinitions(simplified)

    // sort by category then label
    variables.sort((a, b) => (a.category.localeCompare(b.category) || a.label.localeCompare(b.label)))

    return NextResponse.json({ success: true, variables })
  } catch (error) {
    console.error('❌ Failed to fetch variables:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch variables' }, { status: 500 })
  }
}
