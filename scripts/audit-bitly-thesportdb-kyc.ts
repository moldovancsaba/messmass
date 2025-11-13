// WHAT: Comprehensive audit of Bitly and TheSportDB data in KYC system
// WHY: Verify all external data sources are properly integrated and aggregated
// HOW: Check projects, partners, variables_metadata, and data flow rules

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found in environment');
  process.exit(1);
}

interface AuditReport {
  // Bitly data
  bitlyVariablesInKYC: string[];
  projectsWithBitlyData: number;
  partnersWithBitlyLinks: number;
  bitlyLinksTotal: number;
  bitlyJunctionsTotal: number;
  
  // TheSportDB data
  sportsDbFieldsInKYC: string[];
  partnersWithSportsDb: number;
  partnersWithFootballData: number;
  
  // Data aggregation rules
  eventLevelBitlyData: number;
  partnerLevelBitlyData: number;
  eventLevelSportsDbData: number;
  partnerLevelSportsDbData: number;
}

async function auditBitlyAndSportsDbData() {
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('messmass');
    const variablesMetadata = db.collection('variables_metadata');
    const projects = db.collection('projects');
    const partners = db.collection('partners');
    const bitlyLinks = db.collection('bitly_links');
    const bitlyProjectLinks = db.collection('bitly_project_links');
    
    const report: AuditReport = {
      bitlyVariablesInKYC: [],
      projectsWithBitlyData: 0,
      partnersWithBitlyLinks: 0,
      bitlyLinksTotal: 0,
      bitlyJunctionsTotal: 0,
      sportsDbFieldsInKYC: [],
      partnersWithSportsDb: 0,
      partnersWithFootballData: 0,
      eventLevelBitlyData: 0,
      partnerLevelBitlyData: 0,
      eventLevelSportsDbData: 0,
      partnerLevelSportsDbData: 0,
    };
    
    console.log('🔍 AUDIT: Bitly Integration\n');
    console.log('='.repeat(80));
    
    // 1. Check Bitly variables in KYC system
    const bitlyVars = await variablesMetadata.find({
      name: { $regex: /bitly/i }
    }).toArray();
    
    report.bitlyVariablesInKYC = bitlyVars.map(v => v.name as string);
    console.log(`\n📊 Bitly Variables in KYC (${bitlyVars.length}):`);
    bitlyVars.forEach(v => {
      console.log(`  - ${v.name} (${v.alias || 'no alias'}) - Type: ${v.type}`);
    });
    
    // 2. Check projects with Bitly data in stats
    const projectsWithBitly = await projects.countDocuments({
      $or: [
        { 'stats.totalBitlyClicks': { $exists: true, $ne: null, $gt: 0 } },
        { 'stats.uniqueBitlyClicks': { $exists: true, $ne: null, $gt: 0 } },
      ]
    });
    report.projectsWithBitlyData = projectsWithBitly;
    console.log(`\n📌 Projects with Bitly data in stats: ${projectsWithBitly}`);
    
    // 3. Check partners with Bitly links
    const partnersWithBitly = await partners.countDocuments({
      bitlyLinkIds: { $exists: true, $nin: [null, []] }
    });
    report.partnersWithBitlyLinks = partnersWithBitly;
    console.log(`📌 Partners with Bitly links: ${partnersWithBitly}`);
    
    // 4. Check Bitly links and junctions
    const totalLinks = await bitlyLinks.countDocuments();
    const totalJunctions = await bitlyProjectLinks.countDocuments();
    report.bitlyLinksTotal = totalLinks;
    report.bitlyJunctionsTotal = totalJunctions;
    console.log(`📌 Total Bitly links: ${totalLinks}`);
    console.log(`📌 Total Bitly-Project junctions: ${totalJunctions}`);
    
    // 5. Sample Bitly data flow
    const sampleProject = await projects.findOne({
      'stats.totalBitlyClicks': { $exists: true, $ne: null, $gt: 0 }
    });
    
    if (sampleProject) {
      console.log(`\n📋 Sample Project Bitly Data:`);
      console.log(`  Event: ${sampleProject.eventName} (${sampleProject.eventDate})`);
      console.log(`  Total Clicks: ${sampleProject.stats?.totalBitlyClicks || 0}`);
      console.log(`  Unique Clicks: ${sampleProject.stats?.uniqueBitlyClicks || 0}`);
      
      // Check if partner has aggregated data
      if (sampleProject.partner1) {
        const partner = await partners.findOne({ _id: sampleProject.partner1 });
        if (partner) {
          console.log(`  Partner: ${partner.name}`);
          console.log(`  Partner has ${partner.bitlyLinkIds?.length || 0} Bitly links`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 AUDIT: TheSportDB / Football-Data Integration\n');
    console.log('='.repeat(80));
    
    // 6. Check TheSportDB fields in KYC
    const sportsDbVars = await variablesMetadata.find({
      $or: [
        { name: { $regex: /sports|team|league|venue|stadium/i } },
        { category: { $regex: /sport|team|event/i } }
      ]
    }).toArray();
    
    report.sportsDbFieldsInKYC = sportsDbVars.map(v => v.name as string);
    console.log(`\n📊 Sports-related Variables in KYC (${sportsDbVars.length}):`);
    sportsDbVars.slice(0, 10).forEach(v => {
      console.log(`  - ${v.name} (${v.alias || 'no alias'})`);
    });
    if (sportsDbVars.length > 10) {
      console.log(`  ... and ${sportsDbVars.length - 10} more`);
    }
    
    // 7. Check partners with TheSportDB data
    const partnersWithSportsDb = await partners.countDocuments({
      'sportsDb.teamId': { $exists: true, $ne: null }
    });
    report.partnersWithSportsDb = partnersWithSportsDb;
    console.log(`\n📌 Partners with TheSportDB data: ${partnersWithSportsDb}`);
    
    // 8. Check partners with Football-Data data
    const partnersWithFootballData = await partners.countDocuments({
      'footballData.teamId': { $exists: true, $ne: null }
    });
    report.partnersWithFootballData = partnersWithFootballData;
    console.log(`📌 Partners with Football-Data data: ${partnersWithFootballData}`);
    
    // 9. Sample TheSportDB data
    const samplePartner = await partners.findOne({
      'sportsDb.teamId': { $exists: true }
    });
    
    if (samplePartner) {
      console.log(`\n📋 Sample Partner TheSportDB Data:`);
      console.log(`  Name: ${samplePartner.name}`);
      console.log(`  Team ID: ${samplePartner.sportsDb?.teamId}`);
      console.log(`  League: ${samplePartner.sportsDb?.strLeague || 'N/A'}`);
      console.log(`  Stadium: ${samplePartner.sportsDb?.strStadium || 'N/A'}`);
      console.log(`  Capacity: ${samplePartner.sportsDb?.intStadiumCapacity || 'N/A'}`);
      console.log(`  Country: ${samplePartner.sportsDb?.strCountry || 'N/A'}`);
      console.log(`  Founded: ${samplePartner.sportsDb?.intFormedYear || 'N/A'}`);
    }
    
    // 10. Check event-level vs partner-level data
    const projectsWithEventResults = await projects.countDocuments({
      $or: [
        { 'stats.eventResultHome': { $exists: true, $ne: null } },
        { 'stats.eventResultVisitor': { $exists: true, $ne: null } },
        { 'stats.eventAttendees': { $exists: true, $ne: null } },
      ]
    });
    console.log(`\n📌 Projects with event-level results: ${projectsWithEventResults}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 DATA FLOW RULES VERIFICATION\n');
    console.log('='.repeat(80));
    
    console.log(`\n✅ Bitly Date Attribution Rules:`);
    console.log(`   - Data goes to event until next day after event date`);
    console.log(`   - Between events: data goes to next event`);
    console.log(`   - After last event: data goes only to partner`);
    console.log(`   - Implementation: bitly_project_links with startDate/endDate`);
    
    // Check junction table date ranges
    const junctionsWithDates = await bitlyProjectLinks.countDocuments({
      startDate: { $exists: true },
      endDate: { $exists: true }
    });
    console.log(`   📊 Junctions with date ranges: ${junctionsWithDates} / ${totalJunctions}`);
    
    console.log(`\n✅ TheSportDB Data Rules:`);
    console.log(`   - Partner-level: All team metadata (league, venue, capacity, etc.)`);
    console.log(`   - Event-level: Match results, attendance, scores`);
    console.log(`   - Aggregation: Partner gets sum from all events`);
    
    console.log(`\n✅ Clicker Data Rules:`);
    console.log(`   - Event-level: Direct storage in project.stats`);
    console.log(`   - Partner-level: Should aggregate from all related events`);
    console.log(`   - Status: ⚠️ Partner aggregation may need implementation`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SUMMARY REPORT\n');
    console.log('='.repeat(80));
    
    console.log(`\n🔗 Bitly Integration:`);
    console.log(`   - KYC Variables: ${report.bitlyVariablesInKYC.length}`);
    console.log(`   - Projects with data: ${report.projectsWithBitlyData}`);
    console.log(`   - Partners with links: ${report.partnersWithBitlyLinks}`);
    console.log(`   - Total links: ${report.bitlyLinksTotal}`);
    console.log(`   - Link-Project junctions: ${report.bitlyJunctionsTotal}`);
    
    console.log(`\n⚽ TheSportDB Integration:`);
    console.log(`   - KYC Variables: ${report.sportsDbFieldsInKYC.length}`);
    console.log(`   - Partners with TheSportDB: ${report.partnersWithSportsDb}`);
    console.log(`   - Partners with Football-Data: ${report.partnersWithFootballData}`);
    console.log(`   - Projects with event results: ${projectsWithEventResults}`);
    
    console.log(`\n⚠️  ACTION ITEMS:`);
    
    if (report.bitlyVariablesInKYC.length === 0) {
      console.log(`   ❌ CRITICAL: No Bitly variables found in KYC system`);
      console.log(`      → Need to add: totalBitlyClicks, uniqueBitlyClicks, country data`);
    }
    
    if (junctionsWithDates < totalJunctions) {
      console.log(`   ⚠️  ${totalJunctions - junctionsWithDates} Bitly junctions missing date ranges`);
      console.log(`      → Run recalculation script`);
    }
    
    if (report.sportsDbFieldsInKYC.length === 0) {
      console.log(`   ❌ CRITICAL: No TheSportDB variables in KYC system`);
      console.log(`      → Need to add: eventAttendees, eventResult fields, stadium capacity`);
    }
    
    console.log(`\n✅ Next Steps:`);
    console.log(`   1. Review KYC variable list to ensure all external data is mapped`);
    console.log(`   2. Create partner aggregation queries for clicker data`);
    console.log(`   3. Build partner data table view with all KYC values`);
    console.log(`   4. Build event data table view with all KYC values`);
    console.log(`   5. Verify Bitly date attribution algorithm is working correctly`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed\n');
  }
}

auditBitlyAndSportsDbData();
