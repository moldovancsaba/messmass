// app/api/integrations/fanmass/commands/[commandId]/route.ts
// WHAT: Acknowledge a command — called once fanmass has actually applied it,
//       not on receipt, so a crash in between leaves it for the next poll to
//       retry. Optional JSON body: { ackResult?: Record<string, unknown> },
//       carried through to the ledger (e.g. settings.update's
//       restartRequired flag) — see lib/fanmassCommands.ts for why this
//       departs from the bare-DELETE rescan-ack pattern.
// AUTH: requireFanmassIntegrationAuth (same bearer/x-api-key token as the
//       rest of the /api/integrations/fanmass/** surface).

import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { ackCommand } from '@/lib/fanmassCommands';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commandId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const { commandId } = await params;
    const rawBody = await request.text();
    let ackResult: Record<string, unknown> | undefined;
    if (rawBody) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400, code: 'INVALID_COMMAND_ID' });
      }
      const body = parsed as Record<string, unknown>;
      if (body.ackResult !== undefined) {
        if (typeof body.ackResult !== 'object' || body.ackResult === null || Array.isArray(body.ackResult)) {
          throw Object.assign(new Error('ackResult must be a plain object.'), { status: 400, code: 'INVALID_COMMAND_ID' });
        }
        ackResult = body.ackResult as Record<string, unknown>;
      }
    }
    const result = await ackCommand(commandId, ackResult);
    return jsonSuccess(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
