import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';

function retiredResponse() {
  return NextResponse.json({
    success: false,
    error: { code: 'EVENT_RESCAN_RETIRED', message: 'Fanmass analyzes eligible photos one at a time from Camera Atlas. Event-wide rescans are not supported.' },
  }, { status: 410 });
}

function unauthenticated() {
  return NextResponse.json({ success: false, error: { code: 'UNAUTHENTICATED' } }, { status: 401 });
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return unauthenticated();
  }
  return retiredResponse();
}

export async function POST() {
  const user = await getAdminUser();
  if (!user) {
    return unauthenticated();
  }
  return retiredResponse();
}
