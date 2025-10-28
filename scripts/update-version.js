#!/usr/bin/env node
/**
 * VERSION UPDATE SCRIPT
 * 
 * WHAT: Automatically updates version numbers across entire codebase
 * WHY: Single source of truth in VERSION.md prevents version mismatches
 * HOW: Reads VERSION.md, then updates all documented files
 * 
 * Usage:
 *   npm run version:update
 *   node scripts/update-version.js
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🔢 MessMass Version Update Script${colors.reset}\n`);

// Step 1: Read VERSION.md to get current version
const versionMdPath = path.join(__dirname, '..', 'VERSION.md');
const versionMdContent = fs.readFileSync(versionMdPath, 'utf8');

// Extract version from VERSION.md (line 3: **Current Version**: `8.0.0`)
const versionMatch = versionMdContent.match(/\*\*Current Version\*\*:\s*`([0-9]+\.[0-9]+\.[0-9]+)`/);
if (!versionMatch) {
  console.error(`${colors.red}❌ Could not find version in VERSION.md${colors.reset}`);
  process.exit(1);
}

const currentVersion = versionMatch[1];
console.log(`${colors.green}✓ Found version in VERSION.md: ${currentVersion}${colors.reset}\n`);

// Extract timestamp
const timestampMatch = versionMdContent.match(/\*\*Last Updated\*\*:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z)/);
const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();

// Step 2: Define all files to update
const updates = [
  // Core Application
  {
    file: 'package.json',
    pattern: /"version":\s*"[^"]+"/,
    replacement: `"version": "${currentVersion}"`
  },
  
  // Documentation Files
  {
    file: 'README.md',
    pattern: /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[^-]+-blue\)/,
    replacement: `![Version](https://img.shields.io/badge/version-${currentVersion}-blue)`
  },
  {
    file: 'WARP.md',
    pattern: /\*Version: [0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `*Version: ${currentVersion}`
  },
  {
    file: 'USER_GUIDE.md',
    pattern: /\*\*Version:\*\*\s*[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `**Version:** ${currentVersion}`
  },
  {
    file: 'USER_GUIDE.md',
    pattern: /\*\*Last Updated:\*\*\s*[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z/,
    replacement: `**Last Updated:** ${timestamp}`
  },
  {
    file: 'TASKLIST.md',
    pattern: /Current Version:\s*[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `Current Version: ${currentVersion}`
  },
  {
    file: 'TASKLIST.md',
    pattern: /Last Updated:\s*[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z/,
    replacement: `Last Updated: ${timestamp}`
  },
  {
    file: 'RELEASE_NOTES.md',
    pattern: /# Release Notes\s*\n\s*\n\*\*Current Version\*\*:\s*[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `# Release Notes\n\n**Current Version**: ${currentVersion}`
  },
  
  // Specialized Documentation
  {
    file: 'API_REFERENCE.md',
    pattern: /\*\*Version:\*\*\s*[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `**Version:** ${currentVersion}`
  },
  {
    file: 'AUTHENTICATION_AND_ACCESS.md',
    pattern: /\*\*Version:\*\*\s*[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `**Version:** ${currentVersion}`
  },
  {
    file: 'BITLY_INTEGRATION_GUIDE.md',
    pattern: /\*\*Version:\*\*\s*[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `**Version:** ${currentVersion}`
  },
  {
    file: 'CODING_STANDARDS.md',
    pattern: /\*\*Version:\*\*\s*[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `**Version:** ${currentVersion}`
  },
  {
    file: 'COMPONENTS_REFERENCE.md',
    pattern: /\*\*Version:\*\*\s*[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `**Version:** ${currentVersion}`
  },
  {
    file: 'DESIGN_SYSTEM.md',
    pattern: /\*\*Version:\*\*\s*[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `**Version:** ${currentVersion}`
  },
  {
    file: 'HASHTAG_SYSTEM.md',
    pattern: /\*\*Version:\*\*\s*[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `**Version:** ${currentVersion}`
  },
  {
    file: 'PARTNERS_SYSTEM_GUIDE.md',
    pattern: /\*\*Version:\*\*\s*[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `**Version:** ${currentVersion}`
  },
  {
    file: 'QUICK_ADD_GUIDE.md',
    pattern: /\*\*Version:\*\*\s*[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `**Version:** ${currentVersion}`
  },
  
  // In-App Display
  {
    file: 'app/admin/help/page.tsx',
    pattern: /Version\s*\n\s*v[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `Version\n          v${currentVersion}`
  }
];

// Step 3: Execute updates
let successCount = 0;
let errorCount = 0;

console.log(`${colors.blue}📝 Updating ${updates.length} files...${colors.reset}\n`);

updates.forEach(({ file, pattern, replacement }) => {
  const filePath = path.join(__dirname, '..', file);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`${colors.yellow}⚠️  Skip: ${file} (file not found)${colors.reset}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    content = content.replace(pattern, replacement);
    
    if (content === originalContent) {
      console.log(`${colors.yellow}⚠️  Skip: ${file} (no changes needed)${colors.reset}`);
      return;
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`${colors.green}✓ Updated: ${file}${colors.reset}`);
    successCount++;
    
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${file} - ${error.message}${colors.reset}`);
    errorCount++;
  }
});

// Step 4: Summary
console.log(`\n${colors.cyan}═══════════════════════════════════${colors.reset}`);
console.log(`${colors.green}✓ Updated: ${successCount} files${colors.reset}`);
if (errorCount > 0) {
  console.log(`${colors.red}❌ Errors: ${errorCount} files${colors.reset}`);
}
console.log(`${colors.blue}ℹ️  Version: ${currentVersion}${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════${colors.reset}\n`);

// Step 5: Instructions
console.log(`${colors.yellow}Next steps:${colors.reset}`);
console.log(`  1. Review changes: ${colors.cyan}git diff${colors.reset}`);
console.log(`  2. Test build: ${colors.cyan}npm run type-check && npm run build${colors.reset}`);
console.log(`  3. Commit: ${colors.cyan}git commit -m "chore: bump version to ${currentVersion}"${colors.reset}\n`);

process.exit(errorCount > 0 ? 1 : 0);
