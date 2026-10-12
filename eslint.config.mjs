// WHAT: ESLint flat configuration for {messmass}
// WHY: Enforce design system compliance and code quality standards
// HISTORY: This replaces the classic .eslintrc.js and .eslintignore (ESLint 8, no longer
//     supported). The rules are the same ones; only the format and the loader changed.
//     eslint-config-next 15 still ships classic configs, so FlatCompat translates `next`.

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    // WHAT: Files ESLint never visits.
    // WHY: Replaces .eslintignore. Flat config also lints dot-directories, which the
    //     classic loader skipped on its own: .claude/ holds detached checkouts of other
    //     branches and sibling repos (see jest.config.js), so it is listed here.
    ignores: [
      // Backup files
      '**/*_old_backup.*',
      '**/*_backup.*',
      '**/* 2.*',
      '**/* 3.*',
      // Build output
      '.next/**',
      'node_modules/**',
      'out/**',
      'dist/**',
      // Logs
      '**/*.log',
      // Detached checkouts (classic ESLint skipped every dot-directory)
      '.claude/**',
      // Coverage reports
      'coverage/**',
    ],
  },
  ...compat.extends('next'),
  {
    // WHAT: Same unused-directive behaviour as ESLint 8 (off). ESLint 9 warns by default,
    //     and the CI lint step fails on any warning.
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      // WHAT: Prohibit inline styles to enforce CSS modules and design tokens
      // WHY: Inline styles bypass design system and CSS cascade (87+ violations found)
      // See: CODING_STANDARDS.md line 142, TECH_AUDIT_REPORTING_SYSTEM.md Part 1.1
      'react/forbid-dom-props': [
        'error',
        {
          forbid: [
            {
              propName: 'style',
              message:
                'Inline styles are prohibited. Use CSS modules (import styles from \'./Component.module.css\') or utility classes from app/styles/utilities.css. Exception: Dynamic values with // WHAT/WHY comments explaining necessity.',
            },
          ],
        },
      ],

      // WHAT: Encourage best practices
      // WHY: Maintain code quality and consistency
      'react-hooks/exhaustive-deps': 'warn',
      '@next/next/no-img-element': 'error', // Use Next.js Image component
      // OPS-SEC-03: Prefer lib/logger; console logs permitted for legacy telemetry, but no-console is disabled to allow strict zero-warning CI.
      'no-console': 'off',
    },
  },
];

export default config;
