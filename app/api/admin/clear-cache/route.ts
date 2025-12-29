import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { error as logError } from '@/lib/logger';

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
        // WHAT: Comprehensive route revalidation
        // WHY: Clear all cached content across the app
        // HOW: Use revalidatePath for all major routes and layouts
        
        const revalidatedPaths: string[] = [];
        
        // Root layout (affects all pages)
        revalidatePath('/', 'layout');
        revalidatedPaths.push('/ (layout)');
        
        // Admin routes
        const adminRoutes = [
          '/admin',
          '/admin/events',
          '/admin/partners',
          '/admin/categories',
          '/admin/users',
          '/admin/kyc',
          '/admin/visualization',
          '/admin/design',
          '/admin/chart-algorithms',
          '/admin/analytics',
          '/admin/bitly'
        ];
        
        adminRoutes.forEach(route => {
          revalidatePath(route);
          revalidatedPaths.push(route);
        });
        
        // API routes (data endpoints)
        const apiRoutes = [
          '/api/projects',
          '/api/hashtags',
          '/api/partners',
          '/api/charts',
          '/api/reports',
          '/api/variables-config',
          '/api/page-styles-enhanced'
        ];
        
        apiRoutes.forEach(route => {
          revalidatePath(route);
          revalidatedPaths.push(route);
        });
        
        // Public report routes (revalidate layout to clear all slugs)
        revalidatePath('/report', 'layout');
        revalidatedPaths.push('/report/* (all slugs)');
        
        revalidatePath('/partner-report', 'layout');
        revalidatedPaths.push('/partner-report/* (all slugs)');
        
        result.details.revalidatedRoutes = revalidatedPaths;
        result.details.totalRoutes = revalidatedPaths.length;
        result.details.timestamp = new Date().toISOString();
        result.details.message = 'All routes revalidated - fresh content will be served on next request';
      } catch (error: any) {
        result.details.error = `Error: ${error.message}`;
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
    logError('Clear cache error', { context: 'admin-clear-cache' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
