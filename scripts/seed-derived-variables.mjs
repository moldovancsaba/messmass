// Seed the derived-variable config (data-driven totals for the event editor).
// Idempotent upsert. These formulas replace the hardcoded totals in
// EditorDashboard.tsx so no variable name is hardcoded and renames propagate
// via the /admin/kyc merge (which rewrites [tokens] here too).
import { MongoClient } from 'mongodb';
import fs from 'fs';
for (const l of fs.readFileSync('.env.local','utf8').split('\n')){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const c = new MongoClient(process.env.MONGODB_URI); await c.connect();
const db = c.db('messmass');
const doc = {
  _id: 'default',
  totals: [
    { key: 'totalGender', label: 'Gender total', formula: '[female]+[male]' },
    { key: 'totalUnder40', label: 'Under 40', formula: '[genAlpha]+[genYZ]' },
    { key: 'totalOver40', label: 'Over 40', formula: '[genX]+[boomer]' },
    { key: 'totalAge', label: 'Age total', formula: '[genAlpha]+[genYZ]+[genX]+[boomer]' },
    { key: 'totalMerch', label: 'Merch total', formula: '[merched]+[jersey]+[scarf]+[flags]+[baseballCap]+[other]' },
  ],
  // remoteFans keeps its "use stored value, else indoor+outdoor" fallback; names are data.
  fans: { remoteFansVar: 'remoteFans', stadiumVar: 'stadium', remoteFansFallbackFormula: '[indoor]+[outdoor]' },
  updatedAt: new Date().toISOString(),
};
await db.collection('derived_variable_config').replaceOne({ _id: 'default' }, doc, { upsert: true });
console.log('seeded derived_variable_config/default:', JSON.stringify(doc).length, 'bytes');
await c.close();
