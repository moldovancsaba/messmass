// app/api/admin/auth/route.ts
import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAdminUser()
    
    if (user) {
      return NextResponse.json({ 
        success: true, 
        user 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 })
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
