// app/admin/login/page.tsx - SSO-only login (DoneIsBetter). This page is not
// a login form -- the login form lives at sso.doneisbetter.com and is the
// same page every app in the stack sends users to. When there is nothing to
// tell the user (no error, no pending "SSO not configured" state), this page
// immediately forwards to it and renders nothing. It only shows content when
// it has to explain why the user landed back here instead of /admin.
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@sovereignsquad/gds-core/client'
import { Button, Stack, Text } from '@mantine/core'

const ERROR_MESSAGES = new Map<string, string>([
  ['sso_required', 'Please sign in with DoneIsBetter to access the dashboard.'],
  ['no_access', 'Your account does not have access to {messmass} yet. Contact an admin to request access.'],
  ['no_account', 'No {messmass} account for this identity yet. Contact an admin to request access.'],
  ['invalid_sso', 'Sign-in session expired or invalid. Please try again.'],
  ['session_expired', 'Sign-in session expired or invalid. Please try again.'],
  ['auth_failed', 'Sign-in session expired or invalid. Please try again.'],
  ['missing_token', 'SSO did not return a token. Please try again.'],
  ['missing_code', 'SSO did not return a token. Please try again.'],
  ['sso_not_configured', 'SSO is not configured. Contact an administrator.'],
  ['permission_check_failed', 'Could not verify your access with SSO. Please try again.'],
])

const SSO_LOGIN_URL = '/api/auth/sso/login'

function AdminLoginContent() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [ssoNotConfigured, setSsoNotConfigured] = useState(false)
  const [redirecting, setRedirecting] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reason = params.get('reason')
    const err = params.get('error')
    const knownMessage = err ? ERROR_MESSAGES.get(err) : undefined
    const errorMessage = reason === 'sso_required'
      ? ERROR_MESSAGES.get('sso_required')!
      : knownMessage || (err ? 'Sign-in failed. Please try again.' : '')

    const checkAuth = async () => {
      try {
        const [authRes, ssoRes] = await Promise.all([
          fetch('/api/admin/auth'),
          fetch('/api/auth/sso/config'),
        ])
        const authData = await authRes.json()
        if (authRes.ok && authData.user) {
          router.push('/admin')
          return
        }
        const ssoData = await ssoRes.json().catch(() => ({}))
        const ssoEnabled = Boolean(ssoData?.ssoEnabled)

        if (!ssoEnabled) {
          setSsoNotConfigured(true)
          setRedirecting(false)
          return
        }
        if (errorMessage) {
          setError(errorMessage)
          setRedirecting(false)
          return
        }
        // Nothing to explain -- go straight to the real sign-in page.
        window.location.replace(SSO_LOGIN_URL)
      } catch {
        setError('Could not reach the sign-in service. Please try again.')
        setRedirecting(false)
      }
    }
    checkAuth()
  }, [router])

  if (redirecting) return null

  return (
    <AuthShell
      title="{messmass}"
      intent="sign-in"
      error={error || null}
    >
      <Stack align="center" gap="md" w="100%">
        {ssoNotConfigured ? (
          <Text c="red">SSO is not configured for this environment. Contact an administrator.</Text>
        ) : (
          <Button component="a" href={SSO_LOGIN_URL} size="lg" fullWidth>
            Sign In
          </Button>
        )}
      </Stack>
    </AuthShell>
  )
}

// WHAT: No local GdsProvider wrapper here.
// WHY: app/providers.tsx now mounts the single root GdsProvider that covers
//     every route, including this one — the second, route-scoped GdsProvider
//     that used to live in GdsLoginShell.tsx (worked around a hydration
//     conflict with the pre-GDS root MantineProvider) is resolved now that
//     there is only one provider in the tree.
export default function AdminLogin() {
  return <AdminLoginContent />
}
