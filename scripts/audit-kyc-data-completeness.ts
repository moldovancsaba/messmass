// WHAT: Comprehensive KYC data completeness audit
// WHY: Identify missing data from external sources (Bitly, TheSportsDB, content assets)
// HOW: Compare variables_metadata with actual data in project.stats and partner aggregations

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found in environment');
  process.exit(1);
}

interface VariableMetadata {
  name: string;
  alias: string;
  type: 'number' | 'text' | 'derived';
  category: string;
  isSystemVariable: boolean;
}

interface DataSource {
  name: string;
  variables: string[];
  checkFunction: (db: any) => Promise<SourceAuditResult>;
}

interface SourceAuditResult {
  totalVariables: number;
  missingCount: number;
  partialCount: number;
  completeCount: number;
  details: Array<{
    variable: string;
    status: 'missing' | 'partial' | 'complete';
    projectsWithData: number;
    totalProjects: number;
    sampleValue?: any;
  }>;
}

interface AuditReport {
  timestamp: string;
  totalProjects: number;
  totalPartners: number;
  totalVariables: number;
  sources: Record<string, SourceAuditResult>;
  recommendations: string[];
}

// WHAT: Check Bitly-related variables
async function auditBitlyData(db: any): Promise<SourceAuditResult> {
  const bitlyVariables = [
    'totalBitlyClicks',
    'uniqueBitlyClicks',
    'bitlyCountry1',
    'bitlyCountry1Clicks',
    'bitlyCountry2',
    'bitlyCountry2Clicks',
    'bitlyCountry3',
    'bitlyCountry3Clicks',
    'bitlyCountry4',
    'bitlyCountry4Clicks',
    'bitlyCountry5',
    'bitlyCountry5Clicks',
  ];

  const projects = await db.collection('projects').find({}).toArray();
  const totalProjects = projects.length;
  
  const details = await Promise.all(bitlyVariables.map(async (varName) => {
    let projectsWithData = 0;
    let sampleValue = undefined;
    
    for (const project of projects) {
      const value = project.stats?.[varName];
      if (value !== undefined && value !== null && value !== '') {
        projectsWithData++;
        if (!sampleValue) sampleValue = value;
      }
    }
    
    const percentage = (projectsWithData / totalProjects) * 100;
    let status: 'missing' | 'partial' | 'complete';
    if (percentage === 0) status = 'missing';
    else if (percentage < 50) status = 'partial';
    else status = 'complete';
    
    return {
      variable: varName,
      status,
      projectsWithData,
      totalProjects,
      sampleValue,
    };
  }));
  
  const missingCount = details.filter(d => d.status === 'missing').length;
  const partialCount = details.filter(d => d.status === 'partial').length;
  const completeCount = details.filter(d => d.status === 'complete').length;
  
  return {
    totalVariables: bitlyVariables.length,
    missingCount,
    partialCount,
    completeCount,
    details,
  };
}

// WHAT: Check TheSportsDB-related variables
async function auditTheSportsDBData(db: any): Promise<SourceAuditResult> {
  const sportsDbVariables = [
    'eventResultHome',
    'eventResultVisitor',
    'eventResultWinner',
  ];

  const projects = await db.collection('projects').find({}).toArray();
  const totalProjects = projects.length;
  
  const details = await Promise.all(sportsDbVariables.map(async (varName) => {
    let projectsWithData = 0;
    let sampleValue = undefined;
    
    for (const project of projects) {
      const value = project.stats?.[varName];
      if (value !== undefined && value !== null && value !== '') {
        projectsWithData++;
        if (!sampleValue) sampleValue = value;
      }
    }
    
    const percentage = (projectsWithData / totalProjects) * 100;
    let status: 'missing' | 'partial' | 'complete';
    if (percentage === 0) status = 'missing';
    else if (percentage < 50) status = 'partial';
    else status = 'complete';
    
    return {
      variable: varName,
      status,
      projectsWithData,
      totalProjects,
      sampleValue,
    };
  }));
  
  const missingCount = details.filter(d => d.status === 'missing').length;
  const partialCount = details.filter(d => d.status === 'partial').length;
  const completeCount = details.filter(d => d.status === 'complete').length;
  
  return {
    totalVariables: sportsDbVariables.length,
    missingCount,
    partialCount,
    completeCount,
    details,
  };
}

// WHAT: Check junction table for Bitly associations and cached metrics
async function auditBitlyJunctions(db: any): Promise<SourceAuditResult> {
  const projects = await db.collection('projects').find({}).toArray();
  const totalProjects = projects.length;
  
  const junctions = await db.collection('bitly_project_links').find({}).toArray();
  const junctionsByProject = new Map<string, any[]>();
  
  junctions.forEach((j: any) => {
    const pid = j.projectId.toString();
    if (!junctionsByProject.has(pid)) junctionsByProject.set(pid, []);
    junctionsByProject.get(pid)!.push(j);
  });
  
  let projectsWithJunctions = 0;
  let projectsWithCachedMetrics = 0;
  let projectsWithCountryData = 0;
  
  for (const project of projects) {
    const pid = project._id.toString();
    const projectJunctions = junctionsByProject.get(pid) || [];
    
    if (projectJunctions.length > 0) {
      projectsWithJunctions++;
      
      const hasCachedMetrics = projectJunctions.some(j => j.cachedMetrics?.totalClicks > 0);
      if (hasCachedMetrics) projectsWithCachedMetrics++;
      
      const hasCountryData = projectJunctions.some(j => 
        j.cachedMetrics?.countriesData && j.cachedMetrics.countriesData.length > 0
      );
      if (hasCountryData) projectsWithCountryData++;
    }
  }
  
  return {
    totalVariables: 3,
    missingCount: 0,
    partialCount: 0,
    completeCount: 3,
    details: [
      {
        variable: 'bitly_junctions',
        status: projectsWithJunctions > 0 ? 'complete' : 'missing',
        projectsWithData: projectsWithJunctions,
        totalProjects,
        sampleValue: `${junctions.length} junctions total`,
      },
      {
        variable: 'cached_metrics',
        status: projectsWithCachedMetrics > 0 ? 'partial' : 'missing',
        projectsWithData: projectsWithCachedMetrics,
        totalProjects,
        sampleValue: 'clicks, uniqueClicks, countries',
      },
      {
        variable: 'country_data',
        status: projectsWithCountryData > 0 ? 'partial' : 'missing',
        projectsWithData: projectsWithCountryData,
        totalProjects,
        sampleValue: 'countriesData array',
      },
    ],
  };
}

// WHAT: Generate recommendations based on audit results
function generateRecommendations(report: AuditReport): string[] {
  const recommendations: string[] = [];
  
  // Bitly recommendations
  const bitly = report.sources['bitly_data'];
  if (bitly.missingCount > 0 || bitly.partialCount > 0) {
    recommendations.push(
      `🔗 Bitly Data: ${bitly.missingCount} variables completely missing, ${bitly.partialCount} partially populated`
    );
    recommendations.push(
      '   → Action: Run /api/bitly/sync to pull fresh analytics from Bitly API'
    );
    recommendations.push(
      '   → Action: Run scripts/sync-bitly-to-project-stats.ts --apply to copy data to project.stats'
    );
  }
  
  const junctions = report.sources['bitly_junctions'];
  const junctionDetails = junctions.details.find(d => d.variable === 'cached_metrics');
  if (junctionDetails && junctionDetails.status === 'missing') {
    recommendations.push(
      `📊 Cached Metrics: Only ${junctionDetails.projectsWithData}/${junctionDetails.totalProjects} projects have cached metrics`
    );
    recommendations.push(
      '   → Action: Run /api/bitly/recalculate with mode=all to refresh cached metrics'
    );
  }
  
  // TheSportsDB recommendations
  const sportsDb = report.sources['thesportsdb_data'];
  if (sportsDb.missingCount > 0 || sportsDb.partialCount > 0) {
    recommendations.push(
      `⚽ TheSportsDB Data: ${sportsDb.missingCount} variables completely missing, ${sportsDb.partialCount} partially populated`
    );
    recommendations.push(
      '   → Action: Check if TheSportsDB enrichment script exists and run it'
    );
  }
  
  return recommendations;
}

// WHAT: Main audit execution
async function runAudit() {
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('messmass');
    
    console.log('🔍 Starting KYC Data Completeness Audit...\n');
    console.log('='.repeat(80));
    
    // Get baseline counts
    const totalProjects = await db.collection('projects').countDocuments();
    const totalPartners = await db.collection('partners').countDocuments();
    const totalVariables = await db.collection('variables_metadata').countDocuments();
    
    console.log(`\n📊 Database Overview:`);
    console.log(`   Projects: ${totalProjects}`);
    console.log(`   Partners: ${totalPartners}`);
    console.log(`   KYC Variables: ${totalVariables}\n`);
    console.log('='.repeat(80));
    
    // Audit each data source
    const sources: Record<string, SourceAuditResult> = {};
    
    console.log('\n🔗 Auditing Bitly Data...');
    sources['bitly_data'] = await auditBitlyData(db);
    
    console.log('📊 Auditing Bitly Junctions & Cached Metrics...');
    sources['bitly_junctions'] = await auditBitlyJunctions(db);
    
    console.log('⚽ Auditing TheSportsDB Data...');
    sources['thesportsdb_data'] = await auditTheSportsDBData(db);
    
    // Build report
    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      totalProjects,
      totalPartners,
      totalVariables,
      sources,
      recommendations: [],
    };
    
    report.recommendations = generateRecommendations(report);
    
    // Print results
    console.log('\n='.repeat(80));
    console.log('\n📋 AUDIT RESULTS\n');
    
    for (const [sourceName, result] of Object.entries(sources)) {
      console.log(`\n${sourceName.toUpperCase()}:`);
      console.log(`   Total Variables: ${result.totalVariables}`);
      console.log(`   ✅ Complete: ${result.completeCount}`);
      console.log(`   ⚠️  Partial: ${result.partialCount}`);
      console.log(`   ❌ Missing: ${result.missingCount}\n`);
      
      // Show details for missing/partial variables
      const problematic = result.details.filter(d => d.status !== 'complete');
      if (problematic.length > 0) {
        console.log('   Issues:');
        problematic.forEach(detail => {
          const coverage = ((detail.projectsWithData / detail.totalProjects) * 100).toFixed(1);
          const icon = detail.status === 'missing' ? '❌' : '⚠️';
          console.log(`   ${icon} ${detail.variable}: ${detail.projectsWithData}/${detail.totalProjects} projects (${coverage}%)`);
        });
      }
    }
    
    // Print recommendations
    console.log('\n='.repeat(80));
    console.log('\n💡 RECOMMENDATIONS\n');
    
    if (report.recommendations.length === 0) {
      console.log('✅ All data sources are complete! No action needed.\n');
    } else {
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log(`\n✅ Audit completed at ${report.timestamp}\n`);
    
    // Save report to file
    const fs = await import('fs/promises');
    const reportPath = path.join(process.cwd(), 'kyc-audit-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: kyc-audit-report.json\n`);
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run audit
runAudit();
