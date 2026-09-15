// tests/admin-action-rail-per-row.test.tsx
// WHAT: AdminActionRail must resolve per-row action fields (label/icon/title/
//     variant) before rendering them.
// WHY: AdminSurfaceAction.label was typed `string`, but call sites already
//     passed functions -- the users page toggles "Enable API"/"Disable API" per
//     row. The renderer used the value directly, and React renders nothing for a
//     function child, so those buttons showed up as blank boxes with no text and
//     a title of "function...". This asserts a function label reaches the markup
//     as its computed string for both states.
// HOW: renderToStaticMarkup, matching tests/admin-action-rail.test.tsx -- this
//     suite runs under jest-environment-node, so there is no DOM to render into.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AdminActionRail from '@/components/admin/AdminActionRail';

jest.mock('@/components/MaterialIcon', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => React.createElement('i', null, name),
}));

type Row = { apiKeyEnabled: boolean };

const perRowAction = {
  label: (u: Row) => (u.apiKeyEnabled ? 'Disable API' : 'Enable API'),
  icon: (u: Row) => (u.apiKeyEnabled ? 'lock' : 'lock_open'),
  variant: (u: Row) => (u.apiKeyEnabled ? 'danger' : 'primary') as 'danger' | 'primary',
  title: (u: Row) => (u.apiKeyEnabled ? 'Turn API access off' : 'Turn API access on'),
  handler: () => {},
};

function markup(item: Row, actions: any[] = [perRowAction]) {
  return renderToStaticMarkup(
    React.createElement(AdminActionRail as any, { mode: 'list-row', item, actions })
  );
}

describe('AdminActionRail per-row action fields', () => {
  it('renders the computed label and title when API access is enabled', () => {
    const html = markup({ apiKeyEnabled: true });
    expect(html).toContain('Disable API');
    expect(html).toContain('Turn API access off');
    expect(html).toContain('lock');
  });

  it('renders the computed values for the opposite state', () => {
    const html = markup({ apiKeyEnabled: false });
    expect(html).toContain('Enable API');
    expect(html).toContain('Turn API access on');
  });

  it('never emits a function where text belongs (the blank-box regression)', () => {
    const html = markup({ apiKeyEnabled: true });
    expect(html).not.toMatch(/=&gt;|function\s*\(/);
    // the label span must not be empty
    expect(html).not.toMatch(/<span[^>]*>\s*<\/span>\s*<\/button>/);
  });

  it('still accepts plain string fields', () => {
    const html = markup({ apiKeyEnabled: false }, [
      { label: 'Details', icon: 'info', handler: () => {} },
    ]);
    expect(html).toContain('Details');
  });
});
