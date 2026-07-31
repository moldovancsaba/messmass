// lib/emailNotifications.ts
// WHAT: Email transport utility for {messmass}
// WHY: Send the transactional emails the app actually uses (admin password
//      regeneration, and an email config self-test).
// HOW: Calls camera's shared internal email service
//      (POST /api/internal/messmass/email/send is NOT a route -- the actual
//      path is POST /api/internal/email/send on camera) instead of talking to
//      Resend directly. Camera is the one app in the SEYU stack with a
//      working Resend integration and verified sending domain; this avoids
//      messmass keeping its own separate Resend account/dependency/error
//      handling, duplicating logic camera already has. Auth reuses
//      config.cameraProvisionToken -- the SAME shared secret already used for
//      messmass -> camera provisioning (lib/cameraClient.ts), not a new one.
//      See SSO_EMAIL_UNIFICATION_PLAN.md.
//
// If CAMERA_BASE_URL / CAMERA_MESSMASS_INTERNAL_SECRET aren't configured,
// both functions return false without throwing (same "not configured, skip
// gracefully" contract the Resend-direct version had).

import config from './config';

function cameraBase(): string {
  return (config.cameraBaseUrl || '').replace(/\/$/, '');
}

function cameraToken(): string {
  return config.cameraProvisionToken || '';
}

function emailServiceConfigured(): boolean {
  return Boolean(config.cameraBaseUrl && config.cameraProvisionToken);
}

async function sendViaCameraEmailService(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!emailServiceConfigured()) {
    console.error('Email send skipped: CAMERA_BASE_URL / CAMERA_MESSMASS_INTERNAL_SECRET not configured');
    return { sent: false, error: 'camera_email_service_not_configured' };
  }

  try {
    const res = await fetch(`${cameraBase()}/api/internal/email/send`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-messmass-secret': cameraToken(),
        authorization: `Bearer ${cameraToken()}`,
      },
      body: JSON.stringify({ to: params.to, subject: params.subject, html: params.html, fromName: 'messmass' }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      data?: { sent?: boolean; error?: string; messageId?: string | null };
      error?: { message?: string };
    };

    if (!res.ok) {
      const message = json?.error?.message || `camera responded ${res.status}`;
      console.error('Email send failed (camera service error):', message);
      return { sent: false, error: message };
    }

    if (!json?.data?.sent) {
      console.error('Email send failed (Resend rejected via camera):', json?.data?.error);
      return { sent: false, error: json?.data?.error || 'unknown_error' };
    }

    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Email send failed (network error calling camera):', message);
    return { sent: false, error: message };
  }
}

/**
 * WHAT: Test email configuration
 * WHY: Verify the camera email service (and Resend behind it) works before relying on it
 */
export async function testEmailConfig(recipientEmail: string): Promise<boolean> {
  const result = await sendViaCameraEmailService({
    to: recipientEmail,
    subject: '✅ {messmass} Email Configuration Test',
    html: `
      <h2>Email Configuration Test</h2>
      <p>This is a test email from {messmass} to verify the email service configuration.</p>
      <p>If you received this email, your email notifications are working correctly!</p>
      <p><small>Sent at: ${new Date().toISOString()}</small></p>
    `,
  });

  if (result.sent) {
    console.log(`✅ Test email sent successfully to ${recipientEmail}`);
  }
  return result.sent;
}

/**
 * WHAT: Send new password to user
 * WHY: Send regenerated password securely via email
 */
export async function sendPasswordRegeneratedEmail(params: {
  userEmail: string;
  password: string;
}): Promise<boolean> {
  const result = await sendViaCameraEmailService({
    to: params.userEmail,
    subject: '🔐 {messmass} Access Password Regenerated',
    html: `
      <h2>Access Password Regenerated</h2>
      <p>A new access password has been generated for your account on {messmass}.</p>
      <div style="background: #f3f4f6; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; text-align: center;">
        <p style="margin-bottom: 0.5rem; color: #4b5563; font-size: 0.875rem;">Your new password:</p>
        <code style="font-size: 1.5rem; font-weight: bold; color: #111827; letter-spacing: 0.05em;">${params.password}</code>
      </div>
      <hr>
      <p><strong>Security Instructions:</strong></p>
      <ul>
        <li>Use your email (${params.userEmail}) and the password above to log in.</li>
        <li>For security, please do not share this password with anyone.</li>
      </ul>
      <p><small>This is an automated security message from {messmass}.</small></p>
    `,
  });

  if (result.sent) {
    console.log(`✅ Password email sent to ${params.userEmail}`);
  } else {
    console.error('Failed to send password email:', result.error);
  }
  return result.sent;
}
