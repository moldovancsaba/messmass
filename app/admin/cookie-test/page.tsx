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

  if (loading) return <div style={{padding: '2rem'}}>Loading...</div>

  return (
    <div style={{padding: '2rem', fontFamily: 'monospace'}}>
      <h1>🍪 Cookie Test Page</h1>
      <p style={{marginBottom: '2rem'}}>Domain: {typeof window !== 'undefined' ? window.location.hostname : 'unknown'}</p>
      
      <div style={{background: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>
        <h2>Auth API Response:</h2>
        <pre>{JSON.stringify(authStatus, null, 2)}</pre>
      </div>

      <div style={{background: '#f5f5f5', padding: '1rem', borderRadius: '8px'}}>
        <h2>Browser Cookies:</h2>
        <pre>{document.cookie || '(no cookies)'}</pre>
      </div>

      <div style={{marginTop: '2rem'}}>
        <a href="/admin/login" style={{padding: '0.5rem 1rem', background: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '4px'}}>
          ← Back to Login
        </a>
      </div>
    </div>
  )
}
