// POST /api/admin/variables/merge
// AUTH: getAdminUser() + admin/superadmin role.
// WHAT: Apply approved variable merges over event stats. Dry-run by default.
// WHY: Operator-driven normalization from the /admin/kyc console. Backs up every
//     touched field, records conflicts, and is idempotent. See lib/variableMerge.ts.
// BODY: { merges: [{ canonical, legacy: string[], rule: 'copy'|'sum'|'prefer-canonical' }], dryRun?: boolean }

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { getAdminUser, type AdminUser } from '@/lib/auth';
import { applyMerges, type MergeRequestItem, type ConflictRule } from '@/lib/variableMerge';
import { error as logError } from '@/lib/logger';

export const runtime = 'nodejs';

const RULES: ConflictRule[] = ['copy', 'sum', 'prefer-canonical'];

function isAdmin(u: AdminUser | null): u is AdminUser {
  return !!u && (u.role === 'admin' || u.role === 'superadmin');
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const dryRun = body?.dryRun !== false; // default TRUE — never applies without an explicit dryRun:false
    const rawMerges = Array.isArray(body?.merges) ? body.merges : [];

    // validate each merge item
    const merges: MergeRequestItem[] = [];
    for (const m of rawMerges) {
      const canonical = typeof m?.canonical === 'string' ? m.canonical.trim() : '';
      const legacy = Array.isArray(m?.legacy) ? m.legacy.filter((x: unknown) => typeof x === 'string' && x) : [];
      const rule: ConflictRule = RULES.includes(m?.rule) ? m.rule : 'copy';
      if (!canonical || legacy.length === 0 || legacy.includes(canonical)) {
        return NextResponse.json({ success: false, error: `invalid merge: ${JSON.stringify(m)}` }, { status: 400 });
      }
      merges.push({ canonical, legacy, rule });
    }
    if (merges.length === 0) {
      return NextResponse.json({ success: false, error: 'no valid merges' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const result = await applyMerges(db, merges, { dryRun, actor: user.email });
    return NextResponse.json({ success: true, result });
  } catch (e) {
    logError('variable merge failed', { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ success: false, error: 'internal_error' }, { status: 500 });
  }
}
