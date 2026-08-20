import { MongoClient } from 'mongodb';
import fs from 'fs';
for (const line of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g,'');
}
const c = new MongoClient(process.env.MONGODB_URI); await c.connect();
const db = c.db('messmass');

const projects = await db.collection('projects').find({}, { projection:{ stats:1 } }).toArray();
const statKeyCount = {};
for (const p of projects) for (const k of Object.keys(p.stats||{})) statKeyCount[k]=(statKeyCount[k]||0)+1;

// scan EVERY collection that can reference a variable token [name]
const refCols = ['chart_configurations','charts','report_templates','report_variants',
  'reports','reports_v12','chart_algorithms_backup','chart_formatting_defaults','variablesGroups','variables_groups'];
const usedBy = {}; // var -> set of collections
async function scan(col){
  const docs = await db.collection(col).find({}).toArray().catch(()=>[]);
  for (const doc of docs)
    for (const m of JSON.stringify(doc).matchAll(/\[([a-zA-Z][a-zA-Z0-9_.]+)\]/g)){
      (usedBy[m[1]] ??= new Set()).add(col);
    }
  return docs.length;
}
const scanned = {};
for (const col of refCols) scanned[col] = await scan(col);

// clicker sets: which variables operators can tap during an event
const clickerCols = (await db.listCollections().toArray()).map(x=>x.name).filter(n=>/click/i.test(n));
const clickerVars = new Set();
for (const col of clickerCols){
  const docs = await db.collection(col).find({}).toArray().catch(()=>[]);
  for (const doc of docs) for (const m of JSON.stringify(doc).matchAll(/["']([a-zA-Z][a-zA-Z0-9_]+)["']/g)){
    if (statKeyCount[m[1]]!==undefined) clickerVars.add(m[1]);
  }
}

const meta = await db.collection('variables_metadata').find({}).toArray();
const usedAnywhere = new Set(Object.keys(usedBy));
const out = {
  scanned, clickerCols,
  totals:{ projects:projects.length, distinctStatKeys:Object.keys(statKeyCount).length,
    variablesMetadata:meta.length, usedAnywhere:usedAnywhere.size, clickerVars:clickerVars.size },
  statKeys: statKeyCount,
  usedBy: Object.fromEntries(Object.entries(usedBy).map(([k,v])=>[k,[...v]])),
  clickerVars:[...clickerVars].sort(),
  metaNames: meta.map(m=>m.name).filter(Boolean).sort(),
};
fs.writeFileSync('/private/tmp/claude-501/-Users-Shared-Projects-messmass/f30da9ac-67e8-4460-82f8-6058344292a0/scratchpad/varaudit2.json', JSON.stringify(out,null,1));
console.log(JSON.stringify({scanned, clickerCols, totals:out.totals},null,1));
await c.close();
