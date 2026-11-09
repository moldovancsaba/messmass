import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { MongoClient, ObjectId } from 'mongodb';
import { syncPartnerToV3Entity } from '../lib/v3/syncEngine';
import { generateUniquePartnerViewSlug } from '../lib/partnerIdentifier';

// Definite new club partners to create with confidence
const CONFIDENT_NEW_PARTNERS: Array<{
  name: string;
  emoji: string;
  sport: string;
  aliases: string[];
}> = [
  {
    name: 'Beretta Famila Schio',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['famila schio', 'schio', 'beretta famila'],
  },
  {
    name: 'KKZ Crvena Zvezda',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['crvena zvezda', 'red star belgrade basketball'],
  },
  {
    name: 'Tango Bourges Basket',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['bourges', 'bourges basket'],
  },
  {
    name: 'Emlak Konut',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['emlak konut sk'],
  },
  {
    name: 'Casademont Zaragoza',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['zaragoza basket'],
  },
  {
    name: 'Basket Landes',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['landes basket'],
  },
  {
    name: 'Valencia Basket Club',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['valencia basket', 'valencia bc'],
  },
  {
    name: 'Fenerbahce Tarfin',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['fenerbahce basket', 'fenerbahçe'],
  },
  {
    name: 'Arsenal FC',
    emoji: '⚽',
    sport: 'Football',
    aliases: ['arsenal'],
  },
  {
    name: 'Israel Basketball',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['israel'],
  },
];

// Special mapping for single-partner non-fixtures or alias normalization
const SPECIAL_SINGLE_PARTNER_MAPPINGS: Array<{ pattern: RegExp; partnerName: string }> = [
  { pattern: /debreceni vsc ai analytics/i, partnerName: 'Debreceni VSC' },
  { pattern: /mksz szuperkupa/i, partnerName: 'MKSZ - Magyar Kézilabda Szövetség' },
  { pattern: /férfi magyar kupa/i, partnerName: 'MKSZ - Magyar Kézilabda Szövetség' },
  { pattern: /női magyar kupa/i, partnerName: 'MKSZ - Magyar Kézilabda Szövetség' },
  { pattern: /killik lászló női magyar kupa/i, partnerName: 'MKOSZ - Magyar Kosárlabdázók Országos Szövetsége' },
  { pattern: /zsíros tibor férfi magyar kupa/i, partnerName: 'MKOSZ - Magyar Kosárlabdázók Országos Szövetsége' },
  { pattern: /motogp.*balatonpark/i, partnerName: 'Balaton Park Circuit' },
];

const NON_FIXTURE_PATTERNS = [
  /statisztika/i,
  /fanzone/i,
  /fan wall/i,
  /take the pledge/i,
  /magic/i,
  /brain bar/i,
  /exatlon/i,
  /bajnokság/i,
  /final4/i,
  /döntő/i,
  /lupetto day/i,
  /családi nap/i,
  /fiba 3x3/i,
  /plázs/i,
  /kampány/i,
];

function isNonFixture(eventName: string): boolean {
  return NON_FIXTURE_PATTERNS.some((rx) => rx.test(eventName));
}

function parseTeams(eventName: string): { home: string; away: string } | null {
  if (isNonFixture(eventName)) return null;

  const separators = [' x ', ' vs ', ' - '];
  for (const sep of separators) {
    if (eventName.includes(sep)) {
      const parts = eventName.split(sep).map((s) => s.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        return { home: parts[0], away: parts[1] };
      }
    }
  }
  return null;
}

export async function runMaintenance(applyChanges = false) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/messmass';
  const client = await MongoClient.connect(mongoUri);
  const db = client.db('messmass');
  console.log(`\n========================================`);
  console.log(`PROJECT-PARTNER MAINTENANCE (applyChanges: ${applyChanges})`);
  console.log(`========================================\n`);

  // 1. Ensure confident new club partners exist
  let partners = await db.collection('partners').find({}).toArray();
  const createdPartners: string[] = [];

  for (const candidate of CONFIDENT_NEW_PARTNERS) {
    const candidateNorm = candidate.name.toLowerCase().trim();
    const existing = partners.find((p) => {
      const pName = (p.name || '').toLowerCase().trim();
      return pName === candidateNorm || candidate.aliases.some((a) => a.toLowerCase() === pName);
    });

    if (!existing) {
      if (applyChanges) {
        const viewSlug = await generateUniquePartnerViewSlug(db as any);
        const partnerData: any = {
          name: candidate.name,
          emoji: candidate.emoji,
          slug: candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
          viewSlug,
          categorizedHashtags: {
            sport: [candidate.sport.toLowerCase()],
          },
          hashtags: [candidate.name.replace(/\s+/g, '').toLowerCase()],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const res = await db.collection('partners').insertOne(partnerData);
        syncPartnerToV3Entity({ ...partnerData, _id: res.insertedId }).catch(() => {});
        createdPartners.push(`[CREATED] ${candidate.name} (${res.insertedId})`);
      } else {
        createdPartners.push(`[WOULD CREATE] ${candidate.name} (${candidate.emoji}, ${candidate.sport})`);
      }
    }
  }

  // Refresh partners if we created any
  if (applyChanges && createdPartners.length > 0) {
    partners = await db.collection('partners').find({}).toArray();
  }

  console.log(`Step 1: Partner Creation: ${createdPartners.length} operations`);
  createdPartners.forEach((cp) => console.log(`   ${cp}`));

  // Helper to match partner
  function resolvePartner(teamName: string) {
    if (!teamName) return null;
    const clean = teamName.replace(/^\[.*?\]\s*/, '').replace(/^[^\w\s\u00C0-\u024F]+/u, '').trim().toLowerCase();

    // Exact or direct alias match
    let match = partners.find((p) => {
      const pName = (p.name || '').toLowerCase().trim();
      return pName === clean || pName === teamName.toLowerCase().trim();
    });

    if (match) return match;

    // Specific Hungarian/International alias aliases
    if (clean.includes('mlsz') || clean.includes('hungary soccer')) {
      match = partners.find((p) => p.name && p.name.includes('MLSZ'));
    } else if (clean.includes('psg') || clean === 'paris saint-germain') {
      match = partners.find((p) => p.name && p.name.toLowerCase().includes('paris saint-germain'));
    } else if (clean.includes('rögle') || clean.includes('rogle')) {
      match = partners.find((p) => p.name && (p.name.includes('Rögle') || p.name.includes('Rogle')));
    } else if (clean.includes('debrecen') || clean === 'dvsc') {
      match = partners.find((p) => p.name && (p.name.includes('Debrecen') || p.name.includes('DVSC')));
    } else if (clean.includes('pick szeged')) {
      match = partners.find((p) => p.name && p.name.includes('PICK Szeged'));
    } else if (clean.includes('veszprém') || clean.includes('veszprem')) {
      match = partners.find((p) => p.name && (p.name.includes('Veszprém') || p.name.includes('Veszprem')));
    } else if (clean.includes('crvena zvezda')) {
      match = partners.find((p) => p.name && p.name.includes('Crvena Zvezda'));
    } else if (clean.includes('famila schio')) {
      match = partners.find((p) => p.name && p.name.includes('Famila Schio'));
    } else if (clean.includes('bourges')) {
      match = partners.find((p) => p.name && p.name.includes('Bourges'));
    } else if (clean.includes('emlak')) {
      match = partners.find((p) => p.name && p.name.includes('Emlak'));
    } else if (clean.includes('zaragoza')) {
      match = partners.find((p) => p.name && p.name.includes('Zaragoza'));
    } else if (clean.includes('landes')) {
      match = partners.find((p) => p.name && p.name.includes('Landes'));
    } else if (clean.includes('valencia')) {
      match = partners.find((p) => p.name && p.name.includes('Valencia'));
    } else if (clean.includes('fenerbahce')) {
      match = partners.find((p) => p.name && p.name.includes('Fenerbahce'));
    }

    if (match) return match;

    // Substring containment fallback (high confidence only)
    return partners.find((p) => {
      const pName = (p.name || '').toLowerCase().trim();
      return pName.length > 4 && (pName.includes(clean) || clean.includes(pName));
    }) || null;
  }

  // 2. Scan projects with missing partners
  const projects = await db.collection('projects').find({
    $or: [{ partner1: null }, { partner1: { $exists: false } }],
  }).sort({ createdAt: -1 }).toArray();

  console.log(`\nStep 2: Processing ${projects.length} projects without partner1...`);

  let linkedFixturesCount = 0;
  let linkedSinglePartnerCount = 0;
  let skippedNonFixturesCount = 0;

  for (const project of projects) {
    const eventName = project.eventName || '';

    // Check special single partner patterns first
    let singlePartnerMatch = null;
    for (const sp of SPECIAL_SINGLE_PARTNER_MAPPINGS) {
      if (sp.pattern.test(eventName)) {
        singlePartnerMatch = partners.find((p) => p.name === sp.partnerName);
        break;
      }
    }

    if (singlePartnerMatch) {
      if (applyChanges) {
        await db.collection('projects').updateOne(
          { _id: project._id },
          { $set: { partner1: singlePartnerMatch._id } }
        );
      }
      linkedSinglePartnerCount++;
      console.log(`   [SINGLE-PARTNER] "${eventName}" -> P1: "${singlePartnerMatch.name}"`);
      continue;
    }

    const teams = parseTeams(eventName);
    if (!teams) {
      skippedNonFixturesCount++;
      continue;
    }

    const homePartner = resolvePartner(teams.home);
    const awayPartner = resolvePartner(teams.away);

    if (homePartner) {
      const updateDoc: any = { partner1: homePartner._id };
      if (awayPartner) {
        updateDoc.partner2 = awayPartner._id;
      }

      if (applyChanges) {
        await db.collection('projects').updateOne(
          { _id: project._id },
          { $set: updateDoc }
        );
      }
      linkedFixturesCount++;
      console.log(
        `   [FIXTURE LINKED] "${eventName}" -> P1: "${homePartner.name}"${
          awayPartner ? ` | P2: "${awayPartner.name}"` : ' | P2: [none]'
        }`
      );
    }
  }

  console.log(`\n========================================`);
  console.log(`MAINTENANCE SUMMARY:`);
  console.log(`- New partners created: ${createdPartners.length}`);
  console.log(`- Fixture projects linked: ${linkedFixturesCount}`);
  console.log(`- Single-partner special projects linked: ${linkedSinglePartnerCount}`);
  console.log(`- Skipped non-fixture activations: ${skippedNonFixturesCount}`);
  console.log(`========================================\n`);
}

// CLI execution
if (require.main === module) {
  const apply = process.argv.includes('--apply');
  require('dotenv').config({ path: '.env.local' });
  runMaintenance(apply)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
