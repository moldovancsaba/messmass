// app/api/activation-templates/[id]/route.ts
// WHAT: Read one activation template with its yield summary.
// WHY: messmass#228's "operator analytics for activation performance and
//     data yield" acceptance check -- participation count and per-field
//     fill rate, the minimal real version of that.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getActivationTemplate, getActivationYield } from '@/lib/activationBuilder';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const template = await getActivationTemplate(id);
  if (!template) {
    return NextResponse.json({ success: false, error: 'Activation template not found.' }, { status: 404 });
  }
  const yieldSummary = await getActivationYield(id);
  return NextResponse.json({
    success: true,
    template: { ...template, _id: template._id.toString() },
    yield: yieldSummary,
  });
}
