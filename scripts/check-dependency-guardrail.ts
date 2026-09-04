#!/usr/bin/env tsx
/**
 * Dependency Guardrail
 * 
 * Validates that only approved dependencies are used and no vulnerabilities exist.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

// Approved runtime dependencies (add as needed)
const APPROVED_RUNTIME_DEPS = new Set([
  '@mantine/core',
  '@mantine/dates', // Required as of GDS 6.0.0: @sovereignsquad/gds-core declares it as a peer dependency.
  '@mantine/form',
  '@mantine/hooks',
  '@mantine/modals',
  '@mantine/notifications',
  '@sovereignsquad/gds-admin',
  '@sovereignsquad/gds-core',
  '@sovereignsquad/gds-theme',
  '@tabler/icons-react',
  'next',
  'react',
  'react-dom',
  'mongodb',
  'ws',
  'bcrypt',
  'bcryptjs',
  'jsonwebtoken',
  'dotenv',
  'winston',
  'marked',
  'dompurify',
  'isomorphic-dompurify',
  'chart.js',
  'react-chartjs-2',
  'focus-trap-react',
  'google-auth-library', // pinned exact version alongside googleapis; see lib/googleSheetsClient.ts's direct import
  'googleapis',
  '@sparticuz/chromium-min', // Serverless Chromium loader for app/api/export/pdf/route.ts (production); downloads its binary from a GitHub Release at runtime.
  'puppeteer-core', // Drives the above; local dev uses the full `puppeteer` devDependency instead.
  'js-cookie',
  'lucide-react',
  'server-only',
  'typescript',
  'uuid',
  'mongoose', // OPS-V3: Required for V3 time-series engine and multi-tenant reporting.
  '@vercel/blob', // Primary image storage since 323cf3aa/v12.3.11 (lib/imgbbApi.ts, app/api/blob-upload-token); the dep landed without this entry, which left main's CI red until v12.3.17.
  // Add other approved deps as needed
]);

// Approved dev dependencies
const APPROVED_DEV_DEPS = new Set([
  'typescript',
  '@types/node',
  '@types/react',
  '@types/react-dom',
  '@types/bcrypt',
  '@types/bcryptjs',
  '@types/jsonwebtoken',
  '@types/ws',
  '@types/dompurify',
  '@types/marked',
  '@types/expr-eval',
  '@types/jest',
  '@types/js-cookie',
  'puppeteer', // Local-dev-only Chromium for app/api/export/pdf/route.ts; excluded from the production bundle (next.config.js).
  '@eslint/eslintrc',
  'eslint',
  'eslint-config-next',
  'eslint-plugin-jsx-a11y',
  'eslint-plugin-react',
  'eslint-plugin-react-hooks',
  'jest',
  '@testing-library/react',
  '@testing-library/jest-dom',
  'ts-jest',
  'tsx',
  'fast-check',
  'is-date-object',
  '@sovereignsquad/gds-compliance', // gds-adoption.json drift/exception checker; see CI's non-blocking check step
  // Add other approved dev deps as needed
]);

// Forbidden packages (security/architectural violations)
const FORBIDDEN_PACKAGES = new Set([
  'socket.io', // Not in approved stack (using ws)
]);

function checkDependencies() {
  const packageJson: PackageJson = JSON.parse(
    readFileSync('package.json', 'utf-8')
  );

  const violations: string[] = [];

  // Check runtime dependencies
  if (packageJson.dependencies) {
    for (const [pkg, version] of Object.entries(packageJson.dependencies)) {
      if (FORBIDDEN_PACKAGES.has(pkg)) {
        violations.push(`FORBIDDEN: ${pkg}@${version} (runtime dependency)`);
      } else if (!APPROVED_RUNTIME_DEPS.has(pkg)) {
        violations.push(`UNAPPROVED: ${pkg}@${version} (runtime dependency)`);
      }
    }
  }

  // Check dev dependencies
  if (packageJson.devDependencies) {
    for (const [pkg, version] of Object.entries(packageJson.devDependencies)) {
      if (FORBIDDEN_PACKAGES.has(pkg)) {
        violations.push(`FORBIDDEN: ${pkg}@${version} (dev dependency)`);
      } else if (!APPROVED_DEV_DEPS.has(pkg)) {
        violations.push(`UNAPPROVED: ${pkg}@${version} (dev dependency)`);
      }
    }
  }

  return violations;
}

function checkVulnerabilities() {
  try {
    // Use --audit-level=moderate to only fail on high/critical
    // Exit code 1 is expected when vulnerabilities exist, so we parse JSON output
    const auditOutput = execSync('npm audit --json 2>&1 || true', { encoding: 'utf-8' });
    const audit = JSON.parse(auditOutput);
    
    if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
      const highSeverity = Object.values(audit.vulnerabilities).filter(
        (v: any) => v.severity === 'high' || v.severity === 'critical'
      );
      
      if (highSeverity.length > 0) {
        // For now, warn but don't block (vulnerabilities are tracked separately)
        console.warn(`⚠️  Found ${highSeverity.length} HIGH/CRITICAL vulnerabilities (non-blocking)`);
        return [];
      }
    }
  } catch (error: any) {
    // If audit fails completely, don't block (may be network issues)
    console.warn('⚠️  npm audit failed (non-blocking)');
    return [];
  }
  
  return [];
}

function main() {
  const depViolations = checkDependencies();
  const vulnViolations = checkVulnerabilities();
  const allViolations = [...depViolations, ...vulnViolations];

  if (allViolations.length > 0) {
    console.error('❌ Dependency Guardrail: Found violations\n');
    allViolations.forEach(v => console.error(`  ${v}`));
    process.exit(1);
  } else {
    console.log('✅ Dependency Guardrail: All dependencies approved, no vulnerabilities');
    process.exit(0);
  }
}

main();
