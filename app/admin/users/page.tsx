// app/admin/users/page.tsx — Admin Users Management
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminHero from '@/components/AdminHero'
import ColoredCard from '@/components/ColoredCard'

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
    <div className="page-container">
      <AdminHero
        title="Users Management"
        subtitle="Create and manage admin users"
        backLink="/admin"
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
        {generatedPassword && (
          <ColoredCard accentColor="#6366f1" hoverable={false} className="password-generated">
            <div className="password-generated-content">
              <div>
                <div className="password-label">One-time password (copy and share securely)</div>
                <code className="password-code">{generatedPassword}</code>
              </div>
              <button className="btn btn-small btn-secondary" onClick={() => navigator.clipboard.writeText(generatedPassword)}>Copy</button>
            </div>
          </ColoredCard>
        )}
      </ColoredCard>

      <ColoredCard accentColor="#3b82f6" hoverable={false} className="mt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Admin Users</h2>
        {loading ? (
          <div>Loading users…</div>
        ) : error ? (
          <div className="error-text">{error}</div>
        ) : (
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
                {sortedUsers.map(u => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.name}</td>
                    <td>{u.role}</td>
                    <td className="font-mono">{u.createdAt}</td>
                    <td className="font-mono">{u.updatedAt}</td>
                    <td className="actions-cell">
                      <button className="btn btn-small btn-secondary" onClick={() => onRegenerate(u.id)}>Regenerate</button>
                      <button className="btn btn-small btn-danger" onClick={() => onDelete(u.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ColoredCard>
    </div>
  )
}

