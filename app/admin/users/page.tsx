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
import type { AdminUser } from '@/lib/auth';

export default function AdminUsersPageUnified() {
  const router = useRouter();
  
  // Core data state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
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

  // Auth guard
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/admin/auth', { cache: 'no-store' });
        if (!res.ok) {
          router.push('/admin/login');
          return;
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
        name: name.trim()
      });
      if (data.success) {
        const userEmail = email.trim();
        setEmail('');
        setName('');
        setShowCreateModal(false);
        setPasswordModal({
          isOpen: true,
          password: data.password,
          userEmail: userEmail,
          title: 'User Created Successfully'
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

  // WHAT: Wire adapter with real action handlers
  // WHY: Connects unified view actions to actual business logic
  const adapterWithHandlers = {
    ...usersAdapter,
    listConfig: {
      ...usersAdapter.listConfig,
      rowActions: usersAdapter.listConfig.rowActions?.map(action => ({
        ...action,
        handler: action.label === 'Regenerate' 
          ? onRegenerate
          : onDelete
      })),
    },
    cardConfig: {
      ...usersAdapter.cardConfig,
      cardActions: usersAdapter.cardConfig.cardActions?.map(action => ({
        ...action,
        handler: action.label === 'Regenerate' 
          ? onRegenerate
          : onDelete
      })),
    },
  };

  if (loading && users.length === 0) {
    return <div className="page-container">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ color: '#ef4444' }}>{error}</div>
          <button className="btn btn-primary" onClick={refreshUsers} style={{ marginTop: '1rem' }}>
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

        <div className="form-group" style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
          <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
            <strong>Note:</strong> A secure password will be generated automatically and displayed after creation.
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
