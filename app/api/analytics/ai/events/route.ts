import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { getAiPhotoEvents } from '@/lib/aiAnalytics';

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in to view photo analytics.' } },
        { status: 401 },
      );
    }
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Administrator access required.' }, { status: 403 });
    }

    const rawLimit = Number(new URL(request.url).searchParams.get('limit'));
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.trunc(rawLimit), 500) : 200;
    return NextResponse.json({ success: true, data: await getAiPhotoEvents(limit) });
  } catch (error) {
    console.error('AI photo analytics failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'AI_PHOTO_ANALYTICS_FAILED', message: 'Could not load photo analytics.' } },
      { status: 500 },
    );
  }
}
