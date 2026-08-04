import { adminNavSections } from '@/lib/adminNavigation';
import { canAccessMenuItem } from '@/lib/permissions';
import type { UserRole } from '@/lib/users';
import type { TourStepConfig } from '../types';

/**
 * WHAT: builds one tour step per nav item in a sidebar section
 * WHY: adminNavSections already carries an authored label + description for
 *      every item -- deriving steps from it keeps the tour copy and the
 *      nav item's own hover text as a single source of truth instead of
 *      re-authoring the same explanation twice
 */
export function getSegmentTourSteps(sectionKey: string, userRole: UserRole | undefined): TourStepConfig[] {
  const section = adminNavSections.find((s) => s.key === sectionKey);
  if (!section) return [];

  return section.items
    .filter((item) => canAccessMenuItem(userRole, item.label))
    .map((item) => ({
      id: `nav-${item.path}`,
      targetSelector: `[data-tour-id="nav-${item.path}"]`,
      title: item.label,
      description: item.tourDescription ?? item.description,
    }));
}

/** Section metadata (title/description) used by the Tours menu to list segments. */
export function getSegmentTourMeta() {
  return adminNavSections.map((section) => ({
    key: section.key,
    title: section.title,
    description: section.description,
  }));
}
