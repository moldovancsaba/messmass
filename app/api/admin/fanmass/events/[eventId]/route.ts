import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';

async function retired() {
  const user = await getAdminUser();
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return NextResponse.json({ success: false, error: { code: 'ADMIN_AUTH_REQUIRED' } }, { status: 401 });
  }
  return NextResponse.json({
    success: false,
    error: { code: 'EVENT_LEVEL_SYNC_RETIRED', message: 'Fanmass results arrive per photo and are aggregated by Messmass.' },
  }, { status: 410 });
}

export async function GET() {
  return retired();
}

export async function POST() {
  return retired();
}
