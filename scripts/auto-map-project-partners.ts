// WHAT: Automatically map projects to partners based on event names
// WHY: Fix missing partner1/partner2 relationships for template inheritance
// HOW: Parse "Home x Away" event names and match against partner database

import { MongoClient, ObjectId } from 'mongodb';

interface PartnerMatch {
  projectId: ObjectId;
  projectName: string;
  editSlug: string;
  partner1?: { id: ObjectId; name: string };
  partner2?: { id: ObjectId; name: string };
  confidence: 'high' | 'medium' | 'low';
}

/**
 * WHAT: Parse event name into home and away team names
 * WHY: Event format is typically "Home Team x Away Team"
 * HOW: Split by " x " separator
 */
function parseEventName(eventName: string): { home: string; away: string } | null {
  // Common separators: " x ", " vs ", " - "
  const separators = [' x ', ' vs ', ' - '];
  
  for (const sep of separators) {
    if (eventName.includes(sep)) {
      const parts = eventName.split(sep).map(s => s.trim());
      if (parts.length === 2) {
        return { home: parts[0], away: parts[1] };
      }
    }
  }
  
  return null;
}

/**
 * WHAT: Find best matching partner for a team name
 * WHY: Team names may not exactly match partner names
 * HOW: Score matches by string similarity and exact word matches
 */
function findBestPartnerMatch(teamName: string, partners: any[]): { partner: any; score: number } | null {
  let bestMatch: any = null;
  let bestScore = 0;

  const teamLower = teamName.toLowerCase();
  const teamWords = teamLower.split(/\s+/);

  for (const partner of partners) {
    const partnerLower = partner.name.toLowerCase();
    let score = 0;

    // Exact match = highest score
    if (partnerLower === teamLower) {
      score = 100;
    }
    // Partner name contains team name
    else if (partnerLower.includes(teamLower)) {
      score = 80;
    }
    // Team name contains partner name
    else if (teamLower.includes(partnerLower)) {
      score = 70;
    }
    // Word-by-word matching
    else {
      const partnerWords = partnerLower.split(/\s+/);
      const matchingWords = teamWords.filter(word => 
        partnerWords.some((pw: string) => pw.includes(word) || word.includes(pw))
      );
      score = (matchingWords.length / teamWords.length) * 60;
    }

    if (score > bestScore && score >= 60) {
      bestScore = score;
      bestMatch = partner;
    }
  }

  return bestMatch ? { partner: bestMatch, score: bestScore } : null;
}

async function autoMapProjectPartners(dryRun: boolean = true) {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');
    const projectsCollection = db.collection('projects');
    const partnersCollection = db.collection('partners');

    // Get all partners
    const partners = await partnersCollection.find({}).toArray();
    console.log(`📚 Loaded ${partners.length} partners\n`);

    // Get all projects without partner1
    const projects = await projectsCollection
      .find({ partner1: { $exists: false } })
      .toArray();

    console.log(`🔍 Found ${projects.length} projects without partner1\n`);
    console.log('='.repeat(80));

    const matches: PartnerMatch[] = [];
    let highConfidence = 0;
    let mediumConfidence = 0;
    let noMatch = 0;

    for (const project of projects) {
      const eventName = project.eventName || 'Unknown';
      const parsed = parseEventName(eventName);

      if (!parsed) {
        console.log(`\n⚠️  Could not parse: ${eventName}`);
        noMatch++;
        continue;
      }

      const homeMatch = findBestPartnerMatch(parsed.home, partners);
      const awayMatch = findBestPartnerMatch(parsed.away, partners);

      if (!homeMatch) {
        console.log(`\n⚠️  No partner match: ${eventName}`);
        console.log(`   Home: "${parsed.home}" (no match)`);
        noMatch++;
        continue;
      }

      const confidence = homeMatch.score >= 80 ? 'high' : homeMatch.score >= 70 ? 'medium' : 'low';
      
      if (confidence === 'high') highConfidence++;
      else if (confidence === 'medium') mediumConfidence++;

      const match: PartnerMatch = {
        projectId: project._id,
        projectName: eventName,
        editSlug: project.editSlug,
        partner1: { id: homeMatch.partner._id, name: homeMatch.partner.name },
        partner2: awayMatch ? { id: awayMatch.partner._id, name: awayMatch.partner.name } : undefined,
        confidence
      };

      matches.push(match);

      const confidenceIcon = confidence === 'high' ? '✅' : confidence === 'medium' ? '⚠️' : '❓';
      console.log(`\n${confidenceIcon} ${eventName}`);
      console.log(`   Home: "${parsed.home}" → ${homeMatch.partner.name} (score: ${homeMatch.score})`);
      if (awayMatch) {
        console.log(`   Away: "${parsed.away}" → ${awayMatch.partner.name} (score: ${awayMatch.score})`);
      }
      console.log(`   Edit Slug: ${project.editSlug}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`Total projects analyzed: ${projects.length}`);
    console.log(`High confidence matches: ${highConfidence} ✅`);
    console.log(`Medium confidence matches: ${mediumConfidence} ⚠️`);
    console.log(`No matches found: ${noMatch} ❌`);
    console.log(`Total mappable: ${matches.length}`);

    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes made');
      console.log('Run with --apply flag to apply changes');
      return;
    }

    // Apply changes
    console.log('\n💾 Applying partner mappings...\n');

    let updated = 0;
    for (const match of matches) {
      if (!match.partner1) continue;

      const update: any = {
        partner1: match.partner1.id
      };

      if (match.partner2) {
        update.partner2 = match.partner2.id;
      }

      await projectsCollection.updateOne(
        { _id: match.projectId },
        { $set: update }
      );

      console.log(`✅ Updated: ${match.projectName}`);
      console.log(`   partner1: ${match.partner1.name}`);
      if (match.partner2) {
        console.log(`   partner2: ${match.partner2.name}`);
      }
      updated++;
    }

    console.log(`\n✅ Successfully updated ${updated} projects with partner relationships`);

  } finally {
    await client.close();
  }
}

// Check for --apply flag
const applyChanges = process.argv.includes('--apply');

console.log('🚀 Auto-Map Project Partners\n');
if (!applyChanges) {
  console.log('🔍 Running in DRY RUN mode\n');
}

autoMapProjectPartners(!applyChanges);
