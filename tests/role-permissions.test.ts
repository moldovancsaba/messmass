// tests/role-permissions.test.ts
// WHAT: A role's permissions must actually differ by role.
// WHY: F-005 / #391. `permissions` was one flat constant --
//     ['read','write','delete','manage-users'] -- handed to every authenticated
//     role including `user` and `guest`. A previous pass removed the
//     identical-branch ternary that made this visible and left the behaviour
//     untouched, which is exactly how a flat constant survives a code review.
//     Binding the shape to a test means the next person who flattens it fails
//     here rather than in production.

// Imported from lib/roles, not lib/auth: auth pulls in mongodb at module load,
// which leaves a jest worker hanging on a test that only reads a lookup table.
import { permissionsForRole, USER_ROLES } from '@/lib/roles';

describe('permissions are derived per role', () => {
  it('only superadmin may manage users', () => {
    for (const role of USER_ROLES) {
      expect(permissionsForRole(role).includes('manage-users')).toBe(role === 'superadmin');
    }
  });

  it('does not let a plain user write or delete', () => {
    expect(permissionsForRole('user')).toEqual(['read']);
    expect(permissionsForRole('guest')).toEqual(['read']);
  });

  it('gives api accounts read only -- they mutate through the Bearer path, not a session', () => {
    expect(permissionsForRole('api')).toEqual(['read']);
  });

  it('gives admin write and delete but not manage-users', () => {
    expect(permissionsForRole('admin').sort()).toEqual(['delete', 'read', 'write']);
  });

  it('is not the same set for every role', () => {
    const sets = new Set(USER_ROLES.map((r) => permissionsForRole(r).slice().sort().join(',')));
    expect(sets.size).toBeGreaterThan(1);
  });

  it('every role can read', () => {
    for (const role of USER_ROLES) expect(permissionsForRole(role)).toContain('read');
  });
});
