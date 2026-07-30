// scripts/test-email-notifications.ts
// WHAT: Test email notification system
// WHY: Verify Resend credentials + sender identity work before production use

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
    console.log('   1. Verify RESEND_API_KEY is set in .env.local');
    console.log('   2. Verify EMAIL_FROM is a verified sending identity in Resend');
    console.log('   3. Check the Resend dashboard for delivery/API errors');
    process.exit(1);
  }
}

runTest();
