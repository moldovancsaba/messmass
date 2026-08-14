// tests/nav-menu-permissions.test.ts
// WHAT: Every sidebar nav item must be registered in MENU_PERMISSIONS.
// WHY: canAccessMenuItem returns false for an unknown label, so a nav item added
//     without a permission entry is hidden from every role — the page exists and
//     is reachable by URL, but nothing links to it. That is exactly what happened
//     to 'AI Analytics': shipped, working, and invisible in the sidebar.

import { adminNavSections } from '@/lib/adminNavigation';
import { MENU_PERMISSIONS, canAccessMenuItem } from '@/lib/permissions';

describe('sidebar navigation permissions', () => {
  const allLabels = adminNavSections.flatMap((section) => section.items.map((item) => item.label));

  it('registers every nav item, so none is silently hidden', () => {
    const unregistered = allLabels.filter((label) => !MENU_PERMISSIONS[label]);
    expect(unregistered).toEqual([]);
  });

  it('makes every registered item reachable by at least one role', () => {
    const unreachable = allLabels.filter(
      (label) => !(['user', 'admin', 'superadmin'] as const).some((role) => canAccessMenuItem(role, label))
    );
    expect(unreachable).toEqual([]);
  });

  it('keeps AI Analytics open to every role', () => {
    // The product decision: report authors of any role are the audience.
    expect(canAccessMenuItem('user', 'AI Analytics')).toBe(true);
    expect(canAccessMenuItem('admin', 'AI Analytics')).toBe(true);
    expect(canAccessMenuItem('superadmin', 'AI Analytics')).toBe(true);
  });

  it('still denies an unknown label', () => {
    expect(canAccessMenuItem('superadmin', 'Not A Real Menu Item')).toBe(false);
  });
});
