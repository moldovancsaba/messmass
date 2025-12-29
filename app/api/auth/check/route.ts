import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { error as logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logError('Auth check error', { context: 'auth/check' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      authenticated: false,
      user: null
    });
  }
}
