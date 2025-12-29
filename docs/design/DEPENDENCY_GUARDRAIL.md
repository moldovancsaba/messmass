# Dependency Guardrail Documentation

**Version:** 1.0.0  
**Created:** 2025-01-XX  
**Last Updated:** 2025-01-XX  
**Status:** Active

**Maintained By:** Cursora  
**Reviewed By:** Chappie  
**Approved By:** Sultan

---

## Overview

The Dependency Guardrail enforces the approved technology stack for MessMass, preventing introduction of unapproved dependencies that violate stack discipline, security requirements, or architectural decisions.

**Why This Exists:**
- Maintain minimal, audited dependency footprint
- Prevent security vulnerabilities from unvetted packages
- Enforce architectural consistency
- Prevent "temporary" additions that become permanent
- Ensure LTS versions only

---

## Approved Stack

### Core Framework (Required)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | `15.x` | Next.js framework (App Router) |
| `react` | `18.x` | React UI library |
| `react-dom` | `18.x` | React DOM rendering |
| `typescript` | `5.x` | TypeScript language |

### Database & Data

| Package | Version | Purpose |
|---------|---------|---------|
| `mongodb` | `6.x` | MongoDB driver (MongoDB Atlas) |

### Real-Time Communication

| Package | Version | Purpose |
|---------|---------|---------|
| `ws` | `8.x` | WebSocket server (Socket.io alternative) |

### UI & Charts

| Package | Version | Purpose |
|---------|---------|---------|
| `chart.js` | `4.x` | Chart rendering library |
| `react-chartjs-2` | `5.x` | React wrapper for Chart.js |
| `html2canvas` | `*` | PNG export for charts |
| `jspdf` | `*` | PDF generation |
| `lucide-react` | `*` | Icon library |
| `focus-trap-react` | `*` | Accessibility (focus trapping) |
| `marked` | `*` | Markdown parsing |

### Security & Auth

| Package | Version | Purpose |
|---------|---------|---------|
| `bcryptjs` | `*` | Password hashing |
| `jsonwebtoken` | `*` | JWT session tokens |
| `dompurify` | `*` | HTML sanitization (XSS prevention) |
| `jsdom` | `*` | Server-side DOM (for DOMPurify) |
| `expr-eval` | `*` | Safe formula evaluation (replaces Function()) |

### Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `dotenv` | `*` | Environment variable management |
| `js-cookie` | `*` | Client-side cookie management |
| `uuid` | `*` | Unique identifier generation |
| `server-only` | `*` | Server-only code marker |

### External APIs

| Package | Version | Purpose |
|---------|---------|---------|
| `googleapis` | `*` | Google Sheets API |
| `nodemailer` | `*` | Email sending |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/node` | `*` | Node.js type definitions |
| `@types/react` | `*` | React type definitions |
| `@types/react-dom` | `*` | React DOM type definitions |
| `eslint` | `*` | Linting |
| `eslint-config-next` | `*` | Next.js ESLint config |
| `tsx` | `*` | TypeScript execution (scripts) |
| `jest` | `*` | Testing framework |
| `ts-jest` | `*` | Jest TypeScript transformer |

---

## Forbidden Packages

The following packages are **explicitly forbidden**:

### Security Risks
- `eval`, `vm`, `child_process` (code execution risks)

### Deprecated/Abandoned
- `request` (deprecated)
- `node-fetch@2` (deprecated, v3+ is ESM only)

### Framework Replacements
- `remix`, `svelte`, `vue`, `angular` (we use Next.js)

### UI Libraries
- `tailwindcss`, `bootstrap`, `material-ui`, `@mui/material`, `antd`, `chakra-ui` (we use custom components)

### State Management
- `redux`, `mobx`, `zustand`, `jotai` (not needed with Next.js)

### Test Frameworks
- `mocha`, `chai`, `vitest`, `playwright`, `cypress`, `puppeteer` (we use Jest only)

### Build Tools
- `webpack`, `vite`, `rollup`, `parcel` (Next.js handles this)

### Database Alternatives
- `mysql`, `postgres`, `sqlite`, `prisma`, `sequelize`, `typeorm` (MongoDB only)

### Auth Libraries
- `next-auth`, `passport`, `auth0`, `firebase-auth` (we use custom session-based auth)

---

## Usage

### Run Guardrail Locally

```bash
npm run check:dependencies
```

### CI Integration

The guardrail runs automatically in CI/CD pipeline (GitHub Actions) on:
- Pull requests
- Pushes to `main` branch

### Adding a New Dependency

**Process:**
1. **Request approval** from Sultan (Product Owner)
2. **Security audit** the package (0 vulnerabilities required)
3. **Verify LTS** version (no deprecated packages)
4. **Update whitelist** in `scripts/check-dependency-guardrail.ts`
5. **Update documentation** in this file
6. **Test guardrail** passes with new dependency

**Criteria for Approval:**
- ✅ Security-audited (0 vulnerabilities)
- ✅ LTS version (not deprecated)
- ✅ Fits approved architecture
- ✅ No architectural violations
- ✅ Minimal dependency footprint

---

## Violation Types

### 1. Forbidden Package
**Reason:** Package is explicitly forbidden (security/architectural violation)

**Example:**
```
❌ Found 1 dependency violation(s):
🚫 FORBIDDEN PACKAGES:
  - tailwindcss (dependencies)
    Reason: Package is explicitly forbidden
```

**Fix:** Remove the package or request exception from Sultan.

### 2. Unapproved Package
**Reason:** Package is not in approved whitelist

**Example:**
```
⚠️  UNAPPROVED PACKAGES:
  - some-new-package (dependencies)
    Reason: Package is not in approved whitelist
```

**Fix:** Request approval and add to whitelist.

### 3. Version Mismatch
**Reason:** Version does not match allowed version range

**Example:**
```
📌 VERSION MISMATCH:
  - next (dependencies)
    Reason: Version 14.5.0 does not match allowed versions: 15.x
```

**Fix:** Update version to match approved range.

---

## CI Integration

The guardrail is integrated into GitHub Actions workflow:

```yaml
# .github/workflows/dependency-guardrail.yml
name: Dependency Guardrail

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check-dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run check:dependencies
```

---

## Troubleshooting

### False Positives

If a package is incorrectly flagged:
1. Verify it's in the approved list
2. Check version constraints
3. Update whitelist if needed
4. Document the exception

### Missing Packages

If a package should be approved but isn't:
1. Request approval from Sultan
2. Add to whitelist in `scripts/check-dependency-guardrail.ts`
3. Update this documentation
4. Test guardrail passes

---

## Maintenance

**Who Maintains:**
- Cursora: Script implementation and whitelist updates
- Chappie: Documentation and approval process
- Sultan: Final approval for new dependencies

**Update Frequency:**
- When new dependencies are approved
- When packages are deprecated
- When security vulnerabilities are discovered
- When architectural decisions change

---

**Last Updated:** 2025-01-XX  
**Updated By:** Cursora  
**Next Review:** As needed

