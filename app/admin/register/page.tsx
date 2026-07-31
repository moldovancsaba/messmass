// app/admin/register/page.tsx
// WHAT: Self-service local-account registration has been removed -- SSO
//     (sso.doneisbetter.com) is now the only way to get access.
// WHY: SSO_EMAIL_UNIFICATION_PLAN.md Phase 4 follow-up. Redirects any old
//     bookmarked/linked visits straight to the login page instead of 404ing.

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRegister() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/login')
  }, [router])

  return null
}
