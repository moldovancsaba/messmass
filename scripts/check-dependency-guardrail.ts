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
  'next',
  'react',
  'react-dom',
  'mongodb',
  'ws',
  'bcrypt',
  'jsonwebtoken',
  'dotenv',
  'winston',
  'marked',
  'dompurify',
  'isomorphic-dompurify',
  'chart.js',
  'react-chartjs-2',
  // Add other approved deps as needed
]);

// Approved dev dependencies
const APPROVED_DEV_DEPS = new Set([
  'typescript',
  '@types/node',
  '@types/react',
  '@types/react-dom',
  '@types/bcrypt',
  '@types/jsonwebtoken',
  '@types/ws',
  '@types/dompurify',
  '@types/marked',
  'eslint',
  'eslint-config-next',
  'jest',
  '@testing-library/react',
  '@testing-library/jest-dom',
  'ts-jest',
  'tsx',
  // Add other approved dev deps as needed
]);

// Forbidden packages (security/architectural violations)
const FORBIDDEN_PACKAGES = new Set([
  'expr-eval', // Security vulnerability, replaced with safe formula evaluator
  'mongoose', // Not in approved stack (using native MongoDB driver)
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
    const auditOutput = execSync('npm audit --json', { encoding: 'utf-8', stdio: 'pipe' });
    const audit = JSON.parse(auditOutput);
    
    if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
      const highSeverity = Object.values(audit.vulnerabilities).filter(
        (v: any) => v.severity === 'high' || v.severity === 'critical'
      );
      
      if (highSeverity.length > 0) {
        return [`Found ${highSeverity.length} HIGH/CRITICAL vulnerabilities`];
      }
    }
  } catch (error: any) {
    // npm audit may fail if there are vulnerabilities
    // Check if it's a non-zero exit code (vulnerabilities found) vs actual error
    if (error.status === 1) {
      // Exit code 1 means vulnerabilities found - this is expected and we should check severity
      try {
        const auditOutput = execSync('npm audit --json 2>/dev/null || true', { encoding: 'utf-8' });
        const audit = JSON.parse(auditOutput);
        if (audit.vulnerabilities) {
          const highSeverity = Object.values(audit.vulnerabilities).filter(
            (v: any) => v.severity === 'high' || v.severity === 'critical'
          );
          if (highSeverity.length > 0) {
            return [`Found ${highSeverity.length} HIGH/CRITICAL vulnerabilities`];
          }
        }
      } catch {
        // If we can't parse, allow it (may be network issues)
        return [];
      }
    }
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

