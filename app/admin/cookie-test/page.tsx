// app/admin/cookie-test/page.tsx
// WHAT: Debug page to test cookie reading
// WHY: Diagnose login issues across domains

'use client'

import { useState, useEffect } from 'react'

export default function CookieTest() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth')
        const data = await res.json()
        setAuthStatus({
          status: res.status,
          ok: res.ok,
          data,
          cookies: document.cookie
        })
      } catch (error: any) {
        setAuthStatus({
          error: error.message,
          cookies: document.cookie
        })
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  if (loading) return (
    <div className="page-container">
      <div className="admin-card text-center">Loading...</div>
    </div>
  )

  return (
    <div className="page-container font-mono">
      <div className="admin-card mb-8">
        <h1 className="text-3xl font-bold mb-4">🍪 Cookie Test Page</h1>
        <p className="mb-4">Domain: {typeof window !== 'undefined' ? window.location.hostname : 'unknown'}</p>
      </div>
      
      <div className="admin-card mb-4">
        <h2 className="text-xl font-bold mb-2">Auth API Response:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(authStatus, null, 2)}</pre>
      </div>

      <div className="admin-card mb-4">
        <h2 className="text-xl font-bold mb-2">Browser Cookies:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">{document.cookie || '(no cookies)'}</pre>
      </div>

      <div className="admin-card">
        <a href="/admin/login" className="btn btn-primary">
          ← Back to Login
        </a>
      </div>
    </div>
  )
}
