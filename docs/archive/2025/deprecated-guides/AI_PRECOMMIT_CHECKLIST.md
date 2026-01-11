# AI Pre-Commit Checklist (MANDATORY)
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version:** 1.0.0  
**Created:** 2025-11-01T23:26:55Z  
**Enforcement:** STRICT - No exceptions

---

## ⚠️ CRITICAL RULE

**BEFORE ANY `git commit` COMMAND, AI MUST COMPLETE THIS CHECKLIST IN FULL.**

**Failure to complete checklist = COMMIT REJECTED**

---

## Pre-Commit Checklist (Execute in Order)

### ☑️ 1. Determine Version Bump Type

**Question:** What type of change did I make?

- **PATCH (x.x.N)** - Bug fixes, documentation only, config changes
- **MINOR (x.N.0)** - New features, new API endpoints, new UI components
- **MAJOR (N.0.0)** - Breaking changes, major refactors, schema changes

**Action:** Identify version bump type before proceeding.

---

### ☑️ 2. Update Version Number

**Files to update:**
1. `package.json` - Line 3: `"version": "X.Y.Z"`
2. All documentation files with version badges

**Command:**
```bash
# Update version in package.json
# Manually edit or use: npm version patch|minor|major --no-git-tag-version
```

**Verify:**
```bash
grep -r "\"version\":" package.json
```

---

### ☑️ 3. Update RELEASE_NOTES.md

**Required Structure:**
```markdown
## [vX.Y.Z] - YYYY-MM-DDTHH:MM:SS.sssZ

### Added
- Feature 1 description
- Feature 2 description

### Fixed
- Bug fix 1 description
- Bug fix 2 description

### Changed
- Change 1 description

### Technical Details
- File changes
- API endpoints affected
- Component updates
```

**Action:** Add entry at TOP of file with current changes.

---

### ☑️ 4. Update ARCHITECTURE.md

**Required Updates:**
- Add new components to component list
- Add new API endpoints to API section
- Update system diagrams if structure changed
- Document new dependencies

**Action:** Search for relevant sections and append/update.

---

### ☑️ 5. Update TASKLIST.md

**Required Actions:**
- Move completed tasks to "Completed" section
- Update task status and completion timestamp
- Add any new tasks discovered during implementation
- Remove tasks that are no longer relevant

**Action:** Update task statuses with ISO 8601 timestamps.

---

### ☑️ 6. Update LEARNINGS.md

**Required Entry:**
```markdown
## [vX.Y.Z] - YYYY-MM-DDTHH:MM:SS.sssZ

### Issue
Brief description of problem solved

### Solution
What was implemented

### Key Learning
What to remember for future

### Category
Dev / Design / Backend / Frontend / Process
```

**Action:** Add learning entry if any insights gained.

---

### ☑️ 7. Update ROADMAP.md

**Required Actions:**
- Remove completed features from roadmap
- Update progress on in-progress features
- Add any new tasks/features discovered
- Ensure roadmap reflects current project state

**Action:** Clean up completed items, add new future tasks.

---

### ☑️ 8. Update README.md (if applicable)

**Update if:**
- New major feature added
- Installation steps changed
- New environment variables required
- New scripts added to package.json

**Action:** Update relevant sections.

---

### ☑️ 9. Update WARP.md (if applicable)

**Update if:**
- New development commands added
- New API endpoints created
- New component patterns established
- New testing procedures required

**Action:** Update Quick Start Commands or relevant sections.

---

### ☑️ 10. Verify Build & Tests

**Required Commands:**
```bash
# Build verification
npm run build

# Type check
npm run type-check

# Lint check (if not auto-fixed)
npm run lint
```

**Action:** All must pass before commit.

---

### ☑️ 11. Stage All Changes

**Command:**
```bash
git add -A
```

**Verify:**
```bash
git status
```

**Action:** Ensure all documentation updates are staged.

---

### ☑️ 12. Create Commit Message

**Required Format:**
```
type: Brief summary (50 chars max)

- Detailed change 1
- Detailed change 2
- Detailed change 3

Files Changed:
- path/to/file1.ts: Description
- path/to/file2.md: Description

Version: X.Y.Z
Build: ✅ PASSED
Tests: ✅ PASSED (or N/A if no tests)
```

**Types:**
- `feat:` - New feature (MINOR bump)
- `fix:` - Bug fix (PATCH bump)
- `docs:` - Documentation only (PATCH bump)
- `refactor:` - Code restructuring (MINOR bump)
- `chore:` - Maintenance (PATCH bump)
- `breaking:` - Breaking change (MAJOR bump)

---

### ☑️ 13. Execute Commit

**Command:**
```bash
git commit -m "..."
```

**Action:** Commit with properly formatted message.

---

### ☑️ 14. Push to Remote

**Command:**
```bash
git push origin main
```

**Action:** Push changes to GitHub.

---

## Quick Reference Command Sequence

```bash
# 1. Determine version bump type (manual decision)

# 2. Update package.json version
# Edit manually or: npm version patch --no-git-tag-version

# 3-9. Update all documentation files
# Edit: RELEASE_NOTES.md, ARCHITECTURE.md, TASKLIST.md, 
#       LEARNINGS.md, ROADMAP.md, README.md (if needed)

# 10. Verify build
npm run build
npm run type-check

# 11. Stage everything
git add -A

# 12. Check status
git status

# 13. Commit with proper message
git commit -m "..."

# 14. Push
git push origin main
```

---

## Verification Checklist

Before executing `git commit`, verify:

- [ ] Version updated in package.json
- [ ] RELEASE_NOTES.md updated with new entry
- [ ] ARCHITECTURE.md updated (if applicable)
- [ ] TASKLIST.md updated with completed tasks
- [ ] LEARNINGS.md updated (if insights gained)
- [ ] ROADMAP.md cleaned up
- [ ] README.md updated (if needed)
- [ ] WARP.md updated (if needed)
- [ ] `npm run build` passed
- [ ] `npm run type-check` passed
- [ ] All files staged with `git add -A`
- [ ] Commit message properly formatted
- [ ] All timestamps in ISO 8601 format (YYYY-MM-DDTHH:MM:SS.sssZ)

---

## Enforcement

**This checklist is MANDATORY and NON-NEGOTIABLE.**

If AI skips any step:
1. User will reject commit
2. AI must create new commit with proper documentation
3. Version bump must be applied retroactively

**No shortcuts. No exceptions.**

---

## Example Execution Log

```
✅ Step 1: Determined MINOR version bump (new feature)
✅ Step 2: Updated package.json: 9.1.0 → 9.2.0
✅ Step 3: Added entry to RELEASE_NOTES.md
✅ Step 4: Updated ARCHITECTURE.md with new API endpoint
✅ Step 5: Updated TASKLIST.md (3 tasks completed)
✅ Step 6: Added learning to LEARNINGS.md
✅ Step 7: Updated ROADMAP.md (removed completed item)
✅ Step 8: README.md - No changes needed
✅ Step 9: Updated WARP.md with new endpoint
✅ Step 10: Build passed, type-check passed
✅ Step 11: All files staged
✅ Step 12: Commit message formatted
✅ Step 13: Committed successfully
✅ Step 14: Pushed to origin/main

CHECKLIST COMPLETE ✅
```

---

**Status:** ACTIVE  
**Applies to:** All AI development assistants  
**Override:** Not permitted
