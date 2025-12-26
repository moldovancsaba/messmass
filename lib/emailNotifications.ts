// lib/emailNotifications.ts
// WHAT: Email notification utility for MessMass (v12.0.0)
// WHY: Send email alerts for Google Sheets sync events and errors
// HOW: Uses SMTP via nodemailer with existing Gmail credentials

const nodemailer = require('nodemailer');

/**
 * WHAT: Email configuration from environment variables
 * WHY: Reuse existing SMTP credentials from SSO project
 */
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  from: process.env.SMTP_FROM || process.env.EMAIL_FROM
};

/**
 * WHAT: Create SMTP transporter instance
 * WHY: Reusable email client for all notifications
 */
function createTransporter() {
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASS in environment variables.');
  }
  
  return nodemailer.createTransport({
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    secure: EMAIL_CONFIG.secure,
    auth: EMAIL_CONFIG.auth
  });
}

/**
 * WHAT: Send Google Sheets sync success notification
 * WHY: Inform admins about successful automated syncs
 */
export async function sendSyncSuccessEmail(params: {
  partnerName: string;
  eventsCreated: number;
  eventsUpdated: number;
  syncedAt: string;
  recipientEmail: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: params.recipientEmail,
      subject: `✅ Google Sheets Sync Complete - ${params.partnerName}`,
      html: `
        <h2>Google Sheets Sync Successful</h2>
        <p><strong>Partner:</strong> ${params.partnerName}</p>
        <p><strong>Time:</strong> ${new Date(params.syncedAt).toLocaleString()}</p>
        <hr>
        <ul>
          <li>Events Created: ${params.eventsCreated}</li>
          <li>Events Updated: ${params.eventsUpdated}</li>
          <li>Total Changes: ${params.eventsCreated + params.eventsUpdated}</li>
        </ul>
        <p><small>This is an automated message from MessMass.</small></p>
      `
    });
    
    console.log(`✅ Sync success email sent to ${params.recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send sync success email:', error);
    return false;
  }
}

/**
 * WHAT: Send Google Sheets sync error notification
 * WHY: Alert admins immediately when automated sync fails
 */
export async function sendSyncErrorEmail(params: {
  partnerName: string;
  errorMessage: string;
  failedAt: string;
  recipientEmail: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: params.recipientEmail,
      subject: `❌ Google Sheets Sync Failed - ${params.partnerName}`,
      html: `
        <h2 style="color: #dc2626;">Google Sheets Sync Failed</h2>
        <p><strong>Partner:</strong> ${params.partnerName}</p>
        <p><strong>Time:</strong> ${new Date(params.failedAt).toLocaleString()}</p>
        <hr>
        <p><strong>Error:</strong></p>
        <pre style="background: #f3f4f6; padding: 1rem; border-radius: 4px;">${params.errorMessage}</pre>
        <hr>
        <p><strong>Action Required:</strong></p>
        <ul>
          <li>Check Google Sheet permissions (service account has Editor access?)</li>
          <li>Verify sheet ID is correct</li>
          <li>Review error message for details</li>
        </ul>
        <p><small>This is an automated message from MessMass.</small></p>
      `
    });
    
    console.log(`❌ Sync error email sent to ${params.recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send sync error email:', error);
    return false;
  }
}

/**
 * WHAT: Send daily sync summary email
 * WHY: Daily digest of all automated syncs for superadmins
 */
export async function sendDailySyncSummaryEmail(params: {
  date: string;
  totalPartners: number;
  successCount: number;
  failureCount: number;
  totalEventsCreated: number;
  totalEventsUpdated: number;
  failures: Array<{ partnerName: string; error: string }>;
  recipientEmail: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const failuresList = params.failures.length > 0
      ? `
        <h3 style="color: #dc2626;">Failed Syncs (${params.failureCount})</h3>
        <ul>
          ${params.failures.map(f => `<li><strong>${f.partnerName}:</strong> ${f.error}</li>`).join('')}
        </ul>
      `
      : '<p style="color: #16a34a;">✅ All syncs completed successfully!</p>';
    
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: params.recipientEmail,
      subject: `📊 Daily Google Sheets Sync Summary - ${params.date}`,
      html: `
        <h2>Daily Google Sheets Sync Summary</h2>
        <p><strong>Date:</strong> ${params.date}</p>
        <hr>
        <h3>Overview</h3>
        <ul>
          <li>Total Partners Synced: ${params.totalPartners}</li>
          <li>Successful: ${params.successCount} ✅</li>
          <li>Failed: ${params.failureCount} ❌</li>
        </ul>
        <hr>
        <h3>Events</h3>
        <ul>
          <li>Events Created: ${params.totalEventsCreated}</li>
          <li>Events Updated: ${params.totalEventsUpdated}</li>
          <li>Total Changes: ${params.totalEventsCreated + params.totalEventsUpdated}</li>
        </ul>
        <hr>
        ${failuresList}
        <p><small>This is an automated daily summary from MessMass.</small></p>
      `
    });
    
    console.log(`📊 Daily summary email sent to ${params.recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send daily summary email:', error);
    return false;
  }
}

/**
 * WHAT: Test email configuration
 * WHY: Verify SMTP credentials work before production
 */
export async function testEmailConfig(recipientEmail: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: recipientEmail,
      subject: '✅ MessMass Email Configuration Test',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email from MessMass to verify SMTP configuration.</p>
        <p>If you received this email, your email notifications are working correctly!</p>
        <hr>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>SMTP Host: ${EMAIL_CONFIG.host}</li>
          <li>SMTP Port: ${EMAIL_CONFIG.port}</li>
          <li>From: ${EMAIL_CONFIG.from}</li>
        </ul>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `
    });
    
    console.log(`✅ Test email sent successfully to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
}
