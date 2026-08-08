// WHAT: ColoredHashtagBubble now renders through GDS's ChoiceChip
// (@sovereignsquad/gds-core/client), which transitively barrel-imports all of
// @mantine/core -- including Textarea/JsonInput, whose react-textarea-autosize
// dependency touches browser-only APIs at module-load time. This suite runs under
// jest-environment-node (no DOM), so merely importing the adapters below (which
// import ColoredHashtagBubble for an unrelated column) crashes before any test
// runs. Stub it out: this suite only asserts adapter.listConfig.columns shape,
// never hashtag chip rendering.
jest.mock('@/components/ColoredHashtagBubble', () => ({
  __esModule: true,
  default: () => null,
}));

import { organizationsAdapter } from '@/lib/adapters/organizationsAdapter';
import { partnersAdapter } from '@/lib/adapters/partnersAdapter';
import { projectsAdapter } from '@/lib/adapters/projectsAdapter';

describe('mobile admin action contract', () => {
  it('defines explicit mobile column behavior for high-traffic admin entities', () => {
    const adapters = [projectsAdapter, partnersAdapter, organizationsAdapter];

    adapters.forEach((adapter) => {
      expect(adapter.listConfig.columns.some((column) => column.mobile?.behavior === 'primary')).toBe(true);
      expect(adapter.listConfig.columns.some((column) => column.mobile?.behavior === 'hidden')).toBe(
        adapter.pageName === 'organizations' ? false : true
      );
    });
  });

  it('shows a permission-safe organization action state in both list and card views', () => {
    expect(organizationsAdapter.listConfig.actionEmptyStateLabel).toMatch(/No organization actions/);
    expect(organizationsAdapter.cardConfig.actionEmptyStateLabel).toMatch(/No organization actions/);
  });
});
