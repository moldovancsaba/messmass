// scripts/verify-bitly-variables.js
// Quick verification that Bitly country variables are registered

const { BASE_STATS_VARIABLES, getAllVariableDefinitions } = require('../lib/variablesRegistry.ts');

console.log('\n🔍 Checking for Bitly country variables in registry...\n');

const bitlyCountryVars = BASE_STATS_VARIABLES.filter(v => 
  v.name.startsWith('bitlyCountry')
);

console.log(`✅ Found ${bitlyCountryVars.length} Bitly country variables:\n`);

bitlyCountryVars.forEach(v => {
  console.log(`   - ${v.name}: ${v.label} (${v.type})`);
});

console.log('\n📊 Full list of Bitly variables in "Bitly / Top Countries" category:\n');

const topCountriesVars = BASE_STATS_VARIABLES.filter(v => 
  v.category === 'Bitly / Top Countries'
);

topCountriesVars.forEach(v => {
  console.log(`   ${v.name} → [SEYU${v.name.toUpperCase()}]`);
});

console.log(`\n✅ Total variables in registry: ${BASE_STATS_VARIABLES.length}`);
console.log(`✅ Bitly country variables: ${topCountriesVars.length}`);

if (topCountriesVars.length === 10) {
  console.log('\n✅ ALL 10 BITLY COUNTRY VARIABLES ARE REGISTERED!\n');
} else {
  console.log(`\n⚠️ Expected 10 variables, found ${topCountriesVars.length}\n`);
}
