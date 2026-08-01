// app/admin/login/page.tsx - SSO-only login (DoneIsBetter), built on the same
// shared AuthShell component camera uses, so the two apps' login screens
// share one visual language instead of looking like unrelated products.
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@sovereignsquad/gds-core/client'
import { Button, Stack, Text, Image as MantineImage } from '@mantine/core'
import GdsLoginShell from './GdsLoginShell'

const ERROR_MESSAGES: Record<string, string> = {
  sso_required: 'Please sign in with DoneIsBetter to access the dashboard.',
  no_access: 'Your account does not have access to {messmass} yet. Contact an admin to request access.',
  no_account: 'No {messmass} account for this identity yet. Contact an admin to request access.',
  invalid_sso: 'Sign-in session expired or invalid. Please try again.',
  session_expired: 'Sign-in session expired or invalid. Please try again.',
  auth_failed: 'Sign-in session expired or invalid. Please try again.',
  missing_token: 'SSO did not return a token. Please try again.',
  missing_code: 'SSO did not return a token. Please try again.',
  sso_not_configured: 'SSO is not configured. Contact an administrator.',
  permission_check_failed: 'Could not verify your access with SSO. Please try again.',
}

function AdminLoginContent() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [ssoConfigured, setSsoConfigured] = useState(false)

  // Check if already authenticated and whether SSO is configured
  useEffect(() => {
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
        setSsoConfigured(Boolean(ssoData?.ssoEnabled))
      } catch {
        // ignore
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  // Read URL params for SSO redirect reasons and errors
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const reason = params.get('reason')
    const err = params.get('error')
    if (reason === 'sso_required') {
      setError(ERROR_MESSAGES.sso_required)
    } else if (err && ERROR_MESSAGES[err]) {
      setError(ERROR_MESSAGES[err])
    } else if (err) {
      setError('Sign-in failed. Please try again.')
    }
  }, [])

  return (
    <AuthShell
      title="{messmass}"
      description="Sign in with your DoneIsBetter account to access the dashboard"
      intent="sign-in"
      brand={
        <MantineImage src="/messmass-logo.png" alt="{messmass}" w={48} h={48} fit="contain" />
      }
      error={error || null}
      footer={`${'{messmass}'} Admin Panel — Secure Access Required`}
    >
      <Stack align="center" gap="md" w="100%">
        {!checkingAuth && (
          ssoConfigured ? (
            <Button component="a" href="/api/auth/sso/login" size="lg" fullWidth>
              Sign in with DoneIsBetter
            </Button>
          ) : (
            <Text c="red">SSO is not configured for this environment. Contact an administrator.</Text>
          )
        )}
        <Button component="a" href="/" variant="default" size="sm">
          ← Back to {'{messmass}'}
        </Button>
      </Stack>
    </AuthShell>
  )
}

export default function AdminLogin() {
  return (
    <GdsLoginShell>
      <AdminLoginContent />
    </GdsLoginShell>
  )
}
