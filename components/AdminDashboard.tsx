// components/AdminDashboard.tsx - Simplified version using CSS classes
'use client'

import { useState, useEffect } from 'react'
import { AdminUser } from '@/lib/auth'

interface Project {
  _id: string
  eventName: string
  eventDate: string
  createdAt: string
  updatedAt: string
  stats?: any
  originalStats?: any
  [key: string]: any
}

interface AdminDashboardProps {
  user: AdminUser
  permissions: {
    canManageUsers: boolean
    canDelete: boolean
    canRead: boolean
    canWrite: boolean
  }
}

export default function AdminDashboard({ user, permissions }: AdminDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalEvents: 0,
    totalUsers: 0,
    activeProjects: 0
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const data = await response.json()
      
      const projectsArray = data.projects || data || []
      
      const flattenedProjects = projectsArray.map((project: any) => ({
        ...project,
        ...(project.stats || {}),
        originalStats: project.stats
      }))
      
      setProjects(flattenedProjects)
      
      setStats({
        totalProjects: flattenedProjects.length,
        totalEvents: flattenedProjects.length,
        totalUsers: flattenedProjects.reduce((sum: number, project: any) => 
          sum + (project.indoor || 0) + (project.outdoor || 0) + (project.stadium || 0), 0),
        activeProjects: flattenedProjects.filter((project: any) => 
          new Date(project.updatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Fetch projects error:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!permissions.canDelete) {
      alert('You do not have permission to delete projects')
      return
    }

    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      fetchProjects()
      alert('Project deleted successfully')
    } catch (err) {
      alert('Failed to delete project: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const exportProjectData = (project: Project) => {
    const stats = project.originalStats || project.stats || project
    const csvData = [
      ['Field', 'Value'],
      ['Event Name', project.eventName],
      ['Event Date', project.eventDate],
      ['Created', new Date(project.createdAt).toLocaleString()],
      ['Last Updated', new Date(project.updatedAt).toLocaleString()],
      ['', ''],
      ['Images', ''],
      ['Remote Images', stats.remoteImages || 0],
      ['Hostess Images', stats.hostessImages || 0],
      ['Selfies', stats.selfies || 0],
      ['', ''],
      ['Fans', ''],
      ['Indoor', stats.indoor || 0],
      ['Outdoor', stats.outdoor || 0],
      ['Stadium', stats.stadium || 0],
      ['', ''],
      ['Gender', ''],
      ['Female', stats.female || 0],
      ['Male', stats.male || 0],
      ['', ''],
      ['Age Groups', ''],
      ['Gen Alpha', stats.genAlpha || 0],
      ['Gen Y+Z', stats.genYZ || 0],
      ['Gen X', stats.genX || 0],
      ['Boomer', stats.boomer || 0],
      ['', ''],
      ['Merchandise', ''],
      ['Merched', stats.merched || 0],
      ['Jersey', stats.jersey || 0],
      ['Scarf', stats.scarf || 0],
      ['Flags', stats.flags || 0],
      ['Baseball Cap', stats.baseballCap || 0],
      ['Other', stats.other || 0]
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.eventName.replace(/[^a-z0-9]/gi, '_')}_data.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <div className="admin-title">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <div className="admin-title">Error</div>
          <p>{error}</p>
          <button onClick={fetchProjects} className="admin-btn-refresh">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <div className="admin-header">
        <h1 className="admin-title">MessMass Admin</h1>
        <p className="admin-subtitle">Event Statistics Management Dashboard</p>
        
        <div className="admin-user-info">
          <div className="admin-user-details">
            <div className="admin-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-text">
              <h3>{user.name}</h3>
              <p>{user.role} • {user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/admin/login'}
            className="admin-logout-btn"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="admin-stat-label">Total Projects</div>
          <div className="admin-stat-value">{stats.totalProjects}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="admin-stat-label">Total Audience</div>
          <div className="admin-stat-value">{stats.totalUsers.toLocaleString()}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="admin-stat-label">Active Projects</div>
          <div className="admin-stat-value">{stats.activeProjects}</div>
          <div className="admin-stat-subtitle">Last 24 hours</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="admin-stat-label">System Status</div>
          <div className="admin-stat-value" style={{fontSize: '1.2rem'}}>Online</div>
          <div className="admin-stat-subtitle">All systems operational</div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="admin-projects-container">
        <div className="admin-projects-header">
          <div>
            <h3 className="admin-projects-title">Event Projects</h3>
            <p className="admin-projects-subtitle">Manage all event statistics projects and their data</p>
          </div>
          <button onClick={fetchProjects} className="admin-btn-refresh">
            🔄 Refresh
          </button>
        </div>

        <table className="admin-table">
          <thead className="admin-table-header">
            <tr>
              <th>Event Details</th>
              <th>Images</th>
              <th>Audience</th>
              <th>Demographics</th>
              <th>Merchandise</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="admin-empty-state">
                    <svg className="admin-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="admin-empty-title">No projects found</div>
                    <div className="admin-empty-subtitle">Get started by creating your first event project</div>
                  </div>
                </td>
              </tr>
            ) : (
              projects.map((project) => {
                const stats = project.originalStats || project.stats || project
                const totalFans = (stats.indoor || 0) + (stats.outdoor || 0) + (stats.stadium || 0)
                const totalImages = (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0)
                const totalMerch = (stats.merched || 0) + (stats.jersey || 0) + (stats.scarf || 0) + 
                                  (stats.flags || 0) + (stats.baseballCap || 0) + (stats.other || 0)
                const totalGender = (stats.female || 0) + (stats.male || 0)
                const totalAge = (stats.genAlpha || 0) + (stats.genYZ || 0) + (stats.genX || 0) + (stats.boomer || 0)

                return (
                  <tr key={project._id} className="admin-table-row">
                    <td className="admin-table-cell">
                      <div className="admin-event-name">{project.eventName}</div>
                      <div className="admin-event-date">{project.eventDate}</div>
                    </td>
                    <td className="admin-table-cell">
                      <div className="admin-stat-group">
                        <div className="admin-stat-total images">Total: {totalImages}</div>
                        <div className="admin-stat-breakdown">
                          <div className="admin-stat-item">
                            <span>Remote:</span>
                            <span>{stats.remoteImages || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>Hostess:</span>
                            <span>{stats.hostessImages || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>Selfies:</span>
                            <span>{stats.selfies || 0}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="admin-table-cell">
                      <div className="admin-stat-group">
                        <div className="admin-stat-total fans">Total: {totalFans}</div>
                        <div className="admin-stat-breakdown">
                          <div className="admin-stat-item">
                            <span>Indoor:</span>
                            <span>{stats.indoor || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>Outdoor:</span>
                            <span>{stats.outdoor || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>Stadium:</span>
                            <span>{stats.stadium || 0}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="admin-table-cell">
                      <div className="admin-stat-group">
                        <div className="admin-stat-total gender">Gender: {totalGender}</div>
                        <div className="admin-stat-breakdown">
                          <div className="admin-stat-item">
                            <span>♀ Female:</span>
                            <span>{stats.female || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>♂ Male:</span>
                            <span>{stats.male || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="admin-stat-group">
                        <div className="admin-stat-total age">Age: {totalAge}</div>
                        <div className="admin-stat-breakdown">
                          <div className="admin-stat-item">
                            <span>Alpha:</span>
                            <span>{stats.genAlpha || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>Y+Z:</span>
                            <span>{stats.genYZ || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>X:</span>
                            <span>{stats.genX || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>Boomer:</span>
                            <span>{stats.boomer || 0}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="admin-table-cell">
                      <div className="admin-stat-group">
                        <div className="admin-stat-total merch">Total: {totalMerch}</div>
                        <div className="admin-stat-breakdown">
                          <div className="admin-stat-item">
                            <span>Merched:</span>
                            <span>{stats.merched || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>Jersey:</span>
                            <span>{stats.jersey || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>Scarf:</span>
                            <span>{stats.scarf || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>Flags:</span>
                            <span>{stats.flags || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>Cap:</span>
                            <span>{stats.baseballCap || 0}</span>
                          </div>
                          <div className="admin-stat-item">
                            <span>Other:</span>
                            <span>{stats.other || 0}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="admin-table-cell">
                      <div style={{fontSize: '0.75rem', color: 'var(--color-gray-600)'}}>
                        <div>{new Date(project.updatedAt).toLocaleDateString()}</div>
                        <div>{new Date(project.updatedAt).toLocaleTimeString()}</div>
                      </div>
                    </td>
                    <td className="admin-table-cell">
                      <div className="admin-actions">
                        <button
                          onClick={() => exportProjectData(project)}
                          className="admin-btn admin-btn-export"
                        >
                          📊 Export
                        </button>
                        {permissions.canDelete && (
                          <button
                            onClick={() => deleteProject(project._id)}
                            className="admin-btn admin-btn-delete"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}