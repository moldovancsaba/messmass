import { NextRequest, NextResponse } from 'next/server';
import { generateFilterSlug } from '@/lib/slugUtils';

// POST /api/filter-slug - Generate a filter slug for hashtag combinations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hashtags, styleId } = body;

    if (!hashtags || !Array.isArray(hashtags)) {
      return NextResponse.json(
        { success: false, error: 'Hashtags array is required' },
        { status: 400 }
      );
    }

    if (hashtags.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one hashtag is required' },
        { status: 400 }
      );
    }

    console.log('🔗 Generating filter slug for hashtags:', hashtags);

    const slug = await generateFilterSlug(hashtags, styleId);

    return NextResponse.json({
      success: true,
      slug,
      hashtags: hashtags.map(tag => tag.toLowerCase().trim()).sort(),
      styleId: styleId || null
    });

  } catch (error) {
    console.error('❌ Failed to generate filter slug:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate filter slug'
    }, { status: 500 });
  }
}
