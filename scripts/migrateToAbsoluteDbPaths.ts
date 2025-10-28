// scripts/migrateToAbsoluteDbPaths.ts
// ABSOLUTE DATABASE PATH SYSTEM MIGRATION
// WHAT: Migrate ALL chart formulas from [female] to [stats.female] format
// WHY: Enforce single source of truth - database structure = formula reference
// WHEN: Run ONCE after code changes deployed

import { MongoClient } from 'mongodb';

interface ChartElement {
  id: string;
  label: string;
  formula: string;
  color: string;
  description?: string;
}

interface ChartConfiguration {
  _id: any;
  chartId: string;
  title: string;
  elements: ChartElement[];
  updatedAt?: string;
}

// COMPLETE MIGRATION MAP: Old token → New absolute path
const MIGRATION_MAP: Record<string, string> = {
  // Image Statistics
  '[remoteImages]': '[stats.remoteImages]',
  '[hostessImages]': '[stats.hostessImages]',
  '[selfies]': '[stats.selfies]',
  '[approvedImages]': '[stats.approvedImages]',
  '[rejectedImages]': '[stats.rejectedImages]',
  
  // Location
  '[remoteFans]': '[stats.remoteFans]',
  '[stadium]': '[stats.stadium]',
  '[totalFans]': '[stats.totalFans]',
  '[indoor]': '[stats.remoteFans]', // Legacy
  '[outdoor]': '[stats.remoteFans]', // Legacy
  
  // Demographics
  '[female]': '[stats.female]',
  '[male]': '[stats.male]',
  '[genAlpha]': '[stats.genAlpha]',
  '[genYZ]': '[stats.genYZ]',
  '[genX]': '[stats.genX]',
  '[boomer]': '[stats.boomer]',
  
  // Merchandise
  '[merched]': '[stats.merched]',
  '[jersey]': '[stats.jersey]',
  '[scarf]': '[stats.scarf]',
  '[flags]': '[stats.flags]',
  '[baseballCap]': '[stats.baseballCap]',
  '[other]': '[stats.other]',
  
  // Visits
  '[visitFacebook]': '[stats.visitFacebook]',
  '[visitInstagram]': '[stats.visitInstagram]',
  '[visitYoutube]': '[stats.visitYoutube]',
  '[visitTiktok]': '[stats.visitTiktok]',
  '[visitX]': '[stats.visitX]',
  '[visitTrustpilot]': '[stats.visitTrustpilot]',
  '[visitQrCode]': '[stats.visitQrCode]',
  '[visitShortUrl]': '[stats.visitShortUrl]',
  '[visitWeb]': '[stats.visitWeb]',
  '[socialVisit]': '[stats.socialVisit]',
  
  // Event
  '[eventAttendees]': '[stats.eventAttendees]',
  '[eventResultHome]': '[stats.eventResultHome]',
  '[eventResultVisitor]': '[stats.eventResultVisitor]',
  '[eventValuePropositionVisited]': '[stats.eventValuePropositionVisited]',
  '[eventValuePropositionPurchases]': '[stats.eventValuePropositionPurchases]',
  
  // Computed
  '[allImages]': '[stats.allImages]',
  '[totalUnder40]': '[stats.totalUnder40]',
  '[totalOver40]': '[stats.totalOver40]',
  
  // Keep PARAM and MANUAL tokens unchanged
  // [PARAM:*] stays as is
  // [MANUAL:*] stays as is
};

function migrateFormula(formula: string): { newFormula: string; changed: boolean } {
  let newFormula = formula;
  let changed = false;
  
  for (const [oldToken, newToken] of Object.entries(MIGRATION_MAP)) {
    if (newFormula.includes(oldToken)) {
      // Use regex to ensure we only replace exact matches
      const regex = new RegExp(oldToken.replace(/[[\]]/g, '\\$&'), 'g');
      newFormula = newFormula.replace(regex, newToken);
      changed = true;
    }
  }
  
  return { newFormula, changed };
}

async function migrateCharts() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable required');
  }
  
  const client = new MongoClient(uri);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const chartsCollection = db.collection<ChartConfiguration>('chartConfigurations');
    
    console.log('📊 Fetching all charts...');
    const allCharts = await chartsCollection.find({}).toArray();
    console.log(`✅ Found ${allCharts.length} charts`);
    
    let updatedCount = 0;
    let unchangedCount = 0;
    const changes: Array<{ chartId: string; title: string; formulaChanges: string[] }> = [];
    
    for (const chart of allCharts) {
      let chartChanged = false;
      const formulaChanges: string[] = [];
      
      for (const element of chart.elements) {
        const { newFormula, changed } = migrateFormula(element.formula);
        
        if (changed) {
          formulaChanges.push(`  "${element.label}": ${element.formula} → ${newFormula}`);
          element.formula = newFormula;
          chartChanged = true;
        }
      }
      
      if (chartChanged) {
        await chartsCollection.updateOne(
          { _id: chart._id },
          {
            $set: {
              elements: chart.elements,
              updatedAt: new Date().toISOString(),
              lastModifiedBy: 'migration-absolute-db-paths'
            }
          }
        );
        
        changes.push({
          chartId: chart.chartId,
          title: chart.title,
          formulaChanges
        });
        
        updatedCount++;
        console.log(`✅ Updated: ${chart.title} (${chart.chartId})`);
      } else {
        unchangedCount++;
        console.log(`⏭️  No changes: ${chart.title} (${chart.chartId})`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total charts: ${allCharts.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Unchanged: ${unchangedCount}`);
    console.log('='.repeat(80));
    
    if (changes.length > 0) {
      console.log('\n📝 DETAILED CHANGES:');
      console.log('='.repeat(80));
      for (const change of changes) {
        console.log(`\n${change.title} (${change.chartId}):`);
        change.formulaChanges.forEach(c => console.log(c));
      }
    }
    
    console.log('\n✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Closed database connection');
  }
}

if (require.main === module) {
  migrateCharts()
    .then(() => {
      console.log('\n🎉 Success!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error:', error);
      process.exit(1);
    });
}

export { migrateCharts, migrateFormula, MIGRATION_MAP };
