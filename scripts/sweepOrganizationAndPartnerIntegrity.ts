import { MongoClient, ObjectId } from 'mongodb';

interface TargetCluster {
  name: string;
  uri: string;
}

const CLUSTERS: TargetCluster[] = [
  {
    name: 'camaraclastar (PROD)',
    uri: 'mongodb+srv://moldovancsaba_db_user:wMP6z5B3ft5mmyI0@camaraclastar.koyedpi.mongodb.net/?retryWrites=true&w=majority&appName=camaraclastar',
  },
  {
    name: 'r96vlxs (SECONDARY)',
    uri: 'mongodb+srv://messmass:mirdob-5kykku-qozGym@messmass-cluster.r96vlxs.mongodb.net/?appName=messmass-cluster',
  },
];

async function main() {
  const isApply = process.argv.includes('--apply');
  console.log(`=== PlanetBrain Organization & Partner Integrity Sweep (Mode: ${isApply ? 'APPLY' : 'DRY RUN'}) ===\n`);

  for (const cluster of CLUSTERS) {
    console.log(`\n==================================================`);
    console.log(`Connecting to ${cluster.name}...`);
    const client = new MongoClient(cluster.uri);
    await client.connect();
    const db = client.db('messmass');

    // 1. Ensure Organizations exist with proper metadata, slugs, and report templates
    console.log(`\n[1] Auditing and ensuring Organizations...`);
    const orgDefs = [
      {
        _id: new ObjectId('6af1b292aba7ef5227678119'),
        name: 'EuroLeague Women',
        slug: 'euroleague-women',
        reportTemplateId: '6ac399f67e5287fcd54a733d', // EuroLeague Women template
        emoji: '🏀',
      },
      {
        _id: new ObjectId('69eb65379539a431fc3b8265'),
        name: 'Champions Hockey League (CHL)',
        slug: 'chl',
        reportTemplateId: '6a4275cc0b525e4131bccc0c', // CHL 2025/26 ORGANISATION template
        emoji: '🏒',
      },
      {
        _id: new ObjectId('6a155ba15eec356c8f24f189'),
        name: 'MOL EHF 2025/2026',
        slug: 'mol-ehf-2025-2026',
        reportTemplateId: '6a3a710ade2db486ebc9dfc4', // MOL EHF template
        emoji: '🤾',
      },
      {
        _id: new ObjectId('6a5e7c5196099ffc8fdcf564'),
        name: 'Swiss Ice Hockey',
        slug: 'swiss-ice-hockey',
        reportTemplateId: '693fff05daa7a23d8085643b', // SIHF Swiss Ice Hockey Federation PARTNER
        emoji: '🏒',
      },
      {
        _id: new ObjectId('6a5e7c4a96099ffc8fdcf55b'),
        name: 'MotoGP',
        slug: 'motogp',
        reportTemplateId: '6aa7f4938359ad3a42da593d',
        emoji: '🏍️',
      },
      {
        _id: new ObjectId('6af1c0000000000000000001'),
        name: 'MLSZ - Magyar Labdarúgó Szövetség',
        slug: 'mlsz',
        reportTemplateId: '6ac4b74e2b4556cdd6e13e4f', // MLSZ FanXP
        emoji: '⚽',
      },
      {
        _id: new ObjectId('6af1c0000000000000000002'),
        name: 'FIBA 3x3',
        slug: 'fiba-3x3',
        emoji: '🏀',
      },
      {
        _id: new ObjectId('6af1c0000000000000000003'),
        name: 'European Aquatics',
        slug: 'european-aquatics',
        reportTemplateId: '69441bece7368553af7945d0',
        emoji: '🏊',
      },
      {
        _id: new ObjectId('6af1c0000000000000000004'),
        name: 'UEFA',
        slug: 'uefa',
        reportTemplateId: '6a7db7176a21d784c2795b94',
        emoji: '⚽',
      },
    ];

    for (const def of orgDefs) {
      let existing = await db.collection('organizations').findOne({
        $or: [{ _id: def._id }, { slug: def.slug }, { name: def.name }],
      });

      if (!existing) {
        console.log(`  + Creating organization: "${def.name}" (slug: ${def.slug})`);
        if (isApply) {
          await db.collection('organizations').insertOne({
            _id: def._id,
            name: def.name,
            slug: def.slug,
            status: 'active',
            metadata: {
              emoji: def.emoji,
              reportTemplateId: def.reportTemplateId,
              reportId: def.reportTemplateId,
              showEmoji: true,
              showMembersList: true,
              showMembersListTitle: true,
              showMembersListDetails: true,
              showEventsList: true,
              showEventsListTitle: true,
              showEventsListDetails: true,
              stats: {},
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        console.log(`  ✓ Organization exists: "${existing.name}" (_id: ${existing._id})`);
        const metadata = existing.metadata || {};
        const needsUpdate =
          !metadata.reportTemplateId && def.reportTemplateId ||
          metadata.emoji !== def.emoji;

        if (needsUpdate) {
          console.log(`    -> Updating metadata for "${existing.name}"`);
          if (isApply) {
            await db.collection('organizations').updateOne(
              { _id: existing._id },
              {
                $set: {
                  'metadata.reportTemplateId': metadata.reportTemplateId || def.reportTemplateId,
                  'metadata.reportId': metadata.reportId || def.reportTemplateId,
                  'metadata.emoji': metadata.emoji || def.emoji,
                  'metadata.showMembersList': true,
                  'metadata.showEventsList': true,
                  updatedAt: new Date().toISOString(),
                },
              }
            );
          }
        }
      }
    }

    // 2. Link member clubs to their Organizations in `partners` collection
    console.log(`\n[2] Linking clubs to their Organizations...`);
    
    // EuroLeague Women Clubs
    const euroleagueOrgId = new ObjectId('6af1b292aba7ef5227678119');
    const euroleagueClubPatterns = [
      /Beretta Famila Schio/i,
      /Galatasaray/i,
      /Fenerbahce/i,
      /Valencia Basket/i,
      /Crvena Zvezda/i,
      /Tango Bourges/i,
      /Emlak Konut/i,
      /Casademont Zaragoza/i,
      /Basket Landes/i,
      /Flammes Carolo/i,
    ];

    for (const pat of euroleagueClubPatterns) {
      const clubs = await db.collection('partners').find({ name: pat }).toArray();
      for (const club of clubs) {
        if (!club.organizationId || club.organizationId.toString() !== euroleagueOrgId.toString()) {
          console.log(`  -> EuroLeague Club: "${club.name}" (${club._id}) -> link to EuroLeague Women Org`);
          if (isApply) {
            await db.collection('partners').updateOne(
              { _id: club._id },
              { $set: { organizationId: euroleagueOrgId, updatedAt: new Date().toISOString() } }
            );
          }
        }
      }
    }

    // Champions Hockey League (CHL) Clubs
    const chlOrgId = new ObjectId('69eb65379539a431fc3b8265');
    const chlClubPatterns = [
      /Bordeax Boxers/i,
      /Bordeaux Boxers/i,
      /HC Pilsen/i,
      /Fribourg-Gott/i,
      /Geneve Servette/i,
      /Graz99ers/i,
      /SC Bern/i,
      /Klagenfurt/i,
      /Oceláři Třinec/i,
      /Sparta Praha/i,
      /Eisbären Berlin/i,
      /Bremerhaven/i,
      /ZSC Lions/i,
    ];

    for (const pat of chlClubPatterns) {
      const clubs = await db.collection('partners').find({ name: pat }).toArray();
      for (const club of clubs) {
        if (!club.organizationId || club.organizationId.toString() !== chlOrgId.toString()) {
          console.log(`  -> CHL Club: "${club.name}" (${club._id}) -> link to CHL Org`);
          if (isApply) {
            await db.collection('partners').updateOne(
              { _id: club._id },
              { $set: { organizationId: chlOrgId, updatedAt: new Date().toISOString() } }
            );
          }
        }
      }
    }

    // MOL EHF Handball Clubs
    const ehfOrgId = new ObjectId('6a155ba15eec356c8f24f189');
    const ehfClubPatterns = [
      /Dinamo Bucure/i,
      /Wisla Plock/i,
      /PICK Szeged/i,
      /One Veszpr/i,
      /HBC Nantes/i,
      /^Barça/i,
      /SC Magdeburg/i,
      /Industria Kielce/i,
      /RK Celje/i,
      /HC Zagreb/i,
      /Aalborg H/i,
      /Kolstad H/i,
      /GOG H/i,
      /MT Melsungen/i,
      /Eurofarm Pelister/i,
      /Sporting Clube de Portugal/i,
      /HC Vardar/i,
      /Montpellier Handball/i,
      /IFK Kristianstad/i,
      /Füchse Berlin/i,
      /SAH - Aarhus/i,
      /MOL Tatabánya/i,
    ];

    for (const pat of ehfClubPatterns) {
      const clubs = await db.collection('partners').find({ name: pat }).toArray();
      for (const club of clubs) {
        if (!club.organizationId || club.organizationId.toString() !== ehfOrgId.toString()) {
          console.log(`  -> EHF Handball Club: "${club.name}" (${club._id}) -> link to MOL EHF Org`);
          if (isApply) {
            await db.collection('partners').updateOne(
              { _id: club._id },
              { $set: { organizationId: ehfOrgId, updatedAt: new Date().toISOString() } }
            );
          }
        }
      }
    }

    // Swiss Ice Hockey National Teams
    const sihfOrgId = new ObjectId('6a5e7c5196099ffc8fdcf564');
    const sihfTeamPatterns = [
      /Swiss Ice Hockey/i,
      /Czech Ice Hockey/i,
      /Finland Ice Hockey/i,
      /Sweden Ice Hockey/i,
      /Hungary Ice Hockey/i,
    ];
    for (const pat of sihfTeamPatterns) {
      const clubs = await db.collection('partners').find({ name: pat }).toArray();
      for (const club of clubs) {
        if (!club.organizationId || club.organizationId.toString() !== sihfOrgId.toString()) {
          console.log(`  -> Swiss Ice Hockey Team: "${club.name}" (${club._id}) -> link to SIHF Org`);
          if (isApply) {
            await db.collection('partners').updateOne(
              { _id: club._id },
              { $set: { organizationId: sihfOrgId, updatedAt: new Date().toISOString() } }
            );
          }
        }
      }
    }

    // 3. Link projects to organizations and ensure dual partner fields (partner1 & partner1Id)
    console.log(`\n[3] Auditing and repairing project fields & organization linkages...`);
    const projects = await db.collection('projects').find({}).toArray();
    let dualFieldFixes = 0;
    let orgFixes = 0;

    for (const p of projects) {
      const updates: Record<string, any> = {};

      // Ensure partner1 <-> partner1Id synchronization
      const p1 = p.partner1Id || p.partner1;
      const p2 = p.partner2Id || p.partner2;

      if (p1 && (!p.partner1 || !p.partner1Id || p.partner1.toString() !== p.partner1Id.toString())) {
        updates.partner1 = new ObjectId(p1);
        updates.partner1Id = new ObjectId(p1);
      }
      if (p2 && (!p.partner2 || !p.partner2Id || p.partner2.toString() !== p.partner2Id.toString())) {
        updates.partner2 = new ObjectId(p2);
        updates.partner2Id = new ObjectId(p2);
      }

      // Check organization linkage
      const name = p.eventName || '';
      let targetOrgId: ObjectId | null = null;

      // EuroLeague Women
      if (
        name.includes('Schio') && (name.includes('Galatasaray') || name.includes('Crvena Zvezda')) ||
        name.includes('Fenerbahce') && (name.includes('Valencia') || name.includes('Flammes Carolo')) ||
        name.includes('Valencia') && name.includes('Fenerbahce') ||
        name.includes('Bourges') && name.includes('Emlak Konut') ||
        name.includes('Zaragoza') && name.includes('Basket Landes')
      ) {
        targetOrgId = euroleagueOrgId;
      }
      // Champions Hockey League
      else if (
        name.includes('CHL') ||
        name.includes('Bordeax Boxers') ||
        name.includes('Bordeaux Boxers') ||
        name.includes('HC Pilsen') ||
        name.includes('Fribourg-Gottéron') ||
        name.includes('Geneve Servette') ||
        name.includes('Graz99ers')
      ) {
        targetOrgId = chlOrgId;
      }
      // MOL EHF Handball
      else if (
        name.includes('EHF') ||
        name.includes('CS Dinamo') ||
        name.includes('Wisla Plock') ||
        name.includes('Celje') ||
        name.includes('HBC Nantes') ||
        (name.includes('PICK Szeged') && (name.includes('Kristianstad') || name.includes('Wisla Plock')))
      ) {
        targetOrgId = ehfOrgId;
      }
      // Swiss Ice Hockey
      else if (
        name.includes('Swiss Ice Hockey') ||
        name.includes('SIHF') ||
        name.includes('Swiss Fan Wall') ||
        name.includes('Women\'s Euro Hockey Tour')
      ) {
        targetOrgId = sihfOrgId;
      }
      // MotoGP
      else if (name.includes('MotoGP')) {
        targetOrgId = new ObjectId('6a5e7c4a96099ffc8fdcf55b');
      }
      // MLSZ
      else if (name.includes('MLSZ') || name.includes('Magyarország-Belgium VB')) {
        targetOrgId = new ObjectId('6af1c0000000000000000001');
      }
      // FIBA 3x3
      else if (name.includes('FIBA 3X3') || name.includes('FIBA 3x3')) {
        targetOrgId = new ObjectId('6af1c0000000000000000002');
      }

      if (targetOrgId && (!p.organizationId || p.organizationId.toString() !== targetOrgId.toString())) {
        updates.organizationId = targetOrgId;
      }

      if (Object.keys(updates).length > 0) {
        if (updates.partner1 || updates.partner2) dualFieldFixes++;
        if (updates.organizationId) orgFixes++;

        console.log(`  -> Project "${name}" (${p._id}):`, updates);
        if (isApply) {
          await db.collection('projects').updateOne(
            { _id: p._id },
            { $set: { ...updates, updatedAt: new Date().toISOString() } }
          );
        }
      }
    }

    console.log(`\nSummary for ${cluster.name}:`);
    console.log(`  - Dual partner field fixes: ${dualFieldFixes}`);
    console.log(`  - Organization linkage fixes: ${orgFixes}`);

    await client.close();
  }

  console.log(`\nSweep completed successfully!`);
}

main().catch(console.error);
