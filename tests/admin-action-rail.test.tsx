import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AdminActionRail from '@/components/admin/AdminActionRail';
import { getAdminEntitySurfaceActions } from '@/lib/adminEntitySystem';
import { organizationsEntityConfig } from '@/lib/adapters/organizationsAdapter';
import { partnersEntityConfig } from '@/lib/adapters/partnersAdapter';
import { projectsEntityConfig } from '@/lib/adapters/projectsAdapter';

describe('AdminActionRail', () => {
  const item = { _id: '1', name: 'Test Item' };

  it('renders primary actions and moves lower-priority actions into overflow', () => {
    const html = renderToStaticMarkup(
      <AdminActionRail
        item={item}
        actions={[
          { label: 'Delete', priority: 'danger', variant: 'danger', handler: jest.fn() },
          { label: 'Report', priority: 'primary', variant: 'primary', handler: jest.fn() },
          { label: 'Edit', priority: 'overflow', variant: 'secondary', handler: jest.fn() },
        ]}
      />
    );

    expect(html).toContain('Report');
    expect(html).toContain('More');
    expect(html).toContain('Delete');
    expect(html).toContain('Edit');
  });

  it('uses mobile labels and preserves disabled action state', () => {
    const html = renderToStaticMarkup(
      <AdminActionRail
        item={item}
        actions={[
          {
            label: 'Open Default Report',
            mobileLabel: 'Default Report',
            priority: 'primary',
            variant: 'primary',
            disabled: true,
            handler: jest.fn(),
          },
        ]}
      />
    );

    expect(html).toContain('aria-label="Open Default Report"');
    expect(html).toContain('Default Report');
    expect(html).toContain('disabled=""');
  });

  it('renders a permission-safe empty action state', () => {
    const html = renderToStaticMarkup(
      <AdminActionRail
        item={item}
        actions={[]}
        emptyStateLabel="No actions are available for your role."
      />
    );

    expect(html).toContain('No actions are available for your role.');
  });
});

describe('admin entity mobile action contract', () => {
  it('keeps organization actions role-gated and available on cards for superadmins', () => {
    const adminActions = getAdminEntitySurfaceActions(
      organizationsEntityConfig,
      { user: { role: 'admin' } },
      'card'
    );
    const superAdminActions = getAdminEntitySurfaceActions(
      organizationsEntityConfig,
      { user: { role: 'superadmin' } },
      'card'
    );

    expect(adminActions).toHaveLength(0);
    expect(superAdminActions.map((action) => action.label)).toEqual([
      'Reports',
      'Open Default Report',
      'Edit',
      'Manage Members',
      'Delete',
    ]);
  });

  it('exposes previously list-only partner and project actions on card surfaces', () => {
    const projectCardActions = getAdminEntitySurfaceActions(
      projectsEntityConfig,
      { user: { role: 'admin' } },
      'card'
    );
    const partnerCardActions = getAdminEntitySurfaceActions(
      partnersEntityConfig,
      { user: { role: 'admin' } },
      'card'
    );

    expect(projectCardActions.map((action) => action.label)).toEqual(
      expect.arrayContaining(['Share Report', 'Share Editor', 'Export CSV', 'KYC Data'])
    );
    expect(partnerCardActions.map((action) => action.label)).toEqual(
      expect.arrayContaining(['Share Report', 'KYC Data'])
    );
  });
});
