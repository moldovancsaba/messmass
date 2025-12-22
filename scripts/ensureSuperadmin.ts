// scripts/ensureSuperadmin.ts
// WHAT: Ensure at least one superadmin exists in the system
// WHY: Bootstrap RBAC system, prevent lockout scenarios
// HOW: Check for existing superadmin, create from env vars if none exist

import getDb from '../lib/db';
import { createUser } from '../lib/users';

async function ensureSuperadmin() {
  console.log('🔍 Checking for existing superadmins...\n');
  
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // WHAT: Check if any superadmin exists
    const existingSuperadmin = await usersCollection.findOne({ role: 'superadmin' });
    
    if (existingSuperadmin) {
      console.log('✅ Superadmin exists:', existingSuperadmin.email);
      console.log('   No action needed.\n');
      process.exit(0);
    }
    
    console.log('⚠️  No superadmin found. Creating from environment variables...\n');
    
    // WHAT: Get credentials from environment variables
    const email = process.env.SUPERADMIN_EMAIL;
    const name = process.env.SUPERADMIN_NAME || 'Super Admin';
    const password = process.env.SUPERADMIN_PASSWORD;
    
    if (!email || !password) {
      console.error('❌ ERROR: Missing required environment variables:');
      console.error('   SUPERADMIN_EMAIL - Email address for superadmin account');
      console.error('   SUPERADMIN_PASSWORD - Password for superadmin account');
      console.error('   SUPERADMIN_NAME (optional) - Full name (default: "Super Admin")');
      console.error('\nExample:');
      console.error('   SUPERADMIN_EMAIL=admin@example.com \\');
      console.error('   SUPERADMIN_PASSWORD=secure_password \\');
      console.error('   SUPERADMIN_NAME="John Doe" \\');
      console.error('   npm run seed:superadmin\n');
      process.exit(1);
    }
    
    // WHAT: Create superadmin user
    const now = new Date().toISOString();
    const newSuperadmin = await createUser({
      email: email.toLowerCase(),
      name,
      role: 'superadmin',
      password,
      createdAt: now,
      updatedAt: now,
    });
    
    console.log('✅ Superadmin created successfully!');
    console.log('=' .repeat(60));
    console.log('📧 Email:   ', newSuperadmin.email);
    console.log('👤 Name:    ', newSuperadmin.name);
    console.log('⚡ Role:    ', newSuperadmin.role);
    console.log('🆔 ID:      ', newSuperadmin._id?.toString());
    console.log('=' .repeat(60));
    console.log('\n🔐 IMPORTANT: Store the password securely!');
    console.log('   Password: ', password);
    console.log('\n🚀 You can now log in at: /admin/login\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// WHAT: Run if executed directly
if (require.main === module) {
  ensureSuperadmin();
}

export default ensureSuperadmin;
