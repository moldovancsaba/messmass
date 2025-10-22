/* WHAT: API endpoint to fetch page style for public pages
 * WHY: Allow stats pages to load and apply appropriate theme
 * HOW: Check project.styleIdEnhanced, fallback to global default
 * PUBLIC: No authentication required (public stats pages need this) */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { PageStyleEnhanced } from '@/lib/pageStyleTypesEnhanced';

/* WHAT: GET - Fetch page style for project or global default
 * WHY: Public pages need to load appropriate theme
 * QUERY: projectId (optional) - if not provided, returns global default
 * RETURNS: PageStyleEnhanced object */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const client = await clientPromise;
    const db = client.db();

    let style: PageStyleEnhanced | null = null;

    /* WHAT: If projectId provided, check if project has custom style
     * WHY: Apply project-specific theme if assigned */
    if (projectId) {
      const project = await db.collection('projects').findOne({
        $or: [
          { _id: new ObjectId(projectId) },
          { viewSlug: projectId },
          { editSlug: projectId }
        ]
      });

      if (project && project.styleIdEnhanced) {
        // Load project-specific style
        const projectStyle = await db
          .collection('page_styles_enhanced')
          .findOne({ _id: new ObjectId(project.styleIdEnhanced) });

        if (projectStyle) {
          style = {
            ...projectStyle,
            _id: projectStyle._id.toString()
          } as PageStyleEnhanced;
        }
      }
    }

    /* WHAT: If no project-specific style found, load global default
     * WHY: Fallback to system-wide theme */
    if (!style) {
      const globalDefault = await db
        .collection('page_styles_enhanced')
        .findOne({ isGlobalDefault: true });

      if (globalDefault) {
        style = {
          ...globalDefault,
          _id: globalDefault._id.toString()
        } as PageStyleEnhanced;
      }
    }

    /* WHAT: If still no style (first time setup), return hardcoded default
     * WHY: Ensure pages always have a theme */
    if (!style) {
      style = {
        name: 'System Default',
        description: 'Default theme',
        isGlobalDefault: true,
        pageBackground: {
          type: 'solid',
          solidColor: '#ffffff'
        },
        heroBackground: {
          type: 'solid',
          solidColor: '#f3f4f6'
        },
        contentBoxBackground: {
          type: 'solid',
          solidColor: '#ffffff',
          opacity: 1
        },
        typography: {
          fontFamily: 'inter',
          primaryTextColor: '#1f2937',
          secondaryTextColor: '#6b7280',
          headingColor: '#111827'
        },
        colorScheme: {
          primary: '#3b82f6',
          secondary: '#10b981',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444'
        }
      };
    }

    return NextResponse.json({
      success: true,
      style
    });
  } catch (error) {
    console.error('Failed to fetch page style:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page style' },
      { status: 500 }
    );
  }
}
