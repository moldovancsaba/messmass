#!/usr/bin/env node
/**
 * WHAT: Design system violation checker
 * WHY: Prevent gradients, glass-morphism, and excessive inline styles from creeping back
 * 
 * Usage: node scripts/check-design-violations.js
 * Exit code: 0 = pass, 1 = violations found
 */

const { execSync } = require('child_process');
const path = require('path');

const VIOLATIONS = {
  gradients: {
    pattern: 'linear-gradient\\|radial-gradient',
    message: 'Gradient backgrounds detected',
    allowedFiles: [
      'app/styles/theme.css',  // Legacy gradient tokens (deprecated but documented)
      'app/charts.css',        // Chart visualizations need gradients
      'app/globals.css'        // Shimmer animation uses gradient
    ]
  },
  glassMorphism: {
    pattern: 'backdrop-filter.*blur',
    message: 'Glass-morphism (backdrop-filter) detected',
    allowedFiles: [
      'app/styles/theme.css',      // Documentation of deprecated blur tokens
      'app/styles/admin.css',      // Legacy admin styles (to be cleaned)
      'app/styles/layout.css',     // Legacy layout styles (to be cleaned)
      'app/styles/components.css', // Legacy component styles (to be cleaned)
      'app/charts.css'             // Chart components need some blur effects
    ]
  }
};

console.log('🔍 Checking for design system violations...\n');

let totalViolations = 0;

for (const [name, config] of Object.entries(VIOLATIONS)) {
  try {
    const cmd = `grep -r "${config.pattern}" app --include="*.css" --include="*.module.css" | grep -v "node_modules" | grep -v ".next"`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    
    const lines = output.trim().split('\n').filter(line => line);
    const violations = lines.filter(line => {
      const filePath = line.split(':')[0];
      return !config.allowedFiles.some(allowed => filePath.includes(allowed));
    });
    
    if (violations.length > 0) {
      console.log(`❌ ${config.message}:`);
      violations.forEach(v => console.log(`   ${v}`));
      console.log('');
      totalViolations += violations.length;
    }
  } catch (error) {
    // No matches found (grep exit code 1) - this is good!
    if (error.status === 1) {
      console.log(`✅ ${config.message}: None found`);
    }
  }
}

console.log('\n' + '='.repeat(60));
if (totalViolations === 0) {
  console.log('✅ Design system check passed!');
  console.log('   No violations detected.');
  process.exit(0);
} else {
  console.log(`❌ Design system check failed!`);
  console.log(`   ${totalViolations} violation(s) found.`);
  console.log('\n   Fix these violations before committing.');
  console.log('   See WARP.md for design system guidelines.');
  process.exit(1);
}
