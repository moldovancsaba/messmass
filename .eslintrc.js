// WHAT: ESLint configuration for MessMass project
// WHY: Enforce design system compliance and code quality standards
// UPDATED: 2025-12-20 - Added rules from technical audit (TECH_AUDIT_REPORTING_SYSTEM.md)

module.exports = {
  extends: ["next"],
  plugins: ["react"],
  rules: {
    // WHAT: Prohibit inline styles to enforce CSS modules and design tokens
    // WHY: Inline styles bypass design system and CSS cascade (87+ violations found)
    // See: CODING_STANDARDS.md line 142, TECH_AUDIT_REPORTING_SYSTEM.md Part 1.1
    "react/forbid-dom-props": ["error", {
      "forbid": [
        {
          "propName": "style",
          "message": "Inline styles are prohibited. Use CSS modules (import styles from './Component.module.css') or utility classes from app/styles/utilities.css. Exception: Dynamic values with // WHAT/WHY comments explaining necessity."
        }
      ]
    }],

    // WHAT: Warn about deprecated imports
    // WHY: DynamicChart.tsx is deprecated as of v11.37.0, will be removed in v12.0.0
    // See: TECH_AUDIT_REPORTING_SYSTEM.md Part 2.1
    "no-restricted-imports": ["warn", {
      "paths": [
        {
          "name": "@/components/DynamicChart",
          "message": "DynamicChart is deprecated as of v11.37.0. Use ReportChart from app/report/[slug]/ReportChart.tsx instead. Will be removed in v12.0.0."
        },
        {
          "name": "../components/DynamicChart",
          "message": "DynamicChart is deprecated as of v11.37.0. Use ReportChart from app/report/[slug]/ReportChart.tsx instead. Will be removed in v12.0.0."
        },
        {
          "name": "./DynamicChart",
          "message": "DynamicChart is deprecated as of v11.37.0. Use ReportChart from app/report/[slug]/ReportChart.tsx instead. Will be removed in v12.0.0."
        }
      ]
    }],

    // WHAT: Encourage best practices
    // WHY: Maintain code quality and consistency
    "react-hooks/exhaustive-deps": "warn",
    "@next/next/no-img-element": "error", // Use Next.js Image component
    "no-console": ["warn", { "allow": ["warn", "error", "log"] }]
  }
};
