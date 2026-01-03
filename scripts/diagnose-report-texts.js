// scripts/diagnose-report-texts.js
// WHAT: Diagnostic script to check reportText fields in MongoDB
// WHY: User reported missing/disconnected report texts in events and partners
// HOW: Query database and report on data integrity issues

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function diagnoseReportTexts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    
    // ==========================================
    // PART 1: Check Partners
    // ==========================================
    console.log('📊 DIAGNOSING PARTNERS...\n');
    
    const partnersCollection = db.collection('partners');
    const totalPartners = await partnersCollection.countDocuments();
    console.log(`Total partners: ${totalPartners}`);
    
    const partners = await partnersCollection.find({}).toArray();
    
    let partnersWithStats = 0;
    let partnersWithoutStats = 0;
    let partnersWithReportTexts = 0;
    let partnersMissingReportTexts = 0;
    const partnerIssues = [];
    
    partners.forEach(partner => {
      if (!partner.stats) {
        partnersWithoutStats++;
        partnerIssues.push({
          type: 'partner',
          id: partner._id.toString(),
          name: partner.name,
          issue: 'Missing stats object'
        });
      } else {
        partnersWithStats++;
        
        // Check for reportText fields (1-10)
        const hasReportTexts = Array.from({ length: 10 }, (_, i) => i + 1)
          .some(i => partner.stats[`reportText${i}`] !== undefined);
        
        if (hasReportTexts) {
          partnersWithReportTexts++;
        } else {
          partnersMissingReportTexts++;
          partnerIssues.push({
            type: 'partner',
            id: partner._id.toString(),
            name: partner.name,
            issue: 'Has stats object but no reportText fields'
          });
        }
      }
    });
    
    console.log(`  ✅ Partners with stats: ${partnersWithStats}`);
    console.log(`  ❌ Partners without stats: ${partnersWithoutStats}`);
    console.log(`  ✅ Partners with reportText fields: ${partnersWithReportTexts}`);
    console.log(`  ⚠️  Partners missing reportText fields: ${partnersMissingReportTexts}`);
    
    // ==========================================
    // PART 2: Check Events (Projects)
    // ==========================================
    console.log('\n📊 DIAGNOSING EVENTS (PROJECTS)...\n');
    
    const projectsCollection = db.collection('projects');
    const totalProjects = await projectsCollection.countDocuments();
    console.log(`Total events: ${totalProjects}`);
    
    const projects = await projectsCollection.find({}).toArray();
    
    let projectsWithStats = 0;
    let projectsWithoutStats = 0;
    let projectsWithReportTexts = 0;
    let projectsMissingReportTexts = 0;
    const projectIssues = [];
    
    projects.forEach(project => {
      if (!project.stats) {
        projectsWithoutStats++;
        projectIssues.push({
          type: 'event',
          id: project._id.toString(),
          name: project.eventName,
          issue: 'Missing stats object'
        });
      } else {
        projectsWithStats++;
        
        // Check for reportText fields (1-10)
        const hasReportTexts = Array.from({ length: 10 }, (_, i) => i + 1)
          .some(i => project.stats[`reportText${i}`] !== undefined);
        
        if (hasReportTexts) {
          projectsWithReportTexts++;
        } else {
          projectsMissingReportTexts++;
          // Only flag if it's a recent event (created in last 6 months)
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          const createdAt = project.createdAt ? new Date(project.createdAt) : null;
          
          if (!createdAt || createdAt > sixMonthsAgo) {
            projectIssues.push({
              type: 'event',
              id: project._id.toString(),
              name: project.eventName,
              issue: 'Has stats object but no reportText fields',
              createdAt: createdAt?.toISOString()
            });
          }
        }
      }
    });
    
    console.log(`  ✅ Events with stats: ${projectsWithStats}`);
    console.log(`  ❌ Events without stats: ${projectsWithoutStats}`);
    console.log(`  ✅ Events with reportText fields: ${projectsWithReportTexts}`);
    console.log(`  ⚠️  Events missing reportText fields: ${projectsMissingReportTexts}`);
    
    // ==========================================
    // PART 3: Check Database Connection
    // ==========================================
    console.log('\n📊 CHECKING DATABASE CONNECTION...\n');
    
    const adminDb = client.db().admin();
    const serverStatus = await adminDb.serverStatus();
    
    console.log(`  ✅ MongoDB version: ${serverStatus.version}`);
    console.log(`  ✅ Uptime: ${Math.floor(serverStatus.uptime / 3600)} hours`);
    console.log(`  ✅ Connections: ${serverStatus.connections.current}/${serverStatus.connections.available}`);
    
    // ==========================================
    // PART 4: Summary
    // ==========================================
    console.log('\n📊 SUMMARY OF ISSUES...\n');
    
    if (partnerIssues.length === 0 && projectIssues.length === 0) {
      console.log('  ✅ No data integrity issues found!');
      console.log('  ℹ️  Note: Missing reportText fields may be normal if not yet used.');
    } else {
      console.log(`  ⚠️  Found ${partnerIssues.length + projectIssues.length} potential issues:\n`);
      
      if (partnerIssues.length > 0) {
        console.log('  PARTNERS:');
        partnerIssues.slice(0, 10).forEach(issue => {
          console.log(`    - ${issue.name} (${issue.id.substring(0, 8)}...): ${issue.issue}`);
        });
        if (partnerIssues.length > 10) {
          console.log(`    ... and ${partnerIssues.length - 10} more`);
        }
      }
      
      if (projectIssues.length > 0) {
        console.log('\n  EVENTS:');
        projectIssues.slice(0, 10).forEach(issue => {
          console.log(`    - ${issue.name} (${issue.id.substring(0, 8)}...): ${issue.issue}`);
        });
        if (projectIssues.length > 10) {
          console.log(`    ... and ${projectIssues.length - 10} more`);
        }
      }
    }
    
    // ==========================================
    // PART 5: Sample Data Check
    // ==========================================
    console.log('\n📊 SAMPLE DATA CHECK...\n');
    
    // Find a partner with reportText fields
    const partnerWithTexts = partners.find(p => 
      p.stats && Array.from({ length: 10 }, (_, i) => i + 1)
        .some(i => p.stats[`reportText${i}`] !== undefined)
    );
    
    if (partnerWithTexts) {
      console.log(`  ✅ Found partner with reportText: ${partnerWithTexts.name}`);
      const reportTextFields = Array.from({ length: 10 }, (_, i) => i + 1)
        .filter(i => partnerWithTexts.stats[`reportText${i}`] !== undefined)
        .map(i => `reportText${i}`);
      console.log(`     Fields: ${reportTextFields.join(', ')}`);
    } else {
      console.log('  ⚠️  No partners found with reportText fields');
    }
    
    // Find an event with reportText fields
    const projectWithTexts = projects.find(p => 
      p.stats && Array.from({ length: 10 }, (_, i) => i + 1)
        .some(i => p.stats[`reportText${i}`] !== undefined)
    );
    
    if (projectWithTexts) {
      console.log(`  ✅ Found event with reportText: ${projectWithTexts.eventName}`);
      const reportTextFields = Array.from({ length: 10 }, (_, i) => i + 1)
        .filter(i => projectWithTexts.stats[`reportText${i}`] !== undefined)
        .map(i => `reportText${i}`);
      console.log(`     Fields: ${reportTextFields.join(', ')}`);
    } else {
      console.log('  ⚠️  No events found with reportText fields');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

diagnoseReportTexts();

