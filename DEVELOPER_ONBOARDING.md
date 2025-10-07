# MessMass Developer Onboarding

**For New Developers Joining the Project**

Version: 5.21.2  
Last Updated: 2025-10-06T19:57:45.000Z

---

## Welcome to MessMass

This guide will help you understand the MessMass architecture, set up your development environment, and start contributing effectively. Read through sequentially for best results.

---

## 🏗️ Project Overview and Architecture

### What is MessMass?

MessMass is a **real-time collaborative event statistics dashboard** that enables:
- Live tracking of event metrics (attendance, demographics, engagement)
- Real-time collaboration via WebSocket connections
- Advanced hashtag categorization and filtering
- Comprehensive admin panel for event management
- Password-protected public pages for secure data sharing

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  Next.js 15 App Router • React 18 • TypeScript          │
│  ├─ Public Pages (/stats, /edit, /filter)               │
│  ├─ Admin Dashboard (/admin/*)                           │
│  └─ Real-time WebSocket Client                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│              Next.js Server (Vercel/Node)                │
│  ├─ API Routes (/api/*)                                  │
│  ├─ Server Components (SSR)                              │
│  ├─ Authentication Middleware                            │
│  └─ Session Management (HttpOnly cookies)                │
└────────┬──────────────────────────────┬─────────────────┘
         │                              │
         ↓                              ↓
┌──────────────────┐         ┌──────────────────────┐
│  MongoDB Atlas   │         │  WebSocket Server    │
│  Database        │         │  (Separate Node.js)  │
│  - projects      │         │  - port 7654         │
│  - users         │         │  - Room-based        │
│  - hashtags      │         │  - perMessageDeflate │
│  - categories    │         └──────────────────────┘
└──────────────────┘
```

### Core Modules

1. **Frontend Layer** (`app/`, `components/`)
   - Next.js 15 App Router with TypeScript
   - Server and Client Components
   - Real-time WebSocket integration
   - TailAdmin V2 flat design system

2. **API Layer** (`app/api/`)
   - RESTful API routes
   - Authentication middleware
   - Standardized response envelopes (see `lib/types/api.ts`)
   - Pagination support (cursor and offset-based)

3. **Database Layer** (`lib/mongodb.ts`, `lib/users.ts`, etc.)
   - MongoDB connection management
   - Type-safe collection access
   - Centralized query utilities

4. **Authentication System** (`lib/auth.ts`, `lib/pagePassword.ts`)
   - Admin session management (HttpOnly cookies)
   - Page-specific passwords for public access
   - Zero-trust security model

5. **Real-time Layer** (`server/websocket-server.js`)
   - Standalone WebSocket server
   - Project-based rooms
   - Message compression and connection limits

### Data Flow Example: Creating a Project

```
User clicks "Create Project" in Admin UI
    ↓
POST /api/projects { eventName, eventDate, stats, hashtags }
    ↓
API validates admin session (getAdminUser())
    ↓
MongoDB: Insert document into projects collection
    ↓
Generate viewSlug, editSlug, passwords
    ↓
Response: { success: true, project: {...} }
    ↓
UI updates, navigates to new project page
```

---

## 💻 Dev Environment Setup

### Prerequisites

- **Node.js**: v18.0.0+ (confirmed via `node --version`)
- **NPM**: v8.0.0+ (comes with Node)
- **MongoDB**: Access to MongoDB Atlas instance (or local MongoDB)
- **Git**: For version control
- **Code Editor**: VS Code recommended (TypeScript IntelliSense)

### Initial Setup

**1. Clone the Repository**
```bash
git clone https://github.com/moldovancsaba/messmass.git
cd messmass
```

**2. Install Dependencies**
```bash
npm install
```

**3. Environment Variables**

Create `.env.local` in the project root:
```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=messmass

# Authentication
ADMIN_PASSWORD=your_secure_password_here

# Service Base URLs
SSO_BASE_URL=https://your-sso-service.com
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api

# Public URLs (client-accessible)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:7654
```

**Important**: Never commit `.env.local` to version control. It's in `.gitignore`.

**4. Verify TypeScript Configuration**
```bash
npm run type-check
```
Should complete with no errors.

**5. Run Development Server**
```bash
# Terminal 1: Next.js app
npm run dev
# Runs on http://localhost:3000

# Terminal 2: WebSocket server
cd server
npm start
# Runs on ws://localhost:7654
```

**6. Access the Application**
- Admin: http://localhost:3000/admin/login
- Stats: http://localhost:3000/stats/[any-project-slug]

### Development Scripts

```bash
npm run dev          # Start Next.js dev server (:3000)
npm run build        # Production build
npm run start        # Start production server
npm run type-check   # TypeScript validation (no emit)
npm run lint         # ESLint validation
npm run style:audit  # Audit inline styles and hardcoded colors
```

### Troubleshooting Setup

**"Cannot connect to MongoDB"**
- Verify `MONGODB_URI` in `.env.local`
- Check network access in MongoDB Atlas (allow your IP)
- Test connection with `mongosh` CLI

**"WebSocket connection failed"**
- Ensure WebSocket server is running (`cd server && npm start`)
- Check `NEXT_PUBLIC_WS_URL` matches server port
- Verify no firewall blocking port 7654

**"TypeScript errors"**
- Run `npm install` again (ensure all @types packages installed)
- Delete `.next` folder and rebuild: `rm -rf .next && npm run dev`

---

## 🗄️ Database Schema Deep Dive

### Collections

#### `projects`
Primary collection for event data.

```typescript
{
  _id: ObjectId,
  eventName: string,                // "Summer Festival 2025"
  eventDate: string,                // ISO 8601: "2025-07-15T00:00:00.000Z"
  viewSlug: string,                 // Unique: "summer-festival-abc123"
  editSlug: string,                 // Unique: "summer-festival-edit-def456"
  
  // Hashtags
  hashtags?: string[],              // ["summer", "festival"]
  categorizedHashtags?: {           // { country: ["hungary"], period: ["summer"] }
    [category: string]: string[]
  },
  
  // Statistics
  stats: {
    // Images
    remoteImages: number,
    hostessImages: number,
    selfies: number,
    // Demographics
    female: number,
    male: number,
    genAlpha: number,
    genYZ: number,
    genX: number,
    boomer: number,
    // Location
    indoor: number,
    outdoor: number,
    stadium: number,
    remoteFans?: number,            // Optional: defaults to indoor + outdoor
    // Merchandise
    merched: number,
    jersey: number,
    scarf: number,
    flags: number,
    baseballCap: number,
    other: number,
    // Success Manager (optional)
    eventAttendees?: number,
    eventTicketPurchases?: number,
    // ... additional optional fields
  },
  
  createdAt: string,                // ISO 8601 with milliseconds
  updatedAt: string                 // ISO 8601 with milliseconds
}
```

**Key Indexes** (created via `scripts/create-indexes.js`):
- `updatedAt_desc_id_desc` - Default pagination
- `viewSlug_unique`, `editSlug_unique` - Fast lookups
- `hashtags_multikey` - Traditional hashtag filtering
- `categorizedHashtags_wildcard` - Category-specific filtering
- `eventName_text` - Full-text search

#### `users`
Admin user accounts.

```typescript
{
  _id: ObjectId,
  email: string,                    // Unique, lowercase
  name: string,
  role: 'admin' | 'super-admin',
  password: string,                 // MD5-style 32-char hex token
  createdAt: string,
  updatedAt: string
}
```

**Index**: `{ email: 1 }` unique

#### `hashtag_categories`
Hashtag category definitions.

```typescript
{
  _id: ObjectId,
  name: string,                     // "country", "period", "success"
  color: string,                    // Hex color: "#3b82f6"
  createdAt: Date,
  updatedAt: Date
}
```

#### `pagePasswords`
Page-specific access passwords.

```typescript
{
  _id: ObjectId,
  pageId: string,                   // viewSlug or editSlug
  pageType: 'stats' | 'edit' | 'filter',
  password: string,                 // 32-char MD5-style hex
  createdAt: string,
  expiresAt?: string,               // Optional expiration
  usageCount: number,               // Track validation attempts
  lastUsedAt?: string
}
```

### Relationships

- **Projects ↔ Hashtags**: Many-to-many via arrays (no junction table)
- **Projects → Categories**: Via `categorizedHashtags` embedded document
- **Users → Projects**: Implicit via admin access (no foreign keys)

### Migration Notes

- Schema is **additive**: New fields are optional to maintain backward compatibility
- Always use ISO 8601 timestamps with milliseconds (UTC)
- Slugs are generated server-side using UUID v4
- Passwords are MD5-style random hex tokens (not actual MD5 hashing)

---

## 🔐 Authentication System

**Full details**: See [AUTHENTICATION_AND_ACCESS.md](AUTHENTICATION_AND_ACCESS.md)

### Two-Layer Auth Model

**Layer 1: Admin Sessions**
- HttpOnly cookies (`admin-session`)
- 7-day expiration
- Base64-encoded JSON: `{ token, expiresAt, userId, role }`
- Validated via `getAdminUser()` helper

**Layer 2: Page Passwords**
- Per-page access control
- Random 32-char hex tokens
- Stored in `pagePasswords` collection
- Validated via `validateAnyPassword()`

### Key Functions

```typescript
// Check if user is admin (server-side)
import { getAdminUser } from '@/lib/auth'
const admin = await getAdminUser()
if (!admin) return unauthorized()

// Validate page password
import { validateAnyPassword } from '@/lib/pagePassword'
const { isValid } = await validateAnyPassword(pageId, pageType, password)
```

### Next.js 15 Async Patterns

**IMPORTANT**: Next.js 15 made cookies, headers, params async:

```typescript
// OLD (Next.js 14)
const cookieStore = cookies()
const params = { id: string }

// NEW (Next.js 15) - MUST AWAIT
const cookieStore = await cookies()
const { id } = await context.params
```

### Common Pitfalls

1. **Stale Cookies**: Always clear old cookies before setting new ones:
   ```typescript
   cookieStore.set('admin-session', '', { maxAge: 0, path: '/' })
   cookieStore.set('admin-session', newToken, { ... })
   ```

2. **Config Property**: Use `config.dbName`, not `config.mongodbDb`

3. **Runtime Declaration**: Add `export const runtime = 'nodejs'` for routes using Node crypto

---

## #️⃣ Hashtag System Architecture

### Dual Storage Strategy

Hashtags are stored in **both formats** for maximum flexibility:

1. **Traditional**: `hashtags: ["summer", "festival"]`
2. **Categorized**: `categorizedHashtags: { period: ["summer"], type: ["festival"] }`

### Category-Prefixed Format

Format: `category:hashtag`

Examples:
- `country:hungary`
- `period:summer`
- `success:approved`

### Utility Functions (`lib/hashtagCategoryUtils.ts`)

```typescript
// Expand categorized hashtags to "category:hashtag" format
expandHashtagsWithCategories(
  ["summer"],                       // plain hashtags
  { country: ["hungary"] }          // categorized
)
// Returns: ["summer", "country:hungary"]

// Parse "category:hashtag" into components
parseHashtagQuery("country:hungary")
// Returns: { category: "country", hashtag: "hungary" }

// Check if hashtag exists in project
matchHashtagInProject(project, "country:hungary")
// Returns: boolean
```

### Filtering Logic

Supports mixed queries:
```typescript
["summer", "country:hungary"]
```

MongoDB query builds `$and` + `$or` patterns:
```javascript
{
  $and: [
    { $or: [
      { hashtags: { $in: ["summer"] } },
      { "categorizedHashtags.country": { $in: ["summer"] } },
      { "categorizedHashtags.period": { $in: ["summer"] } }
    ]},
    { $or: [
      { "categorizedHashtags.country": { $in: ["hungary"] } }
    ]}
  ]
}
```

---

## ⚡ Real-time WebSocket Integration

### Server Architecture (`server/websocket-server.js`)

- **Port**: 7654 (configurable via `WS_PORT` env)
- **Compression**: perMessageDeflate (10:1 ratio)
- **Connection Limit**: 1000 (configurable via `MAX_CONNECTIONS`)
- **Memory Monitoring**: 60-second interval stats
- **Max Payload**: 100KB

### Message Types

```javascript
// Join project room
{ type: 'join-project', projectId: 'abc123' }

// Stat update (broadcast to room)
{ type: 'stat-update', projectId: 'abc123', stats: {...} }

// Project metadata update
{ type: 'project-update', projectId: 'abc123', data: {...} }

// Heartbeat (keep-alive)
{ type: 'heartbeat' }
```

### Client Integration Pattern

```typescript
// hooks/useWebSocket.ts pattern
const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL)

ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'join-project', projectId }))
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.type === 'stat-update') {
    updateLocalStats(message.stats)
  }
}
```

### Room Management

- Each project has its own room
- Clients join via `join-project` message
- Server broadcasts stat updates to all room members
- Automatic cleanup on disconnect

---

## 🌐 API Endpoints and Usage Patterns

### Standardized Response Format

**See [API_STANDARDS.md](API_STANDARDS.md) for comprehensive guide**

```typescript
// Success response
{
  success: true,
  data: T,
  meta?: { timestamp, version }
}

// Error response
{
  success: false,
  error: string,
  code: APIErrorCode,
  details?: any
}

// Paginated response
{
  success: true,
  data: T[],
  pagination: {
    limit: number,
    offset: number,
    nextOffset: number | null,
    totalMatched?: number
  }
}
```

### Key Endpoints

**Projects**
- `GET /api/projects` - List (supports cursor and offset pagination)
- `POST /api/projects` - Create
- `PUT /api/projects/[id]` - Update
- `DELETE /api/projects` - Delete (query param: `projectId`)

**Admin**
- `POST /api/admin/login` - Admin login
- `DELETE /api/admin/login` - Logout
- `GET /api/admin/hashtag-categories` - List categories
- `PUT /api/admin/local-users/[id]` - Regenerate password
- `DELETE /api/admin/local-users/[id]` - Delete user
- `POST /api/admin/clear-cookies` - Clear stale cookies

**Public**
- `GET /api/page-config` - Get page styling
- `POST /api/page-passwords` - Generate page password
- `PUT /api/page-passwords` - Validate password

### Auth Middleware Pattern

```typescript
import { getAdminUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  // Check admin session
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }
  
  // Proceed with authenticated logic
  // ...
}
```

### Pagination Strategies

**Cursor-based** (default for projects list):
```typescript
GET /api/projects?limit=20&cursor=abc123
Response: { data: [...], nextCursor: 'def456' }
```

**Offset-based** (when sorting/searching):
```typescript
GET /api/projects?sortField=eventName&sortOrder=asc&limit=20&offset=0
Response: { data: [...], pagination: { nextOffset: 20, totalMatched: 150 } }
```

---

## 📝 Code Quality Standards and Commenting

### Mandatory Comment Pattern

**Per rule KoQ93rKBdmt5VlnCCXPc6L**: All code must include:

1. **What** it does (functional explanation)
2. **Why** it exists (strategic justification)

**Example**:
```typescript
// WHAT: Force delete stale cookies before setting new session
// WHY: cookieStore.delete() doesn't emit browser removal headers,
//      causing old cookies to persist and conflict with new sessions
cookieStore.set('admin-session', '', { maxAge: 0, path: '/' })
```

### Prohibitions

- **No test files** - Tests are prohibited (MVP factory approach)
- **No inline styles** - Use centralized CSS classes with design tokens
- **No breadcrumb navigation** - Use clear top-level navigation
- **No backup file suffixes** - Use git branches, not `*2.tsx` files

### Design Token Usage

Always use CSS variables:
```tsx
// ❌ DON'T
<div style={{ background: '#ffffff', borderRadius: '8px' }}>

// ✅ DO
<div className="admin-card">
```

Define in `app/styles/theme.css`:
```css
--mm-white: #ffffff;
--mm-radius-md: 0.5rem;
```

---

## 🔀 Version Control Workflow

### Branching Strategy

- `main` - Production-ready code
- `feat/*` - New features (`feat/hashtag-categories`)
- `fix/*` - Bug fixes (`fix/cookie-stale-session`)
- `docs/*` - Documentation only (`docs/v5.21.2`)

### Commit Format

```
type: subject line (max 72 chars)

Optional body with detailed explanation.
Reference issues, PRs, or decisions.
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`

**Example**:
```
fix: use correct config property dbName instead of mongodbDb

ISSUE: Used config.mongodbDb instead of config.dbName causing
undefined database name errors in API routes.

FIX: Standardized on config.dbName across all files; added
TypeScript strict property access to prevent future typos.
```

### Versioning Protocol

**BEFORE `npm run dev`**: Increment PATCH version
```
2.6.2 → 2.6.3
```

**BEFORE `git commit`**: Increment MINOR, reset PATCH
```
2.6.3 → 2.7.0
```

**Major releases**: Only when explicitly instructed
```
2.7.5 → 3.0.0
```

### Pre-Commit Checklist

```bash
# 1. Type check
npm run type-check

# 2. Lint (warnings OK)
npm run lint

# 3. Production build
npm run build

# 4. Update documentation
# - README.md
# - ARCHITECTURE.md
# - LEARNINGS.md (if applicable)
# - RELEASE_NOTES.md

# 5. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feat/feature-name
```

---

## 🚀 Deployment Process

### Environment Promotion

1. **Development** (`localhost:3000`)
   - Local MongoDB or Atlas dev cluster
   - WebSocket on localhost:7654
   - `.env.local` for secrets

2. **Preview** (Vercel preview deployments)
   - Triggered on PR creation
   - Uses preview environment variables
   - Unique preview URL per branch

3. **Production** (messmass.doneisbetter.com)
   - Triggered on merge to `main`
   - MongoDB Atlas production cluster
   - Separate WebSocket server deployment

### Build Artifacts

- `.next/` - Next.js build output (excluded from git)
- `out/` - Static export (if used)
- `node_modules/` - Dependencies

### Runtime Configuration

**Environment Variables** (production):
```bash
# Set in Vercel dashboard
MONGODB_URI=<production-mongo-uri>
MONGODB_DB=messmass_prod
NEXT_PUBLIC_APP_URL=https://messmass.doneisbetter.com
NEXT_PUBLIC_WS_URL=wss://ws.messmass.doneisbetter.com
```

**WebSocket Server** (separate deployment):
- Deploy to Railway, Heroku, or dedicated VPS
- Ensure port 7654 accessible
- Set `WS_PORT` and `MAX_CONNECTIONS` env vars

---

## ⚠️ Common Pitfalls and Solutions

### 1. Next.js 15 Params Type Change

**Issue**: TypeScript errors in API routes
```typescript
// ❌ Wrong (Next.js 14 pattern)
{ params }: { params: { id: string } }

// ✅ Correct (Next.js 15)
context: { params: Promise<{ id: string }> }
const { id } = await context.params
```

### 2. Cookie Invalidation

**Issue**: Login fails even with correct credentials

**Solution**: Clear stale cookies first
```typescript
cookieStore.set('admin-session', '', { maxAge: 0, path: '/' })
```

**Recovery Tools**:
- `/admin/clear-session` (user-friendly)
- `/api/admin/clear-cookies` (programmatic)

### 3. Config Property Naming

**Issue**: `config.mongodbDb is undefined`

**Solution**: Use `config.dbName`
```typescript
// ❌ Wrong
const dbName = config.mongodbDb

// ✅ Correct
const dbName = config.dbName
```

### 4. WebSocket Connection Failures

**Issue**: "WebSocket connection failed" in browser console

**Solutions**:
- Verify WebSocket server is running (`cd server && npm start`)
- Check `NEXT_PUBLIC_WS_URL` in `.env.local`
- Ensure no firewall blocking port 7654

### 5. Missing API Endpoints

**Issue**: UI button fails with 404

**Solution**: Always implement backend before UI
- Check API route exists
- Test with curl/Postman before integrating UI
- Add to production checklist

### 6. Inline Style Regressions

**Issue**: ESLint warning about `style` prop

**Solution**: Use centralized CSS classes
```tsx
// ❌ Avoid
<div style={{ padding: '24px' }}>

// ✅ Use classes
<div className="admin-card">
```

---

## 📚 Essential Reading

1. **[WARP.md](WARP.md)** - Development rules and protocols
2. **[AUTHENTICATION_AND_ACCESS.md](AUTHENTICATION_AND_ACCESS.md)** - Auth system deep dive
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and components
4. **[LEARNINGS.md](LEARNINGS.md)** - Historical decisions and lessons
5. **[API_STANDARDS.md](API_STANDARDS.md)** - API response formats and patterns
6. **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** - CSS tokens and components

---

## ✅ Developer Checklist

### First Week Goals

- [ ] Clone repo and run locally
- [ ] Create test project in admin
- [ ] Make a simple code change (e.g., button text)
- [ ] Read all Essential Reading docs
- [ ] Understand authentication flow
- [ ] Explore database schema in MongoDB Atlas
- [ ] Submit first PR (documentation improvement)

### First Month Goals

- [ ] Implement a small feature end-to-end
- [ ] Fix a bug from TASKLIST.md
- [ ] Review 3+ PRs from other developers
- [ ] Add new API endpoint with tests
- [ ] Optimize a slow query
- [ ] Contribute to LEARNINGS.md

---

## 🆘 Getting Help

**Documentation**: Check Essential Reading docs first

**Code Questions**: 
- Review similar existing code
- Check git blame for context
- Read comments (what + why pattern)

**Architecture Questions**:
- See ARCHITECTURE.md
- Review data flow diagrams in this doc

**Stuck?**: Contact your team lead or project maintainer

---

**Welcome to the team! 🚀**

*MessMass v5.21.2 • Real-time Event Statistics Dashboard*
