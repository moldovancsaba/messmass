// app/admin/login/page.tsx - Create this fallback login page
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [isProduction, setIsProduction] = useState(false)

  useEffect(() => {
    setIsProduction(process.env.NODE_ENV === 'production')
  }, [])

  const handleDevLogin = () => {
    // Set development admin session
    document.cookie = 'admin-session=local-dev-admin; path=/; max-age=' + (60 * 60 * 24)
    router.push('/admin')
  }

  const handleSSOLogin = () => {
    const returnUrl = encodeURIComponent(`${window.location.origin}/admin`)
    window.location.href = `https://sso.doneisbetter.com/login?return_url=${returnUrl}&app=messmass`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            MessMass Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Event Statistics Management System
          </p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {!isProduction ? (
            // Development Mode
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Development Mode
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>You're running in development mode. You can access the admin panel directly.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleDevLogin}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Enter Admin Panel (Dev Mode)
              </button>
              
              <div className="text-center">
                <button
                  onClick={() => router.push('/')}
                  className="text-indigo-600 hover:text-indigo-500 text-sm"
                >
                  ← Back to Main App
                </button>
              </div>
            </div>
          ) : (
            // Production Mode
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Secure Authentication
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>This admin panel is protected by enterprise-grade SSO authentication.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSSOLogin}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Login with SSO
              </button>
              
              <div className="text-center">
                <button
                  onClick={() => router.push('/')}
                  className="text-indigo-600 hover:text-indigo-500 text-sm"
                >
                  ← Back to Main App
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            MessMass v1.0 - Real-time Event Statistics Platform
          </p>
        </div>
      </div>
    </div>
  )
}