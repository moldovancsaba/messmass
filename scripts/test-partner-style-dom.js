#!/usr/bin/env node

// WHAT: Test partner report style application in DOM
// WHY: Debug why partner styles aren't applying to the page
// HOW: Check the actual CSS generation and DOM application

const { generateGradientCSS } = require('../lib/pageStyleTypesEnhanced');

console.log('🎨 Testing Partner Style DOM Application');
console.log('=====================================');

// Test the SIHF style data from the API
const sihfStyle = {
  name: "SIHF Swiss Ice Hockey Federation",
  typography: {
    fontFamily: "montserrat",
    primaryTextColor: "#000000",
    headingColor: "#000000"
  },
  pageBackground: {
    type: "solid",
    solidColor: "#ffffff",
    gradientAngle: 135,
    gradientStops: [
      { color: "#ffffff", position: 0 },
      { color: "#000000", position: 100 }
    ]
  },
  heroBackground: {
    type: "solid", 
    solidColor: "#f8f9fa"
  },
  colorScheme: {
    primary: "#d32f2f"
  }
};

console.log('📋 SIHF Style Object:');
console.log(JSON.stringify(sihfStyle, null, 2));

console.log('\n🎨 Testing generateGradientCSS:');
const backgroundCSS = generateGradientCSS(sihfStyle.pageBackground);
console.log('Background CSS:', backgroundCSS);

const heroBackgroundCSS = generateGradientCSS(sihfStyle.heroBackground);
console.log('Hero Background CSS:', heroBackgroundCSS);

console.log('\n🔍 Testing Color Safety Checks:');
const safePrimaryTextColor = (typeof sihfStyle.typography?.primaryTextColor === 'string' && sihfStyle.typography.primaryTextColor.trim()) ? sihfStyle.typography.primaryTextColor.trim() : '#111827';
const safeHeadingColor = (typeof sihfStyle.typography?.headingColor === 'string' && sihfStyle.typography.headingColor.trim()) ? sihfStyle.typography.headingColor.trim() : '#111827';
const safeFont = (typeof sihfStyle.typography?.fontFamily === 'string' && sihfStyle.typography.fontFamily.trim()) ? sihfStyle.typography.fontFamily.trim() : 'system-ui, -apple-system, sans-serif';

console.log('Safe Primary Text Color:', safePrimaryTextColor);
console.log('Safe Heading Color:', safeHeadingColor);
console.log('Safe Font:', safeFont);

console.log('\n🎯 Expected Main Container Style:');
const expectedMainStyle = {
  minHeight: '100vh',
  background: backgroundCSS,
  color: safePrimaryTextColor,
  fontFamily: safeFont
};
console.log(JSON.stringify(expectedMainStyle, null, 2));

console.log('\n🎯 Expected UnifiedPageHero Style CSS:');
const expectedHeroCSS = `
.admin-container { 
  background: ${backgroundCSS}; 
  color: ${safePrimaryTextColor};
}
.admin-header { 
  background: ${heroBackgroundCSS}; 
}
.admin-title {
  color: ${safeHeadingColor};
}
`;
console.log(expectedHeroCSS);

console.log('\n✅ Style Generation Test Complete');
console.log('🔍 Check browser console for these exact values when loading partner report');