/**
 * Client for the camera provisioning API (camera PR #87). messmass (the master)
 * calls camera's token-authed /api/internal/messmass/* endpoints to create/link
 * organisations, partners and events. Auth = shared secret (config.cameraProvisionToken).
 */
import config from '@/lib/config';

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
