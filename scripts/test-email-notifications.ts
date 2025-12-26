// scripts/test-email-notifications.ts
// WHAT: Test email notification system
// WHY: Verify SMTP credentials work before production use

import { testEmailConfig } from '../lib/emailNotifications';

async function runTest() {
  console.log('📧 Testing Email Configuration');
  console.log('================================\n');
  
  // Get recipient email from environment variable
  const recipientEmail = process.env.SMTP_USER || 'moldovancsaba@gmail.com';
  
  if (!recipientEmail || !recipientEmail.includes('@')) {
    console.error('❌ Invalid email address in SMTP_USER');
    process.exit(1);
  }
  
  console.log(`📬 Sending test email to: ${recipientEmail}`);
  console.log('⏳ Please wait...\n');
  
  const success = await testEmailConfig(recipientEmail);
  
  if (success) {
    console.log('\n✅ Success! Check your inbox for the test email.');
    console.log('   (Check spam folder if you don\'t see it)');
    process.exit(0);
  } else {
    console.log('\n❌ Failed to send test email.');
    console.log('💡 Troubleshooting:');
    console.log('   1. Verify SMTP_USER and SMTP_PASS in .env.local');
    console.log('   2. Check that SMTP_PASS is the correct app password');
    console.log('   3. Ensure Gmail "Less secure app access" is enabled (if needed)');
    process.exit(1);
  }
}

runTest();
