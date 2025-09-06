import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

/**
 * Global Style Configuration API
 * 
 * Manages the application-wide default style setting.
 * This API stores the global default style ID in the 'settings' collection,
 * allowing the entire application to use a consistent design.
 * 
 * Architecture:
 * - Uses a singleton document in 'settings' collection with _id: 'globalStyle'
 * - Stores the styleId reference to a document in 'pageStyles' collection
 * - Supports fallback to default style if global style is not set or invalid
 */

interface GlobalStyleSetting {
  _id: 'globalStyle';
  styleId: string | null;
  updatedAt: string;
  updatedBy?: string; // Future: track who set the global style
}

// GET /api/admin/global-style - Retrieve current global style configuration
export async function GET() {
  try {
    console.log('🎨 Fetching global style configuration...');
    
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const settingsCollection = db.collection<GlobalStyleSetting>('settings');
    const pageStylesCollection = db.collection('pageStyles');

    // Get global style setting
    const globalStyleSetting = await settingsCollection.findOne({ _id: 'globalStyle' });
    
    let currentGlobalStyle = null;
    
    if (globalStyleSetting && globalStyleSetting.styleId) {
      // Validate that the referenced style still exists
      try {
        currentGlobalStyle = await pageStylesCollection.findOne({ 
          _id: new ObjectId(globalStyleSetting.styleId) 
        });
        
        if (currentGlobalStyle) {
          (currentGlobalStyle as any)._id = (currentGlobalStyle as any)._id.toString();
        } else {
          console.log('⚠️ Global style reference is invalid, clearing it');
          // Clear invalid reference
          await settingsCollection.updateOne(
            { _id: 'globalStyle' },
            { 
              $set: { 
                styleId: null, 
                updatedAt: new Date().toISOString() 
              }
            }
          );
        }
      } catch (error) {
        console.log('⚠️ Error validating global style reference:', error);
        currentGlobalStyle = null;
      }
    }

    return NextResponse.json({
      success: true,
      globalStyle: currentGlobalStyle,
      hasGlobalStyle: !!currentGlobalStyle,
      lastUpdated: globalStyleSetting?.updatedAt
    });

  } catch (error) {
    console.error('❌ Failed to fetch global style configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch global style configuration' },
      { status: 500 }
    );
  }
}

// POST /api/admin/global-style - Set/update global style configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { styleId } = body;
    
    console.log('🎨 Setting global style:', styleId || 'null (clear)');

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const settingsCollection = db.collection<GlobalStyleSetting>('settings');
    const pageStylesCollection = db.collection('pageStyles');

    // If styleId is provided, validate it exists
    if (styleId && styleId !== 'null') {
      try {
        const styleExists = await pageStylesCollection.findOne({ 
          _id: new ObjectId(styleId) 
        });
        
        if (!styleExists) {
          return NextResponse.json(
            { success: false, error: 'Style not found' },
            { status: 404 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid style ID format' },
          { status: 400 }
        );
      }
    }

    // Update or create global style setting
    const now = new Date().toISOString();
    const globalStyleSetting: GlobalStyleSetting = {
      _id: 'globalStyle',
      styleId: (styleId && styleId !== 'null') ? styleId : null,
      updatedAt: now
    };

    await settingsCollection.replaceOne(
      { _id: 'globalStyle' },
      globalStyleSetting,
      { upsert: true }
    );

    // Fetch the updated style for response
    let updatedStyle = null;
    if (globalStyleSetting.styleId) {
      updatedStyle = await pageStylesCollection.findOne({ 
        _id: new ObjectId(globalStyleSetting.styleId) 
      });
      if (updatedStyle) {
        (updatedStyle as any)._id = (updatedStyle as any)._id.toString();
      }
    }

    console.log('✅ Global style updated successfully');

    return NextResponse.json({
      success: true,
      globalStyle: updatedStyle,
      hasGlobalStyle: !!updatedStyle,
      message: updatedStyle ? 
        `Global style set to "${updatedStyle.name}"` : 
        'Global style cleared, using default style'
    });

  } catch (error) {
    console.error('❌ Failed to update global style configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update global style configuration' },
      { status: 500 }
    );
  }
}
