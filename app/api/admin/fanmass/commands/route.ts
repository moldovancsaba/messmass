// app/api/admin/fanmass/commands/route.ts
// WHAT: Admin-session-authenticated write side of the Fanmass command queue —
//     the human-operator boundary, opposite auth from the fanmass-facing
//     GET/DELETE pair under /api/integrations/fanmass/commands.
// WHY: An operator action in the Run Control / Entity Curation / Settings
//     tabs has nothing to submit to without this. Never accepts the fanmass
//     integration token as an alternative credential — mixing the two would
//     let anyone holding that lower-friction, broader-scoped token also
//     enqueue admin-only commands.
// AUTH: getAdminUser() + role check (admin/superadmin) — same posture as the
//     rescan-trigger POST this mirrors.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, type AdminUser } from '@/lib/auth';
import { createCommand, findPendingDuplicate, type FanmassCommandType } from '@/lib/fanmassCommands';
import { findDisallowedSettingsKeys } from '@/lib/fanmassSettingsAllowlist';
import { error as logError } from '@/lib/logger';

function isAdmin(user: AdminUser | null): user is AdminUser {
  return user !== null && (user.role === 'admin' || user.role === 'superadmin');
}

const KNOWN_COMMAND_TYPES: FanmassCommandType[] = [
  'run_control.start_batch',
  'run_control.stop_batch',
  'entity.confirm_cluster',
  'entity.reject_cluster',
  'entity.rename',
  'entity.merge',
  'settings.update',
  'settings.rotateApiKey',
];

// WHAT: Minimal per-type shape check — presence of required keys only, not
//     full validation (fanmass's own dispatcher does the real work and
//     surfaces its own errors on ack).
function validatePayloadShape(type: FanmassCommandType, payload: Record<string, unknown>): string | null {
  switch (type) {
    case 'run_control.start_batch':
      return typeof payload.batchId === 'string' && payload.batchId.trim() ? null : 'batchId is required.';
    case 'run_control.stop_batch':
      return typeof payload.batchId === 'string' && payload.batchId.trim() && typeof payload.runId === 'string' && payload.runId.trim()
        ? null
        : 'batchId and runId are required.';
    case 'entity.confirm_cluster':
    case 'entity.reject_cluster':
      return typeof payload.batchId === 'string' && payload.batchId.trim() && payload.clusterId !== undefined
        ? null
        : 'batchId and clusterId are required.';
    case 'entity.rename':
      return typeof payload.entityId === 'string' && payload.entityId.trim() ? null : 'entityId is required.';
    case 'entity.merge':
      return typeof payload.entityId === 'string' && typeof payload.sourceId === 'string' && payload.entityId.trim() && payload.sourceId.trim()
        ? null
        : 'entityId and sourceId are required.';
    case 'settings.update':
      return Object.keys(payload).length > 0 ? null : 'payload must contain at least one setting or rotateApiKey.';
    case 'settings.rotateApiKey':
      return null;
    default:
      return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in to enqueue Fanmass commands.' } },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as { type?: string; payload?: Record<string, unknown> };
    const { type, payload } = body;

    if (!type || !KNOWN_COMMAND_TYPES.includes(type as FanmassCommandType)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_COMMAND_TYPE', message: `type must be one of: ${KNOWN_COMMAND_TYPES.join(', ')}` } },
        { status: 400 }
      );
    }
    const cmdType = type as FanmassCommandType;
    const cmdPayload = payload || {};

    const shapeError = validatePayloadShape(cmdType, cmdPayload);
    if (shapeError) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_COMMAND_PAYLOAD', message: shapeError } }, { status: 400 });
    }

    // settings.update gets a second, independent allowlist check — defense
    // in depth alongside the Settings tab's own client-side gate and
    // fanmass's config.py allowlist (lib/fanmassSettingsAllowlist.ts).
    if (cmdType === 'settings.update') {
      const disallowed = findDisallowedSettingsKeys(cmdPayload);
      if (disallowed.length > 0) {
        return NextResponse.json(
          { success: false, error: { code: 'SETTING_NOT_ALLOWLISTED', message: `"${disallowed[0]}" is not an allowed setting.` } },
          { status: 400 }
        );
      }
    }

    const duplicate = await findPendingDuplicate(cmdType, cmdPayload);
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_PENDING_COMMAND', message: `A ${cmdType} command is already pending.` } },
        { status: 409 }
      );
    }

    const requestedBy = user.email || user.name || user.id;
    const command = await createCommand(cmdType, cmdPayload, requestedBy);
    return NextResponse.json(
      { success: true, data: { id: command.commandId, type: command.type, status: command.status, requestedAt: command.requestedAt } },
      { status: 201 }
    );
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    logError('POST /api/admin/fanmass/commands error', { context: 'fanmass-commands' }, err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json(
      { success: false, error: { message: (err as Error).message || 'Could not enqueue command.' } },
      { status }
    );
  }
}
