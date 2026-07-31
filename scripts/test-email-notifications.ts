// scripts/test-email-notifications.ts
// WHAT: Test email notification system
// WHY: Verify camera's shared internal email service is reachable and configured
//      before relying on it in production (see lib/emailNotifications.ts)

import { testEmailConfig } from '../lib/emailNotifications';

async function runTest() {
  console.log('📧 Testing Email Configuration');
  console.log('================================\n');

  // Get recipient email from environment variable, or an arg, or a sane default.
  const recipientEmail = process.env.TEST_EMAIL_RECIPIENT || process.argv[2] || 'moldovancsaba@gmail.com';

  if (!recipientEmail || !recipientEmail.includes('@')) {
    console.error('❌ Invalid recipient email. Pass one as an argument or set TEST_EMAIL_RECIPIENT.');
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
    console.log('   1. Verify CAMERA_BASE_URL and CAMERA_MESSMASS_INTERNAL_SECRET are set in .env.local');
    console.log('   2. Confirm camera itself has RESEND_API_KEY / CAMERA_EMAIL_FROM configured');
    console.log('   3. Check camera\'s logs / the Resend dashboard for delivery/API errors');
    process.exit(1);
  }
}

runTest();
