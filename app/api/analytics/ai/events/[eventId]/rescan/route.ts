import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';

async function retired() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHENTICATED' } }, { status: 401 });
  }
  return NextResponse.json({
    success: false,
    error: { code: 'EVENT_RESCAN_RETIRED', message: 'Fanmass analyzes eligible photos one at a time from Camera Atlas. Event-wide rescans are not supported.' },
  }, { status: 410 });
}

export async function GET(_request: NextRequest) {
  return retired();
}

export async function POST(_request: NextRequest) {
  return retired();
}
