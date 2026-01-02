#!/usr/bin/env tsx
/**
 * Layout Grammar Guardrail
 * 
 * Checks for forbidden CSS patterns that violate the Layout Grammar policy:
 * - overflow: auto, scroll, hidden (on content layers)
 * - text-overflow: ellipsis
 * - -webkit-line-clamp
 * 
 * These patterns are forbidden because they allow scrolling/truncation,
 * which violates the "no scroll, no truncation" policy.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const FORBIDDEN_PATTERNS = [
  // Overflow patterns (forbidden on content layers)
  { pattern: /overflow\s*:\s*(auto|scroll|hidden)/g, name: 'overflow: auto/scroll/hidden' },
  { pattern: /overflow-x\s*:\s*(auto|scroll|hidden)/g, name: 'overflow-x: auto/scroll/hidden' },
  { pattern: /overflow-y\s*:\s*(auto|scroll|hidden)/g, name: 'overflow-y: auto/scroll/hidden' },
  // Truncation patterns
  { pattern: /text-overflow\s*:\s*ellipsis/g, name: 'text-overflow: ellipsis' },
  { pattern: /-webkit-line-clamp/g, name: '-webkit-line-clamp' },
];

const ALLOWED_COMMENTS = [
  'decorative clipping',
  'mask wrapper',
  'explicit comment',
];

interface Violation {
  file: string;
  line: number;
  pattern: string;
  match: string;
}

function checkFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comment lines (single-line comments)
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
      return;
    }
    
    // Skip lines with allowed comments
    const hasAllowedComment = ALLOWED_COMMENTS.some(comment => 
      line.toLowerCase().includes(comment.toLowerCase())
    );
    if (hasAllowedComment) return;

    FORBIDDEN_PATTERNS.forEach(({ pattern, name }) => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        violations.push({
          file: filePath,
          line: index + 1,
          pattern: name,
          match: match[0],
        });
      }
    });
  });

  return violations;
}

function scanDirectory(dir: string, extensions: string[] = ['.css', '.tsx', '.ts']): Violation[] {
  const violations: Violation[] = [];
  const entries = readdirSync(dir);

  // Layout Grammar scope: only report rendering files
  const LAYOUT_GRAMMAR_SCOPE = [
    'app/report',
    'components/charts',
    'components/CellWrapper',
  ];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, and other build/dependency directories
      if (['node_modules', '.next', 'out', '.git', 'dist', 'build', 'scripts', '__tests__'].includes(entry)) {
        continue;
      }
      // Only check Layout Grammar scope files
      const inScope = LAYOUT_GRAMMAR_SCOPE.some(scope => fullPath.includes(scope));
      if (!inScope) {
        continue;
      }
      violations.push(...scanDirectory(fullPath, extensions));
    } else if (stat.isFile()) {
      // Only check Layout Grammar scope files
      const inScope = LAYOUT_GRAMMAR_SCOPE.some(scope => fullPath.includes(scope));
      if (!inScope) {
        continue;
      }
      // Skip guardrail script itself
      if (fullPath.includes('check-layout-grammar-guardrail.ts')) {
        continue;
      }
      const ext = entry.substring(entry.lastIndexOf('.'));
      if (extensions.includes(ext)) {
        violations.push(...checkFile(fullPath));
      }
    }
  }

  return violations;
}

function main() {
  const violations = scanDirectory(process.cwd());

  if (violations.length > 0) {
    console.error('❌ Layout Grammar Guardrail: Found forbidden CSS patterns\n');
    violations.forEach(v => {
      console.error(`  ${v.file}:${v.line} - ${v.pattern}`);
      console.error(`    Found: ${v.match}`);
    });
    console.error(`\nTotal violations: ${violations.length}`);
    process.exit(1);
  } else {
    console.log('✅ Layout Grammar Guardrail: No violations found');
    process.exit(0);
  }
}

main();

