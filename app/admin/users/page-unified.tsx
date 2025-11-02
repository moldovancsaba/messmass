// app/admin/users/page.tsx — Admin Users Management (Unified)
'use client';

// WHAT: Migrated users page using Unified Admin View System (Phase 5)
// WHY: Reduces code by ~40% while adding search, sort, view toggle
// BEFORE: 400 lines with manual table, complex pagination, search state
// AFTER: ~250 lines with UnifiedAdminPage for user list display

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UnifiedAdminPage from '@/components/UnifiedAdminPage';
import { usersAdapter } from '@/lib/adapters';
import ColoredCard from '@/components/ColoredCard';
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
  
  // Create form state (keep separate - not part of table)
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
  const onCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
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
        } catch {
          setError('Failed to regenerate password');
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
      {/* WHAT: Keep custom create form section with manual hero
          WHY: This page has unique two-section layout (create form + user list) */}
      <div className="page-container" style={{ marginBottom: 0 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600 mt-2">Create and manage admin users</p>
          </div>
          <a href="/admin" className="btn btn-secondary">← Back to Admin</a>
        </div>

        <ColoredCard accentColor="#10b981" hoverable={false}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Admin</h2>
          <form onSubmit={onCreateUser} className="user-create-form">
            <input
              className="form-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="form-input"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className="btn btn-small btn-primary" 
              disabled={creating || !email.trim() || !name.trim()}
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
        </ColoredCard>
      </div>

      {/* WHAT: Unified admin page for user list display
          WHY: Replaces manual table + complex pagination with automatic search/sort/view */}
      <UnifiedAdminPage
        adapter={adapterWithHandlers as any}
        items={users as any}
        title="All Admin Users"
        subtitle="Manage existing admin accounts"
      />

      {/* WHAT: Keep existing modal components unchanged
          WHY: Modal logic is separate from display logic */}
      
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
