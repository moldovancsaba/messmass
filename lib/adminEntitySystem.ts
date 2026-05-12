import type { AdminUser } from '@/lib/auth';
import type { AdminPageAdapter, AdminSurfaceAction } from '@/lib/adminDataAdapters';

export type AdminEntitySurface = 'list' | 'card';

export type AdminEntityCapability =
  | 'create'
  | 'edit'
  | 'delete'
  | 'report'
  | 'share'
  | 'edit-content'
  | 'manage-members'
  | 'analytics'
  | 'kyc'
  | 'export';

export type AdminEntityPermission = AdminUser['role'] | 'authenticated';

type EntityRouteAction<T> = {
  kind: 'route';
  getHref: (item: T) => string;
  target?: '_self' | '_blank';
};

type EntityModalAction = {
  kind: 'modal';
  modalKey: string;
};

type EntityShareAction<T> = {
  kind: 'share';
  shareKey: string;
  getResourceId: (item: T) => string;
};

type EntityMutationAction<T> = {
  kind: 'mutation';
  mutationKey: string;
  confirmMessage?: string | ((item: T) => string);
};

export type AdminEntityActionExecution<T> =
  | EntityRouteAction<T>
  | EntityModalAction
  | EntityShareAction<T>
  | EntityMutationAction<T>;

export interface AdminEntityActionDefinition<T> {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  title?: string;
  surfaces?: AdminEntitySurface[];
  requiredCapabilities?: AdminEntityCapability[];
  requiredPermissions?: AdminEntityPermission[];
  execution: AdminEntityActionExecution<T>;
}

export interface AdminEntitySearchConfig<T> {
  fields: Array<keyof T | string>;
  placeholder?: string;
}

export interface AdminEntityConfig<T> {
  entityKey: string;
  pageName: string;
  displayName: string;
  supportedViews: AdminEntitySurface[];
  capabilities: AdminEntityCapability[];
  search: AdminEntitySearchConfig<T>;
  permissionRequirements?: AdminEntityPermission[];
  actions: AdminEntityActionDefinition<T>[];
}

export interface AdminEntityRuntime<T> {
  user?: Pick<AdminUser, 'role'> | null;
  openModal?: (modalKey: string, item: T) => void;
  openShare?: (shareKey: string, resourceId: string, item: T) => void;
  runMutation?: (mutationKey: string, item: T) => void;
  navigate?: (href: string, target?: '_self' | '_blank') => void;
}

function hasRequiredPermissions(
  requiredPermissions: AdminEntityPermission[] | undefined,
  user: Pick<AdminUser, 'role'> | null | undefined
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  if (!user) {
    return false;
  }

  return requiredPermissions.some((permission) => {
    if (permission === 'authenticated') {
      return true;
    }

    if (permission === 'admin') {
      return user.role === 'admin' || user.role === 'superadmin';
    }

    return user.role === permission;
  });
}

function hasRequiredCapabilities<T>(
  action: AdminEntityActionDefinition<T>,
  entityConfig: AdminEntityConfig<T>
): boolean {
  return (action.requiredCapabilities || []).every((capability) =>
    entityConfig.capabilities.includes(capability)
  );
}

export function executeAdminEntityAction<T>(
  action: AdminEntityActionDefinition<T>,
  item: T,
  runtime: AdminEntityRuntime<T>
) {
  const navigate = runtime.navigate || ((href: string, target?: '_self' | '_blank') => {
    if (target === '_blank') {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }

    window.location.assign(href);
  });

  switch (action.execution.kind) {
    case 'route':
      navigate(action.execution.getHref(item), action.execution.target);
      return;
    case 'modal':
      runtime.openModal?.(action.execution.modalKey, item);
      return;
    case 'share':
      runtime.openShare?.(
        action.execution.shareKey,
        action.execution.getResourceId(item),
        item
      );
      return;
    case 'mutation': {
      const confirmMessage = typeof action.execution.confirmMessage === 'function'
        ? action.execution.confirmMessage(item)
        : action.execution.confirmMessage;

      if (confirmMessage && !window.confirm(confirmMessage)) {
        return;
      }

      runtime.runMutation?.(action.execution.mutationKey, item);
      return;
    }
  }
}

export function getAdminEntitySurfaceActions<T>(
  entityConfig: AdminEntityConfig<T>,
  runtime: AdminEntityRuntime<T>,
  surface: AdminEntitySurface
): AdminSurfaceAction<T>[] {
  return entityConfig.actions
    .filter((action) => !action.surfaces || action.surfaces.includes(surface))
    .filter((action) => hasRequiredCapabilities(action, entityConfig))
    .filter((action) => hasRequiredPermissions(action.requiredPermissions, runtime.user))
    .map((action) => ({
      label: action.label,
      icon: action.icon,
      variant: action.variant,
      title: action.title,
      handler: (item: T) => executeAdminEntityAction(action, item, runtime),
    }));
}

export function withAdminEntityActions<T extends { _id: string }>(
  baseAdapter: AdminPageAdapter<T>,
  entityConfig: AdminEntityConfig<T>,
  runtime: AdminEntityRuntime<T>
): AdminPageAdapter<T> {
  const rowActions = getAdminEntitySurfaceActions(entityConfig, runtime, 'list');
  const cardActions = getAdminEntitySurfaceActions(entityConfig, runtime, 'card');

  return {
    ...baseAdapter,
    pageName: entityConfig.pageName,
    searchFields: entityConfig.search.fields,
    listConfig: {
      ...baseAdapter.listConfig,
      rowActions,
    },
    cardConfig: {
      ...baseAdapter.cardConfig,
      cardActions,
    },
  };
}
