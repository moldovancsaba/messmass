// app/admin/users/page.tsx — Admin Users Management
'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminHero from '@/components/AdminHero'
import ColoredCard from '@/components/ColoredCard'
import { apiPost, apiPut, apiDelete } from '@/lib/apiClient'
import PasswordModal from '@/components/PasswordModal'
import ConfirmModal from '@/components/ConfirmModal'

interface ListedUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'super-admin'
  createdAt: string
  updatedAt: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  
  // WHAT: Server-side pagination state following established pattern
  // WHY: Consistent pagination behavior across all admin pages
  const [users, setUsers] = useState<ListedUser[]>([])
  const [totalMatched, setTotalMatched] = useState<number>(0)
  const [nextOffset, setNextOffset] = useState<number | null>(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const PAGE_SIZE = 20
  
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Create form
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  
  // WHAT: Modal state for password display and confirmations
  // WHY: Replace window.confirm() and inline password display with proper modals
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    password: string;
    userEmail: string;
    title: string;
  }>({ isOpen: false, password: '', userEmail: '', title: '' })
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    isDangerous?: boolean;
  }>({ isOpen: false, onConfirm: () => {}, title: '', message: '' })

  // WHAT: Debounce search input to reduce API calls
  // WHY: Prevents excessive requests while user is typing
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  // Auth guard
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/admin/auth', { cache: 'no-store' })
        if (!res.ok) {
          router.push('/admin/login')
          return
        }
      } catch {
        router.push('/admin/login')
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // WHAT: Load first page whenever the debounced search changes
  // WHY: Server-side search with pagination following established pattern
  useEffect(() => {
    const loadFirst = async () => {
      setLoading(true)
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const qs = debouncedTerm
          ? `?search=${encodeURIComponent(debouncedTerm)}&offset=0&limit=${PAGE_SIZE}`
          : `?offset=0&limit=${PAGE_SIZE}`
        const res = await fetch(`/api/admin/local-users${qs}`, { cache: 'no-store', signal: ctrl.signal })
        const data = await res.json()
        if (data.success) {
          setUsers(data.users || [])
          setNextOffset(data.pagination?.nextOffset ?? null)
          setTotalMatched(data.pagination?.totalMatched ?? data.users?.length ?? 0)
          setError(null)
        } else {
          setError(data.error || 'Failed to load users')
        }
      } catch (err) {
        // Swallow abort errors silently; log others
        if ((err as any)?.name !== 'AbortError') {
          console.error('Failed to fetch users:', err)
          setError('Failed to load users')
        }
      } finally {
        setLoading(false)
      }
    }

    loadFirst()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm])

  // WHAT: Load more users for pagination
  // WHY: "Load 20 more" button functionality
  const loadMore = async () => {
    if (loadingMore || nextOffset == null) return
    setLoadingMore(true)
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const qs = debouncedTerm
        ? `?search=${encodeURIComponent(debouncedTerm)}&offset=${nextOffset}&limit=${PAGE_SIZE}`
        : `?offset=${nextOffset}&limit=${PAGE_SIZE}`
      const res = await fetch(`/api/admin/local-users${qs}`, { cache: 'no-store', signal: ctrl.signal })
      const data = await res.json()
      if (data.success) {
        setUsers(prev => [...prev, ...(data.users || [])])
        setNextOffset(data.pagination?.nextOffset ?? null)
        setTotalMatched(data.pagination?.totalMatched ?? totalMatched)
      }
    } catch (err) {
      if ((err as any)?.name !== 'AbortError') {
        console.error('Failed to load more users:', err)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  // WHAT: Refresh users after create/regenerate/delete
  // WHY: Keeps displayed data in sync with database
  const refreshUsers = async () => {
    setLoading(true)
    try {
      const qs = debouncedTerm
        ? `?search=${encodeURIComponent(debouncedTerm)}&offset=0&limit=${PAGE_SIZE}`
        : `?offset=0&limit=${PAGE_SIZE}`
      const res = await fetch(`/api/admin/local-users${qs}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setUsers(data.users || [])
        setNextOffset(data.pagination?.nextOffset ?? null)
        setTotalMatched(data.pagination?.totalMatched ?? data.users?.length ?? 0)
      }
    } catch (err) {
      console.error('Failed to refresh users:', err)
    } finally {
      setLoading(false)
    }
  }

  const onCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !name.trim()) return
    setCreating(true)
    try {
      // WHAT: Use apiPost() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header
      const data = await apiPost('/api/admin/local-users', {
        email: email.trim(),
        name: name.trim()
      })
      if (data.success) {
        const userEmail = email.trim()
        setEmail('')
        setName('')
        // WHAT: Show password in modal instead of inline card
        // WHY: Better UX with copy button and secure display
        setPasswordModal({
          isOpen: true,
          password: data.password,
          userEmail: userEmail,
          title: 'User Created Successfully'
        })
        await refreshUsers()
      } else {
        setError(data.error || 'Failed to create user')
      }
    } catch {
      setError('Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const onRegenerate = async (id: string, userEmail: string) => {
    // WHAT: Show confirmation modal instead of window.confirm
    // WHY: Better UX with styled modal
    setConfirmModal({
      isOpen: true,
      title: 'Regenerate Password',
      message: 'Regenerate password for this user? Old password will no longer work.',
      confirmText: 'Regenerate',
      isDangerous: true,
      onConfirm: async () => {
        try {
          // WHAT: Use apiPut() for automatic CSRF token handling
          // WHY: Production middleware requires X-CSRF-Token header
          const data = await apiPut(`/api/admin/local-users/${id}`, {
            regeneratePassword: true
          })
          if (data.success) {
            // WHAT: Show new password in modal with copy button
            // WHY: Easy to copy and share with user
            setPasswordModal({
              isOpen: true,
              password: data.password,
              userEmail: userEmail,
              title: 'Password Regenerated'
            })
            await refreshUsers()
          } else {
            setError(data.error || 'Failed to regenerate password')
          }
        } catch {
          setError('Failed to regenerate password')
        }
      }
    })
  }

  const onDelete = async (id: string) => {
    // WHAT: Show confirmation modal instead of window.confirm
    // WHY: Better UX with styled modal
    setConfirmModal({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This cannot be undone.',
      confirmText: 'Delete',
      isDangerous: true,
      onConfirm: async () => {
        try {
          // WHAT: Use apiDelete() for automatic CSRF token handling
          // WHY: Production middleware requires X-CSRF-Token header
          const data = await apiDelete(`/api/admin/local-users/${id}`)
          if (data.success !== false) {
            await refreshUsers()
          } else {
            setError(data.error || 'Failed to delete user')
          }
        } catch {
          setError('Failed to delete user')
        }
      }
    })
  }

  const sortedUsers = useMemo(() => users.slice().sort((a, b) => a.email.localeCompare(b.email)), [users])

  return (
    <div className="page-container">
      <AdminHero
        title="Users Management"
        subtitle="Create and manage admin users"
        backLink="/admin"
        showSearch
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search users by email or name..."
      />

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
          <button type="submit" className="btn btn-small btn-primary" disabled={creating || !email.trim() || !name.trim()}>
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      </ColoredCard>

      <ColoredCard accentColor="#3b82f6" hoverable={false} className="mt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Admin Users</h2>
        
        {/* WHAT: Pagination stats header showing X of Y items
         * WHY: User feedback on search/filter results */}
        {!loading && users.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Showing {users.length} of {totalMatched} users
            </div>
          </div>
        )}
        
        {loading && users.length === 0 ? (
          <div>Loading users…</div>
        ) : error ? (
          <div className="error-text">{error}</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            {searchTerm ? `No users found matching "${searchTerm}"` : 'No users yet'}
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>{u.name}</td>
                      <td>{u.role}</td>
                      <td className="font-mono">{u.createdAt}</td>
                      <td className="font-mono">{u.updatedAt}</td>
                      <td className="actions-cell">
                        <button className="btn btn-small btn-secondary" onClick={() => onRegenerate(u.id, u.email)}>Regenerate</button>
                        <button className="btn btn-small btn-danger" onClick={() => onDelete(u.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* WHAT: Load More button for pagination
             * WHY: Allows loading additional users when more than 20 exist */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              {nextOffset != null ? (
                <button className="btn btn-secondary" disabled={loadingMore} onClick={loadMore}>
                  {loadingMore ? 'Loading…' : `Load ${PAGE_SIZE} more`}
                </button>
              ) : (
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>No more items</span>
              )}
            </div>
          </>
        )}
      </ColoredCard>

      {/* WHAT: Modal for displaying generated passwords with copy button
          WHY: Replaces window.alert() and inline cards with better UX */}
      <PasswordModal
        isOpen={passwordModal.isOpen}
        onClose={() => setPasswordModal({ isOpen: false, password: '', userEmail: '', title: '' })}
        password={passwordModal.password}
        title={passwordModal.title}
        userEmail={passwordModal.userEmail}
        subtitle="Copy this password and share it securely with the user"
      />

      {/* WHAT: Modal for confirmation dialogs
          WHY: Replaces window.confirm() with styled modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, onConfirm: () => {}, title: '', message: '' })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDangerous={confirmModal.isDangerous}
      />
    </div>
  )
}

