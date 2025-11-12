// WHAT: ESLint configuration for MessMass project
// WHY: Enforce design system compliance and code quality standards
module.exports = {
  extends: ["next"],
  plugins: ["react"],
  rules: {
    // WHAT: Forbid inline style prop on DOM elements
    // WHY: All styling must use design tokens from theme.css via CSS modules
    // EXCEPTION: Computed token-driven styles (e.g. PageStyle gradient backgrounds)
    //            are allowed but should reference CSS variables
    // ENFORCEMENT: Changed from 'warn' to 'error' to prevent future violations
    "react/forbid-dom-props": [
      "error",
      { 
        forbid: [
          {
            propName: "style",
            message: "Inline styles are prohibited. Use CSS modules with design tokens from theme.css. For computed styles, use CSS variables (e.g. style={{ background: 'var(--computed-gradient)' }})."
          }
        ] 
      }
    ]
  }
};
