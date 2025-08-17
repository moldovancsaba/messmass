// app/admin/page.tsx - Update with logout functionality
import { getAdminUser, hasPermission } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'

export default async function AdminPage() {
  const user = await getAdminUser()
  
  if (!user) {
    redirect('/admin/login')
  }
  
  const canManageUsers = await hasPermission('manage-users')
  const canDelete = await hasPermission('delete')
  
  const handleLogout = async () => {
    'use server'
    
    try {
      // Clear the admin session cookie
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      cookieStore.delete('admin-session')
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    redirect('/admin/login')
  }

  return (
    <div className="admin-container">
      {/* Glass Card Header with MessMass Design System */}
      <div className="glass-card admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">MessMass Admin</h1>
            <p className="admin-subtitle">Event Statistics Management</p>
          </div>
          <div className="admin-user-info">
            <div className="admin-badge">
              <p className="admin-role">{user.name}</p>
              <p className="admin-level">{user.role}</p>
              <p className="admin-status">✓ Authenticated</p>
            </div>
            <form action={handleLogout}>
              <button
                type="submit"
                className="btn btn-logout"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Admin Dashboard Content */}
      <AdminDashboard 
        user={user}
        permissions={{
          canManageUsers,
          canDelete,
          canRead: true,
          canWrite: await hasPermission('write')
        }}
      />
    </div>
  )
}