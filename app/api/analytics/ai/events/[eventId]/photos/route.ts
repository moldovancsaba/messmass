import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { listFanmassPhotoAnalysisDetails } from '@/lib/fanmassPhotoAnalyses';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in to view photo analysis.' } },
        { status: 401 },
      );
    }
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Administrator access required.' },
        { status: 403 },
      );
    }
    const { eventId } = await params;
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit')) || 100;
    const offset = Number(url.searchParams.get('offset')) || 0;
    const result = await listFanmassPhotoAnalysisDetails(eventId, { limit, offset });
    return NextResponse.json({ success: true, data: { eventId, ...result } });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const code = (error as { code?: string }).code ?? 'AI_PHOTO_RESULTS_FAILED';
    return NextResponse.json(
      { success: false, error: { code, message: error instanceof Error ? error.message : 'Could not load photo analysis.' } },
      { status },
    );
  }
}
