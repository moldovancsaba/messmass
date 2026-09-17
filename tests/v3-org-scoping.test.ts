// tests/v3-org-scoping.test.ts
// WHAT: resolveV3OrgId -- the actual scoping decision behind messmass#395 (F-004).
// WHY: Both branches of this used to return the same hardcoded id, so
//     "scoping" selected nothing. This pins the fixed policy directly: a
//     user with no organizationIds falls back to Master; superadmin can view
//     any org via an explicit override; a non-superadmin's override attempt
//     is not honored by this function at all (withOrgContext only ever
//     passes a requestedOrgId through for a superadmin -- see its own
//     validation -- but this pins that resolveV3OrgId itself doesn't trust
//     the caller either, so a future refactor that skips that check doesn't
//     silently become a privilege escalation).

import { resolveV3OrgId, MASTER_ORG_ID } from '@/lib/middleware/v3/orgContext';

describe('resolveV3OrgId', () => {
  it('a user with organizationIds is scoped to their first assigned org', () => {
    expect(resolveV3OrgId({ role: 'admin', organizationIds: ['abc123'] }, null)).toBe('abc123');
  });

  it('a user with no organizationIds falls back to Master', () => {
    expect(resolveV3OrgId({ role: 'admin' }, null)).toBe(MASTER_ORG_ID);
  });

  it('a user with an empty organizationIds array falls back to Master', () => {
    expect(resolveV3OrgId({ role: 'admin', organizationIds: [] }, null)).toBe(MASTER_ORG_ID);
  });

  it('superadmin with no override falls back to Master, preserving today\'s behavior', () => {
    expect(resolveV3OrgId({ role: 'superadmin' }, null)).toBe(MASTER_ORG_ID);
  });

  it('superadmin with an override is scoped to the requested org', () => {
    expect(resolveV3OrgId({ role: 'superadmin' }, 'some-other-org-id')).toBe('some-other-org-id');
  });

  it('a non-superadmin\'s requested override is never honored, even with organizationIds set', () => {
    // The security-critical case: this function must not let a regular
    // admin pass a requestedOrgId and view a different tenant's data.
    expect(resolveV3OrgId({ role: 'admin', organizationIds: ['own-org'] }, 'someone-elses-org')).toBe('own-org');
  });

  it('a non-superadmin with no organizationIds still falls back to Master even if they pass an override', () => {
    expect(resolveV3OrgId({ role: 'admin' }, 'someone-elses-org')).toBe(MASTER_ORG_ID);
  });
});
