export interface AdminNavItem {
  navKey?: string;
  label: string;
  path: string;
  icon: string;
  iconVariant?: 'outlined' | 'rounded';
  description: string;
  accentColor: string;
  showInAdminWorkspace?: boolean;
  /**
   * WHAT: alternate copy for the guided tour (lib/tour/*)
   * WHY: `description` is nav-item hover text, written for someone who
   *      already knows roughly what the item is. Set this only where that
   *      assumption doesn't hold for a first-time reader; otherwise the
   *      tour falls back to `description` as the single source of truth.
   */
  tourDescription?: string;
}

export interface AdminNavSection {
  key: string;
  title: string;
  description: string;
  items: AdminNavItem[];
}

export interface SidebarNavGroup {
  parent: AdminNavItem;
  children: AdminNavItem[];
}

const navAccent = {
  info: 'var(--mm-info)',
  success: 'var(--mm-success)',
  warning: 'var(--mm-warning)',
  error: 'var(--mm-error)',
  primary: 'var(--mm-color-primary-500)',
  primaryStrong: 'var(--mm-color-primary-600)',
  secondary: 'var(--mm-color-secondary-500)',
  neutral: 'var(--mm-gray-500)',
} as const;

export const adminNavSections: AdminNavSection[] = [
  {
    key: 'operations',
    title: 'Operations',
    description: 'Run live delivery work and sponsor activation workflows.',
    items: [
      {
        navKey: 'events',
        label: 'Events',
        path: '/admin/events',
        icon: 'event',
        description: 'Create events, manage setup, and open live editor or report flows.',
        tourDescription: 'An event is a single occurrence you track stats for — a game, an activation, a campaign moment. It belongs to a partner, and its tracked stats become its report.',
        accentColor: navAccent.success,
      },
      {
        navKey: 'quick-add',
        label: 'Quick Add',
        path: '/admin/quick-add',
        icon: 'bolt',
        description: 'Create operational records faster when full setup is unnecessary.',
        accentColor: navAccent.warning,
      },
      {
        navKey: 'partner-activation',
        label: 'Partner Activation',
        path: '/admin/analytics/sponsorship/activation',
        icon: 'task_alt',
        description: 'Work sponsor proof gaps, recap readiness, and delivery follow-up queues.',
        tourDescription: 'Track what each sponsor still needs before their activation is complete — missing proof, recap status, and follow-up tasks.',
        accentColor: navAccent.warning,
      },
      {
        navKey: 'messages',
        label: 'Messages',
        path: '/admin/messages',
        icon: 'mail',
        description: 'Review outbound communication and internal message workflows.',
        accentColor: navAccent.primaryStrong,
      },
    ],
  },
  {
    key: 'entities',
    title: 'Directory & Assets',
    description: 'Manage clubs, governing federations, matchup assignments, and official vector crests.',
    items: [
      {
        navKey: 'partners',
        label: 'Partners',
        path: '/admin/partners',
        icon: 'handshake',
        description: 'Manage clubs, federations, venues, brands, and their reporting setup.',
        accentColor: navAccent.secondary,
      },
      {
        navKey: 'matchup-assignments',
        label: 'Matchup Assignments',
        path: '/admin/project-partners',
        icon: 'group_work',
        description: 'Assign Home and Away partner clubs to events for template and logo inheritance.',
        accentColor: navAccent.primaryStrong,
      },
      {
        navKey: 'club-clusters',
        label: 'Club Clusters',
        path: '/admin/club-clusters',
        icon: 'groups',
        description: 'Consolidate duplicate club and team detections into canonical partner records.',
        accentColor: navAccent.secondary,
      },
      {
        navKey: 'organizations',
        label: 'Organizations',
        path: '/admin/organizations',
        icon: 'business',
        description: 'Manage governing federations, commercial sponsors, and member club assignments.',
        accentColor: navAccent.primary,
      },
      {
        navKey: 'club-logos',
        label: 'Club Logos',
        path: '/admin/club-logos',
        icon: 'shield',
        description: 'Centralized official club, national team, and federation crests synced across all entities and reports.',
        accentColor: navAccent.primary,
      },
      {
        navKey: 'brand-logos',
        label: 'Brand Logos',
        path: '/admin/brand-assets',
        icon: 'verified',
        description: 'Upload and maintain unified official brand logos and sponsor visual assets.',
        accentColor: navAccent.success,
      },
    ],
  },
  {
    key: 'reports',
    title: 'Reporting',
    description: 'Configure templates, blocks, themes, formulas, and global explorer reports.',
    items: [
      {
        navKey: 'reporting-workspace',
        label: 'Reporting Workspace',
        path: '/admin/reports',
        icon: 'dashboard_customize',
        description: 'Enter the canonical reporting workspace and choose the setup surface you need.',
        tourDescription: 'A report is the shareable page a partner sees for their event or organization. This is the hub for everything that builds one — layout, visual theme, and reusable content.',
        accentColor: navAccent.primary,
      },
      {
        navKey: 'report-builder',
        label: 'Report Builder',
        path: '/admin/visualization',
        icon: 'view_quilt',
        description: 'Manage report blocks, layouts, preview flow, and template composition.',
        tourDescription: 'Design what a report looks like — arrange its blocks (charts, stats, text) into a layout, then preview it before it goes live.',
        accentColor: navAccent.secondary,
        showInAdminWorkspace: false,
      },
      {
        navKey: 'report-themes',
        label: 'Report Themes',
        path: '/admin/styles',
        icon: 'palette',
        description: 'Manage reusable report visual themes and branded page styling.',
        accentColor: navAccent.error,
        showInAdminWorkspace: false,
      },
      {
        navKey: 'content-library',
        label: 'Content Library',
        path: '/admin/content-library',
        icon: 'folder',
        description: 'Manage reusable report content assets and shared media resources.',
        accentColor: navAccent.info,
        showInAdminWorkspace: false,
      },
      {
        navKey: 'charts-kpi-formulas',
        label: 'Charts & KPI Formulas',
        path: '/admin/charts',
        icon: 'trending_up',
        description: 'Configure chart logic, KPI formulas, and calculation behavior.',
        accentColor: navAccent.warning,
        showInAdminWorkspace: false,
      },
      {
        navKey: 'global-report',
        label: 'Global Report',
        path: '/admin/global/reports',
        icon: 'public',
        description: 'Everything Messmass collects, in the same interactive report as a hashtag, partner or event: variants, page password and sharing.',
        accentColor: navAccent.primaryStrong,
      },
    ],
  },
  {
    key: 'data',
    title: 'Data & Tagging',
    description: 'Control tracked metrics, live counter layouts, tags, and short links.',
    items: [
      {
        navKey: 'metrics-fields',
        label: 'Metrics & Fields',
        path: '/admin/kyc',
        icon: 'tune',
        description: 'Manage tracked event metrics, aliases, and input-field definitions.',
        tourDescription: 'The master dictionary of every metric messmass can track — VIP guests, merch sold, and so on. Define a variable once here, and it becomes usable in data entry and report formulas.',
        accentColor: navAccent.primary,
      },
      {
        navKey: 'live-counter-layouts',
        label: 'Live Counter Layouts',
        path: '/admin/clicker-manager',
        icon: 'swap_horiz',
        description: 'Manage live event counter groupings and partner-level layout assignment.',
        tourDescription: 'A Live Counter Layout is a reusable layout for fast, tap-to-count data entry at live events. Assign a layout to a partner and every one of their events uses that same counter layout.',
        accentColor: navAccent.secondary,
      },
      {
        navKey: 'filters',
        label: 'Filters',
        path: '/admin/filter',
        icon: 'search',
        description: 'Manage multi-hashtag filters and related exploration paths.',
        accentColor: navAccent.primaryStrong,
      },
      {
        navKey: 'hashtags',
        label: 'Hashtags',
        path: '/admin/hashtags',
        icon: 'label',
        description: 'Manage hashtags, their categorization, and downstream reporting tags.',
        accentColor: navAccent.primaryStrong,
      },
      {
        navKey: 'categories',
        label: 'Categories',
        path: '/admin/categories',
        icon: 'public',
        description: 'Organize hashtag categories and their reusable structure.',
        accentColor: navAccent.warning,
      },
      {
        navKey: 'bitly-links',
        label: 'Bitly Links',
        path: '/admin/bitly',
        icon: 'link',
        description: 'Manage Bitly links, associations, and performance evidence.',
        accentColor: navAccent.info,
      },
    ],
  },
  {
    key: 'analytics',
    title: 'Intelligence',
    description: 'Review sponsorship performance, Fanmass AI vision proof, and executive insights.',
    items: [
      {
        navKey: 'analytics-home',
        label: 'Analytics Home',
        path: '/admin/analytics',
        icon: 'dashboard',
        description: 'Enter the canonical analytics workspace and choose the right reporting lens.',
        tourDescription: 'The entry point for every analytics view — sponsorship, executive, marketing, and operations dashboards all start here.',
        accentColor: navAccent.primary,
      },
      {
        navKey: 'sponsorship-hub',
        label: 'Sponsorship Hub',
        path: '/admin/analytics/sponsorship',
        icon: 'analytics',
        description: 'Review unified sponsorship performance across events, partners, and organizations.',
        accentColor: navAccent.secondary,
        showInAdminWorkspace: false,
      },
      {
        navKey: 'executive-dashboard',
        label: 'Executive Dashboard',
        path: '/admin/analytics/executive',
        icon: 'monitoring',
        description: 'Review cross-event KPIs, trends, and top events at portfolio level.',
        accentColor: navAccent.info,
        showInAdminWorkspace: false,
      },
      {
        navKey: 'marketing-dashboard',
        label: 'Marketing Dashboard',
        path: '/admin/analytics/marketing',
        icon: 'campaign',
        description: 'Review campaign, audience, and reach-focused analytics views.',
        accentColor: navAccent.error,
        showInAdminWorkspace: false,
      },
      {
        navKey: 'operations-dashboard',
        label: 'Operations Dashboard',
        path: '/admin/analytics/operations',
        icon: 'manufacturing',
        description: 'Review delivery, capacity, and execution-oriented analytics views.',
        accentColor: navAccent.warning,
        showInAdminWorkspace: false,
      },
      {
        navKey: 'automated-insights',
        label: 'Automated Insights',
        path: '/admin/analytics/combined-insights',
        icon: 'merge',
        description: 'Both insight pipelines -- Executive Dashboard and Analytics Insights -- merged into one feed.',
        accentColor: navAccent.warning,
        showInAdminWorkspace: false,
      },
      {
        navKey: 'ai-analytics',
        label: 'AI Analytics',
        path: '/admin/analytics/ai',
        icon: 'smart_toy',
        description: 'Review completed Fanmass photo results, detections, saved boxes, and content flags by event.',
        tourDescription: 'Shows only photo results Messmass has received. Counts describe those photos and do not imply that every event photo has been analyzed.',
        accentColor: navAccent.info,
      },
      {
        navKey: 'fanmass-proof-review',
        label: 'Fanmass Proof Review',
        path: '/admin/fanmass-evidence',
        icon: 'fact_check',
        description: 'Check, confirm, reject, correct or add the proof behind every brand and club figure Fanmass produces; the decisions train the whole system.',
        accentColor: navAccent.primary,
      },
    ],
  },
  {
    key: 'system',
    title: 'System',
    description: 'Manage access, public front-door publishing, and runtime cache.',
    items: [
      {
        navKey: 'users',
        label: 'Users',
        path: '/admin/users',
        icon: 'group',
        description: 'Manage admin users, roles, and access control.',
        accentColor: navAccent.primaryStrong,
      },
      {
        navKey: 'main-page',
        label: 'Main Page',
        path: '/admin/mainpage',
        icon: 'home',
        description: 'Choose the report driving the public main page and regenerate static content.',
        accentColor: navAccent.primary,
      },
      {
        navKey: 'cache',
        label: 'Cache',
        path: '/admin/cache',
        icon: 'delete',
        description: 'Clear caches when operators need fresh runtime or content state.',
        accentColor: navAccent.error,
      },
    ],
  },
];

export function getAdminWorkspaceSections(): AdminNavSection[] {
  return adminNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.showInAdminWorkspace !== false),
    }))
    .filter((section) => section.items.length > 0);
}

export function getAnalyticsNavItems(): AdminNavItem[] {
  return adminNavSections.find((section) => section.key === 'analytics')?.items || [];
}

export function getReportingNavItems(): AdminNavItem[] {
  return adminNavSections.find((section) => section.key === 'reports')?.items || [];
}

export function getReportingWorkspaceItems(): AdminNavItem[] {
  const reportingItems = getReportingNavItems().filter((item) => item.path !== '/admin/reports');
  const dataItems = adminNavSections.find((section) => section.key === 'data')?.items || [];
  const reportingDependencies = dataItems.filter((item) =>
    item.path === '/admin/kyc' || item.path === '/admin/clicker-manager'
  );

  return [...reportingItems, ...reportingDependencies];
}

export function getAnalyticsWorkspaceItems(): AdminNavItem[] {
  const analyticsItems = getAnalyticsNavItems();
  const partnerActivationItem = adminNavSections
    .find((section) => section.key === 'operations')
    ?.items.find((item) => item.label === 'Partner Activation');

  if (!partnerActivationItem) {
    return analyticsItems;
  }

  const sponsorshipHubIndex = analyticsItems.findIndex((item) => item.label === 'Sponsorship Hub');
  if (sponsorshipHubIndex === -1) {
    return [...analyticsItems, partnerActivationItem];
  }

  return [
    ...analyticsItems.slice(0, sponsorshipHubIndex + 1),
    partnerActivationItem,
    ...analyticsItems.slice(sponsorshipHubIndex + 1),
  ];
}

function buildGroupedItems(
  items: AdminNavItem[],
  groupSpec: Array<{ parentPath: string; childPaths: string[] }>
): SidebarNavGroup[] {
  const byPath = new Map(items.map((item) => [item.path, item]));
  const consumed = new Set<string>();
  const groups: SidebarNavGroup[] = [];

  for (const spec of groupSpec) {
    const parent = byPath.get(spec.parentPath);
    const availableChildren = spec.childPaths
      .map((cp) => byPath.get(cp))
      .filter((c): c is AdminNavItem => Boolean(c));

    if (parent) {
      consumed.add(parent.path);
      availableChildren.forEach((c) => consumed.add(c.path));
      groups.push({ parent, children: availableChildren });
    } else if (availableChildren.length > 0) {
      const [promoted, ...rest] = availableChildren;
      consumed.add(promoted.path);
      rest.forEach((c) => consumed.add(c.path));
      groups.push({ parent: promoted, children: rest });
    }
  }

  for (const item of items) {
    if (!consumed.has(item.path)) {
      groups.push({ parent: item, children: [] });
    }
  }

  return groups;
}

/**
 * Consolidates the 33 underlying admin routes into 15 scannable top-level
 * sidebar items (Overview + 14 section groups), keeping secondary surfaces
 * accessible via expandable submenus (expanded mode) or hover/focus flyout
 * menus (collapsed mode).
 */
export function getSidebarNavGroups(section: AdminNavSection): SidebarNavGroup[] {
  switch (section.key) {
    case 'operations':
      return buildGroupedItems(section.items, [
        { parentPath: '/admin/events', childPaths: ['/admin/quick-add'] },
        { parentPath: '/admin/analytics/sponsorship/activation', childPaths: [] },
        { parentPath: '/admin/messages', childPaths: [] },
      ]);
    case 'entities':
      return buildGroupedItems(section.items, [
        { parentPath: '/admin/partners', childPaths: ['/admin/project-partners', '/admin/club-clusters'] },
        { parentPath: '/admin/organizations', childPaths: [] },
        { parentPath: '/admin/club-logos', childPaths: ['/admin/brand-assets'] },
      ]);
    case 'reports':
      return buildGroupedItems(section.items, [
        {
          parentPath: '/admin/reports',
          childPaths: ['/admin/visualization', '/admin/styles', '/admin/charts', '/admin/content-library'],
        },
        { parentPath: '/admin/global/reports', childPaths: [] },
      ]);
    case 'data':
      return buildGroupedItems(section.items, [
        { parentPath: '/admin/kyc', childPaths: ['/admin/clicker-manager'] },
        { parentPath: '/admin/filter', childPaths: ['/admin/hashtags', '/admin/categories', '/admin/bitly'] },
      ]);
    case 'analytics':
      return buildGroupedItems(section.items, [
        {
          parentPath: '/admin/analytics',
          childPaths: [
            '/admin/analytics/sponsorship',
            '/admin/analytics/executive',
            '/admin/analytics/marketing',
            '/admin/analytics/operations',
            '/admin/analytics/combined-insights',
          ],
        },
        { parentPath: '/admin/analytics/ai', childPaths: ['/admin/fanmass-evidence'] },
      ]);
    case 'system':
      return buildGroupedItems(section.items, [
        { parentPath: '/admin/users', childPaths: [] },
        { parentPath: '/admin/mainpage', childPaths: ['/admin/cache'] },
      ]);
    default:
      return section.items.map((item) => ({ parent: item, children: [] }));
  }
}
