#!/usr/bin/env tsx
/**
 * WHAT: Dependency Guardrail - Approved Stack Only
 * WHY: Prevent introduction of unapproved dependencies that violate stack discipline
 * HOW: Compare package.json dependencies against approved whitelist, fail build if violations found
 * 
 * Approved Stack (from README.md, ARCHITECTURE.md, and CODING_STANDARDS.md):
 * - Next.js 15.x
 * - React 18.x
 * - TypeScript 5.x
 * - MongoDB 6.x
 * - Socket.io (ws) 8.x
 * - Chart.js 4.x
 * - Vercel (hosting)
 * - GitHub (version control)
 * 
 * Security Requirements:
 * - All dependencies must be security-audited (0 vulnerabilities)
 * - No deprecated libraries
 * - No abandoned packages
 * - LTS versions only
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface ApprovedDependency {
  name: string;
  allowedVersions?: string[]; // e.g., ['15.x', '15.5.x'] or exact version
  category: 'core' | 'ui' | 'data' | 'dev' | 'infrastructure';
  required: boolean;
}

/**
 * Approved runtime dependencies (dependencies, not devDependencies)
 * Based on README.md, ARCHITECTURE.md, and CODING_STANDARDS.md
 */
const APPROVED_RUNTIME_DEPENDENCIES: ApprovedDependency[] = [
  // Core Framework
  { name: 'next', allowedVersions: ['15.x'], category: 'core', required: true },
  { name: 'react', allowedVersions: ['18.x'], category: 'core', required: true },
  { name: 'react-dom', allowedVersions: ['18.x'], category: 'core', required: true },
  { name: 'typescript', allowedVersions: ['5.x'], category: 'core', required: true },
  
  // Database
  { name: 'mongodb', allowedVersions: ['6.x'], category: 'data', required: true },
  
  // Real-time Communication
  { name: 'ws', allowedVersions: ['8.x'], category: 'core', required: true },
  
  // UI & Charts
  { name: 'chart.js', allowedVersions: ['4.x'], category: 'ui', required: false },
  { name: 'react-chartjs-2', allowedVersions: ['5.x'], category: 'ui', required: false },
  
  // Utilities
  { name: 'dotenv', category: 'core', required: false },
  { name: 'js-cookie', category: 'core', required: false },
  { name: 'uuid', category: 'core', required: false },
  { name: 'server-only', category: 'core', required: false },
  
  // Security & Auth
  { name: 'bcryptjs', category: 'core', required: false },
  { name: 'jsonwebtoken', category: 'core', required: false },
  { name: 'dompurify', category: 'core', required: false },
  { name: 'jsdom', category: 'dev', required: false }, // Used server-side for DOMPurify
  
  // Markdown & HTML
  { name: 'marked', category: 'ui', required: false },
  
  // Formula Evaluation (Security: replaced Function() constructor)
  { name: 'expr-eval', category: 'core', required: false },
  
  // Export & PDF
  { name: 'html2canvas', category: 'ui', required: false },
  { name: 'jspdf', category: 'ui', required: false },
  
  // External APIs
  { name: 'googleapis', category: 'data', required: false },
  { name: 'nodemailer', category: 'core', required: false },
  
  // UI Components
  { name: 'lucide-react', category: 'ui', required: false },
  { name: 'focus-trap-react', category: 'ui', required: false },
  
  // Type Definitions (allowed in dependencies if needed at runtime)
  { name: '@types/nodemailer', category: 'dev', required: false },
  { name: '@types/bcryptjs', category: 'dev', required: false },
  { name: '@types/dompurify', category: 'dev', required: false },
  { name: '@types/expr-eval', category: 'dev', required: false },
  { name: '@types/html2canvas', category: 'dev', required: false },
  { name: '@types/js-cookie', category: 'dev', required: false },
  { name: '@types/jsonwebtoken', category: 'dev', required: false },
  { name: '@types/uuid', category: 'dev', required: false },
  { name: '@types/ws', category: 'dev', required: false },
];

/**
 * Approved dev dependencies (devDependencies)
 * These are allowed but should be minimal
 */
const APPROVED_DEV_DEPENDENCIES: ApprovedDependency[] = [
  // Type Definitions
  { name: '@types/node', category: 'dev', required: true },
  { name: '@types/react', category: 'dev', required: true },
  { name: '@types/react-dom', category: 'dev', required: true },
  { name: '@types/jest', category: 'dev', required: false },
  
  // Linting & Formatting
  { name: 'eslint', category: 'dev', required: true },
  { name: 'eslint-config-next', category: 'dev', required: true },
  { name: 'eslint-plugin-jsx-a11y', category: 'dev', required: false },
  { name: 'eslint-plugin-react', category: 'dev', required: false },
  { name: 'eslint-plugin-react-hooks', category: 'dev', required: false },
  { name: '@eslint/eslintrc', category: 'dev', required: false },
  
  // Testing (existing Next.js/Node toolchain only)
  { name: 'jest', category: 'dev', required: false },
  { name: 'ts-jest', category: 'dev', required: false },
  { name: '@testing-library/jest-dom', category: 'dev', required: false },
  { name: '@testing-library/react', category: 'dev', required: false },
  { name: 'fast-check', category: 'dev', required: false },
  { name: 'is-date-object', category: 'dev', required: false },
  
  // Build Tools
  { name: 'tsx', category: 'dev', required: true }, // Used for scripts
];

/**
 * Explicitly forbidden packages (security, deprecated, or architectural violations)
 */
const FORBIDDEN_PACKAGES: string[] = [
  // Security risks
  'eval',
  'vm',
  'child_process',
  
  // Deprecated or abandoned
  'request', // Deprecated
  'node-fetch@2', // Deprecated (v3+ is ESM only, not compatible)
  
  // Framework replacements (not allowed)
  'remix',
  'svelte',
  'vue',
  'angular',
  
  // UI libraries (we use custom components)
  'tailwindcss',
  'bootstrap',
  'material-ui',
  '@mui/material',
  'antd',
  'chakra-ui',
  
  // State management (not needed with Next.js)
  'redux',
  'mobx',
  'zustand',
  'jotai',
  
  // Test frameworks (we use Jest only)
  'mocha',
  'chai',
  'vitest',
  'playwright',
  'cypress',
  'puppeteer',
  
  // Build tools (Next.js handles this)
  'webpack',
  'vite',
  'rollup',
  'parcel',
  
  // Database alternatives (MongoDB only)
  'mysql',
  'postgres',
  'sqlite',
  'prisma',
  'sequelize',
  'typeorm',
  
  // Auth libraries (we use custom session-based auth)
  'next-auth',
  'passport',
  'auth0',
  'firebase-auth',
];

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface Violation {
  packageName: string;
  reason: 'forbidden' | 'unapproved' | 'version_mismatch';
  category: 'dependencies' | 'devDependencies';
  message: string;
}

/**
 * Check if a version matches allowed versions
 */
function matchesVersion(version: string, allowedVersions?: string[]): boolean {
  if (!allowedVersions || allowedVersions.length === 0) {
    return true; // No version constraint
  }
  
  // Remove ^, ~, >=, <=, >, < prefixes
  const cleanVersion = version.replace(/^[\^~><=]+/, '');
  
  for (const allowed of allowedVersions) {
    if (allowed.endsWith('.x')) {
      // e.g., '15.x' matches '15.5.4'
      const major = allowed.split('.')[0];
      if (cleanVersion.startsWith(`${major}.`)) {
        return true;
      }
    } else if (allowed.includes('.x')) {
      // e.g., '15.5.x' matches '15.5.4'
      const prefix = allowed.replace('.x', '');
      if (cleanVersion.startsWith(prefix)) {
        return true;
      }
    } else if (cleanVersion === allowed) {
      // Exact match
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a package is approved
 */
function isApproved(
  packageName: string,
  version: string,
  isDev: boolean
): { approved: boolean; reason?: string; allowedVersions?: string[] } {
  // Check forbidden list first
  if (FORBIDDEN_PACKAGES.some(forbidden => packageName === forbidden || packageName.startsWith(`${forbidden}/`))) {
    return { approved: false, reason: 'Package is explicitly forbidden' };
  }
  
  // Check approved list
  const approvedList = isDev ? APPROVED_DEV_DEPENDENCIES : APPROVED_RUNTIME_DEPENDENCIES;
  const approved = approvedList.find(pkg => pkg.name === packageName);
  
  if (!approved) {
    return { approved: false, reason: 'Package is not in approved whitelist' };
  }
  
  // Check version if specified
  if (approved.allowedVersions && !matchesVersion(version, approved.allowedVersions)) {
    return {
      approved: false,
      reason: `Version ${version} does not match allowed versions: ${approved.allowedVersions.join(', ')}`,
      allowedVersions: approved.allowedVersions,
    };
  }
  
  return { approved: true };
}

/**
 * Main guardrail function
 */
function checkDependencyGuardrail(): { violations: Violation[]; passed: boolean } {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
  const packageJson: PackageJson = JSON.parse(packageJsonContent);
  
  const violations: Violation[] = [];
  
  // Check runtime dependencies
  if (packageJson.dependencies) {
    for (const [packageName, version] of Object.entries(packageJson.dependencies)) {
      const check = isApproved(packageName, version, false);
      if (!check.approved) {
        violations.push({
          packageName,
          reason: check.reason === 'Package is explicitly forbidden' ? 'forbidden' : 
                  check.allowedVersions ? 'version_mismatch' : 'unapproved',
          category: 'dependencies',
          message: check.reason || 'Package is not approved',
        });
      }
    }
  }
  
  // Check dev dependencies
  if (packageJson.devDependencies) {
    for (const [packageName, version] of Object.entries(packageJson.devDependencies)) {
      const check = isApproved(packageName, version, true);
      if (!check.approved) {
        violations.push({
          packageName,
          reason: check.reason === 'Package is explicitly forbidden' ? 'forbidden' : 
                  check.allowedVersions ? 'version_mismatch' : 'unapproved',
          category: 'devDependencies',
          message: check.reason || 'Package is not approved',
        });
      }
    }
  }
  
  return {
    violations,
    passed: violations.length === 0,
  };
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Checking dependency guardrail...\n');
  
  const result = checkDependencyGuardrail();
  
  if (result.passed) {
    console.log('✅ All dependencies are approved!\n');
    process.exit(0);
  } else {
    console.error(`❌ Found ${result.violations.length} dependency violation(s):\n`);
    
    // Group by reason
    const forbidden = result.violations.filter(v => v.reason === 'forbidden');
    const unapproved = result.violations.filter(v => v.reason === 'unapproved');
    const versionMismatch = result.violations.filter(v => v.reason === 'version_mismatch');
    
    if (forbidden.length > 0) {
      console.error('🚫 FORBIDDEN PACKAGES (security/architectural violation):');
      forbidden.forEach(v => {
        console.error(`  - ${v.packageName} (${v.category})`);
        console.error(`    Reason: ${v.message}`);
      });
      console.error('');
    }
    
    if (unapproved.length > 0) {
      console.error('⚠️  UNAPPROVED PACKAGES (not in whitelist):');
      unapproved.forEach(v => {
        console.error(`  - ${v.packageName} (${v.category})`);
        console.error(`    Reason: ${v.message}`);
      });
      console.error('');
    }
    
    if (versionMismatch.length > 0) {
      console.error('📌 VERSION MISMATCH (wrong version range):');
      versionMismatch.forEach(v => {
        console.error(`  - ${v.packageName} (${v.category})`);
        console.error(`    Reason: ${v.message}`);
      });
      console.error('');
    }
    
    console.error('💡 To fix:');
    console.error('  1. Remove forbidden packages');
    console.error('  2. Request approval for unapproved packages from Sultan');
    console.error('  3. Update version to match approved range');
    console.error('\n📖 See docs/design/DEPENDENCY_GUARDRAIL.md for approved stack documentation.\n');
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { checkDependencyGuardrail, APPROVED_RUNTIME_DEPENDENCIES, APPROVED_DEV_DEPENDENCIES, FORBIDDEN_PACKAGES };

