/**
 * Database Collection Audit Script
 * 
 * Purpose: Comprehensive audit of MongoDB collections to identify:
 * - All collection names and their document counts
 * - Schema consistency within collections
 * - Fragmentation issues (data stored in unexpected collections)
 * - Duplicate or redundant collections
 * - Orphaned data and referential integrity
 * - Index health and performance
 * 
 * Usage: npm run audit:database
 */

import { MongoClient, Db } from 'mongodb';
import config from '../lib/config';

interface CollectionInfo {
  name: string;
  count: number;
  sampleDoc: any;
  indexes: any[];
  avgDocSize: number;
  totalSize: number;
}

interface AuditReport {
  timestamp: string;
  totalCollections: number;
  collections: CollectionInfo[];
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

const EXPECTED_COLLECTIONS = [
  'projects',
  'partners',
  'bitly_links',
  'bitly_project_links',
  'bitly_analytics_cache',
  'hashtag_categories',
  'hashtags',
  'notifications',
  'variables_metadata',
  'variables_groups',
  'chart_configurations',
  'chart_formatting_defaults',
  'page_styles_enhanced',
  'analytics_aggregates',
  'aggregation_logs',
  'local_users',
  'countries',
  'cities'
];

async function auditDatabase(): Promise<AuditReport> {
  const client = new MongoClient(config.mongodbUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(config.dbName);
    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      totalCollections: 0,
      collections: [],
      warnings: [],
      errors: [],
      recommendations: []
    };

    // Get all collections
    const collections = await db.listCollections().toArray();
    report.totalCollections = collections.length;
    
    console.log(`\n📊 Found ${collections.length} collections\n`);

    // Audit each collection
    for (const collInfo of collections) {
      const collName = collInfo.name;
      const collection = db.collection(collName);
      
      console.log(`🔍 Auditing: ${collName}...`);
      
      try {
        const count = await collection.countDocuments();
        const sampleDoc = await collection.findOne({});
        const indexes = await collection.indexes();
        const stats = await db.command({ collStats: collName });
        
        const info: CollectionInfo = {
          name: collName,
          count,
          sampleDoc,
          indexes,
          avgDocSize: stats.avgObjSize || 0,
          totalSize: stats.size || 0
        };
        
        report.collections.push(info);
        
        // Check if collection is expected
        if (!EXPECTED_COLLECTIONS.includes(collName)) {
          report.warnings.push(
            `⚠️  Unexpected collection: "${collName}" (${count} documents)`
          );
        }
        
        // Check for empty collections
        if (count === 0) {
          report.warnings.push(
            `⚠️  Empty collection: "${collName}"`
          );
        }
        
        // Check for missing indexes
        if (indexes.length === 1 && indexes[0].name === '_id_') {
          report.recommendations.push(
            `💡 "${collName}" has no custom indexes (may need performance optimization)`
          );
        }
        
      } catch (error) {
        report.errors.push(
          `❌ Error auditing "${collName}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Check for missing expected collections
    for (const expectedColl of EXPECTED_COLLECTIONS) {
      if (!collections.find(c => c.name === expectedColl)) {
        report.warnings.push(
          `⚠️  Missing expected collection: "${expectedColl}"`
        );
      }
    }

    // Check for data fragmentation in projects
    await checkProjectsFragmentation(db, report);
    
    // Check for orphaned data
    await checkOrphanedData(db, report);
    
    // Check for referential integrity
    await checkReferentialIntegrity(db, report);

    return report;
    
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

async function checkProjectsFragmentation(db: Db, report: AuditReport): Promise<void> {
  console.log('\n🔬 Checking projects collection fragmentation...');
  
  try {
    const projects = db.collection('projects');
    
    // Check for projects with missing stats
    const projectsWithoutStats = await projects.countDocuments({ stats: { $exists: false } });
    if (projectsWithoutStats > 0) {
      report.warnings.push(
        `⚠️  ${projectsWithoutStats} projects missing "stats" field`
      );
    }
    
    // Check for projects with empty stats
    const projectsWithEmptyStats = await projects.countDocuments({ stats: {} });
    if (projectsWithEmptyStats > 0) {
      report.warnings.push(
        `⚠️  ${projectsWithEmptyStats} projects have empty "stats" object`
      );
    }
    
    // Sample check for data stored at wrong levels
    const sampleProjects = await projects.find({}).limit(10).toArray();
    for (const project of sampleProjects) {
      // Check for variables stored outside stats object
      const topLevelKeys = Object.keys(project);
      const suspiciousKeys = topLevelKeys.filter(key => 
        !['_id', 'eventName', 'eventDate', 'slug', 'hashtags', 'categorizedHashtags', 
          'stats', 'bitlyLinks', 'bitlyLinkIds', 'createdAt', 'updatedAt', 'styleIdEnhanced',
          'partner1Id', 'partner2Id', 'footballDataId', 'sportsDbId', '__v'].includes(key)
      );
      
      if (suspiciousKeys.length > 0) {
        report.warnings.push(
          `⚠️  Project ${project._id} has suspicious top-level keys: ${suspiciousKeys.join(', ')}`
        );
      }
      
      // Check for nested stats issues
      if (project.stats) {
        const statsKeys = Object.keys(project.stats);
        // Look for unexpected nested objects
        for (const key of statsKeys) {
          if (typeof project.stats[key] === 'object' && project.stats[key] !== null && !Array.isArray(project.stats[key])) {
            report.warnings.push(
              `⚠️  Project ${project._id} has nested object in stats: stats.${key}`
            );
          }
        }
      }
    }
    
  } catch (error) {
    report.errors.push(
      `❌ Error checking projects fragmentation: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function checkOrphanedData(db: Db, report: AuditReport): Promise<void> {
  console.log('\n🔬 Checking for orphaned data...');
  
  try {
    // Check for orphaned bitly_project_links
    const bitlyProjectLinks = db.collection('bitly_project_links');
    const projects = db.collection('projects');
    const bitlyLinks = db.collection('bitly_links');
    
    const linkCount = await bitlyProjectLinks.countDocuments();
    if (linkCount > 0) {
      const sampleLinks = await bitlyProjectLinks.find({}).limit(100).toArray();
      
      for (const link of sampleLinks) {
        // Check if project exists
        if (link.projectId) {
          const projectExists = await projects.countDocuments({ _id: link.projectId });
          if (projectExists === 0) {
            report.warnings.push(
              `⚠️  Orphaned bitly_project_link: references non-existent project ${link.projectId}`
            );
          }
        }
        
        // Check if bitly link exists
        if (link.bitlyLinkId) {
          const bitlyExists = await bitlyLinks.countDocuments({ _id: link.bitlyLinkId });
          if (bitlyExists === 0) {
            report.warnings.push(
              `⚠️  Orphaned bitly_project_link: references non-existent bitly_link ${link.bitlyLinkId}`
            );
          }
        }
      }
    }
    
    // Check for orphaned style references
    const pageStyles = db.collection('page_styles_enhanced');
    const projectsWithStyle = await projects.find({ styleIdEnhanced: { $exists: true } }).limit(100).toArray();
    
    for (const project of projectsWithStyle) {
      const styleExists = await pageStyles.countDocuments({ _id: project.styleIdEnhanced });
      if (styleExists === 0) {
        report.warnings.push(
          `⚠️  Project ${project._id} references non-existent style ${project.styleIdEnhanced}`
        );
      }
    }
    
  } catch (error) {
    report.errors.push(
      `❌ Error checking orphaned data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function checkReferentialIntegrity(db: Db, report: AuditReport): Promise<void> {
  console.log('\n🔬 Checking referential integrity...');
  
  try {
    const projects = db.collection('projects');
    const partners = db.collection('partners');
    
    // Check partner references in projects
    const projectsWithPartners = await projects.find({
      $or: [
        { partner1Id: { $exists: true } },
        { partner2Id: { $exists: true } }
      ]
    }).limit(100).toArray();
    
    for (const project of projectsWithPartners) {
      if (project.partner1Id) {
        const partnerExists = await partners.countDocuments({ _id: project.partner1Id });
        if (partnerExists === 0) {
          report.warnings.push(
            `⚠️  Project ${project._id} references non-existent partner1 ${project.partner1Id}`
          );
        }
      }
      
      if (project.partner2Id) {
        const partnerExists = await partners.countDocuments({ _id: project.partner2Id });
        if (partnerExists === 0) {
          report.warnings.push(
            `⚠️  Project ${project._id} references non-existent partner2 ${project.partner2Id}`
          );
        }
      }
    }
    
  } catch (error) {
    report.errors.push(
      `❌ Error checking referential integrity: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function printReport(report: AuditReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('📋 DATABASE AUDIT REPORT');
  console.log('='.repeat(80));
  console.log(`\n⏰ Timestamp: ${report.timestamp}`);
  console.log(`📊 Total Collections: ${report.totalCollections}\n`);
  
  // Collections table
  console.log('📦 COLLECTIONS:');
  console.log('─'.repeat(80));
  report.collections
    .sort((a, b) => b.count - a.count)
    .forEach(coll => {
      const sizeKB = (coll.totalSize / 1024).toFixed(2);
      const avgSizeBytes = coll.avgDocSize.toFixed(0);
      console.log(`  ${coll.name.padEnd(35)} ${String(coll.count).padStart(8)} docs  |  ${sizeKB.padStart(10)} KB  |  avg: ${avgSizeBytes} bytes  |  ${coll.indexes.length} indexes`);
    });
  
  // Warnings
  if (report.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    console.log('─'.repeat(80));
    report.warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  // Errors
  if (report.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    console.log('─'.repeat(80));
    report.errors.forEach(error => console.log(`  ${error}`));
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('─'.repeat(80));
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`✅ Audit complete. Total issues: ${report.warnings.length + report.errors.length}`);
  console.log('='.repeat(80) + '\n');
}

// Run audit
auditDatabase()
  .then(report => {
    printReport(report);
    process.exit(report.errors.length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
