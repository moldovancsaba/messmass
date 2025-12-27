/**
 * Test endpoint to verify Google Sheets environment variables are set in production
 * DELETE THIS FILE after debugging
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasEmail = !!process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
    const hasPrivateKey = !!process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    
    // Extract first/last few characters of private key for verification (NOT the full key)
    let privateKeyPreview = 'NOT_SET';
    if (hasPrivateKey) {
      const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY!;
      privateKeyPreview = `${key.substring(0, 30)}...${key.substring(key.length - 30)}`;
    }

    return NextResponse.json({
      status: 'Environment Variables Check',
      GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL: hasEmail ? process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL : 'NOT_SET',
      GOOGLE_SHEETS_PRIVATE_KEY: hasPrivateKey ? `SET (${privateKeyPreview})` : 'NOT_SET',
      MONGODB_URI: !!process.env.MONGODB_URI ? 'SET' : 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check environment variables',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
