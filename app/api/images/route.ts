// app/api/images/route.ts
// WHAT: Images endpoint for project galleries
// WHY: Provide image URLs and metadata for project galleries
// HOW: Query projects collection for image data

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { cookies } from 'next/headers';
import { error as logError } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * GET /api/images
 * WHAT: Get images for a project
 * WHY: Gallery components need image URLs and metadata
 * 
 * QUERY PARAMS:
 *   - projectId: Project ID (optional)
 *   - slug: Project slug (optional)
 * 
 * RESPONSE:
 *   - success: boolean
 *   - images: Array of image objects
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const slug = searchParams.get('slug');
    
    // Check authentication
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    const pageAuth = cookieStore.get('page_auth');
    
    if (!adminSession && !pageAuth) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          images: []
        },
        { status: 401 }
      );
    }
    
    if (!projectId && !slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project ID or slug required',
          images: []
        },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    // Build query
    const query: any = {};
    if (projectId && ObjectId.isValid(projectId)) {
      query._id = new ObjectId(projectId);
    } else if (slug) {
      query.editSlug = slug;
    }
    
    // Find project
    const project = await db.collection('projects').findOne(query);
    
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          images: []
        },
        { status: 404 }
      );
    }
    
    // Extract image data from project
    // Images might be stored in various fields depending on your schema
    const images: any[] = [];
    
    // Check for image URLs in project data
    if (project.imageUrl) {
      images.push({
        url: project.imageUrl,
        type: 'main',
        caption: project.eventName
      });
    }
    
    // Check for gallery images
    if (project.galleryImages && Array.isArray(project.galleryImages)) {
      project.galleryImages.forEach((img: any, index: number) => {
        images.push({
          url: typeof img === 'string' ? img : img.url,
          type: 'gallery',
          caption: typeof img === 'object' ? img.caption : `Image ${index + 1}`,
          index
        });
      });
    }
    
    // Check for report images in stats
    if (project.stats) {
      Object.keys(project.stats).forEach(key => {
        if (key.startsWith('reportImage') && project.stats[key]) {
          images.push({
            url: project.stats[key],
            type: 'report',
            field: key
          });
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      images,
      count: images.length,
      projectId: project._id.toString(),
      projectName: project.eventName
    });
    
  } catch (error) {
    logError('GET /api/images error', { context: 'images' }, error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load images',
        images: []
      },
      { status: 500 }
    );
  }
}
