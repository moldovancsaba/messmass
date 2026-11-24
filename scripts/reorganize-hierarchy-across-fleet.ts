import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';
import { optionalCameraUri, requireMessmassUri } from './lib/singleClusterConfig';

const CLUSTERS = [
  { name: 'Messmass (MONGODB_URI)', uri: requireMessmassUri(), hasCameraDb: Boolean(optionalCameraUri()) },
];

// ---------------------------------------------------------------------------
// 1. Canonical Organization IDs (Federations, Leagues, Sponsors)
// ---------------------------------------------------------------------------
const ORG_IDS = {
  // Federations
  MLSZ: new ObjectId('6af1c0000000000000000001'),
  FIBA_3X3: new ObjectId('6af1c0000000000000000002'),
  EUROPEAN_AQUATICS: new ObjectId('6af1c0000000000000000003'),
  UEFA: new ObjectId('6af1c0000000000000000004'),
  MKSZ: new ObjectId('6af1c0000000000000000005'),
  MRSZ: new ObjectId('6af1c0000000000000000006'),
  MJSZ: new ObjectId('6af1c0000000000000000007'),
  PZPN: new ObjectId('6af1c0000000000000000008'),
  ZPRP: new ObjectId('6af1c0000000000000000009'),
  FIBA: new ObjectId('6af1c0000000000000000010'),
  MKOSZ: new ObjectId('6afd4d1727132886f7e7b49d'),
  SIHF: new ObjectId('6a5e7c5196099ffc8fdcf564'),

  // Leagues & Competitions
  OTP_BANK_LIGA: new ObjectId('6af1c1000000000000000001'),
  MERKANTIL_BANK_LIGA: new ObjectId('6af1c1000000000000000002'),
  MOL_MAGYAR_KUPA: new ObjectId('6af1c1000000000000000003'),
  TIPPMIX_FERFI_NB1: new ObjectId('6af1c1000000000000000004'),
  TIPPMIX_NOI_NB1: new ObjectId('6af1c1000000000000000005'),
  KH_KEZILABDA_LIGA: new ObjectId('6af1c1000000000000000006'),
  ICEHL_ERSTE_LIGA: new ObjectId('6af1c1000000000000000007'),
  UEFA_CHAMPIONS_LEAGUE: new ObjectId('6af1c1000000000000000008'),
  UEFA_EUROPEAN_QUALIFIERS: new ObjectId('6af1c1000000000000000009'),
  EUROLEAGUE_WOMEN: new ObjectId('6af1b292aba7ef5227678119'),
  CHL: new ObjectId('69eb65379539a431fc3b8265'),
  MOL_EHF: new ObjectId('6a155ba15eec356c8f24f189'),
  SERIE_A: new ObjectId('6a5e7c5396099ffc8fdcf567'),
  MOTOGP: new ObjectId('6a5e7c4a96099ffc8fdcf55b'),

  // Sponsors
  TIPPMIX_SZRT: new ObjectId('6af1c2000000000000000001'),
  MOL_GROUP: new ObjectId('6af1c2000000000000000002'),
};

// ---------------------------------------------------------------------------
// 2. Test / Placeholder Records to Delete Everywhere
// ---------------------------------------------------------------------------
const DELETE_ORG_IDS = [
  '6a5e7c4696099ffc8fdcf558', // SEYU UZB
  '6a5e7c4c96099ffc8fdcf55e', // Seyu Events
  '6a5e7c4e96099ffc8fdcf561', // Central Asian University
  '6a5e7c5596099ffc8fdcf56a', // каmеяа аррlicатiоп
  '6a5e7c5896099ffc8fdcf56d', // FunFitFan
];

const DELETE_PARTNER_IDS = [
  '6a5e7c4696099ffc8fdcf559', // SEYU UZB
  '6a5e7c4c96099ffc8fdcf55f', // Seyu Events
  '6a5e7c4f96099ffc8fdcf562', // Central Asian University
  '6a5e7c5696099ffc8fdcf56b', // каmеяа аррlicатiоп
  '6a5e7c5896099ffc8fdcf56e', // FunFitFan
  '6a0c4ef18a2bbd7fb10abf40', // David FC
  '6af46f5848ec727d23cfa0c6', // teszt 100
  '699c4158846876b20fc58143', // Zenga Demo
  '69affbe4412b384a3257bd1b', // Champions Hockey League (0-event duplicate partner)
];

const DELETE_EVENT_IDS = [
  '6a5e7c5796099ffc8fdcf56c', // каmеяа
  '6a5e7c5996099ffc8fdcf56f', // Moldovan Csaba's FunFitFan
  '6a5e7c5096099ffc8fdcf563', // Final Day (CAU test)
  '6a5e7c4e96099ffc8fdcf560', // EXPO 2026 (SEYU UZB test)
  '699c4180c24fd5a3bd5eb1f3', // Zenga Kampány 2026 március
  '699d7d355530a13fa0db266c', // messmass.com - DEMO
  '6ad7804e5be59a50105001f9', // savetheworld — Take the Pledge (NO_DATE test)
];

// ---------------------------------------------------------------------------
// 3. Partner Merges (sourceId -> targetId)
// ---------------------------------------------------------------------------
const PARTNER_MERGES: Array<{
  fromId: string;
  toId: string;
  canonicalName?: string;
  addSponsorTag?: string;
}> = [
  // Hungarian Football (tippmix & duplicate splits)
  { fromId: '68eea86df5fff60e66413ab9', toId: '6a01974c9d781d4900629d4d', canonicalName: 'Újpest FC', addSponsorTag: 'tippmix' },
  { fromId: '68eeac2d482bab8ad7af942a', toId: '6a05b394767174e927c63141', canonicalName: 'MTK Budapest', addSponsorTag: 'tippmix' },
  { fromId: '68f77ede9d48f546efb9dea5', toId: '6a048012fe440d910605e906', canonicalName: 'Diósgyőri VTK', addSponsorTag: 'tippmix' },
  { fromId: '68f7809a9d7e63a072225c13', toId: '69f9e1299d7c0c1ee36819fd', canonicalName: 'Zalaegerszegi TE FC', addSponsorTag: 'tippmix' },
  { fromId: '6af1ede55658cd2683ba9cc4', toId: '69f9e1299d7c0c1ee36819fd', canonicalName: 'Zalaegerszegi TE FC' },
  { fromId: '68f779099d48f546efb9de99', toId: '6a019d78362a6fc382e5a6fc', canonicalName: 'ETO FC', addSponsorTag: 'tippmix' },
  { fromId: '6af1ede65658cd2683ba9cc7', toId: '6a019d78362a6fc382e5a6fc', canonicalName: 'ETO FC' },
  { fromId: '6af1ede65658cd2683ba9cc6', toId: '68f77f339d48f546efb9dea6', canonicalName: 'Debreceni VSC' },
  { fromId: '6af1ede65658cd2683ba9cc5', toId: '68f784499d7e63a072225c19', canonicalName: 'Videoton FC Fehérvár' },
  { fromId: '6af1ede65658cd2683ba9cc8', toId: '68f120783e9851f15e2afe8b', canonicalName: 'Nyíregyháza FC' },
  { fromId: '691b2d7bc701ab041e740ace', toId: '691b2d6bc701ab041e740acd', canonicalName: 'Ireland' },
  { fromId: '6af1ede55658cd2683ba9cb9', toId: '68eea956482bab8ad7af9428', canonicalName: 'Hungary Football Men - MLSZ' },

  // Basketball (tippmix & duplicate splits)
  { fromId: '6a02e63567cacbd0c18eb226', toId: '68f6295736dae2424f1d13cc', canonicalName: 'DVTK HUNTHERM', addSponsorTag: 'tippmix' },
  { fromId: '6af1ede65658cd2683ba9ccc', toId: '68ef5a0110eddb9737ecda59', canonicalName: 'Alba Fehérvár Kosárlabda' },
  { fromId: '6af1ede65658cd2683ba9ccd', toId: '68f62632f1081bc59a724bf8', canonicalName: 'NHSZ-Szolnoki Olajbányász' },
  { fromId: '6af1ede55658cd2683ba9cc3', toId: '6af1b76c5731c7eaca35087b', canonicalName: 'Israel Basketball' },

  // Handball
  { fromId: '6af1ede55658cd2683ba9cb7', toId: '690b2fc4a9ae1682cbc211ce', canonicalName: 'MOL Tatabánya KC' },
  { fromId: '6af1ede55658cd2683ba9cb5', toId: '6aa24e60e632553d9ed45569', canonicalName: 'Montpellier Handball' },
  { fromId: '6af1ede55658cd2683ba9cb6', toId: '68ef8b50642b6684a3c80562', canonicalName: 'Sporting Clube de Portugal' },

  // Ice Hockey
  { fromId: '6afd6ec9143282d65399b048', toId: '68f258becb107e78f6c141d4', canonicalName: 'HC Fribourg-Gottéron' },
  { fromId: '6af1b76c5731c7eaca350879', toId: '6acc88ff3bc7e50e1e6882e7', canonicalName: 'Genève-Servette' },
  { fromId: '6a9ab146c0f3f7abfebc3c68', toId: '695d6ad1a930357be362a791', canonicalName: 'Moser Medical Graz99ers' },
  { fromId: '6912f3485f70cd35acc56bca', toId: '69a54b6de24f1f9ca024a321', canonicalName: 'SC Bern' },
  { fromId: '6a5e7c5196099ffc8fdcf565', toId: '68f626b4eaea906244f28925', canonicalName: 'Swiss Ice Hockey Federation (SIHF)' },

  // Motorsport
  { fromId: '6aa7e86fdbc52d81b8c77dd6', toId: '6a5e7c4a96099ffc8fdcf55c', canonicalName: 'MotoGP' },
];

function addUniqueTag(arr: string[] | undefined, tag: string): string[] {
  const set = new Set((arr || []).map((x) => String(x).trim()).filter(Boolean));
  set.add(tag);
  return Array.from(set);
}

async function reorganizeCluster(cluster: { name: string; uri: string; hasCameraDb: boolean }) {
  const client = new MongoClient(cluster.uri);
  await client.connect();
  const db = client.db('messmass');
  const now = new Date().toISOString();

  console.log(`\n============================================================`);
  console.log(`Reorganizing Organizations, Partners & Events on ${cluster.name}`);
  console.log(`============================================================`);

  const orgsCol = db.collection('organizations');
  const partnersCol = db.collection('partners');
  const projectsCol = db.collection('projects');
  const variantsCol = db.collection('report_variants');

  // -------------------------------------------------------------------------
  // Step 1: Fix the 18 Cross-Sport / Wrong-Partner Corrupted Events FIRST
  // (before merging partners, so e.g. the 2 volleyball games on Hungary National Team aren't merged into football)
  // -------------------------------------------------------------------------
  console.log('[1] Fixing cross-sport & wrong-partner corrupted events...');

  // 1a. 2 Volleyball matches (🏐 Hungary x Denmark, 🏐 Hungary x Turkey) -> MRSZ partner (68ff45b75473ed0e88defa53)
  const MRSZ_PARTNER_ID = new ObjectId('68ff45b75473ed0e88defa53');
  await projectsCol.updateMany(
    { _id: { $in: [new ObjectId('68a31ade85f7f395e248f452'), new ObjectId('68a3140c4facdc7acf03a408')] } },
    { $set: { partner1: MRSZ_PARTNER_ID, partner1Id: MRSZ_PARTNER_ID, updatedAt: now } }
  );

  // 1b. 10 Újpest FC football matches that had Estonia National Team as partner1
  const UJPEST_ID = new ObjectId('6a01974c9d781d4900629d4d');
  const ujpestFixes: Array<{ eventId: string; p2Id: string }> = [
    { eventId: '68a31c617156b08d95203613', p2Id: '68f77fe69d7e63a072225c10' }, // Kisvárda FC
    { eventId: '68a318399385721704af4ca7', p2Id: '68f780219d7e63a072225c11' }, // Paksi FC
    { eventId: '68a2f944fa27e5f2260e7e0c', p2Id: '6a048012fe440d910605e906' }, // Diósgyőri VTK
    { eventId: '68ac2d6a54d43f7d4ef56087', p2Id: '68f120783e9851f15e2afe8b' }, // Nyíregyháza FC
    { eventId: '68ac2550153559b70134cc4a', p2Id: '6a019d78362a6fc382e5a6fc' }, // ETO FC
    { eventId: '68ac1fa7b0e2fcaca4608e0c', p2Id: '6a048012fe440d910605e906' }, // Diósgyőri VTK
    { eventId: '68ac1d4f5e891edcae1c8eea', p2Id: '68f77f339d48f546efb9dea6' }, // Debreceni VSC (was Sporting CP handball!)
    { eventId: '68ac1551b0e2fcaca4608e05', p2Id: '68f784499d7e63a072225c19' }, // Videoton FC Fehérvár
    { eventId: '68a8a433e741c8f8ba3ac637', p2Id: '68f780639d7e63a072225c12' }, // Puskás Akadémia FC
    { eventId: '68a7344a80a7ed4f8b4a7c7a', p2Id: '69f9e1299d7c0c1ee36819fd' }, // Zalaegerszegi TE FC (was SZTE-Szedeák basketball!)
  ];
  for (const fix of ujpestFixes) {
    const p2ObjId = new ObjectId(fix.p2Id);
    await projectsCol.updateOne(
      { _id: new ObjectId(fix.eventId) },
      { $set: { partner1: UJPEST_ID, partner1Id: UJPEST_ID, partner2: p2ObjId, partner2Id: p2ObjId, updatedAt: now } }
    );
  }

  // 1c. ⚽ DVTK x ZTE (68a307238092da4a83ed58cd): P2 was SZTE-Szedeák (basketball) -> Zalaegerszegi TE FC
  const ZTE_FC_ID = new ObjectId('69f9e1299d7c0c1ee36819fd');
  const DVTK_FC_ID = new ObjectId('6a048012fe440d910605e906');
  await projectsCol.updateOne(
    { _id: new ObjectId('68a307238092da4a83ed58cd') },
    { $set: { partner1: DVTK_FC_ID, partner1Id: DVTK_FC_ID, partner2: ZTE_FC_ID, partner2Id: ZTE_FC_ID, updatedAt: now } }
  );

  // 1d. FIBA World Cup Qualifier - HUN vs EST (6a8d6b65dbb9609a250b1a9f): P2 was Farjestad BK (hockey) -> Estonia National Team
  const estoniaPartner = await partnersCol.findOne({ name: /Estonia National Team/i });
  if (estoniaPartner) {
    await projectsCol.updateOne(
      { _id: new ObjectId('6a8d6b65dbb9609a250b1a9f') },
      { $set: { partner2: estoniaPartner._id, partner2Id: estoniaPartner._id, updatedAt: now } }
    );
  }

  // 1e. 🏀 Hungary x Iceland (68a74086129ce4f6890aa58b): P1 was MTK Budapest -> Hungary Basketball Men - MKOSZ
  const MKOSZ_MEN_ID = new ObjectId('68eea983482bab8ad7af9429');
  const MKOSZ_WOMEN_ID = new ObjectId('68f2570fefe14c2e19c4fc8e');
  await projectsCol.updateOne(
    { _id: new ObjectId('68a74086129ce4f6890aa58b') },
    { $set: { partner1: MKOSZ_MEN_ID, partner1Id: MKOSZ_MEN_ID, organizationId: ORG_IDS.MKOSZ, updatedAt: now } }
  );

  // 1f. 🏀 Hungary x Romania (68a31e537156b08d95203614): P1 -> Hungary Basketball Men - MKOSZ
  await projectsCol.updateOne(
    { _id: new ObjectId('68a31e537156b08d95203614') },
    { $set: { partner1: MKOSZ_MEN_ID, partner1Id: MKOSZ_MEN_ID, organizationId: ORG_IDS.MKOSZ, updatedAt: now } }
  );

  // 1g. Egis Körmend x Alba Fehérvár (690b2ce07cb441f56bdda56e): P2 was Alba Fehérvár Kézilabda -> Alba Fehérvár Kosárlabda
  const ALBA_BASKET_ID = new ObjectId('68ef5a0110eddb9737ecda59');
  await projectsCol.updateOne(
    { _id: new ObjectId('690b2ce07cb441f56bdda56e') },
    { $set: { partner2: ALBA_BASKET_ID, partner2Id: ALBA_BASKET_ID, updatedAt: now } }
  );

  // 1h. [🏒] Zurich Lions x Farjestad (68a736b680a7ed4f8b4a7c7b): P1 was SEYU -> ZSC Lions, P2 -> Farjestad BK, org -> CHL
  const ZSC_LIONS_ID = new ObjectId('6a04901a6d6dde7d52b561de');
  const farjestadPartner = await partnersCol.findOne({ name: /Farjestad/i });
  await projectsCol.updateOne(
    { _id: new ObjectId('68a736b680a7ed4f8b4a7c7b') },
    {
      $set: {
        partner1: ZSC_LIONS_ID,
        partner1Id: ZSC_LIONS_ID,
        ...(farjestadPartner ? { partner2: farjestadPartner._id, partner2Id: farjestadPartner._id } : {}),
        organizationId: ORG_IDS.CHL,
        updatedAt: now,
      },
    }
  );

  // 1i. Reassign the remaining real sport events from SEYU (694bd8852543b3d05b568468)
  const FIBA3X3_PARTNER_ID = new ObjectId('6a8d6aec5aba0c50052eb67f');
  await projectsCol.updateMany(
    { organizationId: ORG_IDS.FIBA_3X3, partner1: new ObjectId('694bd8852543b3d05b568468') },
    {
      $set: {
        partner1: FIBA3X3_PARTNER_ID,
        partner1Id: FIBA3X3_PARTNER_ID,
        updatedAt: now,
      },
      $unset: { partner2: '', partner2Id: '' },
    }
  );

  // 7 FIBA U20 Women EuroBasket events in Miskolc -> partner1 = Hungary Basketball Women - MKOSZ, org = MKOSZ
  await projectsCol.updateMany(
    { eventName: /FIBA U20/i },
    {
      $set: {
        partner1: MKOSZ_WOMEN_ID,
        partner1Id: MKOSZ_WOMEN_ID,
        organizationId: ORG_IDS.MKOSZ,
        federationOrganizationId: ORG_IDS.MKOSZ,
        competitionType: 'national_team',
        updatedAt: now,
      },
    }
  );

  // 2 Zsíros Tibor Final Four 2025 events -> partner1 = Hungary Basketball Men - MKOSZ, org = MKOSZ
  await projectsCol.updateMany(
    { _id: { $in: [new ObjectId('68a8a2c6e741c8f8ba3ac636'), new ObjectId('68a8a19fe741c8f8ba3ac635')] } },
    {
      $set: {
        partner1: MKOSZ_MEN_ID,
        partner1Id: MKOSZ_MEN_ID,
        organizationId: ORG_IDS.MKOSZ,
        federationOrganizationId: ORG_IDS.MKOSZ,
        competitionType: 'domestic_cup',
        updatedAt: now,
      },
    }
  );

  // 2 MotoGP Balatonpark 2025 events -> partner1 = MotoGP (6a5e7c4a96099ffc8fdcf55c), org = MotoGP
  const MOTOGP_PARTNER_ID = new ObjectId('6a5e7c4a96099ffc8fdcf55c');
  await projectsCol.updateMany(
    { _id: { $in: [new ObjectId('68a2f39f84762cb47afcdf14'), new ObjectId('68a2f37184762cb47afcdf12')] } },
    {
      $set: {
        partner1: MOTOGP_PARTNER_ID,
        partner1Id: MOTOGP_PARTNER_ID,
        organizationId: ORG_IDS.MOTOGP,
        updatedAt: now,
      },
    }
  );

  // 4 EHF Final4 2025 events (from SEYU) -> TruckScout24 EHF FINAL4 / MOL EHF Raiffeisen Bank Final4
  const TRUCKSCOUT_EHF_ID = new ObjectId('6a2badf04f4b88a6d2eae427');
  const RAIFFEISEN_EHF_ID = new ObjectId('6a25778dcb26bcda9baebb98');
  await projectsCol.updateMany(
    { _id: { $in: [new ObjectId('68ad7f816a5e49bfc550d568'), new ObjectId('68ad7d0ebffa48c15104de71')] } },
    { $set: { partner1: TRUCKSCOUT_EHF_ID, partner1Id: TRUCKSCOUT_EHF_ID, organizationId: ORG_IDS.MOL_EHF, updatedAt: now } }
  );
  await projectsCol.updateMany(
    { _id: { $in: [new ObjectId('68ac373f54d43f7d4ef5608b'), new ObjectId('68ac339821b3cbb15114717e')] } },
    { $set: { partner1: RAIFFEISEN_EHF_ID, partner1Id: RAIFFEISEN_EHF_ID, organizationId: ORG_IDS.MOL_EHF, updatedAt: now } }
  );

  // 3 Cup Finals (2025 MOL Hungarian Cup, Czech MOL Cup, Slovnaft Cup) from SEYU
  const MOL_MAGYAR_KUPA_PARTNER_ID = new ObjectId('698c5d819217bb18e9ace951');
  const MOL_CZECH_CUP_PARTNER_ID = new ObjectId('6a0c565b4dd90cdc4ad98124');
  const MOL_SLOVNAFT_PARTNER_ID = new ObjectId('69f706fc0494498cecfaa181');
  await projectsCol.updateOne(
    { _id: new ObjectId('68ac2a1554d43f7d4ef56086') },
    { $set: { partner1: MOL_MAGYAR_KUPA_PARTNER_ID, partner1Id: MOL_MAGYAR_KUPA_PARTNER_ID, organizationId: ORG_IDS.MOL_MAGYAR_KUPA, updatedAt: now } }
  );
  await projectsCol.updateOne(
    { _id: new ObjectId('68ac2c3ebbd1d7e78b71f9d4') },
    { $set: { partner1: MOL_CZECH_CUP_PARTNER_ID, partner1Id: MOL_CZECH_CUP_PARTNER_ID, organizationId: ORG_IDS.UEFA, updatedAt: now } }
  );
  await projectsCol.updateOne(
    { _id: new ObjectId('68ac21a7e6042bba62e6dd0f') },
    { $set: { partner1: MOL_SLOVNAFT_PARTNER_ID, partner1Id: MOL_SLOVNAFT_PARTNER_ID, organizationId: ORG_IDS.UEFA, updatedAt: now } }
  );

  // -------------------------------------------------------------------------
  // Step 2: Delete Test / Placeholder Organizations, Partners, and Events
  // -------------------------------------------------------------------------
  console.log('[2] Deleting test/placeholder organizations, partners, and events...');
  const delOrgRes = await orgsCol.deleteMany({ _id: { $in: DELETE_ORG_IDS.map((id) => new ObjectId(id)) } });
  const delPartnerRes = await partnersCol.deleteMany({ _id: { $in: DELETE_PARTNER_IDS.map((id) => new ObjectId(id)) } });
  const delEventRes = await projectsCol.deleteMany({ _id: { $in: DELETE_EVENT_IDS.map((id) => new ObjectId(id)) } });
  await db.collection('v3_entities').deleteMany({ _id: { $in: DELETE_PARTNER_IDS.map((id) => new ObjectId(id)) } });
  await db.collection('v3_activities').deleteMany({ _id: { $in: DELETE_EVENT_IDS.map((id) => new ObjectId(id)) } });
  console.log(`    Deleted in messmass: ${delOrgRes.deletedCount} orgs, ${delPartnerRes.deletedCount} partners, ${delEventRes.deletedCount} events`);

  // -------------------------------------------------------------------------
  // Step 3: Merge Split (tippmix) & Duplicate Club Partners
  // -------------------------------------------------------------------------
  console.log('[3] Merging split (tippmix) and duplicate partners...');
  for (const merge of PARTNER_MERGES) {
    const fromOid = new ObjectId(merge.fromId);
    const toOid = new ObjectId(merge.toId);
    const fromDoc = await partnersCol.findOne({ _id: fromOid });
    const toDoc = await partnersCol.findOne({ _id: toOid });
    if (!toDoc) continue;

    // If addSponsorTag is set, tag all events that used fromOid with that sponsor tag before remapping
    if (merge.addSponsorTag) {
      const affectedEvents = await projectsCol
        .find({
          $or: [{ partner1: fromOid }, { partner2: fromOid }, { partner1Id: fromOid }, { partner2Id: fromOid }],
        })
        .toArray();
      for (const ev of affectedEvents) {
        const cat = ev.categorizedHashtags || {};
        cat.sponsor = addUniqueTag(cat.sponsor, merge.addSponsorTag);
        const tags = addUniqueTag(ev.hashtags, merge.addSponsorTag);
        await projectsCol.updateOne({ _id: ev._id }, { $set: { categorizedHashtags: cat, hashtags: tags } });
      }
    }

    // Remap partner1 / partner1Id and partner2 / partner2Id on projects
    await projectsCol.updateMany(
      { $or: [{ partner1: fromOid }, { partner1Id: fromOid }] },
      { $set: { partner1: toOid, partner1Id: toOid, updatedAt: now } }
    );
    await projectsCol.updateMany(
      { $or: [{ partner2: fromOid }, { partner2Id: fromOid }] },
      { $set: { partner2: toOid, partner2Id: toOid, updatedAt: now } }
    );

    // Enrich canonical partner with any missing logoUrl / styleId / reportTemplateId / cameraPartnerId from source
    const setPartner: Record<string, any> = { updatedAt: now };
    if (merge.canonicalName) setPartner.name = merge.canonicalName;
    if (!toDoc.logoUrl && fromDoc?.logoUrl) setPartner.logoUrl = fromDoc.logoUrl;
    if (!toDoc.styleId && fromDoc?.styleId) setPartner.styleId = fromDoc.styleId;
    if (!toDoc.reportTemplateId && fromDoc?.reportTemplateId) setPartner.reportTemplateId = fromDoc.reportTemplateId;
    if (!toDoc.cameraPartnerId && fromDoc?.cameraPartnerId) setPartner.cameraPartnerId = fromDoc.cameraPartnerId;
    if (!toDoc.viewSlug) setPartner.viewSlug = fromDoc?.viewSlug || crypto.randomUUID();

    await partnersCol.updateOne({ _id: toOid }, { $set: setPartner });
    await partnersCol.deleteOne({ _id: fromOid });
    await db.collection('v3_entities').deleteOne({ _id: fromOid });
  }

  // -------------------------------------------------------------------------
  // Step 4: Upsert All Federation, League, and Sponsor Organizations
  // -------------------------------------------------------------------------
  console.log('[4] Upserting Federation, League, and Sponsor Organizations...');
  const FIBA_TEMPLATE_ID = '6af1c3330000000000000002';
  const FIBA_STYLE_ID = '6af1c3330000000000000001';
  const MKOSZ_TEMPLATE_ID = '6a44d494c46838dc21b8a164';
  const MKOSZ_STYLE_ID = '6a4e14963a14524466406957';
  const MLSZ_TEMPLATE_ID = '6ac4b74e2b4556cdd6e13e4f';
  const EHF_TEMPLATE_ID = '6a3a710ade2db486ebc9dfc4';
  const MOL_STYLE_ID = '6ac89e8e6ee3a226b2883a93';
  const MRSZ_TEMPLATE_ID = '69c14dbeb4ee82dabb21da7c';
  const MRSZ_STYLE_ID = '69c14bf1e5f207ac51691630';
  const MKSZ_TEMPLATE_ID = '6a956cc735baeff9ea90ead5';
  const MKSZ_STYLE_ID = '6a95697281da4ebc63264caa';
  const CHL_ORG_TEMPLATE_ID = '6a4275cc0b525e4131bccc0c';
  const CHL_STYLE_ID = '69f17104d02efac9e18fef4d';
  const SIHF_TEMPLATE_ID = '693fff05daa7a23d8085643b';
  const SIHF_STYLE_ID = '6949807a81d8734f57642325';
  const ELW_TEMPLATE_ID = '6ac399f67e5287fcd54a733d';
  const ELW_STYLE_ID = '6ac39952e60f705205f34339';
  const EA_TEMPLATE_ID = '69441bece7368553af7945d0';
  const EA_STYLE_ID = '694a9f6d353a466230d45d27';
  const UEFA_TEMPLATE_ID = '6a7db7a26a21d784c2795b9e';
  const UEFA_STYLE_ID = '6a7db9e45ea8a0f3792fa015';
  const PZPN_TEMPLATE_ID = '6ac37cabf59bab771cd8a822';
  const PZPN_STYLE_ID = '6aba3fb2e38b1223288f336d';
  const ZPRP_TEMPLATE_ID = '6a0c505afb7639ca2baa1d66';
  const ZPRP_STYLE_ID = '6a0ec6eb4fe790628c551458';
  const ROMA_TEMPLATE_ID = '69aadbc5f9fba855049c446c';
  const ROMA_STYLE_ID = '694994cd537b2ef87ed6d556';
  const MOTOGP_TEMPLATE_ID = '6aa7f4938359ad3a42da593d';
  const MOTOGP_STYLE_ID = '6aa81519532e2caeba34d95f';
  const SZRT_STYLE_ID = '694a97ece1aeeb57f1e562e8';

  const orgDefinitions = [
    // FEDERATIONS
    {
      _id: ORG_IDS.MLSZ,
      name: 'MLSZ - Magyar Labdarúgó Szövetség',
      slug: 'mlsz',
      emoji: '⚽',
      orgType: 'federation',
      federationTag: 'mlsz',
      leagueOrganizationIds: [
        ORG_IDS.OTP_BANK_LIGA.toString(),
        ORG_IDS.MERKANTIL_BANK_LIGA.toString(),
        ORG_IDS.MOL_MAGYAR_KUPA.toString(),
      ],
      reportTemplateId: MLSZ_TEMPLATE_ID,
      styleId: MKOSZ_STYLE_ID,
    },
    {
      _id: ORG_IDS.MKOSZ,
      name: 'MKOSZ - Magyar Kosárlabdázók Országos Szövetsége',
      slug: 'mkosz',
      emoji: '🏀',
      orgType: 'federation',
      federationTag: 'mkosz',
      leagueOrganizationIds: [
        ORG_IDS.TIPPMIX_FERFI_NB1.toString(),
        ORG_IDS.TIPPMIX_NOI_NB1.toString(),
      ],
      reportTemplateId: MKOSZ_TEMPLATE_ID,
      styleId: MKOSZ_STYLE_ID,
      logoUrl: 'https://pub-b52ac4e9cc2b4199acd3a3b997ffdb0f.r2.dev/logos/58bc83108cac375d625edb1bcb1b7763593051d4799b1aeaed0c581504c6e5ea.png',
    },
    {
      _id: ORG_IDS.MKSZ,
      name: 'MKSZ - Magyar Kézilabda Szövetség',
      slug: 'mksz',
      emoji: '🤾',
      orgType: 'federation',
      federationTag: 'mksz',
      leagueOrganizationIds: [ORG_IDS.KH_KEZILABDA_LIGA.toString()],
      reportTemplateId: MKSZ_TEMPLATE_ID,
      styleId: MKSZ_STYLE_ID,
    },
    {
      _id: ORG_IDS.MRSZ,
      name: 'MRSZ - Magyar Röplabda Szövetség',
      slug: 'mrsz',
      emoji: '🏐',
      orgType: 'federation',
      federationTag: 'mrsz',
      leagueOrganizationIds: [],
      reportTemplateId: MRSZ_TEMPLATE_ID,
      styleId: MRSZ_STYLE_ID,
    },
    {
      _id: ORG_IDS.MJSZ,
      name: 'MJSZ - Magyar Jégkorong Szövetség',
      slug: 'mjsz',
      emoji: '🏒',
      orgType: 'federation',
      federationTag: 'mjsz',
      leagueOrganizationIds: [ORG_IDS.ICEHL_ERSTE_LIGA.toString()],
      reportTemplateId: FIBA_TEMPLATE_ID,
      styleId: MKOSZ_STYLE_ID,
    },
    {
      _id: ORG_IDS.SIHF,
      name: 'Swiss Ice Hockey (SIHF)',
      slug: 'swiss-ice-hockey',
      emoji: '🏒',
      orgType: 'federation',
      federationTag: 'sihf',
      leagueOrganizationIds: [],
      reportTemplateId: SIHF_TEMPLATE_ID,
      styleId: SIHF_STYLE_ID,
    },
    {
      _id: ORG_IDS.PZPN,
      name: 'PZPN - Polish Football Association',
      slug: 'pzpn',
      emoji: '⚽',
      orgType: 'federation',
      federationTag: 'pzpn',
      leagueOrganizationIds: [],
      reportTemplateId: PZPN_TEMPLATE_ID,
      styleId: PZPN_STYLE_ID,
    },
    {
      _id: ORG_IDS.ZPRP,
      name: 'ZPRP - Polish Handball Federation',
      slug: 'zprp',
      emoji: '🤾',
      orgType: 'federation',
      federationTag: 'zprp',
      leagueOrganizationIds: [],
      reportTemplateId: ZPRP_TEMPLATE_ID,
      styleId: ZPRP_STYLE_ID,
    },
    {
      _id: ORG_IDS.UEFA,
      name: 'UEFA',
      slug: 'uefa',
      emoji: '⚽',
      orgType: 'federation',
      federationTag: 'uefa',
      leagueOrganizationIds: [
        ORG_IDS.UEFA_CHAMPIONS_LEAGUE.toString(),
        ORG_IDS.UEFA_EUROPEAN_QUALIFIERS.toString(),
      ],
      reportTemplateId: UEFA_TEMPLATE_ID,
      styleId: UEFA_STYLE_ID,
    },
    {
      _id: ORG_IDS.FIBA,
      name: 'FIBA',
      slug: 'fiba',
      emoji: '🏀',
      orgType: 'federation',
      federationTag: 'fiba',
      leagueOrganizationIds: [
        ORG_IDS.EUROLEAGUE_WOMEN.toString(),
        ORG_IDS.FIBA_3X3.toString(),
      ],
      reportTemplateId: FIBA_TEMPLATE_ID,
      styleId: FIBA_STYLE_ID,
    },
    {
      _id: ORG_IDS.EUROPEAN_AQUATICS,
      name: 'European Aquatics',
      slug: 'european-aquatics',
      emoji: '🏊',
      orgType: 'federation',
      federationTag: 'european_aquatics',
      leagueOrganizationIds: [],
      reportTemplateId: EA_TEMPLATE_ID,
      styleId: EA_STYLE_ID,
    },

    // LEAGUES
    {
      _id: ORG_IDS.OTP_BANK_LIGA,
      name: 'OTP Bank Liga (NB I)',
      slug: 'otp-bank-liga',
      emoji: '⚽',
      orgType: 'league',
      federationId: ORG_IDS.MLSZ.toString(),
      leagueTag: 'otp_bank_liga_nb1',
      reportTemplateId: FIBA_TEMPLATE_ID,
      styleId: SZRT_STYLE_ID,
    },
    {
      _id: ORG_IDS.MERKANTIL_BANK_LIGA,
      name: 'Merkantil Bank Liga (NB II)',
      slug: 'merkantil-bank-liga',
      emoji: '⚽',
      orgType: 'league',
      federationId: ORG_IDS.MLSZ.toString(),
      leagueTag: 'merkantil_bank_liga_nb2',
      reportTemplateId: FIBA_TEMPLATE_ID,
      styleId: SZRT_STYLE_ID,
    },
    {
      _id: ORG_IDS.MOL_MAGYAR_KUPA,
      name: 'MOL Magyar Kupa',
      slug: 'mol-magyar-kupa',
      emoji: '🏆',
      orgType: 'league',
      federationId: ORG_IDS.MLSZ.toString(),
      leagueTag: 'mol_magyar_kupa',
      reportTemplateId: EHF_TEMPLATE_ID,
      styleId: MOL_STYLE_ID,
    },
    {
      _id: ORG_IDS.TIPPMIX_FERFI_NB1,
      name: 'Tippmix Férfi Kosárlabda NB I. A',
      slug: 'tippmix-ferfi-nb1',
      emoji: '🏀',
      orgType: 'league',
      federationId: ORG_IDS.MKOSZ.toString(),
      leagueTag: 'tippmix_ferfi_nb1',
      reportTemplateId: MKOSZ_TEMPLATE_ID,
      styleId: SZRT_STYLE_ID,
    },
    {
      _id: ORG_IDS.TIPPMIX_NOI_NB1,
      name: 'Tippmix Női Kosárlabda NB I. A',
      slug: 'tippmix-noi-nb1',
      emoji: '🏀',
      orgType: 'league',
      federationId: ORG_IDS.MKOSZ.toString(),
      leagueTag: 'tippmix_noi_nb1',
      reportTemplateId: MKOSZ_TEMPLATE_ID,
      styleId: SZRT_STYLE_ID,
    },
    {
      _id: ORG_IDS.KH_KEZILABDA_LIGA,
      name: 'K&H Kézilabda Liga',
      slug: 'kh-kezilabda-liga',
      emoji: '🤾',
      orgType: 'league',
      federationId: ORG_IDS.MKSZ.toString(),
      leagueTag: 'kh_kezilabda_liga',
      reportTemplateId: FIBA_TEMPLATE_ID,
      styleId: MKSZ_STYLE_ID,
    },
    {
      _id: ORG_IDS.ICEHL_ERSTE_LIGA,
      name: 'ICEHL & Erste Liga',
      slug: 'icehl-erste-liga',
      emoji: '🏒',
      orgType: 'league',
      federationId: ORG_IDS.MJSZ.toString(),
      leagueTag: 'erste_liga',
      reportTemplateId: FIBA_TEMPLATE_ID,
      styleId: SZRT_STYLE_ID,
    },
    {
      _id: ORG_IDS.EUROLEAGUE_WOMEN,
      name: 'EuroLeague Women',
      slug: 'euroleague-women',
      emoji: '🏀',
      orgType: 'league',
      federationId: ORG_IDS.FIBA.toString(),
      leagueTag: 'euroleague_women',
      reportTemplateId: ELW_TEMPLATE_ID,
      styleId: ELW_STYLE_ID,
    },
    {
      _id: ORG_IDS.FIBA_3X3,
      name: 'FIBA 3x3',
      slug: 'fiba-3x3',
      emoji: '🏀',
      orgType: 'league',
      federationId: ORG_IDS.FIBA.toString(),
      leagueTag: 'fiba_3x3',
      reportTemplateId: FIBA_TEMPLATE_ID,
      styleId: FIBA_STYLE_ID,
    },
    {
      _id: ORG_IDS.CHL,
      name: 'Champions Hockey League (CHL)',
      slug: 'chl',
      emoji: '🏒',
      orgType: 'league',
      leagueTag: 'champions_hockey_league',
      reportTemplateId: CHL_ORG_TEMPLATE_ID,
      styleId: CHL_STYLE_ID,
    },
    {
      _id: ORG_IDS.MOL_EHF,
      name: 'MOL EHF 2025/2026',
      slug: 'mol-ehf-2025-2026',
      emoji: '🤾',
      orgType: 'league',
      leagueTag: 'ehf_champions_league',
      reportTemplateId: EHF_TEMPLATE_ID,
      styleId: MOL_STYLE_ID,
    },
    {
      _id: ORG_IDS.UEFA_CHAMPIONS_LEAGUE,
      name: 'UEFA Champions League & Super Cup',
      slug: 'uefa-champions-league',
      emoji: '⚽',
      orgType: 'league',
      federationId: ORG_IDS.UEFA.toString(),
      leagueTag: 'uefa_champions_league',
      reportTemplateId: UEFA_TEMPLATE_ID,
      styleId: UEFA_STYLE_ID,
    },
    {
      _id: ORG_IDS.UEFA_EUROPEAN_QUALIFIERS,
      name: 'UEFA European Championship & Qualifiers',
      slug: 'uefa-european-qualifiers',
      emoji: '⚽',
      orgType: 'league',
      federationId: ORG_IDS.UEFA.toString(),
      leagueTag: 'uefa_european_qualifiers',
      reportTemplateId: UEFA_TEMPLATE_ID,
      styleId: UEFA_STYLE_ID,
    },
    {
      _id: ORG_IDS.SERIE_A,
      name: 'Serie A - Lega Serie A',
      slug: 'serie-a',
      emoji: '⚽',
      orgType: 'league',
      leagueTag: 'serie_a',
      reportTemplateId: ROMA_TEMPLATE_ID,
      styleId: ROMA_STYLE_ID,
    },
    {
      _id: ORG_IDS.MOTOGP,
      name: 'MotoGP',
      slug: 'motogp',
      emoji: '🏍️',
      orgType: 'league',
      leagueTag: 'motogp',
      reportTemplateId: MOTOGP_TEMPLATE_ID,
      styleId: MOTOGP_STYLE_ID,
    },

    // SPONSORS
    {
      _id: ORG_IDS.TIPPMIX_SZRT,
      name: 'Szerencsejáték Zrt. (Tippmix)',
      slug: 'tippmix',
      emoji: '🍀',
      orgType: 'sponsor',
      sponsorTag: 'tippmix',
      reportTemplateId: FIBA_TEMPLATE_ID,
      styleId: SZRT_STYLE_ID,
    },
    {
      _id: ORG_IDS.MOL_GROUP,
      name: 'MOL Group Sports Sponsorships',
      slug: 'mol',
      emoji: '⛽',
      orgType: 'sponsor',
      sponsorTag: 'mol',
      reportTemplateId: EHF_TEMPLATE_ID,
      styleId: MOL_STYLE_ID,
    },
  ];

  for (const def of orgDefinitions) {
    const existing = await orgsCol.findOne({ _id: def._id });
    const existingStats = existing?.metadata?.stats || {};
    const existingLogo = existing?.metadata?.logoUrl || (def as any).logoUrl;
    await orgsCol.updateOne(
      { _id: def._id },
      {
        $set: {
          name: def.name,
          slug: def.slug,
          status: 'active',
          metadata: {
            ...(existing?.metadata || {}),
            emoji: def.emoji,
            ...(existingLogo ? { logoUrl: existingLogo } : {}),
            orgType: def.orgType,
            ...(def.federationId ? { federationId: def.federationId } : {}),
            ...(def.leagueOrganizationIds ? { leagueOrganizationIds: def.leagueOrganizationIds } : {}),
            ...(def.federationTag ? { federationTag: def.federationTag } : {}),
            ...(def.leagueTag ? { leagueTag: def.leagueTag } : {}),
            ...(def.sponsorTag ? { sponsorTag: def.sponsorTag } : {}),
            reportTemplateId: def.reportTemplateId,
            reportId: def.reportTemplateId,
            styleId: def.styleId,
            showEmoji: true,
            showMembersList: true,
            showMembersListTitle: true,
            showMembersListDetails: true,
            showEventsList: true,
            showEventsListTitle: true,
            showEventsListDetails: true,
            stats: existingStats,
          },
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
  }

  // -------------------------------------------------------------------------
  // Step 5: Classify & Stamp ALL Events + Partners with Organization, Federation, League, Sponsor, and Scope Hashtags
  // -------------------------------------------------------------------------
  console.log('[5] Classifying and stamping all events and partners...');
  const allPartners = await partnersCol.find({}).toArray();
  const partnerById = new Map(allPartners.map((p) => [p._id.toString(), p]));
  const allEvents = await projectsCol.find({}).toArray();

  // Track which organization each partner belongs to
  const partnerOrgAssignment = new Map<string, { orgId: ObjectId; fedOrgId?: ObjectId; kind: 'national_team' | 'club' | 'sponsor' }>();

  const NB2_FOOTBALL_CLUBS = new Set([
    'Budafoki MTE',
    'Aquital FC Csákvár',
    'Mezőkövesd Zsóry FC',
    'Békéscsaba 1912 Előre',
    'Tiszakécskei LC',
    'FC Ajka',
    'Soroksár SC',
    'Szentlőrinc SE',
    'Karcagi  SE',
    'Kecskeméti TE',
    'HR-Rent Kozármisleny',
    'Budapest Honvéd FC',
    'Szeged-Csanád Grosics Akadémia',
    'Videoton FC Fehérvár',
    'Budapesti Vasutas SC Zugló',
    'Vasas FC',
  ]);

  const WOMEN_NB1_BASKETBALL_CLUBS = new Set([
    'DVTK HUNTHERM',
    'Sopron Basket',
    'NKA Universitas Pécs Női',
    'UNI Győr',
    'Csata TKK',
    'ELTE BEAC Újbuda',
    'BKG-PRIMA Szigetszentmiklós',
    'TARR KSC Szekszárd',
    'VBW CEKK Cegléd',
    'TFSE',
    'Vasas Akadémia',
    'Dávid Kornél Kosárlabda Akadémia',
  ]);

  for (const ev of allEvents) {
    const ename = String(ev.eventName || '');
    const el = ename.toLowerCase();
    const p1Id = (ev.partner1 || ev.partner1Id)?.toString();
    const p2Id = (ev.partner2 || ev.partner2Id)?.toString();
    const p1 = p1Id ? partnerById.get(p1Id) : undefined;
    const p2 = p2Id ? partnerById.get(p2Id) : undefined;
    const p1Name = String(p1?.name || '');
    const p2Name = String(p2?.name || '');
    const p1Emoji = String(p1?.emoji || '');
    const p2Emoji = String(p2?.emoji || '');
    const currentOrgStr = ev.organizationId?.toString();

    const cat = ev.categorizedHashtags || {};
    let hashtags: string[] = Array.isArray(ev.hashtags) ? [...ev.hashtags] : [];

    let targetOrgId: ObjectId | null = ev.organizationId ? new ObjectId(ev.organizationId) : null;
    let targetFedOrgId: ObjectId | null = null;
    let competitionType: string = 'domestic_league';
    let isSyntheticRollup = false;

    // 1. SZRT Synthetic Rollups
    if (p1Name === 'Szerencsejáték Zrt.') {
      targetOrgId = ORG_IDS.TIPPMIX_SZRT;
      competitionType = 'synthetic_rollup';
      isSyntheticRollup = true;
      cat.sponsor = addUniqueTag(cat.sponsor, 'tippmix');
      cat.sponsor = addUniqueTag(cat.sponsor, 'szerencsejatek_zrt');
      hashtags = addUniqueTag(hashtags, 'tippmix');
      partnerOrgAssignment.set(p1!._id.toString(), { orgId: ORG_IDS.TIPPMIX_SZRT, kind: 'sponsor' });
    }
    // 2. EuroLeague Women
    else if (currentOrgStr === ORG_IDS.EUROLEAGUE_WOMEN.toString() || el.includes('euroleague')) {
      targetOrgId = ORG_IDS.EUROLEAGUE_WOMEN;
      targetFedOrgId = ORG_IDS.FIBA;
      competitionType = 'international_club';
      cat.federation = addUniqueTag(cat.federation, 'fiba');
      cat.league = addUniqueTag(cat.league, 'euroleague_women');
      cat.scope = ['club_games'];
      cat.sport = addUniqueTag(cat.sport, 'basketball');
    }
    // 3. FIBA 3x3
    else if (currentOrgStr === ORG_IDS.FIBA_3X3.toString() || /3x3/i.test(ename)) {
      targetOrgId = ORG_IDS.FIBA_3X3;
      targetFedOrgId = ORG_IDS.FIBA;
      competitionType = /nations league/i.test(ename) ? 'national_team' : 'international_club';
      cat.federation = addUniqueTag(cat.federation, 'fiba');
      cat.league = addUniqueTag(cat.league, 'fiba_3x3');
      cat.scope = [competitionType === 'national_team' ? 'national_games' : 'club_games'];
      cat.sport = addUniqueTag(cat.sport, '3x3');
      cat.sport = addUniqueTag(cat.sport, 'basketball');
    }
    // 4. MKOSZ National Team & Magyar Kupa & FIBA World Cup Qualifiers
    else if (
      currentOrgStr === ORG_IDS.MKOSZ.toString() ||
      p1Name.includes('MKOSZ') ||
      /fiba u20|zsiros tibor|zsíros tibor|killik|kilik/i.test(ename)
    ) {
      targetOrgId = ORG_IDS.MKOSZ;
      targetFedOrgId = ORG_IDS.MKOSZ;
      const isCup = /kupa|final four|kilik|killik|zsiros|zsíros/i.test(ename);
      competitionType = isCup ? 'domestic_cup' : 'national_team';
      cat.federation = addUniqueTag(cat.federation, 'mkosz');
      cat.federation = addUniqueTag(cat.federation, 'fiba');
      cat.league = addUniqueTag(cat.league, isCup ? 'mkosz_magyar_kupa' : 'fiba_national_qualifiers');
      cat.scope = [isCup ? 'club_games' : 'national_games'];
      cat.sport = addUniqueTag(cat.sport, 'basketball');
    }
    // 5. Croatia / INA FIBA World Cup Qualifiers
    else if (/cro vs lat|croatia vs israel/i.test(ename)) {
      targetOrgId = ORG_IDS.FIBA;
      targetFedOrgId = ORG_IDS.FIBA;
      competitionType = 'national_team';
      cat.federation = addUniqueTag(cat.federation, 'fiba');
      cat.league = addUniqueTag(cat.league, 'fiba_world_cup_qualifiers');
      cat.sponsor = addUniqueTag(cat.sponsor, 'ina');
      cat.scope = ['national_games'];
      cat.sport = addUniqueTag(cat.sport, 'basketball');
    }
    // 6. Swiss Ice Hockey (SIHF) & Swiss National League (including Fribourg-Gottéron vs Genève-Servette)
    else if (
      currentOrgStr === ORG_IDS.SIHF.toString() ||
      p1Name.includes('SIHF') ||
      p1Name === 'SC Bern' ||
      /fribourg.*gen[eè]ve|fribourg.*ambri|sc bern.*biel|sc bern.*ajoie|sc bern.*lugano/i.test(ename)
    ) {
      // Wait: if SC Bern is playingBrynas IF or Mountfield HK, that's CHL!
      if (/brynas|mountfield|frölunda|lulea|grenoble/i.test(ename)) {
        targetOrgId = ORG_IDS.CHL;
        competitionType = 'international_club';
        cat.federation = addUniqueTag(cat.federation, 'chl');
        cat.league = addUniqueTag(cat.league, 'champions_hockey_league');
        cat.scope = ['club_games'];
        cat.sport = addUniqueTag(cat.sport, 'ice_hockey');
      } else {
        targetOrgId = ORG_IDS.SIHF;
        targetFedOrgId = ORG_IDS.SIHF;
        const isNat = /sihf|euro hockey tour|wm 2026|wm campaign/i.test(ename) || p1Name.includes('SIHF');
        competitionType = isNat ? 'national_team' : 'domestic_league';
        cat.federation = addUniqueTag(cat.federation, 'sihf');
        cat.league = addUniqueTag(cat.league, isNat ? 'sihf_national_team' : 'swiss_national_league');
        cat.scope = [isNat ? 'national_games' : 'club_games'];
        cat.sport = addUniqueTag(cat.sport, 'ice_hockey');
      }
    }
    // 7. Champions Hockey League (CHL)
    else if (
      currentOrgStr === ORG_IDS.CHL.toString() ||
      p1?.organizationId?.toString() === ORG_IDS.CHL.toString() ||
      p2?.organizationId?.toString() === ORG_IDS.CHL.toString()
    ) {
      // Check if it's actually an ICEHL game (Hydro Fehérvár AV19 vs Moser Medical Graz99ers or EC-KAC)
      if (/hydro feh[eé]rv[aá]r|ftc - telekom|ec-kac|ec kac/i.test(ename)) {
        targetOrgId = ORG_IDS.ICEHL_ERSTE_LIGA;
        targetFedOrgId = ORG_IDS.MJSZ;
        competitionType = 'domestic_league';
        cat.federation = addUniqueTag(cat.federation, 'mjsz');
        cat.league = addUniqueTag(cat.league, 'icehl');
        cat.sponsor = addUniqueTag(cat.sponsor, 'tippmix');
        cat.scope = ['club_games'];
        cat.sport = addUniqueTag(cat.sport, 'ice_hockey');
      } else {
        targetOrgId = ORG_IDS.CHL;
        competitionType = 'international_club';
        cat.federation = addUniqueTag(cat.federation, 'chl');
        cat.league = addUniqueTag(cat.league, 'champions_hockey_league');
        cat.scope = ['club_games'];
        cat.sport = addUniqueTag(cat.sport, 'ice_hockey');
      }
    }
    // 8. MOL EHF Champions League vs Hungarian Domestic Handball
    else if (
      currentOrgStr === ORG_IDS.MOL_EHF.toString() ||
      p1?.organizationId?.toString() === ORG_IDS.MOL_EHF.toString() ||
      p2?.organizationId?.toString() === ORG_IDS.MOL_EHF.toString() ||
      /fresh corner cup/i.test(ename)
    ) {
      // Separate domestic Hungarian handball matches (e.g. PLER Budapest x OTP Bank - PICK Szeged, MOL Tatabánya x ETO University Handball Team)
      if (/pler budapest|eto university handball/i.test(ename)) {
        targetOrgId = ORG_IDS.KH_KEZILABDA_LIGA;
        targetFedOrgId = ORG_IDS.MKSZ;
        competitionType = 'domestic_league';
        cat.federation = addUniqueTag(cat.federation, 'mksz');
        cat.league = addUniqueTag(cat.league, 'kh_kezilabda_liga');
        cat.sponsor = addUniqueTag(cat.sponsor, 'tippmix');
        cat.scope = ['club_games'];
        cat.sport = addUniqueTag(cat.sport, 'handball');
      } else {
        targetOrgId = ORG_IDS.MOL_EHF;
        competitionType = 'international_club';
        cat.federation = addUniqueTag(cat.federation, 'ehf');
        cat.league = addUniqueTag(cat.league, 'ehf_champions_league');
        cat.sponsor = addUniqueTag(cat.sponsor, 'mol');
        cat.scope = ['club_games'];
        cat.sport = addUniqueTag(cat.sport, 'handball');
      }
    }
    // 9. MKSZ National Team & Magyar Kupa / Szuperkupa
    else if (p1Name === 'MOL MKSZ' || /mksz|hun - srb vb-selejtez/i.test(ename)) {
      targetOrgId = ORG_IDS.MKSZ;
      targetFedOrgId = ORG_IDS.MKSZ;
      const isNat = /hun - srb|vb-selejtez/i.test(ename);
      competitionType = isNat ? 'national_team' : 'domestic_cup';
      cat.federation = addUniqueTag(cat.federation, 'mksz');
      cat.league = addUniqueTag(cat.league, isNat ? 'ihf_world_cup_qualifiers' : 'mksz_magyar_kupa');
      cat.sponsor = addUniqueTag(cat.sponsor, 'mol');
      cat.scope = [isNat ? 'national_games' : 'club_games'];
      cat.sport = addUniqueTag(cat.sport, 'handball');
    }
    // 10. MRSZ Volleyball
    else if (p1Name.includes('MRSZ') || /🏐|röplabda|hun-tur.*hun-den/i.test(ename)) {
      targetOrgId = ORG_IDS.MRSZ;
      targetFedOrgId = ORG_IDS.MRSZ;
      const isNat = /hungary x|hun-tur/i.test(ename);
      competitionType = isNat ? 'national_team' : 'domestic_cup';
      cat.federation = addUniqueTag(cat.federation, 'mrsz');
      cat.league = addUniqueTag(cat.league, isNat ? 'cev_eurovolley_qualifiers' : 'mrsz_magyar_kupa');
      if (!isNat) cat.sponsor = addUniqueTag(cat.sponsor, 'mol');
      cat.scope = [isNat ? 'national_games' : 'club_games'];
      cat.sport = addUniqueTag(cat.sport, 'volleyball');
    }
    // 11. European Aquatics
    else if (currentOrgStr === ORG_IDS.EUROPEAN_AQUATICS.toString() || p1Name === 'EUROPEAN AQUATICS' || /water polo|swimming/i.test(ename)) {
      targetOrgId = ORG_IDS.EUROPEAN_AQUATICS;
      targetFedOrgId = ORG_IDS.EUROPEAN_AQUATICS;
      const isClub = /final4|super cup/i.test(ename);
      competitionType = isClub ? 'international_club' : 'national_team';
      cat.federation = addUniqueTag(cat.federation, 'european_aquatics');
      cat.league = addUniqueTag(cat.league, isClub ? 'len_champions_league' : 'european_aquatics_championships');
      cat.scope = [isClub ? 'club_games' : 'national_games'];
      cat.sport = addUniqueTag(cat.sport, /swimming/i.test(ename) ? 'swimming' : 'water_polo');
    }
    // 12. MLSZ National Team & MOL Magyar Kupa
    else if (
      currentOrgStr === ORG_IDS.MLSZ.toString() ||
      currentOrgStr === ORG_IDS.MOL_MAGYAR_KUPA.toString() ||
      p1Name.includes('MLSZ') ||
      /mol magyar kupa|mol hungarian soccer cup/i.test(ename)
    ) {
      const isCup = /magyar kupa|hungarian soccer cup/i.test(ename);
      targetOrgId = isCup ? ORG_IDS.MOL_MAGYAR_KUPA : ORG_IDS.MLSZ;
      targetFedOrgId = ORG_IDS.MLSZ;
      competitionType = isCup ? 'domestic_cup' : 'national_team';
      cat.federation = addUniqueTag(cat.federation, 'mlsz');
      cat.federation = addUniqueTag(cat.federation, 'uefa');
      cat.league = addUniqueTag(cat.league, isCup ? 'mol_magyar_kupa' : 'uefa_european_qualifiers');
      if (isCup) cat.sponsor = addUniqueTag(cat.sponsor, 'mol');
      cat.scope = [isCup ? 'club_games' : 'national_games'];
      cat.sport = addUniqueTag(cat.sport, 'football');
    }
    // 13. Polish Federations (PZPN & ZPRP)
    else if (p1Name === 'PZPN' || /pzpn/i.test(ename)) {
      targetOrgId = ORG_IDS.PZPN;
      targetFedOrgId = ORG_IDS.PZPN;
      competitionType = 'national_team';
      cat.federation = addUniqueTag(cat.federation, 'pzpn');
      cat.federation = addUniqueTag(cat.federation, 'uefa');
      cat.league = addUniqueTag(cat.league, 'uefa_european_qualifiers');
      cat.scope = ['national_games'];
      cat.sport = addUniqueTag(cat.sport, 'football');
    } else if (p1Name === 'ZPRP Handball Polska' || /zprp/i.test(ename)) {
      targetOrgId = ORG_IDS.ZPRP;
      targetFedOrgId = ORG_IDS.ZPRP;
      competitionType = 'national_team';
      cat.federation = addUniqueTag(cat.federation, 'zprp');
      cat.federation = addUniqueTag(cat.federation, 'ehf');
      cat.league = addUniqueTag(cat.league, 'ehf_euro_qualifiers');
      cat.scope = ['national_games'];
      cat.sport = addUniqueTag(cat.sport, 'handball');
    }
    // 14. Serie A - Lega Serie A (AS Roma matches)
    else if (p1Name === 'AS Roma' || currentOrgStr === ORG_IDS.SERIE_A.toString()) {
      targetOrgId = ORG_IDS.SERIE_A;
      competitionType = 'domestic_league';
      cat.league = addUniqueTag(cat.league, 'serie_a');
      cat.scope = ['club_games'];
      cat.sport = addUniqueTag(cat.sport, 'football');
    }
    // 15. UEFA Champions League / Super Cup / European Cups
    else if (
      p1Name in { Villarreal: 1, 'Villarreal CF': 1, 'Cesena FC': 1, 'LASK Linz': 1, UEFA: 1, 'MOL Czech Cup 2026': 1, 'MOL Slovnaft': 1, 'Belgian Red Devils': 1 } ||
      /psg - arsenal|uefa super cup|slovnaft|czech.*cup|we are belgium/i.test(ename)
    ) {
      const isNational = /we are belgium/i.test(ename);
      targetOrgId = isNational ? ORG_IDS.UEFA_EUROPEAN_QUALIFIERS : ORG_IDS.UEFA_CHAMPIONS_LEAGUE;
      targetFedOrgId = ORG_IDS.UEFA;
      competitionType = isNational ? 'national_team' : 'international_club';
      cat.federation = addUniqueTag(cat.federation, 'uefa');
      cat.league = addUniqueTag(cat.league, isNational ? 'fifa_world_cup' : 'uefa_champions_league');
      if (/mol|slovnaft/i.test(ename)) cat.sponsor = addUniqueTag(cat.sponsor, 'mol');
      cat.scope = [isNational ? 'national_games' : 'club_games'];
      cat.sport = addUniqueTag(cat.sport, 'football');
    }
    // 16. Hungarian Domestic Basketball (Tippmix Férfi & Női NB I. A -> MKOSZ)
    else if (p1Emoji.includes('🏀') || p2Emoji.includes('🏀') || (cat.sport || []).includes('basketball')) {
      const isWomen = WOMEN_NB1_BASKETBALL_CLUBS.has(p1Name) || WOMEN_NB1_BASKETBALL_CLUBS.has(p2Name);
      targetOrgId = isWomen ? ORG_IDS.TIPPMIX_NOI_NB1 : ORG_IDS.TIPPMIX_FERFI_NB1;
      targetFedOrgId = ORG_IDS.MKOSZ;
      competitionType = 'domestic_league';
      cat.federation = addUniqueTag(cat.federation, 'mkosz');
      cat.league = addUniqueTag(cat.league, isWomen ? 'tippmix_noi_nb1' : 'tippmix_ferfi_nb1');
      cat.sponsor = addUniqueTag(cat.sponsor, 'tippmix');
      hashtags = addUniqueTag(hashtags, 'tippmix');
      cat.scope = ['club_games'];
      cat.sport = addUniqueTag(cat.sport, 'basketball');
    }
    // 17. Hungarian Domestic Handball (K&H Kézilabda Liga -> MKSZ)
    else if (p1Emoji.includes('🤾') || p2Emoji.includes('🤾') || (cat.sport || []).includes('handball')) {
      targetOrgId = ORG_IDS.KH_KEZILABDA_LIGA;
      targetFedOrgId = ORG_IDS.MKSZ;
      competitionType = 'domestic_league';
      cat.federation = addUniqueTag(cat.federation, 'mksz');
      cat.league = addUniqueTag(cat.league, 'kh_kezilabda_liga');
      cat.sponsor = addUniqueTag(cat.sponsor, 'tippmix');
      hashtags = addUniqueTag(hashtags, 'tippmix');
      cat.scope = ['club_games'];
      cat.sport = addUniqueTag(cat.sport, 'handball');
    }
    // 18. ICEHL & Erste Liga Ice Hockey (-> MJSZ)
    else if (p1Emoji.includes('🏒') || p2Emoji.includes('🏒') || (cat.sport || []).includes('icehockey')) {
      targetOrgId = ORG_IDS.ICEHL_ERSTE_LIGA;
      targetFedOrgId = ORG_IDS.MJSZ;
      competitionType = 'domestic_league';
      cat.federation = addUniqueTag(cat.federation, 'mjsz');
      cat.league = addUniqueTag(cat.league, 'erste_liga');
      cat.sponsor = addUniqueTag(cat.sponsor, 'tippmix');
      hashtags = addUniqueTag(hashtags, 'tippmix');
      cat.scope = ['club_games'];
      cat.sport = addUniqueTag(cat.sport, 'ice_hockey');
    }
    // 19. Hungarian Domestic Football (OTP Bank Liga NB I & Merkantil Bank Liga NB II -> MLSZ)
    else if (p1Emoji.includes('⚽') || p2Emoji.includes('⚽') || (cat.sport || []).includes('football') || (cat.sport || []).includes('soccer')) {
      const isNb2 = NB2_FOOTBALL_CLUBS.has(p1Name) && NB2_FOOTBALL_CLUBS.has(p2Name);
      targetOrgId = isNb2 ? ORG_IDS.MERKANTIL_BANK_LIGA : ORG_IDS.OTP_BANK_LIGA;
      targetFedOrgId = ORG_IDS.MLSZ;
      competitionType = 'domestic_league';
      cat.federation = addUniqueTag(cat.federation, 'mlsz');
      cat.league = addUniqueTag(cat.league, isNb2 ? 'merkantil_bank_liga_nb2' : 'otp_bank_liga_nb1');
      cat.sponsor = addUniqueTag(cat.sponsor, 'tippmix');
      hashtags = addUniqueTag(hashtags, 'tippmix');
      cat.scope = ['club_games'];
      cat.sport = addUniqueTag(cat.sport, 'football');
    }
    // 20. MotoGP
    else if (/motogp/i.test(ename) || currentOrgStr === ORG_IDS.MOTOGP.toString()) {
      targetOrgId = ORG_IDS.MOTOGP;
      competitionType = 'special';
      cat.league = addUniqueTag(cat.league, 'motogp');
      cat.sport = addUniqueTag(cat.sport, 'motorsport');
    }

    // Fix MLSZ - Észak-Írország missing partner2
    let extraUpdate: Record<string, any> = {};
    if (ev._id.toString() === '6afb21b18c1464dd1e563aa9' && !ev.partner2) {
      let niPartner = await partnersCol.findOne({ name: /Northern Ireland|Észak-Írország/i });
      if (!niPartner) {
        const ins = await partnersCol.insertOne({
          name: 'Northern Ireland',
          emoji: '⚽',
          viewSlug: crypto.randomUUID(),
          organizationId: ORG_IDS.MLSZ,
          federationOrganizationId: ORG_IDS.MLSZ,
          partnerKind: 'national_team',
          hashtags: ['football', 'uefa'],
          categorizedHashtags: { sport: ['football'], federation: ['uefa'] },
          createdAt: now,
          updatedAt: now,
        });
        niPartner = await partnersCol.findOne({ _id: ins.insertedId });
      }
      if (niPartner) {
        extraUpdate = { partner2: niPartner._id, partner2Id: niPartner._id };
      }
    }

    await projectsCol.updateOne(
      { _id: ev._id },
      {
        $set: {
          ...(targetOrgId ? { organizationId: targetOrgId } : {}),
          ...(targetFedOrgId ? { federationOrganizationId: targetFedOrgId } : {}),
          competitionType,
          isSyntheticRollup,
          categorizedHashtags: cat,
          hashtags,
          ...extraUpdate,
          updatedAt: now,
        },
      }
    );

    // Record partner-to-organization assignment for p1 and p2
    if (targetOrgId) {
      const pKind: 'national_team' | 'club' = competitionType === 'national_team' ? 'national_team' : 'club';
      for (const pid of [p1Id, p2Id]) {
        if (!pid) continue;
        const existingP = partnerById.get(pid);
        if (!existingP) continue;
        // Keep international league org assignment if already set on ELW / CHL / MOL EHF, otherwise set to targetOrgId
        if (!partnerOrgAssignment.has(pid)) {
          partnerOrgAssignment.set(pid, {
            orgId: existingP.organizationId || targetOrgId,
            fedOrgId: targetFedOrgId || undefined,
            kind: pKind,
          });
        }
      }
    }
  }

  // Update partners with organizationId, federationOrganizationId, and partnerKind
  for (const [pid, assign] of partnerOrgAssignment.entries()) {
    await partnersCol.updateOne(
      { _id: new ObjectId(pid) },
      {
        $set: {
          organizationId: assign.orgId,
          ...(assign.fedOrgId ? { federationOrganizationId: assign.fedOrgId } : {}),
          partnerKind: assign.kind,
          updatedAt: now,
        },
      }
    );
  }

  // Explicitly ensure key federation national team partners have partnerKind = 'national_team'
  await partnersCol.updateMany(
    {
      $or: [
        { name: /National Team|MKOSZ|MLSZ|MKSZ|MRSZ|SIHF|PZPN|ZPRP|Finland|Sweden|Czech|Ireland|Greece|Slovenia|Georgia|Ukraine|Kazakhstan|Armenia|Romania|Bosnia|Israel Basketball|Iceland Basketball|Handball Austria/i },
      ],
    },
    { $set: { partnerKind: 'national_team', updatedAt: now } }
  );

  // -------------------------------------------------------------------------
  // Step 6: Seed the 3 Default Report Variants for All Federation Organizations
  //         + Variants for Sponsor Organizations & Multi-Competition Clubs
  // -------------------------------------------------------------------------
  console.log('[6] Seeding 3 default report variants (National Games, Club Games, All Together) for all Federations...');
  const federationOrgs = orgDefinitions.filter((d) => d.orgType === 'federation');
  for (const fed of federationOrgs) {
    const ownerId = fed._id.toString();
    const fedVariants = [
      {
        slug: 'default',
        name: 'All Together (National + Club)',
        isDefault: true,
        eventScope: 'all',
      },
      {
        slug: 'national-games',
        name: 'National Games',
        isDefault: false,
        eventScope: 'national_games',
      },
      {
        slug: 'club-games',
        name: 'Club Games',
        isDefault: false,
        eventScope: 'club_games',
      },
    ];

    for (const fv of fedVariants) {
      await variantsCol.updateOne(
        { ownerType: 'organization', ownerId, slug: fv.slug },
        {
          $set: {
            ownerType: 'organization',
            ownerId,
            name: fv.name,
            slug: fv.slug,
            isDefault: fv.isDefault,
            status: 'published',
            timezone: 'Europe/Budapest',
            periodPreset: 'all_time',
            customDateRange: null,
            eventScope: fv.eventScope,
            eventFilter: null,
            reportTemplateId: fed.reportTemplateId,
            styleId: fed.styleId,
            emoji: fed.emoji,
            showEmoji: true,
            showMembersList: true,
            showMembersListTitle: true,
            showMembersListDetails: true,
            showEventsList: true,
            showEventsListTitle: true,
            showEventsListDetails: true,
            statsOverrides: {},
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
    }
  }

  // Seed Sponsor variants for Tippmix / Szerencsejáték Zrt.
  const tippmixOwnerId = ORG_IDS.TIPPMIX_SZRT.toString();
  const tippmixVariants = [
    { slug: 'default', name: 'All Tippmix Events', isDefault: true, eventFilter: null },
    { slug: 'club-matches', name: 'Sponsored Club Matches', isDefault: false, eventFilter: { excludeSyntheticRollups: true } },
    { slug: 'football', name: 'Tippmix Football (NB I & NB II)', isDefault: false, eventFilter: { sportTags: ['football'], excludeSyntheticRollups: true } },
    { slug: 'basketball', name: 'Tippmix Basketball (NB I. A)', isDefault: false, eventFilter: { sportTags: ['basketball'], excludeSyntheticRollups: true } },
    { slug: 'handball', name: 'Tippmix Handball (K&H Liga)', isDefault: false, eventFilter: { sportTags: ['handball'], excludeSyntheticRollups: true } },
    { slug: 'ice-hockey', name: 'Tippmix Ice Hockey (Erste Liga & ICEHL)', isDefault: false, eventFilter: { sportTags: ['ice_hockey'], excludeSyntheticRollups: true } },
    { slug: 'campaign-rollups', name: 'SZRT Campaign Analytics Rollups', isDefault: false, eventFilter: { competitionTypes: ['synthetic_rollup'] } },
  ];
  for (const tv of tippmixVariants) {
    await variantsCol.updateOne(
      { ownerType: 'organization', ownerId: tippmixOwnerId, slug: tv.slug },
      {
        $set: {
          ownerType: 'organization',
          ownerId: tippmixOwnerId,
          name: tv.name,
          slug: tv.slug,
          isDefault: tv.isDefault,
          status: 'published',
          timezone: 'Europe/Budapest',
          periodPreset: 'all_time',
          customDateRange: null,
          eventScope: 'all',
          eventFilter: tv.eventFilter,
          reportTemplateId: FIBA_TEMPLATE_ID,
          styleId: SZRT_STYLE_ID,
          emoji: '🍀',
          showEmoji: true,
          showMembersList: true,
          showEventsList: true,
          statsOverrides: {},
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
  }

  // -------------------------------------------------------------------------
  // Step 7: Sync Camera DB (camaraclastar/camera) & Fanmass Pipeline
  // -------------------------------------------------------------------------
  if (cluster.hasCameraDb) {
    console.log('[7] Synchronizing camera DB and fanmass_camera_pipeline DB on PROD...');
    const camDb = client.db('camera');
    const camOrgs = camDb.collection('organizations');
    const camPartners = camDb.collection('partners');
    const camEvents = camDb.collection('events');

    // 7a. Delete test organizations, partners, and events from camera DB
    const camDelOrgs = await camOrgs.deleteMany({
      $or: [
        { messmassOrganizationId: { $in: DELETE_ORG_IDS } },
        { name: { $in: ['SEYU UZB', 'Seyu Events', 'Central Asian University', 'каmеяа аррlicатiоп', 'FunFitFan'] } },
      ],
    });
    const camDelPartners = await camPartners.deleteMany({
      $or: [
        { messmassPartnerId: { $in: DELETE_PARTNER_IDS } },
        { name: { $in: ['SEYU UZB', 'Seyu Events', 'Central Asian University', 'каmеяа аррlicатiоп', 'KAM каmеяа аррlicатiоп', 'FunFitFan', 'David FC', 'teszt 100', 'Zenga Demo'] } },
      ],
    });
    const camDelEvents = await camEvents.deleteMany({
      messmassEventId: { $in: DELETE_EVENT_IDS },
    });
    console.log(`    Deleted in camera DB: ${camDelOrgs.deletedCount} orgs, ${camDelPartners.deletedCount} partners, ${camDelEvents.deletedCount} events`);

    // 7b. Sync all messmass organizations to camera.organizations
    const mmOrgs = await orgsCol.find({}).toArray();
    const camOrgIdByMmOrgId = new Map<string, string>();
    for (const mo of mmOrgs) {
      const mmId = mo._id.toString();
      const existingCamOrg = await camOrgs.findOne({ messmassOrganizationId: mmId });
      const camOrgUuid = existingCamOrg?.organizationId || crypto.randomUUID();
      await camOrgs.updateOne(
        { messmassOrganizationId: mmId },
        {
          $set: {
            organizationId: camOrgUuid,
            name: mo.name,
            slug: mo.slug,
            messmassOrganizationId: mmId,
            source: 'messmass',
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
      camOrgIdByMmOrgId.set(mmId, camOrgUuid);
    }

    // 7c. Deduplicate camera.partners and remap merged messmassPartnerIds
    for (const merge of PARTNER_MERGES) {
      const targetCamPartner = await camPartners.findOne({ messmassPartnerId: merge.toId });
      const sourceCamPartners = await camPartners.find({ messmassPartnerId: merge.fromId }).toArray();
      if (targetCamPartner && sourceCamPartners.length > 0) {
        const oldPartnerUuids = sourceCamPartners.map((sp) => sp.partnerId).filter(Boolean);
        if (oldPartnerUuids.length > 0 && targetCamPartner.partnerId) {
          await camEvents.updateMany(
            { partnerId: { $in: oldPartnerUuids } },
            { $set: { partnerId: targetCamPartner.partnerId, partnerName: merge.canonicalName || targetCamPartner.name, updatedAt: now } }
          );
          await camDb.collection('submissions').updateMany(
            { partnerId: { $in: oldPartnerUuids } },
            { $set: { partnerId: targetCamPartner.partnerId } }
          );
        }
        await camPartners.deleteMany({ messmassPartnerId: merge.fromId });
      } else if (!targetCamPartner && sourceCamPartners.length > 0) {
        // Rename the first sourceCamPartner to become the canonical targetCamPartner
        const [first, ...rest] = sourceCamPartners;
        await camPartners.updateOne(
          { _id: first._id },
          { $set: { messmassPartnerId: merge.toId, name: merge.canonicalName || first.name, updatedAt: now } }
        );
        if (rest.length > 0) {
          await camPartners.deleteMany({ _id: { $in: rest.map((r) => r._id) } });
        }
      }
    }

    // Deduplicate any remaining camera.partners that share the same messmassPartnerId
    const allCamPartners = await camPartners.find({ messmassPartnerId: { $exists: true, $ne: null } }).toArray();
    const byMmPartnerId = new Map<string, any[]>();
    for (const cp of allCamPartners) {
      const k = String(cp.messmassPartnerId);
      if (!byMmPartnerId.has(k)) byMmPartnerId.set(k, []);
      byMmPartnerId.get(k)!.push(cp);
    }
    let dedupedCount = 0;
    for (const [mmPid, group] of byMmPartnerId.entries()) {
      const mmPartner = await partnersCol.findOne({ _id: new ObjectId(mmPid) });
      // Prefer the camera partner whose partnerId matches mmPartner.cameraPartnerId
      group.sort((a, b) => {
        const aMatch = mmPartner?.cameraPartnerId && a.partnerId === mmPartner.cameraPartnerId ? 1 : 0;
        const bMatch = mmPartner?.cameraPartnerId && b.partnerId === mmPartner.cameraPartnerId ? 1 : 0;
        return bMatch - aMatch;
      });
      const [keep, ...dups] = group;
      if (mmPartner) {
        const camOrgUuid = mmPartner.organizationId ? camOrgIdByMmOrgId.get(mmPartner.organizationId.toString()) || null : null;
        await camPartners.updateOne(
          { _id: keep._id },
          {
            $set: {
              name: mmPartner.name,
              organizationId: camOrgUuid,
              ...(mmPartner.logoUrl ? { logoUrl: mmPartner.logoUrl } : {}),
              updatedAt: now,
            },
          }
        );
      }
      if (dups.length > 0) {
        const dupUuids = dups.map((d) => d.partnerId).filter(Boolean);
        if (dupUuids.length > 0 && keep.partnerId) {
          await camEvents.updateMany(
            { partnerId: { $in: dupUuids } },
            { $set: { partnerId: keep.partnerId, partnerName: mmPartner?.name || keep.name } }
          );
        }
        await camPartners.deleteMany({ _id: { $in: dups.map((d) => d._id) } });
        dedupedCount += dups.length;
      }
    }
    console.log(`    Deduplicated ${dedupedCount} duplicate camera.partners records`);

    // 7d. Sync camera.events partnerId and partnerName to match messmass.projects.partner1
    const refreshedCamPartners = await camPartners.find({ messmassPartnerId: { $exists: true } }).toArray();
    const camPartnerByMmId = new Map(refreshedCamPartners.map((cp) => [String(cp.messmassPartnerId), cp]));
    const refreshedMmEvents = await projectsCol.find({}).toArray();
    let syncedCamEvents = 0;
    for (const me of refreshedMmEvents) {
      const p1Id = (me.partner1 || me.partner1Id)?.toString();
      if (!p1Id) continue;
      const cp = camPartnerByMmId.get(p1Id);
      if (!cp || !cp.partnerId) continue;
      const res = await camEvents.updateOne(
        { messmassEventId: me._id.toString() },
        {
          $set: {
            partnerId: cp.partnerId,
            partnerName: cp.name,
            name: me.eventName,
            updatedAt: now,
          },
        }
      );
      if (res.modifiedCount > 0) syncedCamEvents++;
    }
    console.log(`    Synchronized ${syncedCamEvents} camera.events partner assignments with messmass`);

    // 7e. Clean test events from fanmass_camera_pipeline
    const pipeDb = client.db('fanmass_camera_pipeline');
    await pipeDb.collection('fanmass_camera_event_state').deleteMany({
      messmassEventId: { $in: DELETE_EVENT_IDS },
    });
    await pipeDb.collection('fanmass_camera_analysis_results').deleteMany({
      messmassEventId: { $in: DELETE_EVENT_IDS },
    });
    await pipeDb.collection('fanmass_camera_analysis_delivery').deleteMany({
      messmassEventId: { $in: DELETE_EVENT_IDS },
    });
  }

  await client.close();
}

async function syncLocalFanmass() {
  try {
    const localClient = new MongoClient('mongodb://127.0.0.1:27017');
    await localClient.connect();
    const localDb = localClient.db('fanmass');
    const delEntities = await localDb.collection('entities').deleteMany({
      displayName: { $in: ['SEYU UZB', 'Seyu Events', 'Central Asian University', 'каmеяа аррlicатiоп', 'FunFitFan', 'David FC', 'teszt 100', 'Zenga Demo'] },
    });
    console.log(`\n[8] Cleaned ${delEntities.deletedCount} test entities from local fanmass MongoDB`);
    await localClient.close();
  } catch (err: any) {
    console.log('Local fanmass sync skipped:', err.message);
  }
}

async function main() {
  for (const cluster of CLUSTERS) {
    await reorganizeCluster(cluster);
  }
  await syncLocalFanmass();
  console.log('\n✅ Fleet-wide Organization, Partner & Event Reorganization Complete!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
