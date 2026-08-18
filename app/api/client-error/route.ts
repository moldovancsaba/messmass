// app/api/client-error/route.ts
// WHAT: Receives a client-side render/runtime error report from app/error.tsx
//     and records it via the server structured logger, so a browser-only
//     crash (never touches an API route, so it never appears in server
//     request logs) is still queryable afterward.
// WHY: A production crash under app/error.tsx only logs to the browser
//     console today, which nobody sees. Every prior debugging attempt for
//     such a crash has to guess from source and server logs alone.
// AUTH: none required deliberately — a crash can happen to a logged-out
//     visitor too, and this must never itself become a second point of
//     failure for the error page. No admin/session data is included beyond
//     whatever the client explicitly reports.

import { NextResponse } from 'next/server';
import { error as logError } from '@/lib/logger';
import { sanitizePlainText } from '@/lib/sanitize';

const MAX_BODY_BYTES = 20 * 1024; // 20 KB
const MAX_MESSAGE_LEN = 2000;
const MAX_STACK_LEN = 8000;
const MAX_DIGEST_LEN = 100;
const MAX_PATHNAME_LEN = 500;
const MAX_USER_AGENT_LEN = 500;

export async function POST(request: Request) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, error: 'Request too large.' }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const message = sanitizePlainText(body.message, MAX_MESSAGE_LEN) || 'Unknown client error';
    const stack = sanitizePlainText(body.stack, MAX_STACK_LEN);
    const digest = sanitizePlainText(body.digest, MAX_DIGEST_LEN);
    const pathname = sanitizePlainText(body.pathname, MAX_PATHNAME_LEN);
    const userAgent = sanitizePlainText(request.headers.get('user-agent'), MAX_USER_AGENT_LEN);

    const reconstructed = new Error(message);
    if (stack) reconstructed.stack = stack;

    logError('Client-side render error', { pathname, digest, userAgent, tags: ['client-error'] }, reconstructed);

    return NextResponse.json({ success: true });
  } catch (err) {
    // This endpoint exists to record failures; it must never itself throw
    // in a way that surfaces to the already-broken page.
    logError('client-error route failed to record a report', {}, err instanceof Error ? err : undefined);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
