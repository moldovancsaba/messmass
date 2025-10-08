import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

/* WHAT: API endpoint to clear Next.js cache
   WHY: Allow admins to force fresh content by clearing server-side cache
   SECURITY: Requires admin authentication */

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getAdminUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { type } = await request.json();

    let result = {
      success: true,
      message: '',
      details: {} as Record<string, any>
    };

    // Clear Next.js build cache
    if (type === 'build' || type === 'all') {
      const cachePath = path.join(process.cwd(), '.next', 'cache');
      
      try {
        if (fs.existsSync(cachePath)) {
          // Use rm -rf to delete the cache directory
          await execAsync(`rm -rf "${cachePath}"`);
          result.details.buildCache = 'Cleared successfully';
        } else {
          result.details.buildCache = 'No cache directory found';
        }
      } catch (error: any) {
        result.details.buildCache = `Error: ${error.message}`;
      }
    }

    // Clear Next.js server cache (revalidate all routes)
    if (type === 'routes' || type === 'all') {
      try {
        // This triggers Next.js to revalidate on next request
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/', 'layout');
        result.details.routesCache = 'Revalidation triggered';
      } catch (error: any) {
        result.details.routesCache = `Error: ${error.message}`;
      }
    }

    result.message = `Cache cleared: ${Object.keys(result.details).join(', ')}`;

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('Clear cache error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
