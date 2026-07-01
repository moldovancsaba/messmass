#!/usr/bin/env node
/**
 * WHAT: Design system violation checker
 * WHY: Prevent gradients, glass-morphism, and excessive inline styles from creeping back
 * 
 * Usage: node scripts/check-design-violations.js
 * Exit code: 0 = pass, 1 = violations found
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VIOLATIONS = {
  gradients: {
    pattern: 'linear-gradient\\|radial-gradient',
    message: 'Gradient backgrounds detected',
    allowedFiles: [
      'app/styles/theme.css',  // Legacy gradient tokens (deprecated but documented)
      'app/charts.css',        // Chart visualizations need gradients
      'app/globals.css',       // Shimmer animation uses gradient
      'app/page.module.css',   // Landing hero remains tokenized but intentionally gradient-backed
      'app/styles/utilities.css' // Shared utility fade helpers still use tokenized gradients
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

const CONTENT_GUARDRAILS = [
  {
    message: 'Inline style props detected in shared UI surfaces',
    pattern: /\bstyle=\{\{/,
    files: [
      'components/AdminDashboard.tsx',
      'components/AnalyticsWorkspaceNav.tsx',
      'components/ReportingWorkspaceNav.tsx'
    ]
  },
  {
    message: 'Raw hex/rgb colors detected in canonical shared surfaces',
    pattern: /#[0-9a-fA-F]{3,8}\b|\brgba?\(/,
    files: [
      'lib/adminNavigation.ts',
      'components/AdminDashboard.tsx',
      'components/AnalyticsWorkspaceNav.tsx',
      'components/ReportingWorkspaceNav.tsx'
    ]
  },
  {
    message: 'Raw form controls detected in report-variant workspaces',
    pattern: /<(input|select)\b/,
    files: [
      'app/admin/organizations/[id]/reports/page.tsx',
      'app/admin/partners/[id]/reports/page.tsx'
    ]
  },
  {
    message: 'Raw color literals detected in canonical chart components',
    pattern: /#[0-9a-fA-F]{3,8}\b|\brgba?\(/,
    files: [
      'components/analytics/LineChart.tsx',
      'components/charts/PieChart.tsx',
      'components/charts/VerticalBarChart.tsx'
    ]
  },
  {
    message: 'Raw form controls detected in shared editor dashboards',
    pattern: /<(input|select)\b/,
    files: [
      'components/OrganizationEditorDashboard.tsx',
      'components/PartnerEditorDashboard.tsx'
    ]
  },
  {
    message: 'Legacy public report shell wrappers detected',
    pattern: /styles\.(page|container|loading|error)/,
    files: [
      'app/partner-report/PartnerReportView.tsx',
      'app/organization-report/OrganizationReportView.tsx'
    ]
  }
];

for (const guardrail of CONTENT_GUARDRAILS) {
  const violations = [];

  for (const relativeFile of guardrail.files) {
    const filePath = path.join(process.cwd(), relativeFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    if (guardrail.pattern.test(content)) {
      violations.push(relativeFile);
    }
  }

  if (violations.length > 0) {
    console.log(`❌ ${guardrail.message}:`);
    violations.forEach((file) => console.log(`   ${file}`));
    console.log('');
    totalViolations += violations.length;
  } else {
    console.log(`✅ ${guardrail.message}: None found`);
  }
}

// WHAT: Block reintroduction of styled-jsx beyond the known legacy baseline.
// WHY: #864 requires no NEW non-Mantine CSS-in-JS. The files below are tracked debt
//      (issue #85); any `<style jsx` outside them fails the check so the debt cannot grow.
const STYLED_JSX_BASELINE = [
  'app/admin/visualization/page.tsx',
  'components/ChartAlgorithmManager.tsx',
  'components/ChartConfiguration.tsx',
  'components/UnifiedHashtagInput.tsx',
];
try {
  const cmd = `grep -rIl "<style jsx" components app --include="*.tsx" | grep -v "node_modules" | grep -v ".next"`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  const files = output.trim().split('\n').filter(Boolean).map((f) => f.replace(/^\.\//, ''));
  const violations = files.filter((f) => !STYLED_JSX_BASELINE.includes(f));
  if (violations.length > 0) {
    console.log('❌ New styled-jsx detected (use Mantine/design tokens; see issue #85):');
    violations.forEach((v) => console.log(`   ${v}`));
    console.log('');
    totalViolations += violations.length;
  } else {
    console.log('✅ New styled-jsx beyond tracked baseline: None found');
  }
} catch (error) {
  // grep exit code 1 = no `<style jsx` matches anywhere = good.
  if (error.status === 1) {
    console.log('✅ New styled-jsx beyond tracked baseline: None found');
  } else {
    throw error;
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
