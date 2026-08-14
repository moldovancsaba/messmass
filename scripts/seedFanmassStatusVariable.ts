// scripts/seedFanmassStatusVariable.ts
// WHAT: Register `fanmassStatus` in variables_metadata.
// WHY: fanmass pushes the value into projects.stats, but an unregistered stats key
//      is invisible to the product — it cannot be picked in a chart formula, has no
//      label or unit in the variables admin, and no validation catches a typo
//      referencing it. The value was already landing on live events (100 on the
//      UEFA Super Cup Fan Festival event) with nothing able to display it.
// HOW: Idempotent upsert keyed on `name`. Deliberately not a $set/$setOnInsert
//      split — a path conflict between those two operators is exactly what broke
//      fanmass's own createVariable upsert previously.

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

// WHAT: The variable definition.
// WHY: `editableInManual: false` records that this value is owned by fanmass — an
//      operator editing it by hand would be overwritten by the next push, so the
//      admin must not offer that.
// NOTE: `derived` must stay FALSE. In messmass `derived: true` means "computed by
//      the formula engine", and pushEventStats deliberately skips those so an
//      external writer cannot clobber a computed value. fanmassStatus is computed
//      by fanmass and pushed in, so marking it derived silently drops it from every
//      push — observed: applied fell from 12 keys to 11 with no error anywhere.
const FANMASS_STATUS_VARIABLE = {
  name: 'fanmassStatus',
  isSystem: false,
  type: 'percentage',
  category: 'Fanmass',
  label: 'Analysis progress (%)',
  description:
    'Percent of the event\'s Drive/camera images that fanmass has analysed (0-100). ' +
    'Written by fanmass, never computed in messmass. An event with no images reports 0, ' +
    'not 100 — waiting for media is not completion. An event whose images include ' +
    'permanent analysis failures never reaches 100, because a failed image counts ' +
    'toward the total but not toward analysed.',
  derived: false,
  flags: {
    visibleInClicker: false,
    editableInManual: false,
  },
  order: 999,
};

async function seedFanmassStatusVariable() {
  const client = new MongoClient(MONGODB_URI as string);
  try {
    await client.connect();
    const collection = client.db(MONGODB_DB).collection('variables_metadata');
    const now = new Date().toISOString();

    const existing = await collection.findOne({ name: FANMASS_STATUS_VARIABLE.name });
    if (existing) {
      await collection.updateOne(
        { name: FANMASS_STATUS_VARIABLE.name },
        { $set: { ...FANMASS_STATUS_VARIABLE, updatedAt: now } }
      );
      console.log(`updated  ${FANMASS_STATUS_VARIABLE.name}`);
    } else {
      await collection.insertOne({ ...FANMASS_STATUS_VARIABLE, createdAt: now, updatedAt: now });
      console.log(`created  ${FANMASS_STATUS_VARIABLE.name}`);
    }

    const stored = await collection.findOne({ name: FANMASS_STATUS_VARIABLE.name });
    console.log(`verified ${stored?.name} type=${stored?.type} label="${stored?.label}" derived=${stored?.derived}`);
  } finally {
    await client.close();
  }
}

seedFanmassStatusVariable().catch((error) => {
  console.error('seed failed:', error);
  process.exit(1);
});
