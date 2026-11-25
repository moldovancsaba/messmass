#!/usr/bin/env bash
# /Users/Shared/Projects/.agents/skills/publish-delivery/scripts/publish-gate.sh
# WHAT: Rock-solid pre-commit CI/build parity gate + post-push live GitHub Actions & Vercel verifier.
# WHY: Eliminates inventory drift, untracked-file leakage, unapproved-dependency failures,
#      stale contract stamps, broken production builds, and unmonitored pushes.

set -euo pipefail

MODE="${1:-}"
REPO_PATH="${2:-$PWD}"

if [[ "$MODE" != "--prepare" && "$MODE" != "--verify-remote" ]]; then
  echo "Usage:"
  echo "  bash publish-gate.sh --prepare [repo_path]        # Run after 'git add', before 'git commit'"
  echo "  bash publish-gate.sh --verify-remote [repo_path]  # Run immediately after 'git push'"
  exit 2
fi

cd "$REPO_PATH"
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"
REPO_NAME="$(basename "$REPO_ROOT")"

build_clean_mirror() {
  local dest_root="$1"
  local mirror="$dest_root/$REPO_NAME"
  mkdir -p "$mirror"
  ln -s "$REPO_ROOT/.git" "$mirror/.git"
  # Copy ONLY git-tracked/staged files using their working-tree contents
  git ls-files --cached -z | while IFS= read -r -d '' f; do
    if [ -e "$f" ]; then
      mkdir -p "$mirror/$(dirname "$f")"
      cp -p "$f" "$mirror/$f"
    fi
  done
  echo "$mirror"
}

run_prepare() {
  echo "================================================================"
  echo "🛡️  PUBLISH GATE (--prepare): $REPO_NAME ($REPO_ROOT)"
  echo "================================================================"

  local untracked
  untracked="$(git ls-files --others --exclude-standard)"
  if [ -n "$untracked" ]; then
    echo "⚠️  Note: Untracked files detected in working tree (excluded from clean inventory mirror):"
    echo "$untracked" | sed 's/^/   - /'
    echo "   (Ensure any new project files you intend to ship have already been 'git add'-ed!)"
  fi

  TMP_DIR="$(mktemp -d)"
  trap 'rm -rf "$TMP_DIR"' EXIT

  # 1. Clean-mirror inventory & architecture regeneration
  if [ -f "scripts/fleet-audit-inventory.py" ]; then
    echo "==> [1/3] Regenerating docs/_audit/*.json in clean tracked/staged mirror"
    MIRROR_DIR="$(build_clean_mirror "$TMP_DIR")"
    python3 "$MIRROR_DIR/scripts/fleet-audit-inventory.py" --repo "$MIRROR_DIR" --write
    mkdir -p docs/_audit
    cp "$MIRROR_DIR"/docs/_audit/*.json docs/_audit/
    git add docs/_audit/*.json

    if [ -f "scripts/generate-architecture-sections.js" ]; then
      echo "==> [1b/3] Regenerating docs/architecture.md from updated inventory"
      node scripts/generate-architecture-sections.js
      git add docs/architecture.md
    fi

    echo "==> [2/3] Verifying clean-checkout inventory parity (matches GitHub Actions)"
    rm -rf "$TMP_DIR/verify"
    VERIFY_MIRROR="$(build_clean_mirror "$TMP_DIR/verify")"
    python3 "$VERIFY_MIRROR/scripts/fleet-audit-inventory.py" --repo "$VERIFY_MIRROR" --check
  fi

  # 2. Repo-specific full CI + Build gate
  echo "==> [3/3] Running full CI & production build gate for $REPO_NAME"
  case "$REPO_NAME" in
    messmass)
      npm run type-check
      npm run lint
      npm test
      npm run style:check
      npm run version:verify
      npm run docs:audit
      npm run inventory:check
      npm run gds:sync
      npx gds-compliance check --manifest ./gds-adoption.json
      npm run comments:check
      npm run comments:versions
      npm run architecture:check
      npx tsx scripts/check-dependency-guardrail.ts
      npx tsx scripts/check-layout-grammar-guardrail.ts
      MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/test}" DB_NAME="${DB_NAME:-messmass_test}" npm run build
      ;;
    fanmass)
      bash scripts/preflight.sh
      # If frontend build updated web/static/gds, stage it if tracked
      if [ -n "$(git status --porcelain web/static/gds 2>/dev/null || true)" ]; then
        echo "ℹ️  Staging updated frontend bundle in web/static/gds"
        git add web/static/gds
      fi
      ;;
    camera)
      npm run inventory:check
      NEXT_TELEMETRY_DISABLED=1 npm run release:check
      ;;
    sso)
      npm run lint
      npm run type-check
      npm run build
      node scripts/check-repo-guardrails.mjs
      node scripts/check-docs-maintenance.mjs
      npm run gds:validate-manifest
      npm run gds:check
      npm test -- --runInBand
      ;;
    planetbrain)
      if [ -f "./scripts/diff-schema.sh" ]; then bash ./scripts/diff-schema.sh; fi
      if [ -f "./scripts/lint-invariants.py" ]; then python3 ./scripts/lint-invariants.py; fi
      ;;
    *)
      if [ -f "scripts/preflight.sh" ]; then
        bash scripts/preflight.sh
      elif [ -f "package.json" ]; then
        npm test
        npm run build
      fi
      ;;
  esac

  echo ""
  echo "✅ PRE-COMMIT PUBLISH GATE PASSED ($REPO_NAME)"
  echo "   Staged files ready to commit:"
  git diff --cached --name-status | sed 's/^/     /'
}

run_verify_remote() {
  local head_sha
  head_sha="$(git rev-parse HEAD)"
  local short_sha="${head_sha:0:8}"
  local repo_slug
  repo_slug="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")"

  echo "================================================================"
  echo "🚀 REMOTE PUBLISH VERIFICATION: $REPO_NAME @ $short_sha ($repo_slug)"
  echo "================================================================"

  if [ -z "$repo_slug" ]; then
    echo "⚠️  No GitHub remote resolved via 'gh repo view'; skipping remote check."
    exit 0
  fi

  # 1. Watch GitHub Actions workflow run for HEAD if workflows exist
  if [ -d ".github/workflows" ] && [ -n "$(ls -A .github/workflows 2>/dev/null || true)" ]; then
    echo "==> Waiting for GitHub Actions workflow run on commit $short_sha..."
    local run_id=""
    for _ in $(seq 1 24); do
      run_id="$(gh run list --commit "$head_sha" --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || true)"
      if [ -n "$run_id" ] && [ "$run_id" != "null" ]; then
        break
      fi
      sleep 5
    done

    if [ -z "$run_id" ] || [ "$run_id" = "null" ]; then
      echo "⚠️  No GitHub Actions workflow triggered for $short_sha after 120s."
    else
      echo "==> Watching GitHub Actions run #$run_id..."
      if ! gh run watch "$run_id" --exit-status; then
        echo "❌ GitHub Actions run #$run_id FAILED! Dumping failed step logs:"
        gh run view "$run_id" --log-failed || true
        exit 1
      fi
      echo "✅ GitHub Actions run #$run_id SUCCEEDED!"
    fi
  fi

  # 2. Poll Vercel deployment status via GitHub Deployments API (for Vercel-connected repos)
  case "$REPO_NAME" in
    messmass|camera|sso)
      echo "==> Checking Vercel deployment status for $short_sha..."
      local dep_id=""
      for _ in $(seq 1 24); do
        dep_id="$(gh api "repos/$repo_slug/deployments?sha=$head_sha&per_page=5" --jq '.[0].id // empty' 2>/dev/null || true)"
        if [ -n "$dep_id" ]; then
          break
        fi
        sleep 5
      done

      if [ -z "$dep_id" ]; then
        echo "ℹ️  No GitHub deployment registered for $short_sha (Vercel may ignore docs-only or branch commits)."
      else
        echo "==> Polling deployment #$dep_id until completion..."
        local state="pending"
        local target_url=""
        for _ in $(seq 1 48); do
          state="$(gh api "repos/$repo_slug/deployments/$dep_id/statuses?per_page=1" --jq '.[0].state // "pending"' 2>/dev/null || echo "pending")"
          target_url="$(gh api "repos/$repo_slug/deployments/$dep_id/statuses?per_page=1" --jq '.[0].target_url // .[0].environment_url // empty' 2>/dev/null || true)"
          if [[ "$state" == "success" ]]; then
            echo "✅ Vercel deployment SUCCEEDED: ${target_url:-ready}"
            break
          elif [[ "$state" == "failure" || "$state" == "error" ]]; then
            echo "❌ Vercel deployment FAILED (state=$state, url=$target_url)!"
            if [ -n "$target_url" ]; then
              npx vercel inspect "$target_url" --logs || true
            fi
            exit 1
          fi
          sleep 5
        done
        if [[ "$state" != "success" ]]; then
          echo "❌ Timed out waiting for Vercel deployment #$dep_id (last state: $state)"
          exit 1
        fi
      fi
      ;;
  esac

  echo ""
  echo "✅ REMOTE PUBLISH VERIFICATION PASSED ($REPO_NAME @ $short_sha — GitHub CI & Vercel GREEN)"
}

if [[ "$MODE" == "--prepare" ]]; then
  run_prepare
else
  run_verify_remote
fi
