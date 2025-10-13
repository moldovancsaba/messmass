// app/api/admin/local-users/route.ts
// WHAT: Admin-only CRUD endpoints (GET list, POST create) for local Users collection
// WHY: Enable managing multiple admin users; passwords are generated MD5-style per project rules

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { createUser, listUsers } from '@/lib/users'
import { generateMD5StylePassword } from '@/lib/pagePassword'

// WHAT: Force Node.js runtime for this route.
// WHY: Password generation uses Node's crypto (randomBytes) via lib/pagePassword.ts.
// The Edge runtime lacks Node's crypto, so we must opt into 'nodejs' to avoid runtime errors.
export const runtime = 'nodejs'

/**
 * GET /api/admin/local-users
 * Retrieves admin users with pagination and search support
 * 
 * Query Parameters:
 * - search: Search term to filter by email or name (case-insensitive)
 * - offset: Starting position for pagination (default: 0)
 * - limit: Maximum number of items to return (default: 20, max: 100)
 * 
 * Response Format:
 * {
 *   success: true,
 *   users: User[],
 *   pagination: {
 *     mode: 'paginated',
 *     limit: 20,
 *     offset: 0,
 *     nextOffset: 20 | null,  // null if no more items
 *     totalMatched: number     // Total items matching search
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })

    // WHAT: Parse pagination and search parameters from query string
    // WHY: Follows established pattern from /api/hashtags and /api/hashtag-categories
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    
    // WHAT: Validate and constrain limit (1-100), default 20
    // WHY: Prevents excessive database loads and ensures consistent page sizes
    const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 100)
    const offset = Math.max(Number(offsetParam) || 0, 0)

    // WHAT: Get all users from database (via existing listUsers helper)
    // WHY: listUsers already handles database connection and filtering
    const allUsers = await listUsers()
    
    // WHAT: Client-side filtering by search term (email or name)
    // WHY: Since users collection is small (<100 typically), client-side filter is acceptable
    //      and avoids modifying listUsers() function which may be used elsewhere
    const filteredUsers = search
      ? allUsers.filter(u => 
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.name.toLowerCase().includes(search.toLowerCase())
        )
      : allUsers
    
    // WHAT: Apply pagination to filtered results
    // WHY: Consistent pagination behavior across all admin list pages
    const totalMatched = filteredUsers.length
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)
    
    // WHAT: Calculate nextOffset for "Load More" button
    // WHY: null indicates last page, number indicates more items available
    const hasMore = offset + paginatedUsers.length < totalMatched
    const nextOffset = hasMore ? offset + limit : null

    console.log(`✅ Retrieved ${paginatedUsers.length} of ${totalMatched} users (offset: ${offset}, search: "${search}")`)

    return NextResponse.json({
      success: true,
      users: paginatedUsers.map(u => ({
        id: u._id?.toString(),
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      })),
      // WHAT: Include pagination metadata for client-side state management
      // WHY: Enables "Load More" button and "X of Y" display
      pagination: {
        mode: 'paginated' as const,
        limit,
        offset,
        nextOffset,
        totalMatched
      }
    })
  } catch (error) {
    console.error('Failed to list users:', error)
    return NextResponse.json({ success: false, error: 'Failed to list users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })

    const body = await request.json()
    const emailRaw = (body?.email || '').toString()
    const name = (body?.name || '').toString()
    const email = emailRaw.toLowerCase()

    if (!email || !name) {
      return NextResponse.json({ success: false, error: 'Email and name are required' }, { status: 400 })
    }

    // Generate MD5-style password (looks like MD5 hash; simple random per project rule)
    const password = generateMD5StylePassword()
    const now = new Date().toISOString()

    const created = await createUser({
      email,
      name,
      role: 'admin',
      password,
      createdAt: now,
      updatedAt: now
    })

    return NextResponse.json({
      success: true,
      user: {
        id: created._id?.toString(),
        email: created.email,
        name: created.name,
        role: created.role,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt
      },
      // Return generated password ONCE so admin can share it securely
      password
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user'
    console.error('Failed to create user:', message)
    // Duplicate email guard
    if (message.includes('E11000')) {
      return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 })
  }
}

