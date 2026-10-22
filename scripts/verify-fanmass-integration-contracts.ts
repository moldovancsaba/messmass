#!/usr/bin/env tsx

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PHOTO_ANALYSIS_CONTRACT } from '../lib/fanmassPhotoAnalyses';

const requiredPhotoRoute = resolve(
  process.cwd(),
  'app/api/integrations/fanmass/events/[eventId]/photos/[photoId]/route.ts',
);
const retiredRoutes = [
  'app/api/integrations/fanmass/events/[eventId]/context/route.ts',
  'app/api/integrations/fanmass/partners/route.ts',
  'app/api/integrations/fanmass/partners/[partnerId]/events/route.ts',
  'app/api/integrations/fanmass/variables/route.ts',
];

const photoRouteSource = readFileSync(requiredPhotoRoute, 'utf8');
if (PHOTO_ANALYSIS_CONTRACT !== 'fanmass.messmass.photo-analysis.v2') {
  throw new Error(`Unexpected photo result contract: ${PHOTO_ANALYSIS_CONTRACT}`);
}
if (!photoRouteSource.includes('storeFanmassPhotoAnalysis') || !photoRouteSource.includes('tombstoneFanmassPhotoAnalysis')) {
  throw new Error('The active Fanmass photo route must support one photo result and its tombstone.');
}

const missingRetirements = retiredRoutes.filter((route) => {
  const source = readFileSync(resolve(process.cwd(), route), 'utf8');
  return !source.includes('retiredFanmassEndpoint');
});
if (missingRetirements.length) {
  throw new Error(`Legacy Fanmass lookup routes are not retired: ${missingRetirements.join(', ')}`);
}

console.log(JSON.stringify({
  ok: true,
  cameraPhotoResultContract: PHOTO_ANALYSIS_CONTRACT,
  photoResultRoute: 'POST and DELETE one photo per request',
  retiredLookupRoutes: retiredRoutes,
  cameraPhotoFlowReadsMessmassContext: false,
}, null, 2));
