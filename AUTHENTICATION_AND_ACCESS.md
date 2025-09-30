# AUTHENTICATION_AND_ACCESS.md

Zero-Trust Authentication and Page Access for MessMass

Last Updated: 2025-09-30T14:13:03.000Z
Version: 5.13.0

Overview
- Goal: Document the complete MessMass authentication model so fellow developers can implement, extend, and debug access control with confidence.
- Model: Zero-trust page access.
  - Admin users authenticate via a DB-backed session (HttpOnly cookie). 
  - Public pages (stats/edit/filter) can be guarded by page-specific passwords (random, MD5-style string).
  - When a single-page access is required, either an admin session OR the correct page password must be provided.

Core Concepts
- Admin Session (DB-backed):
  - Admins log in with email + password stored in the Users collection.
  - Successful login sets an HttpOnly cookie (admin-session) that encodes {token, expiresAt, userId, role} in base64 JSON.
  - Admin session bypasses page-password requirements on protected endpoints.
- Page-Specific Passwords (MD5-style):
  - Each page (stats|edit|filter) can have a randomly generated MD5-style token (32 hex chars) persisted in pagePasswords.
  - Shareable links are created along with the generated password.
  - Validation increases usage counters for auditability.
- Zero-Trust Rule:
  - Protected endpoints accept requests only when:
    1) An admin session is valid (admin-session cookie), OR 
    2) The provided page-specific password is valid for the requested page.

Data Model
- Users (MongoDB: users)
  - email, name, role ('admin' | 'super-admin'), password (plaintext-like MD5-style token per project rules), createdAt, updatedAt

```ts path=/Users/moldovancsaba/Projects/messmass/lib/users.ts start=11
export interface UserDoc {
  _id?: ObjectId
  email: string
  name: string
  role: UserRole
  password: string // plaintext-like token (MD5-style)
  createdAt: string // ISO 8601 with milliseconds
  updatedAt: string // ISO 8601 with milliseconds
}
```

- Page Passwords (MongoDB: pagePasswords)
  - pageId (slug), pageType ('stats'|'edit'|'filter'), password (32-hex), createdAt, optional expiresAt, usageCount, lastUsedAt


Admin Session: Login, Cookie, and Checks
- Login endpoint: POST /api/admin/login
  - Validates credentials against Users collection
  - Creates a base64 JSON session (7 days) and sets cookie 'admin-session' (HttpOnly, SameSite=Lax, Secure in production)

```ts path=/Users/moldovancsaba/Projects/messmass/app/api/admin/login/route.ts start=13
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const emailRaw = (body?.email || '').toString()
    const password = (body?.password || '').toString()

    if (!emailRaw || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const email = emailRaw.toLowerCase()

    // DB-backed user lookup; alias support for 'admin' => 'admin@messmass.com'
    let user = await findUserByEmail(email)
    if (!user && email === 'admin') {
      const alias = await findUserByEmail('admin@messmass.com')
      if (alias) user = alias
    }

    const isValid = !!(user && user.password === password)
    if (!isValid) {
      await new Promise((r) => setTimeout(r, 800))
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const tokenData = {
      token,
      expiresAt: expiresAt.toISOString(),
      userId: user?._id?.toString() || 'admin',
      role: (user?.role || 'super-admin') as 'admin' | 'super-admin'
    }
    const signedToken = Buffer.from(JSON.stringify(tokenData)).toString('base64')

    const cookieStore = await cookies()
    cookieStore.set('admin-session', signedToken, {
      httpOnly: true,
      secure: env.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })

    return NextResponse.json({ success: true, token: signedToken, message: 'Login successful' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- Logout: DELETE /api/admin/login

```ts path=/Users/moldovancsaba/Projects/messmass/app/api/admin/login/route.ts start=82
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin-session')
    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
```

- Server-side auth helpers: lib/auth.ts
  - decodeSessionToken() base64→JSON, expiry check
  - getAdminUser() resolves AdminUser from cookie
  - hasPermission() convenience check

```ts path=/Users/moldovancsaba/Projects/messmass/lib/auth.ts start=21
function decodeSessionToken(sessionToken: string): { token: string; expiresAt: string; userId: string; role: 'admin' | 'super-admin' } | null {
  try {
    const json = Buffer.from(sessionToken, 'base64').toString()
    const tokenData = JSON.parse(json)
    if (!tokenData?.token || !tokenData?.expiresAt || !tokenData?.userId || !tokenData?.role) return null
    const expiresAt = new Date(tokenData.expiresAt)
    const now = new Date()
    if (now > expiresAt) return null
    return tokenData
  } catch {
    return null
  }
}
```

```ts path=/Users/moldovancsaba/Projects/messmass/lib/auth.ts start=40
export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  if (!adminSession?.value) return null

  const tokenData = decodeSessionToken(adminSession.value)
  if (!tokenData) return null

  const user = await findUserById(tokenData.userId)
  if (!user) return null

  const basePermissions = ['read', 'write', 'delete', 'manage-users']
  const permissions = user.role === 'super-admin' ? basePermissions : basePermissions

  return {
    id: user._id!.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    permissions
  }
}
```

- Client/server check: GET /api/auth/check

```ts path=/Users/moldovancsaba/Projects/messmass/app/api/auth/check/route.ts start=1
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    return NextResponse.json({ authenticated: true, user: { name: user.name, role: user.role } });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
```

Page-Specific Passwords (Per-Page Access)
- Runtime requirement (Node): app/api/page-passwords uses Node crypto; route opts into Node runtime.

```ts path=/Users/moldovancsaba/Projects/messmass/app/api/page-passwords/route.ts start=13
export const runtime = 'nodejs';
```

- Password generation (MD5-style), persistence, and usage tracking

```ts path=/Users/moldovancsaba/Projects/messmass/lib/pagePassword.ts start=37
export function generateMD5StylePassword(): string {
  // 32-char lowercase hex string that "looks like" MD5
  return randomBytes(16).toString('hex');
}
```

- Retrieve or create a page password and produce a shareable link

```ts path=/Users/moldovancsaba/Projects/messmass/app/api/page-passwords/route.ts start=15
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { pageId, pageType, regenerate = false } = body;
  const pagePassword = await getOrCreatePagePassword(pageId, pageType as PageType, regenerate);
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  const shareableLink = await generateShareableLink(pageId, pageType as PageType, baseUrl);
  return NextResponse.json({ success: true, shareableLink, pagePassword: { pageId: pagePassword.pageId, pageType: pagePassword.pageType, password: pagePassword.password, createdAt: pagePassword.createdAt, usageCount: pagePassword.usageCount } });
}
```

- Validate password (Admin bypass)

```ts path=/Users/moldovancsaba/Projects/messmass/app/api/page-passwords/route.ts start=74
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { pageId, pageType, password } = body;

  // Admin bypass via session
  const admin = await getAdminUser()
  if (admin) {
    return NextResponse.json({ success: true, isValid: true, isAdmin: true, message: 'Admin session accepted' })
  }

  const validation = await validateAnyPassword(pageId, pageType as PageType, password);
  if (validation.isValid) {
    return NextResponse.json({ success: true, isValid: true, isAdmin: validation.isAdmin, message: validation.isAdmin ? 'Admin password accepted' : 'Page password accepted' });
  } else {
    return NextResponse.json({ success: false, isValid: false, isAdmin: false, error: 'Invalid password' }, { status: 401 });
  }
}
```

- Validate-only function for page passwords

```ts path=/Users/moldovancsaba/Projects/messmass/lib/pagePassword.ts start=178
export async function validateAnyPassword(
  pageId: string,
  pageType: PageType,
  providedPassword: string
): Promise<{ isValid: boolean, isAdmin: boolean }> {
  const isPagePasswordValid = await validatePagePassword(pageId, pageType, providedPassword);
  return { isValid: isPagePasswordValid, isAdmin: false };
}
```

Users Collection and Admin Passwords
- All admin users are stored in users with an MD5-style token in password (per project conventions).
- Creation / updates are done via library helpers or admin UI.

```ts path=/Users/moldovancsaba/Projects/messmass/lib/users.ts start=21
export async function getUsersCollection() {
  const db = await getDb()
  const col = db.collection<UserDoc>('users')
  try { await col.createIndex({ email: 1 }, { unique: true }) } catch {}
  return col
}
```

```ts path=/Users/moldovancsaba/Projects/messmass/lib/users.ts start=61
export async function createUser(user: Omit<UserDoc, '_id'>): Promise<UserDoc> {
  const col = await getUsersCollection()
  const now = new Date().toISOString()
  const doc: Omit<UserDoc, '_id'> = { ...user, email: user.email.toLowerCase(), createdAt: user.createdAt || now, updatedAt: user.updatedAt || now }
  const res = await col.insertOne(doc)
  return { _id: res.insertedId, ...doc }
}
```

```ts path=/Users/moldovancsaba/Projects/messmass/lib/users.ts start=78
export async function updateUserPassword(id: string, password: string): Promise<UserDoc | null> {
  const col = await getUsersCollection()
  if (!ObjectId.isValid(id)) return null
  const now = new Date().toISOString()
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { password, updatedAt: now } })
  return findUserById(id)
}
```

Access Control Flows (Zero-Trust)
1) Admin Access Flow
   - Client: POST /api/admin/login { email, password }
   - Server: Set HttpOnly cookie 'admin-session' (7 days)
   - Check: GET /api/auth/check to verify session
   - Result: Admin session bypasses page password checks on protected endpoints

2) Page Password Access Flow (stats/edit/filter)
   - Server: POST /api/page-passwords { pageId, pageType } → returns password + shareable URL
   - Client: Provide password with PUT /api/page-passwords { pageId, pageType, password }
   - Server: If admin session present → accept; else validate page password

3) Combined (Zero-Trust) Rule
   - Protected endpoints must check admin session first
   - If absent, require page-specific password
   - Never trust client-only checks; always validate on the server

Usage Examples
- Generate a shareable link for stats page

```ts path=null start=null
const res = await fetch('/api/page-passwords', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pageId: 'my-event-slug', pageType: 'stats' })
})
const { shareableLink, pagePassword } = await res.json()
console.log('Visit:', shareableLink.url, 'Password:', pagePassword.password)
```

- Validate access for a stats page (client)

```ts path=null start=null
const res = await fetch('/api/page-passwords', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pageId: 'my-event-slug', pageType: 'stats', password: inputPassword })
})
const data = await res.json()
if (data.success && data.isValid) {
  // proceed to fetch stats
}
```

Operational Policies and Security Notes
- Cookies: HttpOnly, SameSite=Lax, Secure in production
- Timestamps: Always ISO 8601 with milliseconds (UTC)
- Secrets: Never commit .env.local; only NEXT_PUBLIC_* keys are allowed client-side
- Admin Passwords: Store as MD5-style random tokens (project policy); re-generate via randomBytes(16) when needed
- Page Passwords: May set optional expiresAt and track usageCount/lastUsedAt for operational oversight
- Auditing: Use getPasswordStats() for quick insight into usage

Appendix: Quick References
- Check admin session in server code

```ts path=/Users/moldovancsaba/Projects/messmass/lib/auth.ts start=68
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAdminUser()
  return user !== null
}
```

- Node runtime declaration (for password generation route)

```ts path=/Users/moldovancsaba/Projects/messmass/app/api/page-passwords/route.ts start=13
export const runtime = 'nodejs';
```