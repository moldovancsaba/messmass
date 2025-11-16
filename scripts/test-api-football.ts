// WHAT: Test API-Football connection and explore team search
// WHY: Verify API key works and demonstrate search capabilities
// HOW: Test with real partner names from MessMass

import { createApiFootballClient } from '@/lib/api-football';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testApiFootball() {
  console.log('\n🏟️  API-Football Connection Test\n');
  console.log('='.repeat(60) + '\n');

  // Test 1: Search for a famous soccer team
  console.log('TEST 1: Search for AS Roma (Soccer)');
  console.log('-'.repeat(60));
  
  try {
    const soccerClient = createApiFootballClient('soccer');
    const romaTeams = await soccerClient.searchTeam('AS Roma', 'Italy');
    
    console.log(`✅ Found ${romaTeams.length} team(s):\n`);
    
    romaTeams.forEach((team, i) => {
      console.log(`${i + 1}. ${team.name}`);
      console.log(`   ID: ${team.id}`);
      console.log(`   Country: ${team.country}`);
      console.log(`   Founded: ${team.founded || 'N/A'}`);
      console.log(`   Logo: ${team.logo}`);
      if (team.venue) {
        console.log(`   Venue: ${team.venue.name} (${team.venue.city})`);
        console.log(`   Capacity: ${team.venue.capacity?.toLocaleString() || 'N/A'}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Soccer test failed:', error);
  }

  // Test 2: Search for a basketball team
  console.log('\nTEST 2: Search for Barcelona (Basketball)');
  console.log('-'.repeat(60));
  
  try {
    const basketballClient = createApiFootballClient('basketball');
    const barcaTeams = await basketballClient.searchTeam('Barcelona', 'Spain');
    
    console.log(`✅ Found ${barcaTeams.length} team(s):\n`);
    
    barcaTeams.slice(0, 3).forEach((team, i) => {
      console.log(`${i + 1}. ${team.name}`);
      console.log(`   ID: ${team.id}`);
      console.log(`   Country: ${team.country}`);
      console.log(`   Logo: ${team.logo}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Basketball test failed:', error);
  }

  // Test 3: Get today's fixtures
  console.log('\nTEST 3: Get today\'s soccer fixtures');
  console.log('-'.repeat(60));
  
  try {
    const soccerClient = createApiFootballClient('soccer');
    const today = new Date().toISOString().split('T')[0];
    const fixtures = await soccerClient.getFixturesByDate(today);
    
    console.log(`✅ Found ${fixtures.length} fixtures today\n`);
    
    // Show first 5 fixtures
    fixtures.slice(0, 5).forEach((fixture, i) => {
      console.log(`${i + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      console.log(`   League: ${fixture.league.name} (${fixture.league.country})`);
      console.log(`   Venue: ${fixture.fixture.venue?.name || 'TBD'}`);
      console.log(`   Status: ${fixture.fixture.status.long}`);
      if (fixture.goals.home !== null && fixture.goals.away !== null) {
        console.log(`   Score: ${fixture.goals.home} - ${fixture.goals.away}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Fixtures test failed:', error);
  }

  // Test 4: Get available leagues
  console.log('\nTEST 4: Get Italian soccer leagues');
  console.log('-'.repeat(60));
  
  try {
    const soccerClient = createApiFootballClient('soccer');
    const leagues = await soccerClient.getLeagues('Italy', 2024);
    
    console.log(`✅ Found ${leagues.length} league(s):\n`);
    
    leagues.slice(0, 5).forEach((league, i) => {
      console.log(`${i + 1}. ${league.league.name}`);
      console.log(`   Type: ${league.league.type}`);
      console.log(`   Country: ${league.country.name}`);
      const currentSeason = league.seasons.find(s => s.current);
      if (currentSeason) {
        console.log(`   Current Season: ${currentSeason.year} (${currentSeason.start} to ${currentSeason.end})`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Leagues test failed:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ API-Football connection test completed!\n');
  console.log('💡 Next steps:');
  console.log('   1. Search for your partners in the API');
  console.log('   2. Match partners to API-Football team IDs');
  console.log('   3. Store team IDs in partner records');
  console.log('   4. Start enriching events with fixture data\n');
}

testApiFootball();
