// Generate page passwords for all partner report pages
import clientPromise from '../lib/mongodb';
import config from '../lib/config';
import { generateMD5StylePassword } from '../lib/pagePassword';

async function generatePasswords() {
  console.log('🚀 Generating page passwords for all partner reports...');
  
  const client = await clientPromise;
  const db = client.db(config.dbName);
  
  // Get all partners with viewSlug
  const partners = await db.collection('partners')
    .find({ viewSlug: { $exists: true, $ne: null } })
    .project({ _id: 1, name: 1, viewSlug: 1 })
    .toArray();
  
  console.log(`📊 Found ${partners.length} partners with viewSlug`);
  
  let created = 0;
  let existing = 0;
  
  for (const partner of partners) {
    // Check if password already exists
    const existingPassword = await db.collection('page_passwords').findOne({
      pageId: partner.viewSlug,
      pageType: 'stats'
    });
    
    if (existingPassword) {
      existing++;
      continue;
    }
    
    // Generate new password
    const password = generateMD5StylePassword();
    const now = new Date().toISOString();
    
    await db.collection('page_passwords').insertOne({
      pageId: partner.viewSlug,
      pageType: 'stats',
      password,
      createdAt: now,
      usageCount: 0
    });
    
    console.log(`✓ Created password for "${partner.name}" (${partner.viewSlug})`);
    created++;
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Already existed: ${existing}`);
  console.log(`   📝 Total: ${partners.length}`);
  console.log('\n🎉 All partner report pages now have passwords!');
  console.log('💡 Admins can access without password (session bypass)');
  
  process.exit(0);
}

generatePasswords().catch(console.error);
