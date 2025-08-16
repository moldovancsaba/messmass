// app/admin/page.tsx - Update to work with local development
import { getAdminUser, hasPermission } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'

export default async function AdminPage() {
  const user = await getAdminUser()
  
  if (!user) {
    // This shouldn't happen due to middleware, but just in case
    redirect('/admin/login')
  }
  
  const canManageUsers = await hasPermission('manage-users')
  const canDelete = await hasPermission('delete')
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MessMass Admin</h1>
              <p className="text-sm text-gray-600">Event Statistics Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-blue-500">Development Mode</p>
                )}
              </div>
              <button
                onClick={() => {
                  if (process.env.NODE_ENV === 'development') {
                    document.cookie = 'admin-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
                    window.location.href = '/'
                  } else {
                    window.location.href = 'https://sso.doneisbetter.com/logout?app=messmass&return_url=' + encodeURIComponent(window.location.origin)
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <AdminDashboard 
          user={user}
          permissions={{
            canManageUsers,
            canDelete,
            canRead: true,
            canWrite: await hasPermission('write')
          }}
        />
      </main>
    </div>
  )
}