// WHAT: API for listing all partners
// WHY: Admin UI needs partner list for dropdown selections
// HOW: Simple GET endpoint returning all partners

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireSession } from '@/lib/apiGuards';
import { loadCentralizedClubRegistry } from '@/lib/clubLogoResolver';

/**
 * GET /api/admin/partners
 * 
 * WHAT: List all partners with template and centralized club logo info
 * WHY: Admin UI needs partners for dropdown selections (Project Partners, Events, etc.)
 */
export async function GET() {
  // SECURITY (messmass#386): require an authenticated admin session.
  const __denied = await requireSession();
  if (__denied) return __denied;

  try {
    const db = await getDb();
    const [partners, clubRegistry] = await Promise.all([
      db.collection('partners').find({}).sort({ name: 1 }).toArray(),
      loadCentralizedClubRegistry(db),
    ]);

    return NextResponse.json({
      success: true,
      partners: partners.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        emoji: p.emoji || '🏟️',
        showEmoji: p.showEmoji ?? true,
        logoUrl: clubRegistry.resolveLogo({
          partnerId: p._id,
          name: p.name,
          fallbackUrl: p.logoUrl || null,
        }) || null,
        reportTemplateId: p.reportTemplateId?.toString()
      }))
    });

  } catch (error) {
    console.error('Failed to fetch partners:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch partners'
    }, { status: 500 });
  }
}
