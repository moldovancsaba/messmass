#!/usr/bin/env tsx
/**
 * Date Placeholder Guardrail
 * 
 * Checks for placeholder dates (e.g., 2025-01-XX, TBD, placeholder) in tracker and policy docs.
 * All dates must be ISO 8601 format with timezone, derived from git commit timestamps.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const FORBIDDEN_PATTERNS = [
  /2025-01-XX/i,
  /2025-XX-XX/i,
  /TBD/i,
  /placeholder.*date/i,
  /date.*placeholder/i,
  /\d{4}-\d{2}-XX/i, // Any year-month-XX pattern
];

const CHECKED_FILES = [
  'LAYOUT_GRAMMAR_PROGRESS_TRACKER.md',
  'LAYOUT_GRAMMAR_IMPLEMENTATION_PLAN.md',
  'UNIFIED_DESIGN_SYSTEM_MASTER_PLAN.md',
  'DESIGN_SYSTEM_PLAN.md',
];

const CHECKED_DIRS = [
  'docs/design',
  'docs/audits',
];

interface Violation {
  file: string;
  line: number;
  match: string;
}

function checkFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    FORBIDDEN_PATTERNS.forEach(pattern => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        violations.push({
          file: filePath,
          line: index + 1,
          match: match[0],
        });
      }
    });
  });

  return violations;
}

function main() {
  const violations: Violation[] = [];

  // Check specific files
  CHECKED_FILES.forEach(file => {
    try {
      violations.push(...checkFile(file));
    } catch (error) {
      // File might not exist, skip
    }
  });

  // Check directories
  CHECKED_DIRS.forEach(dir => {
    try {
      const entries = readdirSync(dir);
      entries.forEach(entry => {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isFile() && entry.endsWith('.md')) {
          violations.push(...checkFile(fullPath));
        }
      });
    } catch (error) {
      // Directory might not exist, skip
    }
  });

  if (violations.length > 0) {
    console.error('❌ Date Placeholder Guardrail: Found placeholder dates\n');
    violations.forEach(v => {
      console.error(`  ${v.file}:${v.line} - Found: ${v.match}`);
    });
    console.error(`\nTotal violations: ${violations.length}`);
    process.exit(1);
  } else {
    console.log('✅ Date Placeholder Guardrail: No placeholder dates found');
    process.exit(0);
  }
}

main();

