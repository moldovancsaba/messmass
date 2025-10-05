// app/api/debug-env/route.ts
// WHAT: Debug endpoint to check environment and database connection
// WHY: Diagnose production authentication issues
// SECURITY: This should be removed after debugging!

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export async function GET() {
  try {
    const info: any = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      mongoUriPreview: process.env.MONGODB_URI ? 
        process.env.MONGODB_URI.replace(/:[^:@]+@/, ':***@').substring(0, 80) + '...' : 
        'NOT SET',
      hasAdminSessionSecret: !!process.env.ADMIN_SESSION_SECRET,
      databaseConnection: 'NOT TESTED'
    }

    // Try to connect to MongoDB
    if (process.env.MONGODB_URI) {
      try {
        const client = new MongoClient(process.env.MONGODB_URI)
        await client.connect()
        const db = client.db('messmass')
        const usersCollection = db.collection('users')
        const userCount = await usersCollection.countDocuments()
        
        // Check for specific users
        const adminUser = await usersCollection.findOne({ email: 'admin@messmass.com' })
        const moldovanUser = await usersCollection.findOne({ email: 'moldovancsaba@gmail.com' })
        
        info.databaseConnection = 'SUCCESS'
        info.userCount = userCount
        info.hasAdminUser = !!adminUser
        info.hasMoldovanUser = !!moldovanUser
        
        if (adminUser) {
          info.adminUserId = adminUser._id.toString()
          info.adminUserRole = adminUser.role
          info.adminHasPassword = !!adminUser.password
        }
        
        if (moldovanUser) {
          info.moldovanUserId = moldovanUser._id.toString()
          info.moldovanUserRole = moldovanUser.role
          info.moldovanHasPassword = !!moldovanUser.password
        }
        
        await client.close()
      } catch (dbError: any) {
        info.databaseConnection = 'ERROR'
        info.databaseError = dbError.message
      }
    }

    return NextResponse.json(info, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug endpoint error', 
      message: error.message 
    }, { status: 500 })
  }
}
