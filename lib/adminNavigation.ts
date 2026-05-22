export interface AdminNavItem {
  label: string;
  path: string;
  icon: string;
  iconVariant?: 'outlined' | 'rounded';
  description: string;
  accentColor: string;
  showInAdminWorkspace?: boolean;
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
        label: 'Events',
        path: '/admin/events',
        icon: 'event',
        description: 'Create events, manage setup, and open live editor or report flows.',
        accentColor: navAccent.success,
      },
      {
        label: 'Partner Activation',
        path: '/admin/analytics/sponsorship/activation',
        icon: 'task_alt',
        description: 'Work sponsor proof gaps, recap readiness, and delivery follow-up queues.',
        accentColor: navAccent.warning,
      },
      {
        label: 'Quick Add',
        path: '/admin/quick-add',
        icon: 'bolt',
        description: 'Create operational records faster when full setup is unnecessary.',
        accentColor: navAccent.warning,
      },
      {
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
    title: 'Entities',
    description: 'Manage the teams, partners, and organizational relationships behind the work.',
    items: [
      {
        label: 'Partners',
        path: '/admin/partners',
        icon: 'handshake',
        description: 'Manage clubs, federations, venues, brands, and their reporting setup.',
        accentColor: navAccent.secondary,
      },
      {
        label: 'Organizations',
        path: '/admin/organizations',
        icon: 'business',
        description: 'Create organizations and manage partner membership assignments.',
        accentColor: navAccent.primary,
      },
      {
        label: 'Project Partners',
        path: '/admin/project-partners',
        icon: 'group_work',
        description: 'Review and manage partner-to-project associations across the portfolio.',
        accentColor: navAccent.primaryStrong,
      },
    ],
  },
  {
    key: 'reports',
    title: 'Reports',
    description: 'Configure templates, blocks, themes, and reusable report content.',
    items: [
      {
        label: 'Reporting Workspace',
        path: '/admin/reports',
        icon: 'dashboard_customize',
        description: 'Enter the canonical reporting workspace and choose the setup surface you need.',
        accentColor: navAccent.primary,
      },
      {
        label: 'Report Builder',
        path: '/admin/visualization',
        icon: 'view_quilt',
        description: 'Manage report blocks, layouts, preview flow, and template composition.',
        accentColor: navAccent.secondary,
        showInAdminWorkspace: false,
      },
      {
        label: 'Report Themes',
        path: '/admin/styles',
        icon: 'palette',
        description: 'Manage reusable report visual themes and branded page styling.',
        accentColor: navAccent.error,
        showInAdminWorkspace: false,
      },
      {
        label: 'Content Library',
        path: '/admin/content-library',
        icon: 'folder',
        description: 'Manage reusable report content assets and shared media resources.',
        accentColor: navAccent.info,
        showInAdminWorkspace: false,
      },
      {
        label: 'Chart Algorithms',
        path: '/admin/charts',
        icon: 'trending_up',
        description: 'Configure chart logic, formulas, and calculation behavior.',
        accentColor: navAccent.warning,
        showInAdminWorkspace: false,
      },
    ],
  },
  {
    key: 'data',
    title: 'Data',
    description: 'Control variables, clicker sets, links, and supporting data plumbing.',
    items: [
      {
        label: 'KYC Variables',
        path: '/admin/kyc',
        icon: 'lock',
        description: 'Manage tracked variables, aliases, and input-field definitions.',
        accentColor: navAccent.primary,
      },
      {
        label: 'Clicker Sets',
        path: '/admin/clicker-manager',
        icon: 'swap_horiz',
        description: 'Manage clicker-mode groupings and partner-level variable-set assignment.',
        accentColor: navAccent.secondary,
      },
      {
        label: 'Bitly Links',
        path: '/admin/bitly',
        icon: 'link',
        description: 'Manage Bitly links, associations, and performance evidence.',
        accentColor: navAccent.info,
      },
      {
        label: 'Filters',
        path: '/admin/filter',
        icon: 'search',
        description: 'Manage multi-hashtag filters and related exploration paths.',
        accentColor: navAccent.primaryStrong,
      },
      {
        label: 'Hashtags',
        path: '/admin/hashtags',
        icon: 'label',
        description: 'Manage hashtags, their categorization, and downstream reporting tags.',
        accentColor: navAccent.primaryStrong,
      },
      {
        label: 'Categories',
        path: '/admin/categories',
        icon: 'public',
        description: 'Organize hashtag categories and their reusable structure.',
        accentColor: navAccent.warning,
      },
    ],
  },
  {
    key: 'analytics',
    title: 'Analytics',
    description: 'Review sponsorship performance, operational insights, and analytics surfaces.',
    items: [
      {
        label: 'Analytics Home',
        path: '/admin/analytics',
        icon: 'dashboard',
        description: 'Enter the canonical analytics workspace and choose the right reporting lens.',
        accentColor: navAccent.primary,
      },
      {
        label: 'Sponsorship Hub',
        path: '/admin/analytics/sponsorship',
        icon: 'analytics',
        description: 'Review unified sponsorship performance across events, partners, and organizations.',
        accentColor: navAccent.secondary,
        showInAdminWorkspace: false,
      },
      {
        label: 'Executive Dashboard',
        path: '/admin/analytics/executive',
        icon: 'monitoring',
        description: 'Review cross-event KPIs, trends, and top events at portfolio level.',
        accentColor: navAccent.info,
        showInAdminWorkspace: false,
      },
      {
        label: 'Marketing Dashboard',
        path: '/admin/analytics/marketing',
        icon: 'campaign',
        description: 'Review campaign, audience, and reach-focused analytics views.',
        accentColor: navAccent.error,
        showInAdminWorkspace: false,
      },
      {
        label: 'Operations Dashboard',
        path: '/admin/analytics/operations',
        icon: 'manufacturing',
        description: 'Review delivery, capacity, and execution-oriented analytics views.',
        accentColor: navAccent.warning,
        showInAdminWorkspace: false,
      },
      {
        label: 'Insights',
        path: '/admin/analytics/insights',
        icon: 'lightbulb',
        description: 'Review anomaly detection, trends, and broader analytics insights.',
        accentColor: navAccent.warning,
        showInAdminWorkspace: false,
      },
    ],
  },
  {
    key: 'system',
    title: 'System',
    description: 'Manage access, system behavior, publishing, and guidance.',
    items: [
      {
        label: 'Users',
        path: '/admin/users',
        icon: 'group',
        description: 'Manage admin users, roles, and access control.',
        accentColor: navAccent.primaryStrong,
      },
      {
        label: 'Main Page',
        path: '/admin/mainpage',
        icon: 'home',
        description: 'Choose the report driving the public main page and regenerate static content.',
        accentColor: navAccent.primary,
      },
      {
        label: 'Cache',
        path: '/admin/cache',
        icon: 'delete',
        description: 'Clear caches when operators need fresh runtime or content state.',
        accentColor: navAccent.error,
      },
      {
        label: 'Help',
        path: '/admin/help',
        icon: 'menu_book',
        description: 'Read in-product guidance for operators, guests, and admins.',
        accentColor: navAccent.neutral,
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
    item.label === 'KYC Variables' || item.label === 'Clicker Sets'
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

export function getSidebarNavGroups(section: AdminNavSection): SidebarNavGroup[] {
  if (section.key === 'analytics' || section.key === 'reports') {
    const [parent, ...children] = section.items;
    if (!parent) {
      return [];
    }

    return [{ parent, children }];
  }

  return section.items.map((item) => ({
    parent: item,
    children: [],
  }));
}
