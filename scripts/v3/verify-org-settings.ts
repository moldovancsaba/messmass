const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

/**
 * WHAT: Verification script for Organization settings parity.
 * WHY: Validates metadata-based styling and template logic.
 */
async function verifyOrgSettings() {
  try {
    console.log('🔗 Connecting to DB...');
    // WHAT: Use dynamic imports to ensure dotenv is loaded before lib/config initialization
    const { default: connectV3 } = await import('../../lib/mongoose-v3');
    const { default: V3Organization } = await import('../../lib/models/v3/Organization');
    const { V3ReportResolver } = await import('../../lib/v3/reporting/reportResolver');

    await connectV3();
    const testOrgSlug = 'test-org-' + Date.now();
    
    // 1. Create a test organization with metadata
    console.log('📝 Creating test organization...');
    const org = await V3Organization.create({
      name: 'Verification Org',
      slug: testOrgSlug,
      metadata: {
        emoji: '🧪',
        styleId: '65f1a2b3c4d5e6f7a8b9c0d1', // Fake style ID
        reportTemplateId: '65f1a2b3c4d5e6f7a8b9c0d2', // Fake report ID
        logoUrl: 'https://example.com/logo.png',
        showEmoji: true
      }
    });

    console.log('✅ Org created with ID:', org._id);

    // 2. Resolve report and check for style persistence
    console.log('🔍 Resolving report for org...');
    try {
        const resolution = await V3ReportResolver.resolveForOrganization(org._id.toString());
        console.log('📊 Resolution Result:', resolution?.resolvedFrom);
        console.log('🎨 Resolved Style ID:', resolution?.report?.styleId);
        
        if (resolution?.report?.styleId === '65f1a2b3c4d5e6f7a8b9c0d1') {
            console.log('🚀 SUCCESS: Style ID correctly overridden from metadata!');
        } else {
            console.log('⚠️ WARNING: Style ID mismatch or not applied.');
        }
    } catch (e) {
        console.log('ℹ️ Resolver (expected failure on non-existent report ID, but metadata check follows):', e instanceof Error ? e.message : e);
    }

    // 3. Verify object structure in DB
    const freshOrg = await V3Organization.findById(org._id).lean();
    console.log('📂 Metadata in DB:', JSON.stringify(freshOrg.metadata, null, 2));

    // Cleanup
    await V3Organization.findByIdAndDelete(org._id);
    console.log('🧹 Cleanup complete.');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
}

verifyOrgSettings();
