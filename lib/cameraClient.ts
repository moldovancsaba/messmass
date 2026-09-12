/**
 * Client for the camera provisioning API (camera PR #87). messmass (the master)
 * calls camera's token-authed /api/internal/messmass/* endpoints to create/link
 * organisations, partners and events. Auth = shared secret (config.cameraProvisionToken).
 */
import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';

/**
 * WHAT: Validates an inbound request claims to be camera, via the same
 *     shared secret used for the forward (messmass -> camera) direction.
 * WHY: Reused by every camera -> messmass inbound endpoint
 *     (app/api/integrations/camera/partners, app/api/integrations/camera/sso-session)
 *     so the check stays in exactly one place.
 */
export function assertCameraSecret(request: NextRequest): NextResponse | null {
  const configured = config.cameraProvisionToken;
  if (!configured) {
    return NextResponse.json({ success: false, error: 'camera_integration_not_configured' }, { status: 503 });
  }
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const headerSecret = request.headers.get('x-camera-secret')?.trim() || '';
  if (bearer !== configured && headerSecret !== configured) {
    return NextResponse.json({ success: false, error: 'invalid_camera_secret' }, { status: 401 });
  }
  return null;
}

function base(): string {
  return (config.cameraBaseUrl || '').replace(/\/$/, '');
}
function token(): string {
  return config.cameraProvisionToken || '';
}
export function cameraConfigured(): boolean {
  return Boolean(config.cameraBaseUrl && config.cameraProvisionToken);
}

async function req(method: string, path: string, body?: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-messmass-secret': token(),
      authorization: `Bearer ${token()}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`camera_${res.status}:${JSON.stringify(json).slice(0, 200)}`);
  }
  return (json.data !== undefined ? json.data : json) as Record<string, unknown>;
}

/**
 * WHAT: Best-effort cross-app login -- forwards the SSO tokens messmass just
 *     received to camera's /api/internal/messmass/sso-session, which
 *     independently re-verifies them against SSO and mints a REAL camera
 *     session if the user has camera access. Returns the Set-Cookie
 *     header(s) camera produced (to be appended onto messmass's own
 *     response), or null if camera is unconfigured, unreachable, or the
 *     user doesn't have camera access -- all non-fatal, never throws.
 * WHY: Together with SESSION_COOKIE_DOMAIN=.messmass.com on camera's side,
 *     this is what makes "log into messmass -> also logged into camera"
 *     work without a second OAuth round-trip. See docs/... shared session.
 */
export async function pushSsoSessionToCamera(tokens: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}): Promise<string[] | null> {
  if (!cameraConfigured()) return null;
  try {
    const res = await fetch(`${base()}/api/internal/messmass/sso-session`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-messmass-secret': token(),
        authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      }),
    });
    if (!res.ok) return null;
    const cookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    return cookies.length ? cookies : null;
  } catch {
    return null;
  }
}

export const cameraClient = {
  upsertOrganization: (name: string, messmassOrganizationId: string) =>
    req('POST', '/api/internal/messmass/organizations', { name, messmassOrganizationId }).then((d) => d.organization as { organizationId: string }),
  upsertPartner: (input: { name: string; messmassPartnerId: string; organizationId?: string; logoUrl?: string; cameraPartnerId?: string }) =>
    req('POST', '/api/internal/messmass/partners', input).then((d) => d.partner as { partnerId: string; linked: boolean; created: boolean }),
  findPartners: (params: { name?: string; messmassPartnerId?: string }) => {
    const q = new URLSearchParams();
    if (params.name) q.set('name', params.name);
    if (params.messmassPartnerId) q.set('messmassPartnerId', params.messmassPartnerId);
    return req('GET', `/api/internal/messmass/partners?${q.toString()}`).then((d) => (d.partners as Array<{ partnerId: string; name: string }>) || []);
  },
  // Existing camera events available for adoption (create/link a messmass event for each).
  listAdoptableEvents: (unlinkedOnly = false) =>
    req('GET', `/api/internal/messmass/events${unlinkedOnly ? '?unlinked=true' : ''}`).then(
      (d) => (d.events as Array<{ eventId: string; name: string; partnerId: string; partnerName: string | null; eventDate: string | null; messmassEventId: string | null }>) || [],
    ),
  // With cameraEventId: adopt that existing camera event; else create a new one.
  provisionEvent: (input: { messmassEventId: string; partnerId: string; eventName: string; eventDate?: string; cameraEventId?: string }) =>
    req('POST', '/api/internal/messmass/events', input).then((d) => d.event as { eventId: string; mongoId: string; created: boolean; adopted?: boolean }),
};
