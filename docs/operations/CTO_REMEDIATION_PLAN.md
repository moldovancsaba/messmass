# CTO Remediation Plan: Security Hardening in Production
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Plan Date:** 2025-12-29T00:00:00.000Z (UTC)  
**Status:** 🔴 **ACTIVE - CRITICAL REMEDIATION IN PROGRESS**  
**Timeline:** 3-4 weeks for critical fixes, 2-3 months for complete hardening  
**Principle:** **ZERO DOWNTIME - ALL FIXES MUST BE BACKWARD COMPATIBLE**

---

## Executive Summary

**Situation:** Production system has critical security vulnerabilities that must be fixed immediately while maintaining 100% service availability.

**Strategy:** Phased, backward-compatible migrations with feature flags, dual-write patterns, and gradual cutover.

**Risk Mitigation:** 
- All changes are backward compatible
- Rollback plan for every phase
- Feature flags for instant disable
- Comprehensive monitoring
- Staged rollouts (10% → 50% → 100%)

**Success Criteria:**
- Zero service interruptions
- All critical vulnerabilities fixed
- No user-visible changes
- Performance maintained or improved

---

## Phase 0: Preparation & Infrastructure (Days 1-2)

### 0.1 Emergency Monitoring Setup

**Objective:** Establish baseline monitoring before making changes

**Actions:**
1. **Set up error tracking**
   ```bash
   # Add Sentry or similar
   npm install @sentry/nextjs
   ```

2. **Enable Vercel Analytics** (if not already enabled)
   - Monitor API response times
   - Track error rates
   - Monitor deployment success

3. **Database monitoring**
   - Set up MongoDB Atlas alerts for:
     - Slow queries (>100ms)
     - Connection pool exhaustion
     - High CPU/memory usage

4. **Create monitoring dashboard**
   - Authentication success/failure rates
   - Session creation/validation rates
   - API error rates by endpoint
   - Database query performance

**Deliverable:** Monitoring dashboard with baseline metrics

**Rollback:** N/A (monitoring only)

---

### 0.2 Feature Flag Infrastructure

**Objective:** Enable instant rollback capability for all changes

**Actions:**
1. **Install feature flag library**
   ```bash
   npm install @unleash/nextjs
   # OR simple env-based flags
   ```

2. **Create feature flag system**
   ```typescript
   // lib/featureFlags.ts
   export const FEATURE_FLAGS = {
     USE_BCRYPT_AUTH: process.env.ENABLE_BCRYPT_AUTH === 'true',
     USE_JWT_SESSIONS: process.env.ENABLE_JWT_SESSIONS === 'true',
     USE_SANITIZED_HTML: process.env.ENABLE_HTML_SANITIZATION === 'true',
     USE_SAFE_FORMULA_PARSER: process.env.ENABLE_SAFE_FORMULAS === 'true',
   } as const;
   ```

3. **Environment variables setup**
   ```bash
   # .env.local (development)
   ENABLE_BCRYPT_AUTH=false
   ENABLE_JWT_SESSIONS=false
   ENABLE_HTML_SANITIZATION=false
   ENABLE_SAFE_FORMULA_PARSER=false
   
   # Vercel Production (set via dashboard)
   ENABLE_BCRYPT_AUTH=false  # Will enable in Phase 1
   ```

**Deliverable:** Feature flag system ready for use

**Rollback:** Set flags to `false` in Vercel dashboard

---

### 0.3 Database Backup & Recovery Plan

**Objective:** Ensure we can recover from any migration issues

**Actions:**
1. **Create full database backup**
   ```bash
   npm run db:backup
   # Verify backup file exists and is valid
   ```

2. **Test restore procedure**
   ```bash
   npm run db:restore backups/messmass_backup_TIMESTAMP/
   # Verify restore works on staging
   ```

3. **Document rollback procedures**
   - Database restore steps
   - Code rollback via Git
   - Environment variable rollback

**Deliverable:** Tested backup and restore procedure

**Rollback:** Restore from backup if needed

---

## Phase 1: Password Security (Days 3-5) - CRITICAL

### 1.1 Dual-Write Password Migration

**Objective:** Migrate passwords to bcrypt without breaking existing authentication

**Strategy:** Support both plaintext and hashed passwords during transition

**Implementation:**

**Step 1: Install bcrypt**
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

**Step 2: Update authentication to support both**
```typescript
// app/api/admin/login/route.ts
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  // ... existing code ...
  
  // WHAT: Support both plaintext (legacy) and hashed (new) passwords
  // WHY: Zero-downtime migration - users can login with either format
  let isValid = false;
  
  if (user?.passwordHash) {
    // New hashed password
    isValid = await bcrypt.compare(password, user.passwordHash);
  } else if (user?.password) {
    // Legacy plaintext password - validate and migrate
    isValid = user.password === password;
    
    if (isValid) {
      // WHAT: Migrate password to bcrypt on successful login
      // WHY: Gradually migrate users without forcing password reset
      const passwordHash = await bcrypt.hash(password, 12);
      await updateUserPasswordHash(user._id.toString(), passwordHash);
      
      // Log migration (for monitoring)
      console.log(`[MIGRATION] Password migrated for user: ${user.email}`);
    }
  }
  
  // ... rest of login logic ...
}
```

**Step 3: Update password creation**
```typescript
// lib/users.ts
import bcrypt from 'bcryptjs';

export async function createUser(userData: {
  email: string;
  password: string;
  // ... other fields
}) {
  // WHAT: Always hash new passwords
  // WHY: New users get secure passwords immediately
  const passwordHash = await bcrypt.hash(userData.password, 12);
  
  const user = {
    email: userData.email,
    passwordHash, // Store hashed
    // DO NOT store plaintext password
    // ... other fields
  };
  
  return await usersCollection.insertOne(user);
}
```

**Step 4: Background migration script (optional)**
```typescript
// scripts/migrate-passwords-background.ts
// WHAT: Migrate passwords for inactive users in background
// WHY: Speed up migration without impacting active users
// WHEN: Run during low-traffic hours

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

async function migrateInactiveUsers() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'messmass');
  const users = db.collection('users');

  // Find users with plaintext passwords who haven't logged in recently
  const inactiveUsers = await users.find({
    password: { $exists: true },
    passwordHash: { $exists: false },
    lastLogin: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 days ago
  }).toArray();

  for (const user of inactiveUsers) {
    if (!user.password) continue;
    
    try {
      const passwordHash = await bcrypt.hash(user.password, 12);
      await users.updateOne(
        { _id: user._id },
        { 
          $set: { passwordHash },
          $unset: { password: "" }
        }
      );
      console.log(`Migrated inactive user: ${user.email}`);
    } catch (error) {
      console.error(`Failed to migrate ${user.email}:`, error);
    }
  }

  await client.close();
}
```

**Deployment Steps:**
1. Deploy code with dual-write support (feature flag: `ENABLE_BCRYPT_AUTH=false`)
2. Verify existing logins still work
3. Enable feature flag: `ENABLE_BCRYPT_AUTH=true`
4. Monitor authentication success rates
5. Run background migration script during low traffic
6. After 1 week, remove plaintext password support

**Monitoring:**
- Authentication success rate (should remain 100%)
- Migration rate (users migrated per day)
- Login latency (should not increase significantly)

**Rollback Plan:**
1. Set `ENABLE_BCRYPT_AUTH=false` in Vercel
2. Redeploy (Vercel auto-deploys from GitHub)
3. All users fall back to plaintext authentication

**Timeline:** 3-5 days (deploy + monitor + background migration)

---

### 1.2 Remove Plaintext Password Support

**Objective:** Remove legacy plaintext password code after migration complete

**Prerequisites:**
- 100% of active users have `passwordHash` field
- No users logging in with plaintext passwords for 7+ days

**Implementation:**
```typescript
// app/api/admin/login/route.ts
// Remove plaintext password support

let isValid = false;
if (user?.passwordHash) {
  isValid = await bcrypt.compare(password, user.passwordHash);
} else {
  // WHAT: Reject users without passwordHash
  // WHY: Migration complete, plaintext passwords no longer supported
  return NextResponse.json(
    { error: 'Account requires password reset. Please contact administrator.' },
    { status: 401 }
  );
}
```

**Deployment:**
1. Verify all users migrated (database query)
2. Deploy code without plaintext support
3. Monitor for authentication failures
4. Have password reset process ready for edge cases

**Timeline:** 1 day (after migration complete)

---

## Phase 2: Session Token Security (Days 6-8) - CRITICAL

### 2.1 Dual-Token Session Migration

**Objective:** Migrate from Base64 to JWT without invalidating existing sessions

**Strategy:** Support both token formats during transition, gradually migrate

**Implementation:**

**Step 1: Install JWT library**
```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

**Step 2: Generate JWT secret**
```bash
# Generate strong random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add to Vercel environment variables: JWT_SECRET
```

**Step 3: Update token generation (dual-write)**
```typescript
// app/api/admin/login/route.ts
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  // ... authentication code ...
  
  const tokenData = {
    token: crypto.randomBytes(32).toString('hex'),
    expiresAt: expiresAt.toISOString(),
    userId: user?._id?.toString() || 'admin',
    role: (user?.role || 'superadmin') as UserRole
  };

  // WHAT: Generate both token formats during migration
  // WHY: Existing sessions continue working, new sessions use JWT
  const legacyToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  const jwtToken = jwt.sign(tokenData, process.env.JWT_SECRET!, {
    expiresIn: '7d',
    algorithm: 'HS256'
  });

  // Store both tokens in cookie (or use feature flag to choose)
  const useJWT = process.env.ENABLE_JWT_SESSIONS === 'true';
  const sessionToken = useJWT ? jwtToken : legacyToken;
  
  // Store token format in cookie for validation
  response.cookies.set('admin-session', sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
    domain,
  });
  
  // Store format indicator (for validation)
  response.cookies.set('session-format', useJWT ? 'jwt' : 'legacy', {
    httpOnly: false, // Client doesn't need to read, but helps debugging
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}
```

**Step 4: Update token validation (dual-read)**
```typescript
// lib/auth.ts or middleware.ts
import jwt from 'jsonwebtoken';

export function validateSessionToken(token: string, format?: string): TokenData | null {
  // WHAT: Support both token formats during migration
  // WHY: Existing sessions continue working
  
  if (format === 'jwt' || (!format && token.includes('.'))) {
    // JWT token (has dots)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
        algorithms: ['HS256']
      }) as TokenData;
      return decoded;
    } catch (error) {
      return null;
    }
  } else {
    // Legacy Base64 token
    try {
      const json = Buffer.from(token, 'base64').toString();
      const tokenData = JSON.parse(json) as TokenData;
      
      // Validate expiration
      const expiresAt = new Date(tokenData.expiresAt);
      if (new Date() > expiresAt) {
        return null; // Expired
      }
      
      return tokenData;
    } catch (error) {
      return null;
    }
  }
}
```

**Step 5: Update middleware**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // ... existing code ...
  
  if (pathname.startsWith('/admin') && !isPublicRoute) {
    const adminSession = request.cookies.get('admin-session');
    const sessionFormat = request.cookies.get('session-format')?.value;
    
    if (!adminSession?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // WHAT: Validate token based on format
    const tokenData = validateSessionToken(adminSession.value, sessionFormat);
    
    if (!tokenData) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // ... rest of middleware ...
  }
}
```

**Deployment Steps:**
1. Deploy code with dual-token support (`ENABLE_JWT_SESSIONS=false`)
2. Verify existing sessions still work
3. Enable JWT for new sessions: `ENABLE_JWT_SESSIONS=true`
4. Monitor session validation success rates
5. After 7 days (session expiration), all sessions will be JWT
6. Remove legacy token support

**Monitoring:**
- Session validation success rate
- Token format distribution (legacy vs JWT)
- Authentication failures

**Rollback Plan:**
1. Set `ENABLE_JWT_SESSIONS=false`
2. Redeploy
3. All sessions fall back to legacy format

**Timeline:** 3-5 days (deploy + 7 days for session expiration)

---

## Phase 3: XSS Protection (Days 9-11) - HIGH

### 3.1 HTML Sanitization

**Objective:** Sanitize all HTML rendering without breaking existing content

**Implementation:**

**Step 1: Install DOMPurify**
```bash
npm install dompurify
npm install --save-dev @types/dompurify
npm install jsdom  # For server-side sanitization
```

**Step 2: Create sanitization utility**
```typescript
// lib/sanitize.ts
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// WHAT: Sanitize HTML for safe rendering
// WHY: Prevent XSS attacks while preserving formatting
export function sanitizeHTML(dirty: string, options?: {
  allowTags?: string[];
  allowAttributes?: string[];
}): string {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: options?.allowTags || [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a'
    ],
    ALLOWED_ATTR: options?.allowAttributes || ['href', 'title'],
    ALLOW_DATA_ATTR: false,
  });
}
```

**Step 3: Update all dangerouslySetInnerHTML usage**
```typescript
// components/charts/TextChart.tsx
import { sanitizeHTML } from '@/lib/sanitize';

// Before:
<div dangerouslySetInnerHTML={{ __html: htmlContent }} />

// After:
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(htmlContent) }} />
```

**Step 4: Feature flag for gradual rollout**
```typescript
// lib/sanitize.ts
export function sanitizeHTML(dirty: string, options?: SanitizeOptions): string {
  if (process.env.ENABLE_HTML_SANITIZATION !== 'true') {
    return dirty; // Bypass during migration
  }
  return purify.sanitize(dirty, { /* ... */ });
}
```

**Deployment Steps:**
1. Deploy with sanitization disabled (`ENABLE_HTML_SANITIZATION=false`)
2. Test all pages with HTML content
3. Enable sanitization (`ENABLE_HTML_SANITIZATION=true`)
4. Monitor for content rendering issues
5. Adjust allowed tags/attributes if needed

**Monitoring:**
- Content rendering errors
- User reports of missing formatting
- XSS attempt detection (if logging enabled)

**Rollback Plan:**
1. Set `ENABLE_HTML_SANITIZATION=false`
2. Redeploy
3. Sanitization bypassed

**Timeline:** 2-3 days

---

## Phase 4: Code Injection Protection (Days 12-14) - CRITICAL

### 4.1 Safe Formula Parser Migration

**Objective:** Replace Function() constructor with safe parser

**Implementation:**

**Step 1: Install safe parser**
```bash
npm install expr-eval
```

**Step 2: Create safe formula engine**
```typescript
// lib/formulaEngine.ts
import { Parser } from 'expr-eval';

const parser = new Parser({
  operators: {
    add: true,
    subtract: true,
    multiply: true,
    divide: true,
    power: true,
    mod: false, // Disable if not needed
  }
});

// WHAT: Safely evaluate formulas without code execution
// WHY: Prevent RCE attacks via formula injection
export function evaluateFormula(
  formula: string, 
  variables: Record<string, number>
): number {
  // WHAT: Validate formula contains only safe characters
  // WHY: Prevent injection of malicious code
  if (!/^[0-9+\-*/().\s\[\]a-zA-Z_]+$/.test(formula)) {
    throw new Error('Invalid formula: contains unsafe characters');
  }
  
  try {
    // Replace variable references (e.g., [stats.remoteImages])
    const cleanFormula = formula.replace(/\[stats\.(\w+)\]/g, (_, varName) => {
      const value = variables[varName];
      if (value === undefined || value === null) {
        return '0';
      }
      return value.toString();
    });
    
    // Parse and evaluate safely
    const expr = parser.parse(cleanFormula);
    return expr.evaluate(variables);
  } catch (error) {
    throw new Error(`Formula evaluation failed: ${error.message}`);
  }
}
```

**Step 3: Update chart algorithm manager**
```typescript
// components/ChartAlgorithmManager.tsx
import { evaluateFormula } from '@/lib/formulaEngine';

// Before:
const result = Function('"use strict"; return (' + testFormula + ')')();

// After:
const result = evaluateFormula(testFormula, variableValues);
```

**Step 4: Feature flag for gradual rollout**
```typescript
// lib/formulaEngine.ts
export function evaluateFormula(formula: string, variables: Record<string, number>): number {
  if (process.env.ENABLE_SAFE_FORMULA_PARSER !== 'true') {
    // Legacy unsafe evaluation (temporary fallback)
    return Function('"use strict"; return (' + formula + ')')();
  }
  
  // Safe evaluation
  // ... safe parser code ...
}
```

**Deployment Steps:**
1. Deploy with safe parser disabled (`ENABLE_SAFE_FORMULA_PARSER=false`)
2. Test all chart formulas
3. Enable safe parser (`ENABLE_SAFE_FORMULA_PARSER=true`)
4. Monitor for formula evaluation errors
5. Remove legacy Function() code after validation

**Monitoring:**
- Formula evaluation errors
- Chart rendering failures
- User reports of incorrect calculations

**Rollback Plan:**
1. Set `ENABLE_SAFE_FORMULA_PARSER=false`
2. Redeploy
3. Fall back to legacy evaluation

**Timeline:** 2-3 days

---

## Phase 5: Additional Security Hardening (Days 15-21) - HIGH

### 5.1 Remove Console.log Statements

**Objective:** Replace all console.log with proper logging

**Implementation:**
1. Use existing logger system (`lib/logger.ts`)
2. Replace all `console.log` with `logInfo`
3. Replace all `console.error` with `logError`
4. Remove PII from logs

**Timeline:** 1-2 days

---

### 5.2 Fix CORS Configuration

**Objective:** Restrict CORS to known origins

**Implementation:**
```typescript
// lib/cors.ts
const ALLOWED_ORIGINS = [
  'https://messmass.doneisbetter.com',
  'https://www.messmass.doneisbetter.com',
  // Add other allowed origins
];

export function buildCorsHeaders(request: NextRequest): Headers {
  const origin = request.headers.get('origin');
  const headers = new Headers();
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return headers;
}
```

**Timeline:** 1 day

---

### 5.3 Fix Role Naming Inconsistencies

**Objective:** Standardize all role checks

**Implementation:**
1. Search and replace all role checks
2. Remove normalization code from middleware
3. Update TypeScript types

**Timeline:** 1 day

---

### 5.4 Separate API Keys from Passwords

**Objective:** Implement proper API key system

**Implementation:**
1. Create `api_keys` collection
2. Hash API keys (similar to passwords)
3. Implement key rotation
4. Migrate existing API users

**Timeline:** 3-5 days

---

## Phase 6: Testing & Validation (Days 22-28) - CRITICAL

### 6.1 Security Testing

**Actions:**
1. **Penetration Testing**
   - Authentication bypass attempts
   - Session token tampering
   - XSS injection tests
   - Code injection attempts

2. **Code Review**
   - Review all authentication code
   - Review all input validation
   - Review all output encoding

3. **Dependency Scanning**
   ```bash
   npm audit
   npm audit fix
   ```

**Timeline:** 3-5 days

---

### 6.2 Performance Testing

**Actions:**
1. Load testing (authentication endpoints)
2. Database query performance
3. Session validation performance
4. Memory usage monitoring

**Timeline:** 2-3 days

---

## Phase 7: Documentation & Process (Ongoing)

### 7.1 Security Documentation

**Actions:**
1. Document security architecture
2. Document incident response plan
3. Document rollback procedures
4. Update developer onboarding

**Timeline:** Ongoing

---

### 7.2 Security Process

**Actions:**
1. Establish security review process
2. Implement security monitoring
3. Schedule regular security audits
4. Create security training materials

**Timeline:** Ongoing

---

## Risk Management

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Authentication breaks during migration | Low | High | Feature flags, dual-write, rollback plan |
| Session invalidation | Low | Medium | Dual-token support, gradual migration |
| Content rendering breaks | Medium | Low | Feature flags, gradual rollout |
| Formula evaluation errors | Low | Medium | Feature flags, comprehensive testing |
| Performance degradation | Low | Medium | Monitoring, load testing |

### Rollback Procedures

**For Each Phase:**
1. Set feature flag to `false` in Vercel
2. Redeploy (automatic from GitHub)
3. System falls back to previous behavior
4. Investigate issue
5. Fix and retry

**For Database Issues:**
1. Restore from backup: `npm run db:restore <backup-path>`
2. Verify data integrity
3. Redeploy code if needed

---

## Communication Plan

### Internal Communication

**Daily Standups:**
- Progress on current phase
- Blockers or issues
- Next day's plan

**Weekly Reports:**
- Phase completion status
- Metrics (success rates, errors)
- Upcoming phases

### User Communication

**If Service Interruption:**
- Immediate notification via status page
- Regular updates every 15 minutes
- Post-incident report

**For Password Resets (if needed):**
- Email notification with reset link
- Clear instructions
- Support contact information

---

## Success Metrics

### Security Metrics
- ✅ 100% of passwords hashed
- ✅ 100% of sessions use JWT
- ✅ 0 XSS vulnerabilities
- ✅ 0 code injection vulnerabilities
- ✅ CORS restricted to known origins

### Operational Metrics
- ✅ 99.9% uptime maintained
- ✅ Authentication success rate > 99.5%
- ✅ API response time < 200ms (p95)
- ✅ Zero data loss
- ✅ Zero user-visible errors

---

## Timeline Summary

| Phase | Duration | Critical Items |
|-------|----------|----------------|
| Phase 0: Preparation | 2 days | Monitoring, feature flags, backups |
| Phase 1: Password Security | 3-5 days | Bcrypt migration |
| Phase 2: Session Security | 3-5 days | JWT migration |
| Phase 3: XSS Protection | 2-3 days | HTML sanitization |
| Phase 4: Code Injection | 2-3 days | Safe formula parser |
| Phase 5: Additional Hardening | 5-7 days | CORS, logging, roles |
| Phase 6: Testing | 5-8 days | Security & performance testing |
| **Total** | **22-33 days** | **3-4 weeks** |

---

## Approval & Sign-Off

**CTO Approval:** Required before Phase 1 begins  
**Security Team Approval:** Required for each phase  
**DevOps Approval:** Required for deployment procedures  

**Next Review:** After Phase 1 completion (Day 5)

---

**Document Version:** 1.1  
**Last Updated:** 2026-01-11T22:28:38.000Z  
**Status:** 🔴 **READY FOR EXECUTION**

