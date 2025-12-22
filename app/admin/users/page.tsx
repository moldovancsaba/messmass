// app/admin/users/page.tsx — Admin Users Management (Unified)
'use client';

// WHAT: Fully unified users page with create modal
// WHY: Consistent with categories page - all CRUD in modals
// BEFORE: 400 lines with inline create form
// AFTER: ~200 lines, fully unified with modal-based create

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UnifiedAdminPage from '@/components/UnifiedAdminPage';
import { usersAdapter } from '@/lib/adapters';
import { FormModal } from '@/components/modals';
import { apiPost, apiPut, apiDelete } from '@/lib/apiClient';
import PasswordModal from '@/components/PasswordModal';
import { ConfirmDialog } from '@/components/modals';
import RoleDropdown from '@/components/RoleDropdown';
import type { AdminUser } from '@/lib/auth';
import type { UserRole } from '@/lib/users';
import adminStyles from '@/app/styles/admin-pages.module.css';

export default function AdminUsersPageUnified() {
  const router = useRouter();
  
  // Core data state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // WHAT: Current user context for role management
  // WHY: Needed for RoleDropdown to determine if user is superadmin and prevent self-demotion
  const [currentUser, setCurrentUser] = useState<{ id: string; role: UserRole } | null>(null);
  
  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'api'>('admin');
  const [creating, setCreating] = useState(false);
  
  // Modal states
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    password: string;
    userEmail: string;
    title: string;
  }>({ isOpen: false, password: '', userEmail: '', title: '' });
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    isDangerous?: boolean;
  }>({ isOpen: false, onConfirm: () => {}, title: '', message: '' });

  // WHAT: Auth guard + fetch current user
  // WHY: Protect page and get user context for role management
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/admin/auth', { cache: 'no-store' });
        if (!res.ok) {
          router.push('/admin/login');
          return;
        }
        
        // WHAT: Fetch current user for role dropdown context
        const data = await res.json();
        if (data.user) {
          setCurrentUser({
            id: data.user.id,
            role: data.user.role as UserRole,
          });
        }
      } catch {
        router.push('/admin/login');
      }
    };
    run();
  }, [router]);

  // Load users data
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/local-users', { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setUsers(data.users || []);
          setError(null);
        } else {
          setError(data.error || 'Failed to load users');
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Refresh after create/regenerate/delete
  const refreshUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/local-users', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to refresh users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create user handler
  const onCreateUser = async () => {
    if (!email.trim() || !name.trim()) return;
    setCreating(true);
    try {
      const data = await apiPost('/api/admin/local-users', {
        email: email.trim(),
        name: name.trim(),
        role: role
      });
      if (data.success) {
        const userEmail = email.trim();
        const userRole = role;
        setEmail('');
        setName('');
        setRole('admin');
        setShowCreateModal(false);
        setPasswordModal({
          isOpen: true,
          password: data.password,
          userEmail: userEmail,
          title: userRole === 'api' ? 'API Key Generated' : 'User Created Successfully'
        });
        await refreshUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch {
      setError('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  // Regenerate password handler
  const onRegenerate = async (user: AdminUser) => {
    setConfirmModal({
      isOpen: true,
      title: 'Regenerate Password',
      message: 'Regenerate password for this user? Old password will no longer work.',
      confirmText: 'Regenerate',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const data = await apiPut(`/api/admin/local-users/${user.id}`, {
            regeneratePassword: true
          });
          if (data.success) {
            setPasswordModal({
              isOpen: true,
              password: data.password,
              userEmail: user.email,
              title: 'Password Regenerated'
            });
            await refreshUsers();
          } else {
            setError(data.error || 'Failed to regenerate password');
          }
        } catch (err) {
          console.error('❌ Regenerate password error:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate password';
          setError(errorMessage);
        }
      }
    });
  };

  // Toggle API access handler
  const onToggleAPIAccess = async (user: AdminUser) => {
    const newState = !user.apiKeyEnabled
    setConfirmModal({
      isOpen: true,
      title: newState ? 'Enable API Access' : 'Disable API Access',
      message: newState 
        ? `Enable API access for ${user.email}? They can immediately use their password as an API key.`
        : `Disable API access for ${user.email}? Active integrations may break.`,
      confirmText: newState ? 'Enable' : 'Disable',
      isDangerous: !newState,
      onConfirm: async () => {
        try {
          const data = await apiPut(
            `/api/admin/local-users/${user.id}/api-access`,
            { enabled: newState }
          )
          if (data.success) {
            await refreshUsers()
            if (newState && data.recommendation) {
              alert(data.recommendation)
            }
          } else {
            setError(data.error || 'Failed to toggle API access')
          }
        } catch {
          setError('Failed to toggle API access')
        }
      }
    })
  }

  // Delete user handler
  const onDelete = async (user: AdminUser) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This cannot be undone.',
      confirmText: 'Delete',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const data = await apiDelete(`/api/admin/local-users/${user.id}`);
          if (data.success !== false) {
            await refreshUsers();
          } else {
            setError(data.error || 'Failed to delete user');
          }
        } catch {
          setError('Failed to delete user');
        }
      }
    });
  };
  
  // WHAT: Role change handler for RoleDropdown
  // WHY: Enable superadmins to promote/demote users
  const onRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const data = await apiPut(`/api/admin/users/${userId}/role`, {
        newRole,
      });
      
      if (data.success) {
        await refreshUsers();
        // WHAT: Show success message
        console.log(`✅ Role updated: ${data.message}`);
      } else {
        setError(data.error || 'Failed to update role');
        throw new Error(data.error || 'Failed to update role');
      }
    } catch (err) {
      console.error('❌ Role change error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
      throw err; // Re-throw so RoleDropdown knows it failed
    }
  };

  // WHAT: Wire adapter with real action handlers + role dropdown
  // WHY: Connects unified view actions to actual business logic and role management
  const adapterWithHandlers = {
    ...usersAdapter,
    listConfig: {
      ...usersAdapter.listConfig,
      columns: usersAdapter.listConfig.columns.map(col => {
        // WHAT: Override role column to use RoleDropdown
        if (col.key === 'role') {
          return {
            ...col,
            render: (user: any) => (
              <RoleDropdown
                userId={user.id}
                currentRole={user.role as UserRole}
                currentUserRole={currentUser?.role}
                currentUserId={currentUser?.id}
                onRoleChange={onRoleChange}
              />
            ),
          };
        }
        return col;
      }),
      rowActions: [
        {
          label: (user: any) => user.apiKeyEnabled ? 'Disable API' : 'Enable API',
          icon: (user: any) => user.apiKeyEnabled ? '🔒' : '🔓',
          variant: (user: any) => user.apiKeyEnabled ? 'warning' : 'success',
          handler: onToggleAPIAccess,
          title: 'Toggle API access'
        },
        ...usersAdapter.listConfig.rowActions?.map(action => ({
          ...action,
          handler: action.label === 'Regenerate' 
            ? onRegenerate
            : onDelete
        })) || []
      ],
    },
    cardConfig: {
      ...usersAdapter.cardConfig,
      metaFields: usersAdapter.cardConfig.metaFields?.map(field => {
        // WHAT: Override role field to use RoleDropdown in card view
        if (field.key === 'role') {
          return {
            ...field,
            render: (user: any) => (
              <RoleDropdown
                userId={user.id}
                currentRole={user.role as UserRole}
                currentUserRole={currentUser?.role}
                currentUserId={currentUser?.id}
                onRoleChange={onRoleChange}
              />
            ),
          };
        }
        return field;
      }),
      cardActions: [
        {
          label: (user: any) => user.apiKeyEnabled ? 'Disable API' : 'Enable API',
          icon: (user: any) => user.apiKeyEnabled ? '🔒' : '🔓',
          variant: (user: any) => user.apiKeyEnabled ? 'warning' : 'success',
          handler: onToggleAPIAccess,
          title: 'Toggle API access'
        },
        ...usersAdapter.cardConfig.cardActions?.map(action => ({
          ...action,
          handler: action.label === 'Regenerate' 
            ? onRegenerate
            : onDelete
        })) || []
      ],
    },
  };

  if (loading && users.length === 0) {
    return <div className="page-container">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className={adminStyles.errorContainer}>
          <div className={adminStyles.errorIcon}>⚠️</div>
          <div className={adminStyles.errorText}>{error}</div>
          <button className={`btn btn-primary ${adminStyles.errorAction}`} onClick={refreshUsers}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* WHAT: Fully unified users page with modal-based create
          WHY: Consistent with categories page, all CRUD in modals */}
      <UnifiedAdminPage
        adapter={adapterWithHandlers as any}
        items={users as any}
        title="👥 Users Management"
        subtitle="Create and manage admin users"
        backLink="/admin"
        actionButtons={[
          {
            label: 'Add User',
            icon: '➕',
            variant: 'primary',
            onClick: () => setShowCreateModal(true),
          }
        ]}
      />

      {/* WHAT: Create user modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEmail('');
          setName('');
          setRole('admin');
        }}
        onSubmit={onCreateUser}
        title="➕ Create New Admin User"
        submitText="Create User"
        disableSubmit={creating || !email.trim() || !name.trim()}
        size="md"
      >
        <div className="form-group mb-6">
          <label className="form-label-block text-sm text-gray-700">
            Email Address *
          </label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />
        </div>

        <div className="form-group mb-6">
          <label className="form-label-block text-sm text-gray-700">
            Full Name *
          </label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="form-group mb-6">
          <label className="form-label-block text-sm text-gray-700">
            User Type *
          </label>
          <select 
            className="form-input" 
            value={role} 
            onChange={(e) => setRole(e.target.value as 'admin' | 'api')}
          >
            <option value="admin">Admin User (Dashboard Access)</option>
            <option value="api">API User (Programmatic Access)</option>
          </select>
          <p className="form-help-text mt-2">
            Admin users log in via web interface. API users authenticate with Bearer tokens.
          </p>
        </div>

        {role === 'api' && (
          <div className="info-box mb-6">
            <p className={adminStyles.warningStrong}><strong>API User Configuration:</strong></p>
            <ul className={adminStyles.warningList}>
              <li>✅ API access automatically enabled</li>
              <li>✅ 32-character API key generated</li>
              <li>✅ Bearer token authentication</li>
              <li>❌ No web dashboard access</li>
            </ul>
          </div>
        )}

        <div className={`form-group ${adminStyles.warningBox}`}>
          <p className={adminStyles.warningText}>
            <strong>Note:</strong> A secure {role === 'api' ? 'API key' : 'password'} will be generated automatically and displayed after creation.
          </p>
        </div>
      </FormModal>

      {/* Password Display Modal */}
      <PasswordModal
        isOpen={passwordModal.isOpen}
        onClose={() => setPasswordModal({ isOpen: false, password: '', userEmail: '', title: '' })}
        password={passwordModal.password}
        title={passwordModal.title}
        userEmail={passwordModal.userEmail}
        subtitle="Copy this password and share it securely with the user"
      />

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, onConfirm: () => {}, title: '', message: '' })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.isDangerous ? 'danger' : 'info'}
      />
    </>
  );
}
