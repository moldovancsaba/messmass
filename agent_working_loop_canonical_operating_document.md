# MESSMASS

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

**Active Work**:

**Status**: 

**Priority**:

**Current Progress**:

**Related Files**:

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
| | | |


### SSO & Authentication

| Location | Document Name | Summary |
|----------|---------------|---------|
| | | |

### Content

| Location | Document Name | Summary |
|----------|---------------|---------|
| | | |

### Development Guides

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/CONTRIBUTING.md` | Contributing Guide | Development workflow, coding standards, git conventions, and documentation requirements. Essential for maintaining code quality. |
| `/docs/NAMING_GUIDE.md` | Naming Guide | Comprehensive naming conventions for files, components, functions, and variables. Ensures consistency across codebase. |
| `/docs/DESIGN_UPDATE.md` | Design Update | Design system updates and UI guidelines. CTA yellow exclusivity rule, color tokens, and component styling standards. |

### Setup

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/I18N_SETUP.md` | i18n Setup | Internationalization setup guide. Locale configuration, translation structure, and language switching implementation. |

### Analysis & Planning

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/DASHBOARD_ANALYSIS_AND_PLAN.md` | Dashboard Analysis | Analysis of dashboard functionality and improvement plans. Current state, issues, and proposed enhancements. |
| `/docs/DEVELOPER_FEEDBACK_ANALYSIS.md` | Developer Feedback Analysis | Analysis of developer feedback and code review findings. Issues identified and solutions proposed. |
| `/docs/CODE_REVIEW_FINDINGS.md` | Code Review Findings | Findings from code reviews. Security issues, performance problems, and code quality improvements. |

### Historical & Reference

| Location | Document Name | Summary |
|----------|---------------|---------|
| `/docs/NEXT_PHASES.md` | Next Phases | Planned future phases of development. Upcoming features, priorities, and timeline estimates. |


---

## 🧠 Important Knowledge

### Critical System State

**Current Version**:
  
**Last Known Working Commit**: 

**Status**:


### Authentication System 

**⚠️ CRITICAL WARNING**: All attempts to "improve" or "fix" these files broke the system. The working version is simple. Keep it simple.

### Documentation System Rules

1. **All feature documents** go in `/docs` folder
2. **Format**: `YYYY-MM-DD_FEATURE.md` (e.g., `2026-01-23_ADMIN_UI_IMPROVEMENTS.md`)
3. **Feature documents** must be referenced in TASKLIST.md, ROADMAP.md, RELEASE_NOTES.md
4. **Update immediately** after code changes - documentation = code
5. **No placeholders** - every document must reflect current state

### Tech Stack Constraints


### Known Issues & Solutions


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

**Last Updated**:

**Current Work**: 