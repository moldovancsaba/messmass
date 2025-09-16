// app/admin/users/page.tsx — Admin Users Management
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  const [users, setUsers] = useState<ListedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create form
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)

  // Auth guard
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/admin/auth', { cache: 'no-store' })
        if (!res.ok) {
          router.push('/admin/login')
          return
        }
        await loadUsers()
      } catch {
        router.push('/admin/login')
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/local-users', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.success) {
        setUsers(data.users)
      } else {
        setError(data.error || 'Failed to load users')
      }
    } catch (e) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const onCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !name.trim()) return
    setCreating(true)
    setGeneratedPassword(null)
    try {
      const res = await fetch('/api/admin/local-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setEmail('')
        setName('')
        setGeneratedPassword(data.password)
        await loadUsers()
      } else {
        setError(data.error || 'Failed to create user')
      }
    } catch {
      setError('Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const onRegenerate = async (id: string) => {
    const confirm = window.confirm('Regenerate password for this user? Old password will no longer work.')
    if (!confirm) return
    try {
      const res = await fetch(`/api/admin/local-users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regeneratePassword: true })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setGeneratedPassword(data.password)
        await loadUsers()
      } else {
        alert(data.error || 'Failed to regenerate password')
      }
    } catch {
      alert('Failed to regenerate password')
    }
  }

  const onDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this user? This cannot be undone.')
    if (!confirm) return
    try {
      const res = await fetch(`/api/admin/local-users/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success !== false) {
        await loadUsers()
      } else {
        alert(data.error || 'Failed to delete user')
      }
    } catch {
      alert('Failed to delete user')
    }
  }

  const sortedUsers = useMemo(() => users.slice().sort((a, b) => a.email.localeCompare(b.email)), [users])

  return (
    <div className="admin-container">
      <div className="glass-card admin-header">
        <div className="admin-header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="admin-branding" style={{ textAlign: 'center', flex: 1 }}>
            <span className="hashtag" style={{ fontSize: '1.5rem', fontWeight: 700, padding: '1rem 2rem', borderRadius: 50, display: 'inline-block' }}>
              Users Management
            </span>
            <p className="admin-subtitle">Create and manage admin users</p>
          </div>
          <div className="admin-user-info" style={{ minWidth: 'auto' }}>
            <Link
              href="/admin"
              className="btn btn-secondary"
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none'
              }}
            >
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Create New Admin</h2>
        <form onSubmit={onCreateUser} style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr auto' }}>
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
          <button type="submit" className="btn btn-primary" disabled={creating || !email.trim() || !name.trim()}>
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
        {generatedPassword && (
          <div className="glass-card" style={{ marginTop: '1rem', padding: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#059669' }}>One-time password (copy and share securely)</div>
                <code style={{ fontFamily: 'monospace' }}>{generatedPassword}</code>
              </div>
              <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(generatedPassword)}>Copy</button>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h2 className="section-title">All Admin Users</h2>
        {loading ? (
          <div>Loading users…</div>
        ) : error ? (
          <div style={{ color: '#ef4444' }}>{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Created</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Updated</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ padding: '0.5rem' }}>{u.email}</td>
                    <td style={{ padding: '0.5rem' }}>{u.name}</td>
                    <td style={{ padding: '0.5rem' }}>{u.role}</td>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{u.createdAt}</td>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{u.updatedAt}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <button className="btn btn-secondary" onClick={() => onRegenerate(u.id)} style={{ marginRight: '0.5rem' }}>Regenerate</button>
                      <button className="btn btn-danger" onClick={() => onDelete(u.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

