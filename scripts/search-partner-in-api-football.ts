// WHAT: Search for a specific partner in API-Football
// WHY: Find the team ID to store in partner record for enrichment
// HOW: Search by name only (free tier limitation: can't filter by country)

import { createApiFootballClient, Sport } from '@/lib/api-football';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function searchPartner(sport: Sport, teamName: string) {
  console.log(`\n🔍 Searching for "${teamName}" in ${sport.toUpperCase()}\n`);
  console.log('='.repeat(70) + '\n');

  try {
    const client = createApiFootballClient(sport);
    const teams = await client.searchTeam(teamName);

    if (teams.length === 0) {
      console.log('❌ No teams found\n');
      return;
    }

    console.log(`✅ Found ${teams.length} team(s):\n`);

    teams.forEach((teamData, i) => {
      const { team, venue } = teamData;
      console.log(`${i + 1}. ${team.name}`);
      console.log(`   🆔 Team ID: ${team.id}`);
      console.log(`   🌍 Country: ${team.country}`);
      console.log(`   📅 Founded: ${team.founded || 'N/A'}`);
      console.log(`   🖼️  Logo: ${team.logo}`);
      if (venue) {
        console.log(`   🏟️  Venue: ${venue.name}`);
        console.log(`   📍 City: ${venue.city}`);
        console.log(`   👥 Capacity: ${venue.capacity?.toLocaleString() || 'N/A'}`);
      }
      console.log('');
    });

    const firstTeam = teams[0].team;
    const firstVenue = teams[0].venue;

    console.log('💡 Next step: Store the Team ID in your partner record\n');
    console.log('   Database update example:');
    console.log('   {');
    console.log('     apiFootball: {');
    console.log(`       teamId: ${firstTeam.id},`);
    console.log(`       sport: "${sport}",`);
    console.log(`       logoUrl: "${firstTeam.logo}",`);
    if (firstVenue) {
      console.log(`       venueName: "${firstVenue.name}",`);
      console.log(`       venueCapacity: ${firstVenue.capacity},`);
    }
    console.log('       lastSyncAt: new Date().toISOString()');
    console.log('     }');
    console.log('   }\n');
  } catch (error) {
    console.error('❌ Search failed:', error);
  }
}

// Get command line arguments
const sport = (process.argv[2] || 'soccer') as Sport;
const teamName = process.argv[3] || 'AS Roma';

searchPartner(sport, teamName);
