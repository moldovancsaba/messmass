// WHAT: Auto-suggest partners based on event names
// WHY: Bulk operation to fix missing partner relationships
// HOW: Parse "Home x Away" format and match against partner names

import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';

/**
 * WHAT: Parse event name into home and away team names
 * WHY: Event format is typically "Home Team x Away Team"
 * HOW: Split by " x " separator
 */
function parseEventName(eventName: string): { home: string; away: string } | null {
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
 * HOW: Score matches by string similarity
 */
function findBestPartnerMatch(teamName: string, partners: any[]): { partner: any; score: number } | null {
  let bestMatch: any = null;
  let bestScore = 0;

  const teamLower = teamName.toLowerCase();
  const teamWords = teamLower.split(/\s+/);

  for (const partner of partners) {
    const partnerLower = partner.name.toLowerCase();
    let score = 0;

    if (partnerLower === teamLower) {
      score = 100;
    } else if (partnerLower.includes(teamLower)) {
      score = 80;
    } else if (teamLower.includes(partnerLower)) {
      score = 70;
    } else {
      const partnerWords = partnerLower.split(/\s+/);
      const matchingWords = teamWords.filter(word => 
        partnerWords.some(pw => pw.includes(word) || word.includes(pw))
      );
      score = (matchingWords.length / teamWords.length) * 60;
    }

    if (score > bestScore && score >= 70) {
      bestScore = score;
      bestMatch = partner;
    }
  }

  return bestMatch ? { partner: bestMatch, score: bestScore } : null;
}

/**
 * POST /api/admin/project-partners/auto-suggest
 * 
 * WHAT: Auto-suggest and apply partner mappings for projects without partner1
 * WHY: Bulk fix for missing relationships
 */
export async function POST() {
  try {
    const db = await getDb();
    const projectsCollection = db.collection('projects');
    const partnersCollection = db.collection('partners');

    // Get all partners
    const partners = await partnersCollection.find({}).toArray();

    // Get all projects without partner1
    const projects = await projectsCollection
      .find({ partner1: { $exists: false } })
      .toArray();

    let updated = 0;
    const updates: any[] = [];

    for (const project of projects) {
      const eventName = project.eventName || '';
      const parsed = parseEventName(eventName);

      if (!parsed) continue;

      const homeMatch = findBestPartnerMatch(parsed.home, partners);
      const awayMatch = findBestPartnerMatch(parsed.away, partners);

      if (!homeMatch) continue;

      // Only apply high-confidence matches (score >= 70)
      if (homeMatch.score >= 70) {
        const update: any = {
          partner1: homeMatch.partner._id
        };

        if (awayMatch && awayMatch.score >= 70) {
          update.partner2 = awayMatch.partner._id;
        }

        updates.push({
          projectId: project._id,
          update
        });
      }
    }

    // Apply all updates
    for (const { projectId, update } of updates) {
      await projectsCollection.updateOne(
        { _id: projectId },
        { $set: update }
      );
      updated++;
    }

    return NextResponse.json({
      success: true,
      updated,
      total: projects.length
    });

  } catch (error) {
    console.error('Failed to auto-suggest partners:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to auto-suggest partners'
    }, { status: 500 });
  }
}
