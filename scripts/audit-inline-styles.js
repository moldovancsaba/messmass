// scripts/audit-inline-styles.js
// WHAT: Comprehensive audit of inline styles in MessMass codebase
// WHY: Identify inline styles that should be extracted to CSS modules
// HOW: Parse files, count style props, categorize as legitimate or extractable

const fs = require('fs');
const path = require('path');

// WHAT: Directories to audit
const AUDIT_DIRS = [
  path.join(__dirname, '../app'),
  path.join(__dirname, '../components'),
];

// WHAT: Patterns for legitimate inline styles (should NOT be extracted)
const LEGITIMATE_PATTERNS = [
  /var\(--/,                    // CSS variables (e.g., var(--mm-space-md))
  /\$\{/,                       // Template literals (dynamic values)
  /props\./,                    // Props-based styles
  /style={{\s*background:/,     // Dynamic backgrounds (often from Design Manager)
  /dangerouslySetInnerHTML/,    // Injected styles
];

// WHAT: Check if inline style is legitimate (computed/dynamic)
function isLegitimateInlineStyle(styleContent) {
  return LEGITIMATE_PATTERNS.some(pattern => pattern.test(styleContent));
}

// WHAT: Extract inline styles from file content
function extractInlineStyles(content, filePath) {
  const styles = [];
  const regex = /style=\{\{([^}]+)\}\}/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const styleContent = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    styles.push({
      filePath,
      lineNumber,
      styleContent: styleContent.trim(),
      isLegitimate: isLegitimateInlineStyle(styleContent),
    });
  }
  
  return styles;
}

// WHAT: Recursively find all .tsx and .ts files
function findFiles(dir, extensions = ['.tsx', '.ts']) {
  let results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, etc.
        if (!file.startsWith('.') && file !== 'node_modules') {
          results = results.concat(findFiles(filePath, extensions));
        }
      } else if (extensions.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return results;
}

// WHAT: Main audit function
function auditInlineStyles() {
  console.log('🔍 Starting inline styles audit...\n');
  
  const allStyles = [];
  const fileStats = {};
  
  // WHAT: Find all files in audit directories
  const filesToAudit = AUDIT_DIRS.flatMap(dir => findFiles(dir));
  
  console.log(`📂 Found ${filesToAudit.length} files to audit\n`);
  
  // WHAT: Extract inline styles from each file
  for (const filePath of filesToAudit) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const styles = extractInlineStyles(content, filePath);
      
      if (styles.length > 0) {
        allStyles.push(...styles);
        
        const relativePath = path.relative(process.cwd(), filePath);
        fileStats[relativePath] = {
          total: styles.length,
          legitimate: styles.filter(s => s.isLegitimate).length,
          extractable: styles.filter(s => !s.isLegitimate).length,
        };
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }
  
  // WHAT: Calculate summary statistics
  const totalStyles = allStyles.length;
  const legitimateStyles = allStyles.filter(s => s.isLegitimate).length;
  const extractableStyles = allStyles.filter(s => !s.isLegitimate).length;
  
  // WHAT: Print summary
  console.log('📊 Audit Summary:');
  console.log(`   Total inline styles: ${totalStyles}`);
  console.log(`   Legitimate (computed/dynamic): ${legitimateStyles}`);
  console.log(`   Extractable (should be CSS modules): ${extractableStyles}`);
  console.log(`   Files with inline styles: ${Object.keys(fileStats).length}\n`);
  
  // WHAT: Sort files by extractable count (highest first)
  const sortedFiles = Object.entries(fileStats)
    .sort(([, a], [, b]) => b.extractable - a.extractable)
    .filter(([, stats]) => stats.extractable > 0);
  
  console.log('🎯 Top files with extractable inline styles:\n');
  sortedFiles.slice(0, 10).forEach(([file, stats], index) => {
    console.log(`   ${index + 1}. ${file}`);
    console.log(`      Extractable: ${stats.extractable}, Legitimate: ${stats.legitimate}, Total: ${stats.total}`);
  });
  
  // WHAT: Generate CSV inventory
  const csvPath = path.join(__dirname, '../docs/audit/inline-styles-inventory.csv');
  const csvRows = [
    ['File', 'Line', 'Style Content', 'Is Legitimate', 'Priority'].join(','),
    ...allStyles
      .filter(s => !s.isLegitimate)
      .sort((a, b) => {
        // Sort by file path, then line number
        const fileCompare = a.filePath.localeCompare(b.filePath);
        return fileCompare !== 0 ? fileCompare : a.lineNumber - b.lineNumber;
      })
      .map(style => {
        const relativePath = path.relative(process.cwd(), style.filePath);
        const escapedContent = `"${style.styleContent.replace(/"/g, '""')}"`;
        const priority = determinePriority(relativePath);
        
        return [
          relativePath,
          style.lineNumber,
          escapedContent,
          style.isLegitimate ? 'Yes' : 'No',
          priority
        ].join(',');
      })
  ];
  
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');
  
  console.log(`\n✅ CSV inventory created: ${path.relative(process.cwd(), csvPath)}`);
  console.log(`   ${extractableStyles} extractable styles documented\n`);
  
  return {
    total: totalStyles,
    legitimate: legitimateStyles,
    extractable: extractableStyles,
    files: sortedFiles.length,
    csvPath: path.relative(process.cwd(), csvPath),
  };
}

// WHAT: Determine priority based on file location
function determinePriority(filePath) {
  if (filePath.includes('/app/admin/')) return 'High';
  if (filePath.includes('/components/')) return 'Medium';
  if (filePath.includes('/app/edit/') || filePath.includes('/app/stats/')) return 'High';
  if (filePath.includes('/app/filter/') || filePath.includes('/app/hashtag/')) return 'Medium';
  return 'Low';
}

// WHAT: Run audit if executed directly
if (require.main === module) {
  const results = auditInlineStyles();
  
  console.log('📋 Next Steps:');
  console.log('   1. Review CSV inventory to prioritize extraction');
  console.log('   2. Create CSS modules for common patterns');
  console.log('   3. Replace inline styles with CSS classes');
  console.log('   4. Add ESLint rule to prevent new inline styles\n');
  
  process.exit(0);
}

module.exports = { auditInlineStyles };
