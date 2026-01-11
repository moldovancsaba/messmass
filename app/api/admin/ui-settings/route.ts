import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { isAuthenticated } from '@/lib/auth';
import config from '@/lib/config';
import { AvailableFont, DEFAULT_FONTS } from '@/lib/fontTypes';

/* What: Admin UI Settings API for font selection and other UI preferences
   Why: Persist admin-selected design choices (font family, etc.) to database
   
   Collection: settings (new)
   Document structure: {
     _id: ObjectId,
     key: 'typography' | 'theme' | ...,
     fontFamily: 'inter' | 'roboto' | 'poppins',
     createdAt: ISO 8601 string with milliseconds,
     updatedAt: ISO 8601 string with milliseconds
   }
*/

export async function GET(request: NextRequest) {
  try {
    /* What: Validate admin session before reading settings
       Why: UI settings should only be accessible to authenticated admins */
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
const db = client.db(config.dbName);
    
    /* What: Fetch typography settings from database
       Why: Return current font selection for admin UI */
    const settings = await db.collection('settings').findOne({ key: 'typography' });
    
    /* What: Return default if no settings exist yet (non-breaking)
       Why: First-time access should work seamlessly without requiring DB setup */
    if (!settings) {
      return NextResponse.json({
        key: 'typography',
        fontFamily: 'inter', // Default to Inter
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching UI settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UI settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    /* What: Validate admin session before updating settings
       Why: Only authenticated admins can change UI preferences */
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fontFamily } = body;

    /* WHAT: Validate font family input against available fonts in database
       WHY: Prevent invalid font selections, use dynamic font list */
    if (!fontFamily || typeof fontFamily !== 'string') {
      return NextResponse.json(
        { error: 'fontFamily is required and must be a string' },
        { status: 400 }
      );
    }

    // Fetch available fonts from database
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const fonts = await db.collection<AvailableFont>('available_fonts')
      .find({ isActive: true })
      .toArray();
    
    // Use default fonts if database is empty
    const availableFonts = fonts.length > 0 
      ? fonts 
      : DEFAULT_FONTS.map((f, idx) => ({ ...f, _id: `default-${idx}` } as AvailableFont));
    
    // Create map of valid font keys (lowercase name)
    const validFontKeys = new Set(
      availableFonts.map(f => f.name.toLowerCase().replace(/\s+/g, ''))
    );
    
    const fontKey = fontFamily.toLowerCase().replace(/\s+/g, '');
    if (!validFontKeys.has(fontKey)) {
      return NextResponse.json(
        { 
          error: `Invalid fontFamily. Must be one of: ${availableFonts.map(f => f.name).join(', ')}`,
          availableFonts: availableFonts.map(f => f.name)
        },
        { status: 400 }
      );
    }
    
    /* What: ISO 8601 timestamp with milliseconds (mandatory format per rules)
       Why: Consistent timestamp format across all database records */
    const now = new Date().toISOString();
    
    /* What: Upsert typography settings (create if not exists, update if exists)
       Why: Non-breaking approach - first save creates the document */
    const result = await db.collection('settings').updateOne(
      { key: 'typography' },
      {
        $set: {
          fontFamily,
          updatedAt: now,
        },
        $setOnInsert: {
          key: 'typography',
          createdAt: now,
        },
      },
      { upsert: true }
    );

    console.log(`✅ UI settings updated: fontFamily=${fontFamily}`);

    /* What: Set cookie with selected font for immediate SSR application
       Why: Next page load will apply the font without waiting for client-side fetch */
    const response = NextResponse.json({
      success: true,
      fontFamily,
      updatedAt: now,
    });
    
    response.cookies.set('mm_font', fontFamily, {
      httpOnly: false, // What: Allow client JS to read for instant switching
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Error updating UI settings:', error);
    return NextResponse.json(
      { error: 'Failed to update UI settings' },
      { status: 500 }
    );
  }
}
