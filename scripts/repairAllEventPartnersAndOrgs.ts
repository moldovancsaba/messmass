// scripts/repairAllEventPartnersAndOrgs.ts
// Comprehensive repair for all misplaced organizations, partners, and event pairings
// Dual-cluster parity: messmass-cluster (r96vlxs) and camaraclastar (koyedpi)

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CLUSTERS = [
  {
    name: 'messmass-cluster',
    uri: process.env.MONGODB_URI || 'mongodb+srv://messmass:mirdob-5kykku-qozGym@messmass-cluster.r96vlxs.mongodb.net/?appName=messmass-cluster',
    dbName: 'messmass',
  },
  {
    name: 'camaraclastar',
    uri: 'mongodb+srv://moldovancsaba_db_user:wMP6z5B3ft5mmyI0@camaraclastar.koyedpi.mongodb.net/?retryWrites=true&w=majority&appName=camaraclastar',
    dbName: 'messmass',
  },
];

interface CanonicalTeam {
  name: string;
  emoji: string;
  orgSlug?: string;
  aliases: string[];
}

const CANONICAL_TEAMS: CanonicalTeam[] = [
  // EuroLeague Women teams
  { name: 'Fenerbahce Tarfin', emoji: '🏀', orgSlug: 'euroleague-women', aliases: ['fenerbahce', 'fenerbahce tarfin', 'fenerbahçe'] },
  { name: 'Valencia Basket Club', emoji: '🏀', orgSlug: 'euroleague-women', aliases: ['valencia', 'valencia basket', 'valencia basket club'] },
  { name: 'Beretta Famila Schio', emoji: '🏀', orgSlug: 'euroleague-women', aliases: ['beretta', 'beretta famila', 'beretta famila schio', 'famila schio', 'schio'] },
  { name: 'Galatasaray Cagdas Faktoring', emoji: '🏀', orgSlug: 'euroleague-women', aliases: ['galatasaray', 'galatasaray cagdas', 'galatasaray cagdas faktoring'] },
  { name: 'DVTK Huntherm', emoji: '🏀', orgSlug: 'euroleague-women', aliases: ['dvtk huntherm'] },
  { name: 'AZS UMCS Lublin', emoji: '🏀', orgSlug: 'euroleague-women', aliases: ['lublin', 'azs umcs lublin'] },
  { name: 'Casademont Zaragoza', emoji: '🏀', orgSlug: 'euroleague-women', aliases: ['zaragoza', 'casademont zaragoza'] },
  { name: 'ZVVZ USK Praha', emoji: '🏀', orgSlug: 'euroleague-women', aliases: ['usk praha', 'zvvz usk praha', 'praha'] },

  // Champions Hockey League (CHL) teams
  { name: 'Bordeax Boxers', emoji: '🏒', orgSlug: 'chf', aliases: ['bordeax boxers', 'bordeaux boxers', 'boxers de bordeaux'] },
  { name: 'HC Pilsen', emoji: '🏒', orgSlug: 'chf', aliases: ['hc pilsen', 'plzen', 'hc plzen'] },
  { name: 'Zurich Lions', emoji: '🏒', orgSlug: 'chf', aliases: ['zurich lions', 'zsc lions', 'zurich'] },
  { name: 'Farjestad BK', emoji: '🏒', orgSlug: 'chf', aliases: ['farjestad', 'färjestad', 'farjestad bk', 'färjestad bk'] },
  { name: 'Rögle Ängelholm', emoji: '🏒', orgSlug: 'chf', aliases: ['rögle', 'rogle', 'rögle ängelholm', 'rogle angelholm'] },
  { name: 'HC Davos', emoji: '🏒', orgSlug: 'chf', aliases: ['hc davos', 'davos'] },
  { name: 'SC Bern', emoji: '🏒', orgSlug: 'swiss-ice-hockey', aliases: ['sc bern', 'bern'] },
  { name: 'HC Ajoie', emoji: '🏒', orgSlug: 'swiss-ice-hockey', aliases: ['hc ajoie', 'ajoie'] },
  { name: 'EHC Biel-Bienne', emoji: '🏒', orgSlug: 'swiss-ice-hockey', aliases: ['ehc biel-bienne', 'biel-bienne', 'ehc biel'] },
  { name: 'EC-KAC', emoji: '🏒', aliases: ['ec kac', 'ec-kac', 'kac'] },
  { name: 'HC Pustertal Wölfe', emoji: '🏒', aliases: ['hc pustertal', 'hc pustertal wolfe', 'hc pustertal wölfe', 'pustertal'] },
  { name: 'HC Fribourg-Gottéron', emoji: '🏒', orgSlug: 'swiss-ice-hockey', aliases: ['hc fribourg-gotteron', 'hc fribourg-gottéron', 'fribourg-gotteron', 'fribourg'] },
  { name: 'HC Ambri-Piotta', emoji: '🏒', orgSlug: 'swiss-ice-hockey', aliases: ['ambri-piotta', 'hc ambri-piotta', 'ambri'] },

  // MOL EHF teams
  { name: 'OTP Bank - PICK Szeged', emoji: '🤾🏻', orgSlug: 'mol-ehf-2025-2026', aliases: ['pick szeged', 'otp bank - pick szeged', 'szeged'] },
  { name: 'IFK Kristianstad', emoji: '🤾', orgSlug: 'mol-ehf-2025-2026', aliases: ['ifk kristianstad', 'kristianstad'] },
  { name: 'CS Dinamo București', emoji: '🤾🏻', orgSlug: 'mol-ehf-2025-2026', aliases: ['cs dinamo bucuresti', 'cs dinamo bucurești', 'dinamo bucuresti', 'dinamo bucurești'] },
  { name: 'Montpellier Handball', emoji: '🤾', orgSlug: 'mol-ehf-2025-2026', aliases: ['montpellier handball', 'montpellier'] },
  { name: 'ONE Veszprém HC', emoji: '🤾', orgSlug: 'mol-ehf-2025-2026', aliases: ['one veszprem', 'one veszprém', 'one veszprem hc', 'one veszprém hc', 'veszprem', 'telekom veszprem'] },
  { name: 'Sporting CP', emoji: '🤾', orgSlug: 'mol-ehf-2025-2026', aliases: ['sporting', 'sporting cp'] },
  { name: 'Füchse Berlin', emoji: '🤾', orgSlug: 'mol-ehf-2025-2026', aliases: ['fuchse berlin', 'füchse berlin'] },
  { name: 'MOL Tatabánya KC', emoji: '🤾', orgSlug: 'mol-ehf-2025-2026', aliases: ['mol tatabanya kc', 'mol tatabánya kc', 'tatabanya', 'tatabánya'] },
  { name: 'GRK Ohrid', emoji: '🤾', orgSlug: 'mol-ehf-2025-2026', aliases: ['grk ohrid', 'ohrid'] },
  { name: 'HC PPD Zagreb', emoji: '🤾', orgSlug: 'mol-ehf-2025-2026', aliases: ['hc zagreb', 'hc ppd zagreb', 'zagreb'] },
  { name: 'Industria Kielce', emoji: '🤾', orgSlug: 'mol-ehf-2025-2026', aliases: ['industria kielce', 'kielce'] },
  { name: 'RK Celje Pivovarna Laško', emoji: '🤾', orgSlug: 'mol-ehf-2025-2026', aliases: ['rk celje', 'celje'] },

  // Hungarian Football & National teams (MLSZ)
  { name: 'Hungary National Team', emoji: '⚽', orgSlug: 'mlsz', aliases: ['hungary', 'magyarország', 'hun', 'magyar válogatott'] },
  { name: 'Turkey National Team', emoji: '⚽', aliases: ['turkey', 'törökország'] },
  { name: 'Kazakhstan National Team', emoji: '⚽', aliases: ['kazakhstan', 'kazahsztán'] },
  { name: 'Finland National Team', emoji: '⚽', aliases: ['finland', 'finnország'] },
  { name: 'Greece National Team', emoji: '⚽', aliases: ['greece', 'görögország'] },
  { name: 'Slovenia National Team', emoji: '⚽', aliases: ['slovenia', 'szlovénia'] },
  { name: 'Ukraine National Team', emoji: '⚽', aliases: ['ukraine', 'ukrajna'] },
  { name: 'Georgia National Team', emoji: '⚽', aliases: ['georgia', 'grúzia'] },
  { name: 'Sweden National Team', emoji: '⚽', aliases: ['sweden', 'svédország'] },
  { name: 'Portugal National Team', emoji: '⚽', aliases: ['portugal', 'portugália'] },
  { name: 'Armenia National Team', emoji: '⚽', aliases: ['armenia', 'örményország'] },
  { name: 'Serbia National Team', emoji: '⚽', aliases: ['serbia', 'szerbia', 'srb'] },
  { name: 'Denmark National Team', emoji: '🏐', aliases: ['denmark', 'dánia'] },
  { name: 'North Macedonia National Team', emoji: '🏀', aliases: ['north macedonia', 'észak-macedónia'] },
  { name: 'Romania National Team', emoji: '🏀', aliases: ['romania', 'románia'] },
  { name: 'Estonia National Team', emoji: '🏀', aliases: ['estonia', 'észtország', 'est'] },
  { name: 'Croatia National Team', emoji: '🏀', aliases: ['croatia', 'horvátország', 'cro'] },
  { name: 'Latvia National Team', emoji: '🏀', aliases: ['latvia', 'lettország', 'lat'] },
  { name: 'Israel National Team', emoji: '🏀', aliases: ['israel', 'izrael'] },

  // Domestic Clubs
  { name: 'DVTK', emoji: '⚽', aliases: ['dvtk', 'dvtk tippmix', 'diósgyőr', 'diosgyor'] },
  { name: 'Újpest FC', emoji: '⚽', aliases: ['ujpest fc', 'újpest fc', 'ujpest', 'újpest'] },
  { name: 'Ferencvárosi TC', emoji: '⚽', aliases: ['ferencvarosi tc', 'ferencvárosi tc', 'ftc', 'fradi'] },
  { name: 'MTK Budapest', emoji: '⚽', aliases: ['mtk', 'mtk budapest'] },
  { name: 'Paksi FC', emoji: '⚽', aliases: ['paksi fc', 'paks'] },
  { name: 'Puskás Akadémia FC', emoji: '⚽', aliases: ['puskas akademia fc', 'puskás akadémia fc', 'puskas akademia', 'puskás akadémia'] },
  { name: 'Kolorcity Kazincbarcika', emoji: '⚽', aliases: ['kazincbarcika', 'kolorcity kazincbarcika'] },
  { name: 'Zalaegerszegi TE (ZTE)', emoji: '⚽', aliases: ['zte', 'zalaegerszeg', 'zte fc'] },
  { name: 'Kisvárda Master Good', emoji: '⚽', aliases: ['kisvarda fc', 'kisvárda fc', 'kisvarda', 'kisvárda'] },
  { name: 'Fehérvár FC', emoji: '⚽', aliases: ['fehervar', 'fehérvár', 'vidi'] },
  { name: 'Debreceni VSC (DVSC)', emoji: '⚽', aliases: ['dvsc', 'debrecen'] },
  { name: 'ETO FC Győr', emoji: '⚽', aliases: ['eto fc gyor', 'eto fc győr', 'eto gyor'] },
  { name: 'Nyíregyháza Spartacus FC', emoji: '⚽', aliases: ['nyiregyhaza', 'nyíregyháza', 'nyíregyháza spartacus fc'] },
  { name: 'LASK Linz', emoji: '⚽', aliases: ['lask', 'lask linz'] },
  { name: 'RZ Pellets WAC', emoji: '⚽', aliases: ['rz pellets wac', 'wac'] },
  { name: 'Villarreal CF', emoji: '⚽', aliases: ['villarreal', 'villarreal cf'] },
  { name: 'Elche CF', emoji: '⚽', aliases: ['elche', 'elche cf'] },
  { name: 'Pro Recco', emoji: '🤽', orgSlug: 'european-aquatics', aliases: ['pro recco'] },

  // Basketball Hungarian Clubs
  { name: 'Falco-Vulcano Energia KC Szombathely', emoji: '🏀', aliases: ['falco', 'falco szombathely', 'falco-vulcano energia kc szombathely'] },
  { name: 'NKA Universitas Pécs', emoji: '🏀', aliases: ['nka universitas pecs', 'nka universitas pécs'] },
  { name: 'Atomerőmű SE', emoji: '🏀', aliases: ['atomeromu se', 'atomerőmű se', 'ase'] },
  { name: 'Alba Fehérvár', emoji: '🏀', aliases: ['alba fehervar', 'alba fehérvár'] },
  { name: 'Szolnoki Olajbányász', emoji: '🏀', aliases: ['szolnoki olajbanyasz', 'szolnoki olajbányász', 'szolnok'] },
];

function cleanName(raw: string): string {
  return raw
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\[\]\(\)]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseMatchTeams(eventName: string): { home: string; away: string } | null {
  const cleaned = eventName
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\[\]]/g, '')
    .trim();

  // Handle '#' separator, e.g. "NKA UNIVERSITAS PÉCS#FALCO-VULCANO ENERGIA KC SZOMBATHELY"
  if (cleaned.includes('#')) {
    const parts = cleaned.split('#').map(s => s.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { home: parts[0], away: parts[1] };
    }
  }

  // Handle " vs "
  if (cleaned.includes(' vs ')) {
    const parts = cleaned.split(' vs ').map(s => s.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { home: parts[0], away: parts[1] };
    }
  }

  // Handle " x "
  if (cleaned.includes(' x ')) {
    const parts = cleaned.split(' x ').map(s => s.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { home: parts[0], away: parts[1] };
    }
  }

  // Handle " - " (excluding date ranges or single-team titles)
  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ').map(s => s.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      // Don't split if one side is day/stat
      if (!parts[1].toLowerCase().includes('day') && !parts[1].toLowerCase().includes('statisztika')) {
        return { home: parts[0], away: parts[1] };
      }
    }
  }

  // Handle " / Lask - Rz Pellets Wac / "
  const slashMatch = cleaned.match(/Lask\s*-\s*Rz Pellets Wac/i);
  if (slashMatch) {
    return { home: 'LASK', away: 'RZ Pellets WAC' };
  }

  return null;
}

function findCanonicalTeam(rawName: string): CanonicalTeam | null {
  const norm = cleanName(rawName);
  for (const team of CANONICAL_TEAMS) {
    if (cleanName(team.name) === norm) return team;
    for (const alias of team.aliases) {
      if (norm === alias || norm.includes(alias) || alias.includes(norm)) {
        return team;
      }
    }
  }
  return null;
}

async function repairCluster(clusterInfo: typeof CLUSTERS[0]) {
  console.log(`\n======================================================`);
  console.log(`REPAIRING CLUSTER: ${clusterInfo.name} (${clusterInfo.dbName})`);
  console.log(`======================================================`);

  const client = new MongoClient(clusterInfo.uri);
  await client.connect();
  const db = client.db(clusterInfo.dbName);

  // 1. Fetch all organizations
  const orgs = await db.collection('organizations').find({}).toArray();
  const orgBySlug = new Map<string, any>();
  const orgByName = new Map<string, any>();
  for (const o of orgs) {
    if (o.slug) orgBySlug.set(o.slug, o);
    if (o.name) orgByName.set(o.name.toLowerCase(), o);
  }

  console.log(`Loaded ${orgs.length} organizations.`);

  // 2. Load or create canonical partners
  const partnersCollection = db.collection('partners');
  const existingPartners = await partnersCollection.find({}).toArray();
  const partnerByName = new Map<string, any>();
  for (const p of existingPartners) {
    partnerByName.set(p.name.toLowerCase(), p);
  }

  // Find SEYU partner id to remove from match events
  const seyuPartner = existingPartners.find(p => p.name === 'SEYU');
  const seyuId = seyuPartner ? seyuPartner._id.toString() : null;

  // Ensure each canonical team exists in partners collection
  for (const team of CANONICAL_TEAMS) {
    let existing = partnerByName.get(team.name.toLowerCase());
    if (!existing) {
      // Check aliases
      for (const alias of team.aliases) {
        if (partnerByName.has(alias)) {
          existing = partnerByName.get(alias);
          break;
        }
      }
    }

    const orgDoc = team.orgSlug ? orgBySlug.get(team.orgSlug) : null;
    const orgId = orgDoc ? orgDoc._id : undefined;

    if (!existing) {
      const newPartnerDoc: any = {
        name: team.name,
        emoji: team.emoji,
        hashtags: [cleanName(team.name).replace(/\s+/g, '')],
        categorizedHashtags: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (orgId) {
        newPartnerDoc.organizationId = orgId;
      }
      const ins = await partnersCollection.insertOne(newPartnerDoc);
      newPartnerDoc._id = ins.insertedId;
      partnerByName.set(team.name.toLowerCase(), newPartnerDoc);
      console.log(`[PARTNER CREATED] "${team.name}" (_id: ${ins.insertedId}, org: ${team.orgSlug || 'none'})`);
    } else {
      // Update organizationId if defined and missing
      if (orgId && (!existing.organizationId || existing.organizationId.toString() !== orgId.toString())) {
        await partnersCollection.updateOne(
          { _id: existing._id },
          { $set: { organizationId: orgId, updatedAt: new Date().toISOString() } }
        );
        console.log(`[PARTNER ORG LINKED] "${existing.name}" -> Org "${orgDoc.name}"`);
      }
      partnerByName.set(team.name.toLowerCase(), existing);
    }
  }

  // Reload partners
  const allPartners = await partnersCollection.find({}).toArray();
  const partnerResolver = (teamName: string): any => {
    const norm = cleanName(teamName);
    // 1. Direct canonical match
    const canonical = findCanonicalTeam(teamName);
    if (canonical) {
      const found = allPartners.find(p => p.name.toLowerCase() === canonical.name.toLowerCase());
      if (found) return found;
    }
    // 2. Direct partner name match
    const direct = allPartners.find(p => cleanName(p.name) === norm);
    if (direct) return direct;
    // 3. Substring match (partner name contains teamName or vice-versa)
    return allPartners.find(p => {
      const pNorm = cleanName(p.name);
      return pNorm.includes(norm) || norm.includes(pNorm);
    });
  };

  // 3. Iterate through all projects and repair
  const projectsCollection = db.collection('projects');
  const projects = await projectsCollection.find({}).toArray();
  console.log(`Analyzing ${projects.length} projects in ${clusterInfo.name}...`);

  let repairedCount = 0;
  for (const project of projects) {
    const eventName = project.eventName || '';
    const currentP1 = project.partner1?.toString() || project.partner1Id?.toString() || null;
    const currentP2 = project.partner2?.toString() || project.partner2Id?.toString() || null;
    const currentOrg = project.organizationId?.toString() || null;

    let targetP1 = currentP1;
    let targetP2 = currentP2;
    let targetOrg = currentOrg;

    // Check if event name suggests an organization
    const lowerName = eventName.toLowerCase();
    if (lowerName.includes('euroleague') || lowerName.includes('fenerbahce') || lowerName.includes('galatasaray') || lowerName.includes('schio')) {
      const elw = orgBySlug.get('euroleague-women');
      if (elw) targetOrg = elw._id.toString();
    } else if (lowerName.includes('chl') || lowerName.includes('champions hockey') || lowerName.includes('bordeaux') || lowerName.includes('bordeax')) {
      const chl = orgBySlug.get('chf');
      if (chl) targetOrg = chl._id.toString();
    } else if (lowerName.includes('ehf') || lowerName.includes('veszprem') || lowerName.includes('tatabanya') || lowerName.includes('kristianstad')) {
      const ehf = orgBySlug.get('mol-ehf-2025-2026');
      if (ehf) targetOrg = ehf._id.toString();
    } else if (lowerName.includes('mlsz') || (lowerName.includes('hungary') && lowerName.includes('⚽'))) {
      const mlsz = orgBySlug.get('mlsz');
      if (mlsz) targetOrg = mlsz._id.toString();
    } else if (lowerName.includes('fiba 3x3')) {
      const fiba = orgBySlug.get('fiba-3x3');
      if (fiba) targetOrg = fiba._id.toString();
    } else if (lowerName.includes('motogp')) {
      const motogp = orgBySlug.get('motogp');
      if (motogp) targetOrg = motogp._id.toString();
    } else if (lowerName.includes('swiss') && lowerName.includes('hockey')) {
      const sih = orgBySlug.get('swiss-ice-hockey');
      if (sih) targetOrg = sih._id.toString();
    } else if (lowerName.includes('european aquatics') || lowerName.includes('water polo')) {
      const ea = orgBySlug.get('european-aquatics');
      if (ea) targetOrg = ea._id.toString();
    }

    // Try parsing home & away teams
    const match = parseMatchTeams(eventName);
    if (match) {
      const homePartner = partnerResolver(match.home);
      const awayPartner = partnerResolver(match.away);

      // If current P1 was SEYU or empty or an organization, replace with real home team
      if (homePartner && (currentP1 === seyuId || !currentP1 || currentP1 === targetOrg)) {
        targetP1 = homePartner._id.toString();
      }
      // If current P2 is missing or an organization, replace with real away team
      if (awayPartner && (!currentP2 || currentP2 === targetOrg)) {
        targetP2 = awayPartner._id.toString();
      }
    }

    // Determine if updates are needed
    const needsP1Update = targetP1 && targetP1 !== currentP1;
    const needsP2Update = targetP2 && targetP2 !== currentP2;
    const needsOrgUpdate = targetOrg && targetOrg !== currentOrg;

    if (needsP1Update || needsP2Update || needsOrgUpdate) {
      const setDoc: any = { updatedAt: new Date().toISOString() };
      if (needsP1Update) {
        setDoc.partner1 = new ObjectId(targetP1!);
        setDoc.partner1Id = new ObjectId(targetP1!);
      }
      if (needsP2Update) {
        setDoc.partner2 = new ObjectId(targetP2!);
        setDoc.partner2Id = new ObjectId(targetP2!);
      }
      if (needsOrgUpdate) {
        setDoc.organizationId = new ObjectId(targetOrg!);
      }

      await projectsCollection.updateOne({ _id: project._id }, { $set: setDoc });
      repairedCount++;
      console.log(`[PROJECT UPDATED] "${eventName}":`, {
        p1: needsP1Update ? `-> ${targetP1}` : 'unchanged',
        p2: needsP2Update ? `-> ${targetP2}` : 'unchanged',
        org: needsOrgUpdate ? `-> ${targetOrg}` : 'unchanged',
      });
    }
  }

  console.log(`Repaired ${repairedCount} projects in ${clusterInfo.name}.`);
  await client.close();
}

async function run() {
  for (const c of CLUSTERS) {
    await repairCluster(c);
  }
  console.log('\nAll cluster repairs completed successfully!');
}

run().catch(console.error);
