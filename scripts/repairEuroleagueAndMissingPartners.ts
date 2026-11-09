import { MongoClient, ObjectId, Db } from 'mongodb';
import { randomUUID } from 'crypto';

const CLUSTERS = [
  {
    name: 'Primary (camaraclastar)',
    uri: 'mongodb+srv://moldovancsaba_db_user:wMP6z5B3ft5mmyI0@camaraclastar.koyedpi.mongodb.net/?retryWrites=true&w=majority&appName=camaraclastar',
  },
  {
    name: 'Secondary (r96vlxs)',
    uri: 'mongodb+srv://messmass:mirdob-5kykku-qozGym@messmass-cluster.r96vlxs.mongodb.net/?appName=messmass-cluster',
  },
];

const NEW_PARTNERS = [
  {
    name: 'Galatasaray Cagdas Faktoring',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['galatasaray', 'galatasaray çağdaş faktoring', 'galatasaray basketbol'],
    country: 'Turkey',
  },
  {
    name: 'Flammes Carolo Basket',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['flammes carolo', 'carolo basket'],
    country: 'France',
  },
  {
    name: 'Valencia Basket Club',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['valencia basket', 'valencia bc'],
    country: 'Spain',
  },
  {
    name: 'KKZ Crvena Zvezda',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['crvena zvezda', 'red star belgrade'],
    country: 'Serbia',
  },
  {
    name: 'Tango Bourges Basket',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['bourges', 'bourges basket'],
    country: 'France',
  },
  {
    name: 'Emlak Konut',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['emlak konut sk'],
    country: 'Turkey',
  },
  {
    name: 'Casademont Zaragoza',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['zaragoza basket', 'basket zaragoza'],
    country: 'Spain',
  },
  {
    name: 'Basket Landes',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['landes basket'],
    country: 'France',
  },
  {
    name: 'Arsenal FC',
    emoji: '⚽',
    sport: 'Football',
    aliases: ['arsenal'],
    country: 'England',
  },
  {
    name: 'Iceland Basketball',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['iceland'],
    country: 'Iceland',
  },
  {
    name: 'Geneve Servette HC',
    emoji: '🏒',
    sport: 'Ice Hockey',
    aliases: ['geneve servette', 'genève-servette hc', 'geneve servette / ch'],
    country: 'Switzerland',
  },
  {
    name: 'Elche CF',
    emoji: '⚽',
    sport: 'Football',
    aliases: ['elche'],
    country: 'Spain',
  },
  {
    name: 'Israel Basketball',
    emoji: '🏀',
    sport: 'Basketball',
    aliases: ['israel'],
    country: 'Israel',
  },
];

async function ensurePartners(db: Db): Promise<Map<string, ObjectId>> {
  const existing = await db.collection('partners').find({}).toArray();
  const partnerMap = new Map<string, ObjectId>();

  for (const p of existing) {
    const norm = (p.name || '').toLowerCase().trim();
    partnerMap.set(norm, p._id);
    if (Array.isArray(p.hashtags)) {
      for (const h of p.hashtags) partnerMap.set(h.toLowerCase(), p._id);
    }
  }

  for (const candidate of NEW_PARTNERS) {
    const cNorm = candidate.name.toLowerCase().trim();
    let foundId = partnerMap.get(cNorm);

    if (!foundId) {
      for (const alias of candidate.aliases) {
        if (partnerMap.has(alias.toLowerCase())) {
          foundId = partnerMap.get(alias.toLowerCase());
          break;
        }
      }
    }

    if (!foundId) {
      const slug = candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const viewSlug = randomUUID();
      const insertDoc: any = {
        name: candidate.name,
        emoji: candidate.emoji,
        slug,
        viewSlug,
        categorizedHashtags: {
          sport: [candidate.sport.toLowerCase()],
        },
        hashtags: [candidate.name.replace(/\s+/g, '').toLowerCase(), ...candidate.aliases.map(a => a.replace(/\s+/g, '').toLowerCase())],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const res = await db.collection('partners').insertOne(insertDoc);
      foundId = res.insertedId;
      console.log(`  [+] Created partner: ${candidate.name} (${foundId.toString()})`);
    }

    partnerMap.set(cNorm, foundId);
    for (const a of candidate.aliases) {
      partnerMap.set(a.toLowerCase().trim(), foundId);
    }
  }

  return partnerMap;
}

export async function runRepair(applyChanges = false) {
  // Sync missing projects from Primary to Secondary if applyChanges
  if (applyChanges) {
    try {
      const primaryClient = await MongoClient.connect(CLUSTERS[0].uri);
      const secondaryClient = await MongoClient.connect(CLUSTERS[1].uri);
      const priProjects = primaryClient.db('messmass').collection('projects');
      const secProjects = secondaryClient.db('messmass').collection('projects');

      const slugsToSync = [
        'e680aeef-5e0a-4627-bce6-1d0ebda3e3bb', // Beretta Famila Schio - Galatasaray Cagdas Faktoring
        'b3850171-27bf-4fff-bfc5-39f5b6dac376', // Galatasaray Cagdas Faktoring - KKZ Crvena Zvezda
        '60b08433-b561-49e2-ac13-468243b3b681', // Fenerbahce Tarfin - Valencia Basket Club
        'acd1dd36-7adf-4557-b0cc-457152217077', // Fenerbahce Tarfin - Flammes Carolo Basket
      ];

      for (const slug of slugsToSync) {
        const doc = await priProjects.findOne({ editSlug: slug });
        if (doc) {
          await secProjects.updateOne({ editSlug: slug }, { $set: doc }, { upsert: true });
          console.log(`Synced project to secondary cluster: ${doc.eventName}`);
        }
      }

      await primaryClient.close();
      await secondaryClient.close();
    } catch (e) {
      console.warn('Project sync error:', e);
    }
  }

  for (const cluster of CLUSTERS) {
    console.log(`\n======================================================`);
    console.log(`Running repair on ${cluster.name} (apply: ${applyChanges})`);
    console.log(`======================================================\n`);

    const client = await MongoClient.connect(cluster.uri);
    const db = client.db('messmass');

    const partnerMap = await ensurePartners(db);

    // Helper to find partner ID by name or alias
    function findId(name: string): ObjectId | null {
      const low = name.toLowerCase().trim();
      if (partnerMap.has(low)) return partnerMap.get(low)!;
      for (const [key, id] of partnerMap.entries()) {
        if (key.includes(low) || low.includes(key)) return id;
      }
      return null;
    }

    // Organization ID for EuroLeague Women
    const elOrg = await db.collection('organizations').findOne({ name: { $regex: 'EuroLeague Women', $options: 'i' } });
    const elOrgId = elOrg?._id || new ObjectId('6af1b292aba7ef5227678119');

    // 1. Explicit EuroLeague Women match pairings
    const EUROLEAGUE_MATCHES: Array<{
      matchPattern: RegExp;
      homeTeam: string;
      awayTeam: string;
    }> = [
      {
        matchPattern: /Beretta Famila Schio.*Galatasaray/i,
        homeTeam: 'Beretta Famila Schio',
        awayTeam: 'Galatasaray Cagdas Faktoring',
      },
      {
        matchPattern: /Galatasaray.*KKZ Crvena Zvezda/i,
        homeTeam: 'Galatasaray Cagdas Faktoring',
        awayTeam: 'KKZ Crvena Zvezda',
      },
      {
        matchPattern: /Fenerbahce.*Valencia/i,
        homeTeam: 'Fenerbahce Tarfin',
        awayTeam: 'Valencia Basket Club',
      },
      {
        matchPattern: /Valencia.*Fenerbahce/i,
        homeTeam: 'Valencia Basket Club',
        awayTeam: 'Fenerbahce Tarfin',
      },
      {
        matchPattern: /Fenerbahce.*Flammes Carolo/i,
        homeTeam: 'Fenerbahce Tarfin',
        awayTeam: 'Flammes Carolo Basket',
      },
      {
        matchPattern: /Tango Bourges.*Emlak Konut/i,
        homeTeam: 'Tango Bourges Basket',
        awayTeam: 'Emlak Konut',
      },
      {
        matchPattern: /Casademont Zaragoza.*Basket Landes/i,
        homeTeam: 'Casademont Zaragoza',
        awayTeam: 'Basket Landes',
      },
      {
        matchPattern: /Beretta Famila Schio.*KKZ Crvena Zvezda/i,
        homeTeam: 'Beretta Famila Schio',
        awayTeam: 'KKZ Crvena Zvezda',
      },
    ];

    console.log('--- Fixing EuroLeague Women Matches ---');
    for (const em of EUROLEAGUE_MATCHES) {
      const project = await db.collection('projects').findOne({ eventName: em.matchPattern });
      if (!project) {
        console.log(`  [!] Project not found for pattern: ${em.matchPattern}`);
        continue;
      }

      const hId = findId(em.homeTeam);
      const aId = findId(em.awayTeam);

      if (!hId || !aId) {
        console.log(`  [ERROR] Could not resolve IDs for ${em.homeTeam} (${hId}) or ${em.awayTeam} (${aId})`);
        continue;
      }

      console.log(`  [*] Match: ${project.eventName} (${project.editSlug})`);
      console.log(`      P1 (Home): ${em.homeTeam} -> ${hId}`);
      console.log(`      P2 (Away): ${em.awayTeam} -> ${aId}`);
      console.log(`      Organization: EuroLeague Women -> ${elOrgId}`);

      if (applyChanges) {
        await db.collection('projects').updateOne(
          { _id: project._id },
          {
            $set: {
              partner1: hId,
              partner1Id: hId,
              partner2: aId,
              partner2Id: aId,
              organizationId: elOrgId,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }
    }

    // 2. Additional specific fixture pairings
    const OTHER_FIXTURES: Array<{
      matchPattern: RegExp;
      homeTeam: string;
      awayTeam: string;
    }> = [
      {
        matchPattern: /PSG.*Arsenal/i,
        homeTeam: 'Paris Saint-Germain',
        awayTeam: 'Arsenal FC',
      },
      {
        matchPattern: /Kometa.*Kaposvári.*MVM-OSE/i,
        homeTeam: 'Kometa-KVGY Kaposvári KK',
        awayTeam: 'MVM-OSE Lions',
      },
      {
        matchPattern: /One Veszprem HC x SC Magdeburg/i,
        homeTeam: 'One Veszprém HC',
        awayTeam: 'SC Magdeburg',
      },
      {
        matchPattern: /Hungary x Iceland/i,
        homeTeam: 'Hungary',
        awayTeam: 'Iceland Basketball',
      },
      {
        matchPattern: /HC Fribourg.*Geneve Servette/i,
        homeTeam: 'HC Fribourg-Gottéron',
        awayTeam: 'Geneve Servette HC',
      },
    ];

    console.log('\n--- Fixing Additional Fixture Pairings ---');
    for (const f of OTHER_FIXTURES) {
      const project = await db.collection('projects').findOne({ eventName: f.matchPattern });
      if (!project) {
        console.log(`  [!] Project not found for pattern: ${f.matchPattern}`);
        continue;
      }

      const hId = findId(f.homeTeam);
      const aId = findId(f.awayTeam);

      if (!hId || !aId) {
        console.log(`  [ERROR] Could not resolve IDs for ${f.homeTeam} (${hId}) or ${f.awayTeam} (${aId}) in ${project.eventName}`);
        continue;
      }

      console.log(`  [*] Match: ${project.eventName}`);
      console.log(`      P1 (Home): ${f.homeTeam} -> ${hId}`);
      console.log(`      P2 (Away): ${f.awayTeam} -> ${aId}`);

      if (applyChanges) {
        await db.collection('projects').updateOne(
          { _id: project._id },
          {
            $set: {
              partner1: hId,
              partner1Id: hId,
              partner2: aId,
              partner2Id: aId,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }
    }

    await client.close();
  }
}

const isApply = process.argv.includes('--apply');
runRepair(isApply).then(() => {
  console.log('\nCompleted repair run.');
}).catch(err => {
  console.error('Fatal repair error:', err);
  process.exit(1);
});
