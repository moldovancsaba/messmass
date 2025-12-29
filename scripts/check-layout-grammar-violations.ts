#!/usr/bin/env tsx
// scripts/check-layout-grammar-violations.ts
// WHAT: CI guardrail to prevent scroll/truncation/clipping violations
// WHY: Prevent "temporary" fixes that violate the Structural Fit Policy
// HOW: Scan CSS and TSX files for forbidden patterns, fail CI if found
// SECURITY: Phase 0 Task 0.7 - CI Guardrail

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

/**
 * WHAT: Forbidden patterns that violate the Structural Fit Policy
 * WHY: These patterns are explicitly prohibited by Section 0 of the design system
 */
const FORBIDDEN_PATTERNS = [
  // Scrolling patterns
  {
    pattern: /overflow\s*:\s*(auto|scroll)/gi,
    description: 'overflow: auto or overflow: scroll',
    message: 'Scrolling is prohibited. Content must fit by structural change or height increase.',
  },
  {
    pattern: /overflow-x\s*:/gi,
    description: 'overflow-x',
    message: 'Horizontal scrolling is prohibited.',
  },
  {
    pattern: /overflow-y\s*:/gi,
    description: 'overflow-y',
    message: 'Vertical scrolling is prohibited.',
  },
  // Truncation patterns
  {
    pattern: /text-overflow\s*:\s*ellipsis/gi,
    description: 'text-overflow: ellipsis',
    message: 'Text truncation (ellipsis) is prohibited. Content must fit fully or structure must adapt.',
  },
  {
    pattern: /line-clamp/gi,
    description: 'line-clamp or -webkit-line-clamp',
    message: 'Line clamping is prohibited. Content must fit fully or structure must adapt.',
  },
  {
    pattern: /-webkit-line-clamp/gi,
    description: '-webkit-line-clamp',
    message: 'Line clamping is prohibited. Content must fit fully or structure must adapt.',
  },
  // Clipping patterns (content layers only - decorative layers allowed)
  {
    pattern: /overflow\s*:\s*hidden/gi,
    description: 'overflow: hidden',
    message: 'overflow: hidden on content layers is prohibited. Allowed only on decorative/mask layers with explicit comment.',
    // Note: We'll check for explicit comments that allow this
  },
];

/**
 * WHAT: Whitelist entries for decorative-only clipping
 * WHY: Some overflow: hidden is allowed on decorative layers (masks, decorative elements)
 * HOW: Must have explicit comment: ALLOWED: decorative-only
 */
const DECORATIVE_CLIPPING_COMMENT = /\/\*\s*ALLOWED:\s*decorative-only\s*\*\//i;

/**
 * WHAT: Directories to scan
 * WHY: Focus on report rendering code where layout grammar applies
 */
const SCAN_DIRECTORIES = [
  'app/report',
  'components/charts',
  'app/report/[slug]',
];

/**
 * WHAT: File extensions to check
 * WHY: CSS and TSX files contain layout code
 */
const SCAN_EXTENSIONS = ['.css', '.tsx', '.ts'];

/**
 * WHAT: Files/directories to exclude
 * WHY: Skip node_modules, build outputs, etc.
 */
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /out/,
  /\.git/,
  /dist/,
  /build/,
];

interface Violation {
  file: string;
  line: number;
  pattern: string;
  description: string;
  message: string;
  code: string;
}

/**
 * WHAT: Check if file should be excluded
 * WHY: Skip build outputs and dependencies
 */
function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * WHAT: Recursively find all files to scan
 * WHY: Check all relevant files in the codebase
 */
function findFiles(dir: string, fileList: string[] = []): string[] {
  try {
    const files = readdirSync(dir);
    
    files.forEach(file => {
      const filePath = join(dir, file);
      
      if (shouldExclude(filePath)) {
        return;
      }
      
      const stat = statSync(filePath);
      
      if (stat.isDirectory()) {
        findFiles(filePath, fileList);
      } else if (SCAN_EXTENSIONS.includes(extname(filePath))) {
        fileList.push(filePath);
      }
    });
  } catch (error) {
    // Skip directories that don't exist or can't be read
  }
  
  return fileList;
}

/**
 * WHAT: Check file for forbidden patterns
 * WHY: Detect violations of the Structural Fit Policy
 */
function checkFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      FORBIDDEN_PATTERNS.forEach(({ pattern, description, message }) => {
        // WHAT: Check for overflow: hidden with special handling
        // WHY: overflow: hidden is allowed on decorative layers with explicit comment
        if (description === 'overflow: hidden') {
          const match = pattern.exec(line);
          if (match) {
            // WHAT: Check if there's an allowed comment nearby
            // WHY: Decorative clipping is allowed with explicit comment
            const lineNumber = index + 1;
            const nearbyLines = [
              lines[index - 1] || '', // Previous line
              line, // Current line
              lines[index + 1] || '', // Next line
            ].join('\n');
            
            if (!DECORATIVE_CLIPPING_COMMENT.test(nearbyLines)) {
              violations.push({
                file: filePath,
                line: lineNumber,
                pattern: match[0],
                description,
                message,
                code: line.trim(),
              });
            }
          }
        } else {
          // WHAT: Check other patterns normally
          const match = pattern.exec(line);
          if (match) {
            violations.push({
              file: filePath,
              line: index + 1,
              pattern: match[0],
              description,
              message,
              code: line.trim(),
            });
          }
        }
      });
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }
  
  return violations;
}

/**
 * WHAT: Main function to run the guardrail
 * WHY: Scan all files and report violations
 */
function main() {
  console.log('🔍 Scanning for Layout Grammar violations...\n');
  
  const allFiles: string[] = [];
  
  // WHAT: Find all files in scan directories
  SCAN_DIRECTORIES.forEach(dir => {
    try {
      const files = findFiles(dir);
      allFiles.push(...files);
    } catch (error) {
      // Directory might not exist, skip
    }
  });
  
  console.log(`📁 Found ${allFiles.length} files to scan\n`);
  
  const allViolations: Violation[] = [];
  
  // WHAT: Check each file
  allFiles.forEach(file => {
    const violations = checkFile(file);
    if (violations.length > 0) {
      allViolations.push(...violations);
    }
  });
  
  // WHAT: Report results
  if (allViolations.length === 0) {
    console.log('✅ No Layout Grammar violations found!\n');
    process.exit(0);
  }
  
  console.error(`❌ Found ${allViolations.length} Layout Grammar violation(s):\n`);
  
  // WHAT: Group violations by file for better readability
  const violationsByFile = new Map<string, Violation[]>();
  allViolations.forEach(v => {
    if (!violationsByFile.has(v.file)) {
      violationsByFile.set(v.file, []);
    }
    violationsByFile.get(v.file)!.push(v);
  });
  
  violationsByFile.forEach((violations, file) => {
    console.error(`📄 ${file}:`);
    violations.forEach(v => {
      console.error(`  Line ${v.line}: ${v.description}`);
      console.error(`  ❌ ${v.message}`);
      console.error(`  Code: ${v.code}`);
      console.error('');
    });
  });
  
  console.error('\n💡 How to fix:');
  console.error('  1. Remove the forbidden pattern');
  console.error('  2. Use structural change (height increase, block split) instead');
  console.error('  3. For decorative-only clipping, add comment: /* ALLOWED: decorative-only */');
  console.error('\n📖 See: DESIGN_SYSTEM_PLAN.md Section 0 (Structural Fit & Typography Enforcement Policy)\n');
  
  process.exit(1);
}

// WHAT: Run the guardrail
main();

