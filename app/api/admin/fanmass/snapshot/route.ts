import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';

export async function GET() {
  const user = await getAdminUser();
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return NextResponse.json({ success: false, error: { code: 'ADMIN_AUTH_REQUIRED' } }, { status: 401 });
  }
  return NextResponse.json({
    success: false,
    error: { code: 'FANMASS_EVENT_DASHBOARD_RETIRED', message: 'Per-photo Fanmass results are available in Messmass AI Analytics.' },
  }, { status: 410 });
}
