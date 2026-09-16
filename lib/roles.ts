// lib/roles.ts
// WHAT: The canonical role set, on its own.
// WHY: It lived in lib/users.ts, which imports mongodb, bcrypt and getDb at
//     module load. Anything that only needed to know the names of the roles --
//     the session-token validator, a test, an Edge-runtime check -- paid for a
//     database client to find out. Here it costs nothing.
// HOW: lib/users.ts re-exports both symbols, so existing importers are
//     unchanged; new callers should import from here.
//
// ROLES: guest (docs only) → user (basic access) → admin (content mgmt)
//        → superadmin (system admin) | api (API-key accounts)

export type UserRole = 'guest' | 'user' | 'admin' | 'superadmin' | 'api';

/** All valid roles; use for validation and dropdowns. */
export const USER_ROLES: UserRole[] = ['guest', 'user', 'admin', 'superadmin', 'api'];

/**
 * Permissions a role actually carries.
 *
 * This was a flat constant in lib/auth.ts -- every authenticated role, `user`
 * and `guest` included, received read, write, delete and manage-users (F-005).
 * It survived a docs-only pass that removed an identical-branch ternary above
 * it and left the behaviour alone. hasPermission() had no callers, so nothing
 * was exposed by it, but a future author reaching for hasPermission would
 * reasonably have assumed it enforced something.
 *
 * `superadmin` is listed in full anyway: hasPermission short-circuits it to
 * true, and a table that quietly omitted the most privileged role would be the
 * next person's surprise.
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  superadmin: ['read', 'write', 'delete', 'manage-users'],
  admin: ['read', 'write', 'delete'],
  // API accounts (camera@messmass.com, fanmass@doneisbetter.com) read through
  // the Bearer-key path; they never need to mutate through a session.
  api: ['read'],
  user: ['read'],
  guest: ['read'],
};

export function permissionsForRole(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] ?? ['read'];
}
