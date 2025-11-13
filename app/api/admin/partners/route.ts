// WHAT: API for listing all partners
// WHY: Admin UI needs partner list for dropdown selections
// HOW: Simple GET endpoint returning all partners

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/admin/partners
 * 
 * WHAT: List all partners with template info
 * WHY: Admin UI needs partners for dropdown selections
 */
export async function GET() {
  try {
    const db = await getDb();
    const partnersCollection = db.collection('partners');

    const partners = await partnersCollection
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      partners: partners.map(p => ({
        _id: p._id.toString(),
        name: p.name,
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
