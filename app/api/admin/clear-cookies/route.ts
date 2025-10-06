// app/api/admin/clear-cookies/route.ts
// WHAT: Utility endpoint to forcefully clear all admin cookies
// WHY: Help users recover from stale cookie issues

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Delete admin-session cookie
    cookieStore.delete('admin-session')
    
    console.log('🗑️  Cleared admin-session cookie')
    
    return NextResponse.json({ 
      success: true, 
      message: 'All admin cookies cleared. Please login again.' 
    })
  } catch (error) {
    console.error('Error clearing cookies:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear cookies' 
    }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
