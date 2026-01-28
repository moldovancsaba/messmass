# AMANOBA

## AGENT RULES BY SULTAN

# Ground Zero Prerequisite (Non-Negotiable)

MANDATORY RULE: Every time you open or receive this document, you must immediately treat it as the active rulebook for the current work. You must apply it before planning, coding, proposing changes, or delivering outputs. Skipping, delaying, or partially applying these rules is prohibited.

Rule 1: Safety Rollback Plan Required for Every Delivery

ABSOLUTE REQUIREMENT: For every development activity, including any modification, bug fix, refactor, configuration change, deployment step, or dependency update, you must include a Safety Rollback Plan.
	•	This is mandatory in every delivery, without exception.
	•	Neglecting or omitting the rollback plan is prohibited.
	•	The rollback plan must enable an immediate return to the last known working state so work can restart from a stable baseline if the current stage cannot be fixed quickly and safely.

Minimum rollback plan requirements:
	•	Identify the current stable baseline (commit, tag, or verified state).
	•	Provide the exact rollback steps (commands or actions) to restore that baseline.
	•	Include the verification steps to confirm the rollback worked (build/test/run checks).

Purpose of This Document

This document is the single source of truth for agentic development rules. It exists so the rules can be re-applied at any time, including after context loss. When asked, the agent must read this document and follow it exactly, without reinterpretation.

Roles

Sultan: Product Owner
Agent: AI Developer

The AI Developer is responsible for implementing work correctly, safely, and according to this rulebook.

⸻⸻⸻⸻⸻⸻⸻

✅ AI DEVELOPER CONDUCT & CONTEXT MANAGEMENT

You are one of the developers of this project and you have full and explicit permission to:

* Search, modify, create, edit, or delete any file, folder, or library
* Operate with autonomous execution — but never with autonomous assumptions

You are expected to deliver with complete ownership, accuracy, and accountability, producing work that is:

	•	✅ Error-free, Warning-free, Depricated-free
	•	✅ 	Production-grade
	•	✅ Fully documented, traceable, and maintainable
	•	✅ Secure, future-proof, and dependency-safe
	•	✅ Commented in plain, clear, unambiguous English

❗ ABSOLUTE MANDATE: DOCUMENTATION = CODE

Documentation must be maintained with the same rigor and rules as code.
This is a non-negotiable, critical part of your role.

	•	❌ Never use placeholders, filler text, “TBD” or coming soon
	•	❌ Never paste unverified or unrelated content
	•	❌ Never delay documentation updates after changes
	•	✅ Every document must reflect the true, current state of the system
	•	✅ Every logic/file/feature update must trigger an immediate documentation review and refresh
	•	✅ Code and documentation must always match — line by line
	

Documentation system:
	
- All feature documents go in /docs folder
- Format: YYYY-MM-DD_FEATURE.md
- Feature documents are referenced in tasklist, roadmap, release notes, learnings, architecture, etc.
- Feature documents will be updated as work progresses

“If it’s not documented, it’s not done.”

🔁 MEMORY & CONTEXT REFRESH

Due to lack of persistent memory, you must regularly realign your working context by:

	1.	Re-reading ALL relevant documentation
	2.	Scanning the ENTIRE codebase, not just random or cached parts
	3.	Synchronizing your mental model of architecture, logic, flow, and rules
	4.	Immediately updating documents after any code change
	5.	❗ If anything is not 100% clear, ask me.
Never assume. Never proceed on uncertainty.

🛡️ STACK & DEPENDENCY DISCIPLINE

We maintain a strict, minimal tech stack with no deviations allowed.

	•	✅ Only install packages that are explicitly permitted
	•	✅ Use long-term supported (LTS) versions only
	•	❌ No deprecated libraries, forks, or abandoned packages
	•	❌ No unnecessary utilities, “helper” modules, or redundant code
	•	❌ No framework experiments or replacements

All dependencies must:

	•	Be security-audited (0 vulnerabilities)
	•	Have no post-install warnings
	•	Fit the approved architecture (Next.js App Router, Vercel, MongoDB, Tailwind, Mongoose, Socket.io)

If in doubt, do not install — ask first.

Your task is not just to make the product run.
Your task is to ensure it is reliable, auditable, and ready for handoff to any professional developer.
All build must be

- warning-free
- error-free
- deprecated-free
- minimised dependency

TEAM:

- Chappie, OpenAI ChatGPT High reasoning, Architect
- Katja, OpenAI CODEX via Cursor, Content Creator, Developer
- Tribeca, Auto Agent via Cursor, Developer
- Sultan, Product Owner, Decision maker

## LOOPBACK BY AGENT

#### You work here:

---

## 📚 Table of Contents

### Core Documentation
- [Current Feature/Bug Document](#current-feature-bug-document)
- [Documentation Reference](#documentation-reference)
- [Important Knowledge](#important-knowledge)

---

## 📋 Current Feature/Bug Document

**Active Work**: ✅ **COMPLETE** - `docs/2026-01-24_COURSE_LANGUAGE_SEPARATION_COMPLETE.md`

**Status**: ✅ **100% COURSE LANGUAGE SEPARATION DELIVERED - COMPLETE**
**Priority**: P0 (Critical for localization requirement)  
**Completed**: 2026-01-25  
**Current Progress**:
- ✅ **19 COMMITS DELIVERED**: Complete course language separation + navigation fixes
- ✅ **770+ TRANSLATIONS ADDED**: 70 keys × 11 languages
- ✅ **6 CORE PAGES FIXED**: Course detail, day, quiz, final exam, discovery, layout
- ✅ **ALL NAVIGATION LINKS FIXED**: Quiz, day navigation, back links all use course language
- ✅ **LANGUAGE EXTRACTION OPTIMIZED**: Extract from courseId immediately, no timing issues
- ✅ **ARCHITECTURE: OPTION 2 ACTIVE**: Any URL locale works, UI always uses course language
- ✅ **BUILD VERIFIED**: Zero errors, no TypeScript issues, production-ready
- ✅ **DOCUMENTATION COMPLETE**: Feature document, release notes, task list all updated
- ✅ **ALL BUGS FIXED**: No more mixed languages, hardcoded English, wrong translations, or URL locale changes
- **Status**: ✅ COMPLETE - Ready to resume Quiz Quality Enhancement work

**Lessons Seeded**:
1. Day 1: Introduction to Productivity
2. Day 2: Time Audit & Accountability
3. Day 3: Priority Alignment
4. Day 4: Capacity Planning
5. Day 5: Measurement & Metrics
6. Day 6: Daily Rituals
7. Day 7: Daily/Weekly Systems
8. Day 8: Context Switching Cost
9. Day 9: Delegation vs Elimination
10. Day 10: Energy Management
11. Day 11: Goal Setting & OKRs

**Related Files**:
- `scripts/seed-productivity-lesson-*.ts` - Individual lesson seed scripts
- `scripts/check-productivity-course.ts` - Course verification tool
- `i18n.ts` - Updated with all 11 target languages

---

## 📖 Documentation Reference

### Core Project Documents

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/TASKLIST.md` | Task List | Complete list of active tasks, completed work, and upcoming features. Updated daily during development. Contains priority-ordered tasks with status tracking. |
| `/docs/ROADMAP.md` | Roadmap | Strategic vision and future plans for the platform. Includes tech debt, upcoming milestones, and long-term goals. Updated when new features are planned. |
| `/docs/ARCHITECTURE.md` | Architecture | Complete system architecture documentation. Covers tech stack, data models, API structure, authentication flow, and component organization. Essential for understanding system design. |
| `/docs/RELEASE_NOTES.md` | Release Notes | Changelog of all completed work in reverse chronological order. Documents bug fixes, features, and improvements for each version. Updated with every release. |
| `/docs/LEARNINGS.md` | Learnings | Knowledge base of issues faced, solutions implemented, and best practices discovered. Categorized by topic (architecture, database, API, etc.). Prevents repeated mistakes. |
| `/docs/TECH_STACK.md` | Tech Stack | Complete list of all dependencies with versions. Frontend, backend, deployment, and development tools. Updated when dependencies change. |
| `/docs/STATUS.md` | Current Status | High-level project status summary. Current phase, completed work, and active initiatives. Quick reference for project state. |
| `/docs/PRODUCTION_STATUS.md` | Production Status | Production deployment status and known issues. Environment checks, database state, and deployment verification. Updated after deployments. |

### Setup & Deployment

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/ENVIRONMENT_SETUP.md` | Environment Setup | Complete guide for setting up development and production environments. Includes prerequisites, MongoDB setup, environment variables, and local development instructions. |
| `/docs/DEPLOYMENT.md` | Deployment Guide | Production deployment procedures for Vercel. Includes pre-deployment checklist, environment configuration, database seeding, cron jobs, and post-deployment verification. |
| `/docs/VERCEL_DEPLOYMENT.md` | Vercel Deployment | Specific Vercel deployment instructions. Domain configuration, environment variables, build settings, and troubleshooting. |
| `/docs/STRIPE_VERCEL_SETUP.md` | Stripe Vercel Setup | Stripe payment integration setup for Vercel. Webhook configuration, environment variables, and testing procedures. |

### Feature Documents (Date-Based Format)

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/2026-01-23_ADMIN_UI_IMPROVEMENTS.md` | Admin UI Improvements | Current active feature: Remove deprecated docs menu, add logout button, rename Players to Users, show actual user name. Includes implementation details and testing checklist. |
| `/docs/FEATURES_SINCE_F20C34A_COMPLETE_DOCUMENTATION.md` | Features Since f20c34a | Complete documentation of all features added since working commit f20c34a. Includes certification system, short courses, SSO problems, and comparison to working version. Reference for redevelopment. |

### SSO & Authentication

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/enable_sso.md` | Enable SSO | SSO integration setup guide. Environment variables, configuration steps, and verification procedures. |
| `/docs/SSO_IMPLEMENTATION_DETAILS.md` | SSO Implementation Details | Complete technical documentation of SSO integration. Token validation, role extraction, callback flow, and error handling. |
| `/docs/SSO_TROUBLESHOOTING.md` | SSO Troubleshooting | Common SSO issues and solutions. Empty page errors, redirect URI mismatches, nonce errors, and debugging steps. |
| `/docs/SSO_NONCE_FIX_INSTRUCTIONS.md` | SSO Nonce Fix | Specific fix for invalid_nonce errors. Root cause analysis, diagnostic steps, and solution implementation. |
| `/docs/SSO_CLIENT_SIDE_INSTRUCTIONS.md` | SSO Client Side | Client-side SSO integration guide. Expected flow, common issues, and security checklist. |
| `/docs/SSO_ENVIRONMENT_VARIABLES.md` | SSO Environment Variables | Complete list of SSO-related environment variables. Required vs optional, example values, and configuration notes. |

### Course & Content

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/certificate_dev_plan.md` | Certificate Development Plan | Certification system development plan. Final exam, certificate issuance, verification, and rendering. |
| `/docs/certification_final_exam_plan.md` | Certification Final Exam Plan | Detailed plan for final certification exam feature. Business rules, question pool, scoring, and certificate issuance. |
| `/docs/course_ideas/` | Course Ideas | Blueprints and plans for future courses. Includes GEO Shopify course, B2B sales, and other course concepts. |

### Development Guides

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/CONTRIBUTING.md` | Contributing Guide | Development workflow, coding standards, git conventions, and documentation requirements. Essential for maintaining code quality. |
| `/docs/NAMING_GUIDE.md` | Naming Guide | Comprehensive naming conventions for files, components, functions, and variables. Ensures consistency across codebase. |
| `/docs/DESIGN_UPDATE.md` | Design Update | Design system updates and UI guidelines. CTA yellow exclusivity rule, color tokens, and component styling standards. |

### Migration & Setup

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/I18N_SETUP.md` | i18n Setup | Internationalization setup guide. Locale configuration, translation structure, and language switching implementation. |
| `/docs/I18N_MIGRATION_SUMMARY.md` | i18n Migration Summary | Summary of internationalization migration. Changes made, files updated, and translation structure. |
| `/docs/MIGRATION_COMPLETE.md` | Migration Complete | Completion status of major migrations. Database migrations, code refactoring, and system updates. |

### Analysis & Planning

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/DASHBOARD_ANALYSIS_AND_PLAN.md` | Dashboard Analysis | Analysis of dashboard functionality and improvement plans. Current state, issues, and proposed enhancements. |
| `/docs/DEVELOPER_FEEDBACK_ANALYSIS.md` | Developer Feedback Analysis | Analysis of developer feedback and code review findings. Issues identified and solutions proposed. |
| `/docs/CODE_REVIEW_FINDINGS.md` | Code Review Findings | Findings from code reviews. Security issues, performance problems, and code quality improvements. |

### Historical & Reference

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/PHASE_1_COMPLETE.md` | Phase 1 Complete | Completion documentation for Phase 1 of development. Foundation work, data models, and initial setup. |
| `/docs/PHASE_2_3_COMPLETE.md` | Phase 2 & 3 Complete | Completion documentation for Phases 2 and 3. Course builder, admin tools, and email automation. |
| `/docs/TRANSFORMATION_PLAN.md` | Transformation Plan | Original plan for transforming from game platform to learning platform. Vision, milestones, and implementation strategy. |
| `/docs/NEXT_PHASES.md` | Next Phases | Planned future phases of development. Upcoming features, priorities, and timeline estimates. |

---

## 🧠 Important Knowledge

### Critical System State

**Current Version**: Restored to working baseline `f20c34a`  
**Last Known Working Commit**: `f20c34a` - "feat: surface certification state in catalog and course detail pages"  
**Status**: ✅ WORKING - System restored to stable baseline

### Authentication System (CRITICAL - DO NOT MODIFY)

**Working Configuration** (f20c34a):
- `app/api/auth/[...nextauth]/route.ts`: Simple export - `export const { GET, POST } = handlers;` (NO CORS wrapping)
- `next.config.ts`: Headers apply to ALL routes including `/api/` (source: '/:path*')
- `public/service-worker.js`: Version 2.0.0 with networkFirstStrategy for APIs (DO NOT disable)
- `auth.ts`: Complex JWT callback with database refresh on every request (DO NOT simplify)
- `middleware.ts`: Simple `export default auth((req) => { ... })` pattern (DO NOT restructure)
- `app/components/session-provider.tsx`: Simple wrapper, no extra props (DO NOT add basePath/refetchInterval)

**⚠️ CRITICAL WARNING**: All attempts to "improve" or "fix" these files broke the system. The working version is simple. Keep it simple.

### Documentation System Rules

1. **All feature documents** go in `/docs` folder
2. **Format**: `YYYY-MM-DD_FEATURE.md` (e.g., `2026-01-23_ADMIN_UI_IMPROVEMENTS.md`)
3. **Feature documents** must be referenced in TASKLIST.md, ROADMAP.md, RELEASE_NOTES.md
4. **Update immediately** after code changes - documentation = code
5. **No placeholders** - every document must reflect current state

### Tech Stack Constraints

- **Next.js**: 15.5.2 (App Router) - DO NOT upgrade without approval
- **Node.js**: >= 20.0.0 (LTS only)
- **MongoDB**: Atlas with Mongoose 8.18.0
- **No deprecated packages** - all dependencies must be security-audited
- **Build must be**: warning-free, error-free, deprecated-free

### Known Issues & Solutions

1. **CORS/Access Control Errors**: Root cause unknown. Working version (f20c34a) has no special handling. DO NOT add CORS wrappers to NextAuth route handler.

2. **SSO Nonce Errors**: Fixed in SSO server (not Amanoba code). If occurs, clear browser cache.

3. **Service Worker**: Version 2.0.0 works correctly. DO NOT disable fetch interception.

### Development Workflow

1. **Before starting**: Read relevant documentation, check TASKLIST.md
2. **During work**: Update feature document in `/docs` as you go
3. **Before commit**: Update TASKLIST.md, RELEASE_NOTES.md, ARCHITECTURE.md if needed
4. **After commit**: Verify build passes, no warnings/errors

### File Locations

- **All documentation**: `/docs/` folder
- **Feature documents**: `/docs/YYYY-MM-DD_FEATURE.md`
- **README**: Project root (`/README.md`)
- **Task list**: `/docs/TASKLIST.md`
- **Architecture**: `/docs/ARCHITECTURE.md`
- **Release notes**: `/docs/RELEASE_NOTES.md`

---

**Last Updated**: 2026-01-25  
**Current Work**: Google Analytics Consent Mode v2 & Course Progress Fix (✅ COMPLETE)
