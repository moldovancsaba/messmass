#!/usr/bin/env tsx

// WHAT: Verification script for production security feature flags
// WHY: Confirm required security flags are enabled in production environment
// HOW: Checks environment variables and reports status

/**
 * Verify production security feature flags
 * 
 * This script checks if required security feature flags are enabled.
 * It should be run in the production environment to verify configuration.
 * 
 * Usage:
 *   NODE_ENV=production tsx scripts/verify-production-flags.ts
 */

const REQUIRED_FLAGS = [
  { envVar: 'ENABLE_BCRYPT_AUTH', name: 'Password Security (bcrypt)' },
  { envVar: 'ENABLE_JWT_SESSIONS', name: 'Session Security (JWT)' },
  { envVar: 'ENABLE_HTML_SANITIZATION', name: 'XSS Protection (HTML sanitization)' },
] as const;

function verifyProductionFlags(): {
  allEnabled: boolean;
  missingFlags: Array<{ envVar: string; name: string }>;
  enabledFlags: Array<{ envVar: string; name: string }>;
} {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  if (!isProduction) {
    console.log('⚠️  Not in production mode (NODE_ENV !== "production")');
    console.log('   This script should be run with NODE_ENV=production');
    console.log('   Current NODE_ENV:', nodeEnv);
    return {
      allEnabled: false,
      missingFlags: [],
      enabledFlags: [],
    };
  }

  const missingFlags: Array<{ envVar: string; name: string }> = [];
  const enabledFlags: Array<{ envVar: string; name: string }> = [];

  for (const { envVar, name } of REQUIRED_FLAGS) {
    const value = process.env[envVar];
    const isEnabled = value === 'true';

    if (isEnabled) {
      enabledFlags.push({ envVar, name });
    } else {
      missingFlags.push({ envVar, name });
    }
  }

  return {
    allEnabled: missingFlags.length === 0,
    missingFlags,
    enabledFlags,
  };
}

// Main execution
const result = verifyProductionFlags();

console.log('\n🔍 Production Security Feature Flags Verification\n');
console.log('='.repeat(60));

if (result.allEnabled) {
  console.log('✅ All required security feature flags are enabled:\n');
  for (const { envVar, name } of result.enabledFlags) {
    console.log(`   ✓ ${name} (${envVar})`);
  }
  console.log('\n✅ Production security configuration is correct.');
  process.exit(0);
} else {
  console.log('❌ Missing required security feature flags:\n');
  for (const { envVar, name } of result.missingFlags) {
    console.log(`   ✗ ${name} (${envVar})`);
  }
  if (result.enabledFlags.length > 0) {
    console.log('\n✅ Enabled flags:');
    for (const { envVar, name } of result.enabledFlags) {
      console.log(`   ✓ ${name} (${envVar})`);
    }
  }
  console.log('\n❌ Production security configuration is incomplete.');
  console.log('\nRemediation:');
  console.log('1. Set the following environment variables in Vercel production:');
  for (const { envVar } of result.missingFlags) {
    console.log(`   ${envVar}=true`);
  }
  console.log('\n2. Redeploy the application');
  console.log('\n3. Run this script again to verify');
  process.exit(1);
}

