// scripts/copy-maplibre-worker.mjs
// WHAT: Copies the MapLibre GL worker and the module it imports into public/maplibre/dist before `next dev` and `next build`.
// WHY: MapLibre GL 6 ships as ES modules only and finds its worker through import.meta.url, which a bundler does not keep.
//     For Next.js its documentation says to serve maplibre-gl-worker.mjs and maplibre-gl-shared.mjs (the worker imports it
//     by relative path) from public/ and point setWorkerUrl at it (components/theme/interactive-report/TerritoryMapCanvas.tsx).
//     Copied from node_modules on every build, so the files always match the installed version; public/maplibre is ignored by
//     git. The folder is named dist because they are the library's built files: the source checks (gds-compliance) skip it.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const dist = path.join(path.dirname(createRequire(import.meta.url).resolve('maplibre-gl/package.json')), 'dist');
const dest = path.join(process.cwd(), 'public', 'maplibre', 'dist');

mkdirSync(dest, { recursive: true });
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  copyFileSync(path.join(dist, file), path.join(dest, file));
}
