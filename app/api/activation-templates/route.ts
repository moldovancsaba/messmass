// app/api/activation-templates/route.ts
// WHAT: Create and list reusable, sponsor-linked activation templates.
// WHY: messmass#228.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getAdminUser } from '@/lib/auth';
import { createActivationTemplate, listActivationTemplates, type ActivationDataField } from '@/lib/activationBuilder';

const FIELD_TYPES = ['text', 'select', 'boolean', 'number'];

function validateDataFields(dataFields: unknown): dataFields is ActivationDataField[] {
  if (!Array.isArray(dataFields) || dataFields.length === 0) return false;
  return dataFields.every(
    (f) => f && typeof f.key === 'string' && typeof f.label === 'string' && FIELD_TYPES.includes(f.type) && typeof f.required === 'boolean'
  );
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const templates = await listActivationTemplates();
  return NextResponse.json({
    success: true,
    templates: templates.map((t) => ({ ...t, _id: t._id.toString() })),
  });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ success: false, error: 'name is required.' }, { status: 400 });
    }
    if (!validateDataFields(body?.dataFields)) {
      return NextResponse.json(
        { success: false, error: `dataFields must be a non-empty array of {key, label, type: ${FIELD_TYPES.join('|')}, required, options?}` },
        { status: 400 }
      );
    }

    const admin = await getAdminUser();
    const template = await createActivationTemplate({
      name,
      description: typeof body?.description === 'string' ? body.description : undefined,
      partnerId: typeof body?.partnerId === 'string' ? body.partnerId : undefined,
      dataFields: body.dataFields,
      createdBy: admin!.email,
    });
    return NextResponse.json({ success: true, template: { ...template, _id: template._id.toString() } });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create activation template.' }, { status: 500 });
  }
}
