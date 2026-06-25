#!/usr/bin/env tsx

import {
  EVENT_CONTEXT_CONTRACT,
  FANMASS_SUMMARY_CONTRACT,
} from '../lib/fanmassIntegration';

const requiredEnv = [
  'FANMASS_BASE_URL',
  'FANMASS_API_KEY',
  'FANMASS_INTEGRATION_TOKEN',
] as const;

function main() {
  const missing = requiredEnv.filter((name) => !process.env[name]);
  const checks = {
    eventContextContract: EVENT_CONTEXT_CONTRACT,
    analyticsSummaryContract: FANMASS_SUMMARY_CONTRACT,
    routeSurface: [
      '/api/integrations/fanmass/events/{eventId}/context',
      '/api/integrations/fanmass/events/{eventId}/link',
      '/api/integrations/fanmass/events/{eventId}/sync',
      '/api/integrations/fanmass/callbacks',
    ],
    missingOptionalRuntimeEnv: missing,
  };

  if (EVENT_CONTEXT_CONTRACT !== 'messmass.fanmass.event-context.v1') {
    throw new Error(`Unexpected event context contract: ${EVENT_CONTEXT_CONTRACT}`);
  }
  if (FANMASS_SUMMARY_CONTRACT !== 'fanmass.messmass.analytics-summary.v1') {
    throw new Error(`Unexpected Fanmass summary contract: ${FANMASS_SUMMARY_CONTRACT}`);
  }

  console.log(JSON.stringify({ ok: true, checks }, null, 2));
}

main();
