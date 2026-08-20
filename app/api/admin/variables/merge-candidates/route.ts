// GET /api/admin/variables/merge-candidates
// AUTH: getAdminUser() + admin/superadmin role.
// WHAT: Read-only list of variable-merge candidates for the /admin/kyc console.
// WHY: Surfaces casing/word-order dupes + report/data name mismatches with a
//     per-candidate conflict analysis and recommendation. See lib/variableMerge.ts.

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { getAdminUser, type AdminUser } from '@/lib/auth';
import { computeMergeCandidates, listVariables, PROTECTED_CLICKER_VARIABLES } from '@/lib/variableMerge';
import { error as logError } from '@/lib/logger';

export const runtime = 'nodejs';

function isAdmin(u: AdminUser | null): u is AdminUser {
  return !!u && (u.role === 'admin' || u.role === 'superadmin');
}

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const [candidates, variables] = await Promise.all([computeMergeCandidates(db), listVariables(db)]);
    return NextResponse.json({ success: true, candidates, variables, protectedVariables: [...PROTECTED_CLICKER_VARIABLES] });
  } catch (e) {
    logError('merge-candidates failed', { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ success: false, error: 'internal_error' }, { status: 500 });
  }
}
