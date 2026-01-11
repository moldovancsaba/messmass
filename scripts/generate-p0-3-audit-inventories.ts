#!/usr/bin/env ts-node

/**
 * Script to generate P0 3.1 (Hardcoded Values) and P0 3.2 (Inline Styles) audit inventories
 * 
 * Usage:
 *   ts-node scripts/generate-p0-3-audit-inventories.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIT_DIR = path.join(__dirname, '..', 'docs', 'audits');

// Ensure audit directory exists
if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

interface HardcodedValue {
  file: string;
  line: number;
  rawValue: string;
  context: string;
  whyHardcoded: string;
  proposedToken: string;
}

interface InlineStyle {
  file: string;
  line: number;
  snippet: string;
  classification: 'Allowed' | 'Forbidden';
  reason: string;
  remediationPath: string;
}

// Helper to read file and get context around a line
function getContext(filePath: string, lineNum: number, contextLines: number = 2): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const start = Math.max(0, lineNum - contextLines - 1);
    const end = Math.min(lines.length, lineNum + contextLines);
    return lines.slice(start, end).join('\n');
  } catch (error) {
    return `Error reading file: ${error}`;
  }
}

// Helper to classify inline style
function classifyInlineStyle(snippet: string, file: string): { classification: 'Allowed' | 'Forbidden'; reason: string } {
  // Check if it uses CSS custom properties (var(--))
  if (snippet.includes('var(--')) {
    return {
      classification: 'Allowed',
      reason: 'Uses CSS custom properties (design tokens)'
    };
  }
  
  // Check if it's a dynamic value (runtime computed)
  if (snippet.includes('[') || snippet.includes('as string') || snippet.includes('fontMap') || snippet.includes('style.') || snippet.includes('color:') && snippet.includes('||')) {
    return {
      classification: 'Allowed',
      reason: 'Runtime dynamic value (computed from props/state)'
    };
  }
  
  // Check if it has eslint-disable comment (already marked as allowed)
  const fileContent = fs.readFileSync(file, 'utf-8');
  const lines = fileContent.split('\n');
  const lineNum = parseInt(snippet.split(':')[0]) || 0;
  const prevLine = lines[lineNum - 2] || '';
  if (prevLine.includes('eslint-disable') && prevLine.includes('react/forbid-dom-props')) {
    return {
      classification: 'Allowed',
      reason: 'Already marked with eslint-disable (dynamic value)'
    };
  }
  
  // Default: Forbidden (static style)
  return {
    classification: 'Forbidden',
    reason: 'Static style should be moved to CSS module'
  };
}

// Generate hardcoded values inventory
function generateHardcodedValuesInventory(): HardcodedValue[] {
  const inventory: HardcodedValue[] = [];
  
  // Find hardcoded hex colors
  try {
    const colorResults = execSync(
      `grep -rn "#[0-9a-fA-F]\\{3,6\\}" app/ components/ --include="*.css" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "theme.css" | grep -v "node_modules"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    
    const colorLines = colorResults.split('\n').filter(line => line.trim());
    
    for (const line of colorLines) {
      const match = line.match(/^([^:]+):(\d+):(.+)$/);
      if (match) {
        const [, file, lineNum, content] = match;
        const hexMatch = content.match(/#[0-9a-fA-F]{3,6}/i);
        if (hexMatch) {
          const hexValue = hexMatch[0];
          const context = getContext(file, parseInt(lineNum));
          
          // Determine why it's hardcoded and propose token
          let whyHardcoded = 'Color value hardcoded instead of using design token';
          let proposedToken = 'var(--mm-color-*)';
          
          // Map common colors to tokens
          const colorMap: Record<string, string> = {
            '#3b82f6': 'var(--mm-color-primary-500)',
            '#10b981': 'var(--mm-color-success-500)',
            '#ef4444': 'var(--mm-color-error-500)',
            '#f59e0b': 'var(--mm-color-warning-500)',
            '#6366f1': 'var(--mm-color-primary-600)',
            '#8b5cf6': 'var(--mm-color-secondary-500)',
            '#1a202c': 'var(--mm-gray-900)',
            '#374151': 'var(--mm-gray-700)',
            '#6b7280': 'var(--mm-gray-500)',
          };
          
          if (colorMap[hexValue.toLowerCase()]) {
            proposedToken = colorMap[hexValue.toLowerCase()];
          }
          
          inventory.push({
            file,
            line: parseInt(lineNum),
            rawValue: hexValue,
            context: context.substring(0, 200), // Limit context length
            whyHardcoded,
            proposedToken
          });
        }
      }
    }
  } catch (error) {
    console.error('Error scanning for hex colors:', error);
  }
  
  // Find hardcoded pixel values (sample - too many to process all)
  try {
    const pxResults = execSync(
      `grep -rn "[0-9]\\+px" app/ components/ --include="*.css" --include="*.module.css" 2>/dev/null | grep -v "theme.css" | head -200`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    
    const pxLines = pxResults.split('\n').filter(line => line.trim());
    
    for (const line of pxLines) {
      const match = line.match(/^([^:]+):(\d+):(.+)$/);
      if (match) {
        const [, file, lineNum, content] = match;
        const pxMatch = content.match(/(\d+)px/);
        if (pxMatch) {
          const pxValue = pxMatch[0];
          const context = getContext(file, parseInt(lineNum));
          
          // Determine spacing token
          const pxNum = parseInt(pxMatch[1]);
          let proposedToken = 'var(--mm-space-*)';
          
          // Map common pixel values to spacing tokens
          if (pxNum % 4 === 0) {
            const spaceUnit = pxNum / 4;
            proposedToken = `var(--mm-space-${spaceUnit})`;
          }
          
          inventory.push({
            file,
            line: parseInt(lineNum),
            rawValue: pxValue,
            context: context.substring(0, 200),
            whyHardcoded: 'Pixel value hardcoded instead of using design token',
            proposedToken
          });
        }
      }
    }
  } catch (error) {
    console.error('Error scanning for pixel values:', error);
  }
  
  return inventory;
}

// Generate inline styles inventory
function generateInlineStylesInventory(): InlineStyle[] {
  const inventory: InlineStyle[] = [];
  
  try {
    const styleResults = execSync(
      `grep -rn "style={{" app/ components/ --include="*.tsx" --include="*.ts" 2>/dev/null`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    
    const styleLines = styleResults.split('\n').filter(line => line.trim());
    
    for (const line of styleLines) {
      const match = line.match(/^([^:]+):(\d+):(.+)$/);
      if (match) {
        const [, file, lineNum, content] = match;
        const context = getContext(file, parseInt(lineNum));
        
        // Extract style object snippet
        const styleMatch = content.match(/style=\{\{([^}]+)\}\}/);
        const snippet = styleMatch ? styleMatch[1].substring(0, 150) : content.substring(0, 150);
        
        const classification = classifyInlineStyle(snippet, file);
        
        let remediationPath = 'Move to CSS module';
        if (classification.classification === 'Allowed') {
          remediationPath = 'Keep as-is (dynamic value) or add eslint-disable comment';
        }
        
        inventory.push({
          file,
          line: parseInt(lineNum),
          snippet: snippet.replace(/\n/g, ' ').trim(),
          classification: classification.classification,
          reason: classification.reason,
          remediationPath
        });
      }
    }
  } catch (error) {
    console.error('Error scanning for inline styles:', error);
  }
  
  return inventory;
}

// Write CSV files
function writeCSV<T>(filename: string, data: T[], headers: string[], getRow: (item: T) => string[]): void {
  const filePath = path.join(AUDIT_DIR, filename);
  const rows: string[] = [headers.join(',')];
  
  for (const item of data) {
    const row = getRow(item).map(cell => {
      // Escape commas and quotes in CSV
      const str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    rows.push(row.join(','));
  }
  
  fs.writeFileSync(filePath, rows.join('\n'), 'utf-8');
  console.log(`✅ Generated ${filename}: ${data.length} entries`);
}

// Main execution
console.log('🔍 Generating P0 3.1 and P0 3.2 audit inventories...\n');

const hardcodedValues = generateHardcodedValuesInventory();
const inlineStyles = generateInlineStylesInventory();

// Write hardcoded values inventory
writeCSV<HardcodedValue>(
  'hardcoded-values-inventory.csv',
  hardcodedValues,
  ['file_path', 'line_number', 'raw_value', 'context_snippet', 'why_hardcoded', 'proposed_token_or_remediation_path'],
  (item) => [item.file, String(item.line), item.rawValue, item.context, item.whyHardcoded, item.proposedToken]
);

// Write inline styles inventory
writeCSV<InlineStyle>(
  'inline-styles-inventory.csv',
  inlineStyles,
  ['file_path', 'line_number', 'snippet', 'classification', 'reason', 'remediation_path'],
  (item) => [item.file, String(item.line), item.snippet, item.classification, item.reason, item.remediationPath]
);

console.log(`\n✅ Inventory generation complete!`);
console.log(`   - Hardcoded values: ${hardcodedValues.length} entries`);
console.log(`   - Inline styles: ${inlineStyles.length} entries`);
