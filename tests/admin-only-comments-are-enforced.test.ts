// tests/admin-only-comments-are-enforced.test.ts
// WHAT: A route whose comment claims "admin only" must actually gate on role.
// WHY: F-025 / #400. Around twenty routes asserted admin-only access while
//     calling requireSession(), which documents that it deliberately checks no
//     role, and getAdminUser() hands the same permission array to every role
//     including guest. The comments were written during the F-009 remediation
//     (messmass#386) and describe the policy it intended to reach; the
//     authorisation half was never built, and nothing connected the prose to the
//     guard, so neither could break when the other changed.
// HOW: This is the mechanism behind #407 -- the claim and the enforcement are
//     bound, so weakening a guard under an admin-only comment fails here rather
//     than silently widening access.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const API_DIR = path.join(ROOT, 'app', 'api');

/** Guards that genuinely establish authorisation, not merely authentication. */
const ROLE_GUARDS = [
  'requireAdmin',
  'requireSuperadmin',    // messmass#227: superadmin-only, narrower than requireAdmin
  "role !== 'superadmin'",
  "role === 'superadmin'",
  'requireProjectWrite',   // scoped to one project's edit slug
  'requirePartnerWrite',   // scoped to one partner's edit slug
  'assertCameraSecret',    // fleet shared secret, not a user session
  'requireAPIAuth',        // bearer key path
];

/** Files where an admin-only phrase is prose about history, not a claim. */
const NOT_A_CLAIM = [
  /the sweep saw the primitive in-file/i,   // describes a past gap
  /this gap was invisible/i,
];

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name === 'route.ts') yield full;
  }
}

describe('routes that claim admin-only actually enforce it', () => {
  const offenders: string[] = [];

  for (const file of walk(API_DIR)) {
    const source = fs.readFileSync(file, 'utf8');
    const claimsAdmin = /admin[- ]only/i.test(source) || /superadmin only/i.test(source);
    if (!claimsAdmin) continue;
    if (NOT_A_CLAIM.some((re) => re.test(source))) continue;

    const enforces = ROLE_GUARDS.some((g) => source.includes(g));
    if (!enforces) {
      offenders.push(path.relative(ROOT, file));
    }
  }

  it('has no route asserting a role it does not check', () => {
    expect(offenders.join('\n')).toBe('');
  });

  it('requireAdmin rejects a non-admin role', () => {
    // The guard's contract in one line: admin and superadmin pass, everything
    // else -- including the `user` role SSO auto-provisions on first sign-in --
    // does not.
    const guard = fs.readFileSync(path.join(ROOT, 'lib', 'apiGuards.ts'), 'utf8');
    expect(guard).toContain("user.role !== 'admin' && user.role !== 'superadmin'");
    expect(guard).toContain('403');
  });
});
