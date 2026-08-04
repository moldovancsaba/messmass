import { adminNavSections } from '@/lib/adminNavigation';
import { canAccessMenuItem } from '@/lib/permissions';
import type { UserRole } from '@/lib/users';
import type { TourStepConfig } from '../types';

/**
 * WHAT: one step per sidebar section, using each section's own title +
 *       description from adminNavigation.ts
 * WHY: a first-time admin needs the six groups introduced before any
 *      individual segment tour makes sense -- this is the one tour whose
 *      steps target section headers rather than individual nav items.
 *      Sections with no accessible items for the current role are dropped
 *      up front, since Sidebar.tsx itself doesn't render that section's
 *      `data-tour-id` wrapper when there's nothing visible inside it.
 */
export function getWelcomeTourSteps(userRole: UserRole | undefined): TourStepConfig[] {
  return adminNavSections
    .filter((section) => section.items.some((item) => canAccessMenuItem(userRole, item.label)))
    .map((section) => ({
      id: `nav-section-${section.key}`,
      targetSelector: `[data-tour-id="nav-section-${section.key}"]`,
      title: section.title,
      description: section.description,
    }));
}
