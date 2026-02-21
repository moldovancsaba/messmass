import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { listContactInquiries } from '@/lib/contactInquiries';
import { hasMinimumRole } from '@/lib/permissions';

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    if (!hasMinimumRole(user.role, 'admin')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const inquiries = await listContactInquiries();
    return NextResponse.json({ success: true, inquiries });
  } catch (err) {
    console.error('Contact inquiries API error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load inquiries' },
      { status: 500 }
    );
  }
}
