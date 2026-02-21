import { NextResponse } from 'next/server';
import { createContactInquiry } from '@/lib/contactInquiries';
import { sanitizePlainText } from '@/lib/sanitize';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Max request body size (bytes) to prevent abuse */
const MAX_BODY_BYTES = 50 * 1024; // 50 KB

const MAX_NAME_LEN = 200;
const MAX_EMAIL_LEN = 320;
const MAX_MESSAGE_LEN = 10_000;

export async function POST(request: Request) {
  try {
    // WHAT: Reject oversized bodies to prevent DoS and memory exhaustion
    const contentLength = request.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Request too large.' },
        { status: 413 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body.' },
        { status: 400 }
      );
    }
    const rawName = typeof body.name === 'string' ? body.name : '';
    const rawEmail = typeof body.email === 'string' ? body.email : '';
    const rawMessage = typeof body.message === 'string' ? body.message : '';

    // WHAT: Sanitize and length-limit to prevent injection and storage abuse
    const name = sanitizePlainText(rawName, MAX_NAME_LEN);
    const email = sanitizePlainText(rawEmail, MAX_EMAIL_LEN).toLowerCase();
    const message = sanitizePlainText(rawMessage, MAX_MESSAGE_LEN);

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    await createContactInquiry({ name, email, message });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact API error:', err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
