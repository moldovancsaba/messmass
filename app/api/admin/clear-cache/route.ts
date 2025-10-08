import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';

/* WHAT: API endpoint to revalidate Next.js cache
   WHY: Allow admins to force fresh content by revalidating caches
   NOTE: File deletion doesn't work on serverless/Vercel - we use Next.js revalidation only
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

    // Revalidate all routes (works on serverless)
    if (type === 'routes' || type === 'all' || type === 'build') {
      try {
        // Revalidate the root layout (affects all pages)
        revalidatePath('/', 'layout');
        
        // Revalidate key paths
        revalidatePath('/admin');
        revalidatePath('/api/projects');
        revalidatePath('/api/hashtags');
        
        result.details.cache = 'All routes revalidated - fresh content will be served on next request';
      } catch (error: any) {
        result.details.cache = `Error: ${error.message}`;
      }
    }

    result.message = type === 'build' 
      ? 'Cache revalidated (Note: Build cache clearing only works locally, not on Vercel)'
      : 'Routes cache revalidated successfully';

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
