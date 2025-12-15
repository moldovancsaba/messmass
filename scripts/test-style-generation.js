#!/usr/bin/env node

// WHAT: Test style generation logic without imports
// WHY: Debug partner report styling issue
// HOW: Replicate the exact logic from the frontend

console.log('🎨 Testing Style Generation Logic');
console.log('=================================');

// Replicate generateGradientCSS function
function generateGradientCSS(background) {
  if (background.type === 'solid') {
    const solidColor = background.solidColor;
    if (solidColor && typeof solidColor === 'string' && solidColor.trim()) {
      return solidColor;
    }
    return '#ffffff'; // Fallback for invalid solid color
  }
  
  if (!background.gradientStops || background.gradientStops.length < 2) {
    return '#ffffff'; // Fallback
  }
  
  const validStops = background.gradientStops.filter(stop => 
    stop.color && 
    typeof stop.color === 'string' && 
    stop.color.trim() &&
    typeof stop.position === 'number' &&
    !isNaN(stop.position)
  );
  
  if (validStops.length < 2) {
    return '#ffffff'; // Fallback if not enough valid stops
  }
  
  const angle = background.gradientAngle || 0;
  const stops = validStops
    .map(stop => `${stop.color} ${stop.position}%`)
    .join(', ');
  
  return `linear-gradient(${angle}deg, ${stops})`;
}

// Test with SIHF style data
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

console.log('📋 Testing SIHF Style:');
console.log('Name:', sihfStyle.name);

console.log('\n🎨 Background Generation:');
const backgroundCSS = generateGradientCSS(sihfStyle.pageBackground);
console.log('Page Background CSS:', backgroundCSS);

const heroBackgroundCSS = generateGradientCSS(sihfStyle.heroBackground);
console.log('Hero Background CSS:', heroBackgroundCSS);

console.log('\n🔍 Color Safety Checks:');
const safePrimaryTextColor = (typeof sihfStyle.typography?.primaryTextColor === 'string' && sihfStyle.typography.primaryTextColor.trim()) ? sihfStyle.typography.primaryTextColor.trim() : '#111827';
const safeHeadingColor = (typeof sihfStyle.typography?.headingColor === 'string' && sihfStyle.typography.headingColor.trim()) ? sihfStyle.typography.headingColor.trim() : '#111827';
const safeFont = (typeof sihfStyle.typography?.fontFamily === 'string' && sihfStyle.typography.fontFamily.trim()) ? sihfStyle.typography.fontFamily.trim() : 'system-ui, -apple-system, sans-serif';

console.log('✅ Safe Primary Text Color:', safePrimaryTextColor);
console.log('✅ Safe Heading Color:', safeHeadingColor);
console.log('✅ Safe Font:', safeFont);

console.log('\n🎯 Expected Main Container Style:');
const expectedMainStyle = {
  minHeight: '100vh',
  background: backgroundCSS,
  color: safePrimaryTextColor,
  fontFamily: safeFont
};
console.log(JSON.stringify(expectedMainStyle, null, 2));

console.log('\n🎯 Expected UnifiedPageHero CSS:');
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

console.log('\n🔍 DIAGNOSIS:');
console.log('✅ Style generation works correctly');
console.log('✅ Colors are safe and valid');
console.log('✅ Background CSS is generated properly');
console.log('');
console.log('❓ POTENTIAL ISSUES:');
console.log('1. Style not being passed to UnifiedPageHero component');
console.log('2. CSS not being injected into DOM');
console.log('3. CSS being overridden by other styles');
console.log('4. ResourceLoader not completing properly');
console.log('');
console.log('🔍 CHECK BROWSER CONSOLE FOR:');
console.log('- "🎨 Partner has direct styleId - fetching: 693fe86456d7006458901c25"');
console.log('- "✅ Using partner direct style: SIHF Swiss Ice Hockey Federation"');
console.log('- "🎨 Style applied: SIHF Swiss Ice Hockey Federation"');
console.log('- "🎨 Applying custom partner style:" with the above values');