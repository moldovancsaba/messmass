# MessMass: Access Documentation for Auditors
## Morgan Stanley Technology Audit - Access Provisioning Guide

**Document Version**: 1.0  
**System Version**: 6.22.3  
**Last Updated**: 2025-10-18T08:35:53.000Z (UTC)  
**Prepared For**: Morgan Stanley Audit Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [Access Levels and Scope](#2-access-levels-and-scope)
3. [Provisioning Instructions](#3-provisioning-instructions)
4. [System Access Methods](#4-system-access-methods)
5. [Database Access](#5-database-access)
6. [Code Repository Access](#6-code-repository-access)
7. [Production Environment](#7-production-environment)
8. [Security and Compliance](#8-security-and-compliance)
9. [Revocation Procedures](#9-revocation-procedures)
10. [Audit Artifacts and Logs](#10-audit-artifacts-and-logs)

---

## 1. Overview

This document provides step-by-step instructions for provisioning read-only access to the MessMass platform for Morgan Stanley audit team members. All access is temporary, logged, and revocable.

### Access Philosophy

**Zero-Trust Principle**: All access requires explicit provisioning and is limited to the minimum scope necessary for audit purposes.

### Audit Timeline

- **Access Provisioning**: 1-2 business days after request
- **Audit Window**: 30 days (extendable upon request)
- **Access Revocation**: Automatic upon audit completion or 30 days (whichever comes first)

---

## 2. Access Levels and Scope

### Level 1: Public Stats Viewer (Recommended Starting Point)

**What Auditors Can See**:
- Public activation reports (aggregated event statistics)
- Charts and visualizations
- Demographics and engagement data
- Bitly traffic sources (aggregated)

**What Auditors CANNOT See**:
- Partner profiles (organizational KYC data)
- Raw clicker data
- Admin configuration
- User accounts

**Access Method**: Page password (shared via secure channel)

**Use Case**: Understand public-facing data presentation and user experience

---

### Level 2: Read-Only Admin Access (For Technical Review)

**What Auditors Can See**:
- All events and statistics
- Partner profiles (clubs, federations, venues, brands)
- Hashtag categories and configuration
- Variable and chart configuration
- Bitly link associations
- User list (admin accounts only)

**What Auditors CANNOT Do**:
- Create, edit, or delete any records
- Change system configuration
- Access sensitive credentials or API tokens
- Execute database queries directly

**Access Method**: Read-only admin account (dedicated audit user)

**Use Case**: Comprehensive system review, configuration audit, data validation

---

### Level 3: MongoDB Atlas Read-Only (For Data Validation)

**What Auditors Can See**:
- All database collections (read-only)
- Indexes and schema structure
- Query performance metrics
- Backup and replication status

**What Auditors CANNOT Do**:
- Modify data
- Create/drop collections or indexes
- Access credentials or environment variables
- Execute admin commands

**Access Method**: MongoDB Atlas invite with read-only role

**Use Case**: Database schema validation, data integrity checks, compliance verification

---

### Level 4: GitHub Repository Access (For Code Review)

**What Auditors Can See**:
- Full source code (all branches)
- Commit history
- Pull requests and code reviews
- Documentation files
- GitHub Actions workflows

**What Auditors CANNOT Do**:
- Push commits
- Create branches
- Approve/merge pull requests
- Access GitHub Secrets or environment variables

**Access Method**: GitHub collaborator invite (read-only)

**Use Case**: Code quality assessment, security vulnerability scanning, documentation review

---

## 3. Provisioning Instructions

### Prerequisites

Before provisioning access, we require:

1. **Audit Team List**: Full names and email addresses of all auditors
2. **Access Level Requests**: Specify which levels each auditor needs
3. **Audit Timeline**: Expected start date and duration
4. **Security Questionnaire**: Completed questionnaire confirming:
   - Auditors have completed security awareness training
   - Auditors will not share access credentials
   - Auditors will use secure workstations only
   - Auditors will comply with NDA terms

---

## 4. System Access Methods

### Method A: Public Stats Page Access (Level 1)

#### Step 1: Select Sample Event

We will provide access to 3 representative events:

1. **Sports Match Event** (Example: Football match with 15,000 attendees)
2. **Multi-Day Festival** (Example: 3-day music festival)
3. **Corporate Event** (Example: Brand activation at stadium)

#### Step 2: Generate Page Passwords

For each event, we generate a unique page password:

```
Event 1: /stats/034d6a7e-0403-422c-bde0-59c907e68978
Password: [provided via secure email]

Event 2: /stats/[slug]
Password: [provided via secure email]

Event 3: /stats/[slug]
Password: [provided via secure email]
```

#### Step 3: Share Credentials Securely

Passwords sent via:
- **Preferred**: Encrypted email (PGP/GPG)
- **Alternative**: Password manager (1Password shared vault)
- **Not Acceptable**: Plain-text email, Slack, SMS

#### Step 4: Auditor Access Procedure

1. Navigate to provided URL (e.g., `https://messmass.doneisbetter.com/stats/[slug]`)
2. Enter page password when prompted
3. View activation report with all charts and metrics
4. Export charts as PNG if needed (download button on each chart)

**Access Duration**: Passwords remain valid for 30 days or until revoked

---

### Method B: Read-Only Admin Account (Level 2)

#### Step 1: Create Audit User Account

System owner executes:

```bash
# MongoDB Shell command to create audit user
db.users.insertOne({
  email: "audit-morgan-stanley@messmass.com",
  role: "admin-readonly",
  name: "Morgan Stanley Audit Team",
  createdAt: new ISODate("2025-10-18T08:35:53.000Z"),
  expiresAt: new ISODate("2025-11-18T08:35:53.000Z"), // 30-day expiry
  notes: "Temporary read-only access for technology audit"
})
```

#### Step 2: Generate Temporary Password

Password generated using secure random string:

```
Email: audit-morgan-stanley@messmass.com
Password: [provided via secure channel - 32-character random string]
```

#### Step 3: Configure Read-Only Middleware

We implement middleware to block all write operations:

```typescript
// middleware/audit-readonly.ts
if (session.user.role === 'admin-readonly') {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Read-only access', { status: 403 });
  }
}
```

#### Step 4: Auditor Login Procedure

1. Navigate to `https://messmass.doneisbetter.com/admin/login`
2. Enter audit user email and password
3. Session valid for 7 days (auto-logout after 2 hours of inactivity)
4. Browse all admin pages (projects, partners, hashtags, charts, etc.)
5. Logout when finished: Click profile menu → Logout

**Restrictions**:
- All "Create", "Edit", "Delete" buttons disabled
- API write operations blocked with 403 Forbidden
- Cannot access Settings pages with sensitive configuration

---

### Method C: MongoDB Atlas Read-Only Access (Level 3)

#### Step 1: Invite to MongoDB Atlas Organization

System owner sends invite:

1. Go to MongoDB Atlas dashboard
2. Navigate to "Access Manager" → "Invite Users"
3. Enter auditor email address
4. Select role: **"Read Only" (atlasAdmin)**
5. Scope: **Cluster: messmass-production**
6. Send invite email

#### Step 2: Auditor Accepts Invite

1. Check email for MongoDB Atlas invite
2. Click "Accept Invitation" link
3. Create MongoDB Atlas account (if first time)
4. Complete 2FA setup (required for Atlas)
5. Access granted to MessMass cluster

#### Step 3: Connect to Database

**Option A: MongoDB Compass (GUI)**

```
Connection String: mongodb+srv://[provided_readonly_user]@cluster0.mongodb.net/messmass?readPreference=secondary

Username: audit-readonly-user
Password: [provided via secure channel]
```

**Option B: MongoDB Shell (CLI)**

```bash
mongosh "mongodb+srv://cluster0.mongodb.net/messmass" \
  --username audit-readonly-user \
  --password [provided]
```

#### Step 4: Available Collections

Auditors can read from:

- `projects` (events and statistics)
- `partners` (organizational profiles)
- `bitly_links` (tracking links)
- `bitly_link_project_junctions` (link-to-event associations)
- `hashtag_categories` (category definitions)
- `users` (admin accounts - sensitive fields redacted)
- `notifications` (activity log)
- `chartConfigurations` (chart definitions)
- `variablesConfig` (variable metadata)
- `variablesGroups` (clicker layout groups)

#### Step 5: Sample Queries

**Query 1: Count all events**
```javascript
db.projects.countDocuments()
```

**Query 2: View sample event**
```javascript
db.projects.findOne()
```

**Query 3: Check indexes**
```javascript
db.projects.getIndexes()
```

**Query 4: Aggregate statistics**
```javascript
db.projects.aggregate([
  { $group: { _id: null, totalEvents: { $sum: 1 }, avgAttendees: { $avg: "$stats.eventAttendees" } } }
])
```

**Restrictions**:
- Read-only role cannot execute `insert`, `update`, `delete`, `drop`
- Cannot create/modify indexes
- Cannot access MongoDB Atlas admin settings

---

### Method D: GitHub Repository Access (Level 4)

#### Step 1: Invite to Repository

System owner invites auditors:

1. Go to `https://github.com/moldovancsaba/messmass`
2. Navigate to "Settings" → "Collaborators"
3. Click "Add people"
4. Enter auditor GitHub username or email
5. Select permission level: **"Read"**
6. Send invite

#### Step 2: Auditor Accepts Invite

1. Check email for GitHub invite
2. Click "Accept Invitation" link
3. Repository appears in auditor's GitHub dashboard

#### Step 3: Clone Repository

```bash
# Clone via HTTPS (no SSH key required for read-only)
git clone https://github.com/moldovancsaba/messmass.git
cd messmass

# View branches
git branch -a

# View commit history
git log --oneline --graph --all
```

#### Step 4: What Auditors Can Review

**Code Files**:
- `/app` - Next.js application code
- `/components` - Reusable React components
- `/lib` - Utility functions and database logic
- `/server` - WebSocket server code
- `/scripts` - Database migration scripts

**Documentation Files**:
- `README.md` - Project overview
- `ARCHITECTURE.md` - System architecture
- `WARP.md` - Development guidelines
- `RELEASE_NOTES.md` - Version history
- `/docs/audit` - Audit deliverables (this folder)

**Configuration Files**:
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js settings
- `.eslintrc.json` - Code quality rules

**Restrictions**:
- Read-only collaborators cannot push commits
- Cannot create branches or tags
- Cannot approve/merge pull requests
- Cannot access GitHub Secrets or deployment keys

---

## 5. Database Access

### MongoDB Atlas Dashboard Access

**What Auditors Can View**:

1. **Cluster Overview**:
   - Cluster tier and configuration (M10 shared)
   - Region and availability zones
   - Current connections count
   - Storage usage and limits

2. **Performance Metrics**:
   - Query performance (execution times)
   - Index usage statistics
   - Connection pool metrics
   - CPU and memory utilization

3. **Backup Status**:
   - Snapshot schedule (daily, weekly, monthly)
   - Retention policy (7 daily, 4 weekly, 12 monthly)
   - Last successful backup timestamp
   - Restore point availability

4. **Security Settings**:
   - Network access rules (IP whitelist)
   - Database users and roles
   - Encryption at rest status (enabled)
   - Audit log configuration

**What Auditors CANNOT Access**:
- Connection strings with admin credentials
- Database user passwords
- Encryption keys
- Billing information
- Cluster modification settings

---

### Data Sensitivity Classification

| Collection | Sensitivity | Auditor Access | Notes |
|------------|-------------|----------------|-------|
| `projects` | Low (aggregate data) | ✅ Full read | Event statistics, no PII |
| `partners` | Medium (business data) | ✅ Full read | Organizational profiles, no personal data |
| `bitly_links` | Low (marketing data) | ✅ Full read | Public URL tracking |
| `users` | High (admin PII) | ⚠️ Redacted read | Emails visible, passwords hashed |
| `notifications` | Low (activity log) | ✅ Full read | System notifications, no sensitive content |
| `chartConfigurations` | Low (config) | ✅ Full read | Chart definitions |
| `variablesConfig` | Low (config) | ✅ Full read | Variable metadata |

**PII Handling**: Auditors acknowledge that admin user emails are visible in the `users` collection but passwords are bcrypt-hashed and unreadable.

---

## 6. Code Repository Access

### Security Considerations

**Environment Variables NOT Committed**:

The following sensitive values are NOT in the repository:

- `MONGODB_URI` (database connection string)
- `ADMIN_PASSWORD` (admin authentication)
- `BITLY_ACCESS_TOKEN` (API credentials)
- `BITLY_ORGANIZATION_GUID` (Bitly account ID)
- `BITLY_GROUP_GUID` (Bitly group ID)
- `NEXT_PUBLIC_WS_URL` (WebSocket server URL)

**What IS in the Repository**:

- `.env.example` (template with placeholder values)
- Source code (no hardcoded secrets)
- Documentation (no sensitive information)
- Configuration files (framework settings only)

### Recommended Review Focus

For security audit, we recommend reviewing:

1. **Authentication Logic**: `lib/auth.ts`, `middleware.ts`
2. **API Security**: All files in `/app/api/**`
3. **Database Queries**: `lib/mongodb.ts`, `lib/*Utils.ts`
4. **Input Validation**: Look for user input handling in API routes
5. **Error Handling**: Check for information leakage in error messages

---

## 7. Production Environment

### Vercel Deployment Access (Optional)

If auditors need to review deployment settings:

#### Step 1: Invite to Vercel Team

System owner invites:

1. Go to Vercel dashboard
2. Navigate to "Settings" → "Members"
3. Click "Invite Member"
4. Enter auditor email
5. Select role: **"Viewer"** (read-only)
6. Send invite

#### Step 2: What Auditors Can See

**Deployment Information**:
- Deployment history and status
- Build logs (no secrets visible)
- Environment variable names (values redacted for viewer role)
- Custom domain configuration
- SSL certificate status

**Performance Metrics**:
- Page load times
- Serverless function execution times
- Bandwidth usage
- Error rates

**What Auditors CANNOT Do**:
- Trigger deployments
- Modify environment variables
- Change domain settings
- Access billing information

---

### WebSocket Server Access (Railway/Heroku)

**Limited Access**: WebSocket server deployment details are provided via screenshot/documentation only. Direct access NOT granted due to security concerns (server has direct database access).

**Audit Artifacts Provided Instead**:
- Server code (available in GitHub: `/server/websocket-server.js`)
- Deployment configuration (documented in `ARCHITECTURE.md`)
- Log samples (sanitized, no credentials)

---

## 8. Security and Compliance

### Access Logging

All auditor access is logged:

| Access Type | Log Location | Retention |
|-------------|--------------|-----------|
| Admin UI Login | MongoDB `users` collection (lastLogin field) | Infinite |
| MongoDB Queries | MongoDB Atlas Audit Log | 90 days |
| GitHub Activity | GitHub audit log | 90 days (free tier) |
| Vercel Access | Vercel activity log | 90 days |

**Auditor Acknowledgment Required**: "I acknowledge that all my access activity is logged and may be reviewed."

---

### Compliance Commitments

Auditors agree to:

1. **Confidentiality**: Not share access credentials with anyone outside audit team
2. **Secure Workstations**: Only access from approved, encrypted devices
3. **No Data Exfiltration**: Not download or export data beyond what's necessary for audit report
4. **Timely Revocation**: Notify system owner immediately upon audit completion
5. **Incident Reporting**: Report any security concerns or anomalies discovered

---

### Data Handling Guidelines

**Permitted**:
- Screenshots of UI for audit documentation
- Sample database queries and results (anonymized)
- Architecture diagrams and system flows
- Code snippets for security review

**Prohibited**:
- Exporting entire database collections
- Sharing raw admin credentials in audit reports
- Publishing system vulnerabilities publicly before responsible disclosure
- Retaining access credentials after audit completion

---

## 9. Revocation Procedures

### Automatic Revocation (After 30 Days)

All access automatically expires after 30 days:

- **Page Passwords**: Set expiry in database (`pagePassword.expiresAt`)
- **Admin Accounts**: MongoDB TTL index removes expired users
- **MongoDB Atlas**: Manual revocation required (automated via support ticket)
- **GitHub**: Manual removal required

---

### Manual Revocation (Immediate)

If auditors complete early or access needs to be revoked:

#### Revoke Page Password Access
```javascript
// MongoDB Shell
db.projects.updateOne(
  { slug: "034d6a7e-0403-422c-bde0-59c907e68978" },
  { $unset: { pagePassword: "" } }
)
```

#### Revoke Admin Account
```javascript
// MongoDB Shell
db.users.deleteOne({ email: "audit-morgan-stanley@messmass.com" })
```

#### Revoke MongoDB Atlas Access
1. Go to MongoDB Atlas dashboard
2. Navigate to "Access Manager" → "Database Users"
3. Find audit user: `audit-readonly-user`
4. Click "..." → "Delete User"
5. Confirm deletion

#### Revoke GitHub Access
1. Go to GitHub repository settings
2. Navigate to "Collaborators"
3. Find auditor username
4. Click "Remove" button
5. Confirm removal

#### Revoke Vercel Access
1. Go to Vercel team settings
2. Navigate to "Members"
3. Find auditor email
4. Click "..." → "Remove from Team"
5. Confirm removal

---

## 10. Audit Artifacts and Logs

### Pre-Audit Artifacts Provided

We provide the following artifacts BEFORE access is granted:

1. **This Document** (`08_ACCESS_DOCUMENTATION.md`)
2. **Executive Summary** (`00_EXEC_SUMMARY.md`)
3. **Plain-English Paper** (`07_PLAIN_ENGLISH_PAPER.md`)
4. **System Architecture Diagram** (PNG export from Mermaid)
5. **Database Schema ERD** (entity-relationship diagram)
6. **Sample Data** (anonymized event statistics)

These artifacts allow auditors to prepare questions and focus areas before live system access.

---

### Post-Audit Artifacts (Upon Request)

After audit completion, we can provide:

| Artifact | Format | Delivery Time |
|----------|--------|---------------|
| **Full Database Export** | JSON (anonymized) | 48 hours |
| **API Request Logs** | CSV (sanitized) | 24 hours |
| **Deployment History** | PDF | Immediate |
| **Dependency Audit** | `npm audit` output | Immediate |
| **Performance Report** | Vercel Analytics PDF | 24 hours |

**Note**: Full database exports are anonymized (admin emails redacted, page passwords removed).

---

## 11. Contact Information

### Primary Contact (System Owner)

**Name**: Csaba Moldovan  
**Email**: moldovancsaba@gmail.com  
**Availability**: Monday-Friday, 9:00-17:00 CET (UTC+1)  
**Response Time**: Within 4 business hours for access requests

### Escalation Contact (For Urgent Issues)

**Email**: moldovancsaba@gmail.com (same, mark as URGENT in subject)  
**Phone**: [Provided separately via secure channel]

### Audit Coordinator (Morgan Stanley Side)

**Name**: [To be provided by audit team]  
**Email**: [To be provided by audit team]  
**Role**: Primary liaison between audit team and system owner

---

## 12. Access Request Form

Please complete the following and send to **moldovancsaba@gmail.com**:

```
MESSMASS AUDIT ACCESS REQUEST

Audit Organization: Morgan Stanley
Audit Coordinator: [Name, Email]
Audit Timeline: [Start Date] to [End Date]

AUDITOR DETAILS (repeat for each auditor):
1. Name: ___________________________
   Email: ___________________________
   GitHub Username (if applicable): ___________________________
   Requested Access Levels: [ ] Level 1  [ ] Level 2  [ ] Level 3  [ ] Level 4

2. Name: ___________________________
   Email: ___________________________
   GitHub Username (if applicable): ___________________________
   Requested Access Levels: [ ] Level 1  [ ] Level 2  [ ] Level 3  [ ] Level 4

SECURITY ATTESTATION:
[ ] All auditors have completed security awareness training
[ ] All auditors will use secure, encrypted workstations
[ ] All auditors agree not to share access credentials
[ ] All auditors agree to comply with NDA terms
[ ] All auditors agree to notify system owner upon audit completion

FOCUS AREAS (optional - helps us prepare):
[ ] Security and authentication
[ ] Data privacy and compliance
[ ] Code quality and architecture
[ ] Performance and scalability
[ ] Operational resilience
[ ] Other: _______________________

SPECIAL REQUIREMENTS (optional):
_____________________________________________
_____________________________________________

Requested By: ___________________________
Date: ___________________________
Signature: ___________________________
```

---

## 13. Frequently Asked Questions (FAQ)

### Q1: How long does access provisioning take?

**A**: 1-2 business days for Level 1-2 access. Level 3-4 may take up to 3 business days if additional approvals are needed.

---

### Q2: Can we request additional sample events for review?

**A**: Yes. Please specify event types (e.g., "football match with 10K+ attendees", "multi-day festival") and we'll provide appropriate samples.

---

### Q3: What if we discover a security vulnerability?

**A**: Report immediately to **moldovancsaba@gmail.com** with subject "SECURITY VULNERABILITY - CONFIDENTIAL". We commit to acknowledging within 4 hours and providing a remediation plan within 48 hours.

---

### Q4: Can we extend the 30-day access window?

**A**: Yes. Submit extension request 5 days before expiry with justification. Extensions granted in 30-day increments.

---

### Q5: What happens if we accidentally trigger a write operation?

**A**: Read-only middleware blocks all write operations with a 403 Forbidden response. No data will be modified. The attempt is logged for audit purposes.

---

### Q6: Can we access production logs (application logs, error logs)?

**A**: Limited access. We can provide sanitized log samples (last 7 days) in CSV format upon request. Real-time log access NOT granted due to potential credential exposure in error messages.

---

### Q7: What if we need access to environment variables for validation?

**A**: We provide a `.env.example` template showing all required variables. For validation, we can confirm "Variable X is set to [type of value]" without revealing the actual value. Example: "MONGODB_URI is set to a valid MongoDB Atlas connection string."

---

### Q8: Can we interview the development team?

**A**: Yes. Coordinate via system owner (moldovancsaba@gmail.com). Interviews can be scheduled with:
- System owner (architecture, design decisions)
- No additional developers (solo project)

---

## 14. Appendix: Sample Credentials (Test Environment)

For initial exploration, we provide a TEST environment with sample data:

### Test Environment Access

**URL**: `https://test.messmass.doneisbetter.com` (if available)  
**Admin Login**:
- Email: `demo-admin@messmass.com`
- Password: `[provided separately]`

**Note**: Test environment is a separate deployment with anonymized/synthetic data. No production data in test environment.

---

## 15. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-18T08:35:53.000Z | Agent Mode | Initial version for Morgan Stanley audit |

---

**Document Prepared By**: Agent Mode  
**Date**: 2025-10-18T08:35:53.000Z (UTC)  
**System Version**: 6.22.3  
**Status**: Approved for Morgan Stanley Audit

---

*This access documentation provides comprehensive provisioning instructions for audit team members. All access is temporary, logged, and revocable. For questions or clarifications, contact moldovancsaba@gmail.com.*
