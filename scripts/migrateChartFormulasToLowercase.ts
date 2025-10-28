// scripts/migrateChartFormulasToLowercase.ts
// WHAT: MongoDB migration to update chart formulas from old SEYU tokens to lowercase field names
// WHY: Enforce SINGLE REFERENCE SYSTEM - database field names = chart tokens
// WHEN: Run once to migrate existing chart_configurations collection

import { MongoClient, Db, Collection } from 'mongodb';

interface ChartElement {
  id: string;
  label: string;
  formula: string;
  color: string;
  description?: string;
  parameters?: Record<string, { value: number; label: string; description: string; unit?: string }>;
  manualData?: Record<string, number>;
}

interface ChartConfiguration {
  _id?: any;
  chartId: string;
  title: string;
  type: 'pie' | 'bar' | 'kpi';
  order: number;
  isActive: boolean;
  elements: ChartElement[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
  emoji?: string;
  subtitle?: string;
  showTotal?: boolean;
  totalLabel?: string;
}

// WHAT: Complete mapping from old SEYU-prefixed uppercase tokens to new lowercase field names
// WHY: Single source of truth for formula migration
const TOKEN_MIGRATION_MAP: Record<string, string> = {
  // Image Statistics
  '[SEYUREMOTEIMAGES]': '[remoteImages]',
  '[SEYUHOSTESSIMAGES]': '[hostessImages]',
  '[SEYUSELFIES]': '[selfies]',
  '[SEYUAPPROVEDIMAGES]': '[approvedImages]',
  '[SEYUREJECTEDIMAGES]': '[rejectedImages]',
  
  // Location Statistics (CRITICAL: indoor/outdoor → remoteFans)
  '[SEYUINDOOR]': '[remoteFans]',
  '[SEYUOUTDOOR]': '[remoteFans]',
  '[SEYUREMOTEFANS]': '[remoteFans]',
  '[INDOOR]': '[remoteFans]',
  '[OUTDOOR]': '[remoteFans]',
  '[SEYUSTADIUMFANS]': '[stadium]',
  '[SEYUSTADIUM]': '[stadium]',
  '[SEYUTOTALFANS]': '[totalFans]',
  
  // Demographics
  '[SEYUFEMALE]': '[female]',
  '[SEYUMALE]': '[male]',
  '[SEYUGENALPHA]': '[genAlpha]',
  '[SEYUGENYZ]': '[genYZ]',
  '[SEYUGENX]': '[genX]',
  '[SEYUBOOMER]': '[boomer]',
  
  // Merchandise
  '[SEYUMERCHEDFANS]': '[merched]',
  '[SEYUMERCHED]': '[merched]',
  '[SEYUMERCHJERSEY]': '[jersey]',
  '[SEYUJERSEY]': '[jersey]',
  '[SEYUMERCHSCARF]': '[scarf]',
  '[SEYUSCARF]': '[scarf]',
  '[SEYUMERCHFLAGS]': '[flags]',
  '[SEYUFLAGS]': '[flags]',
  '[SEYUMERCHBASEBALLCAP]': '[baseballCap]',
  '[SEYUBASEBALLCAP]': '[baseballCap]',
  '[SEYUMERCHOTHER]': '[other]',
  '[SEYUOTHER]': '[other]',
  
  // Social Media Visits
  '[SEYUFACEBOOKVISIT]': '[visitFacebook]',
  '[SEYUINSTAGRAMVISIT]': '[visitInstagram]',
  '[SEYUYOUTUBEVISIT]': '[visitYoutube]',
  '[SEYUTIKTOKVISIT]': '[visitTiktok]',
  '[SEYUXVISIT]': '[visitX]',
  '[SEYUTRUSTPILOTVISIT]': '[visitTrustpilot]',
  '[SEYUSOCIALVISIT]': '[socialVisit]',
  '[SEYUQRCODEVISIT]': '[visitQrCode]',
  '[SEYUSHORTURLVISIT]': '[visitShortUrl]',
  '[SEYUWEBVISIT]': '[visitWeb]',
  
  // Event Metrics
  '[SEYUATTENDEES]': '[eventAttendees]',
  '[SEYUEVENTATTENDEES]': '[eventAttendees]',
  '[SEYURESULTHOME]': '[eventResultHome]',
  '[SEYURESULTVISITOR]': '[eventResultVisitor]',
  '[SEYUPROPOSITIONVISIT]': '[eventValuePropositionVisited]',
  '[SEYUPROPOSITIONPURCHASE]': '[eventValuePropositionPurchases]',
  
  // Merchandise Pricing (migrate to PARAM tokens)
  '[SEYUJERSEYPRICE]': '[PARAM:jerseyPrice]',
  '[SEYUSCARFPRICE]': '[PARAM:scarfPrice]',
  '[SEYUFLAGSPRICE]': '[PARAM:flagsPrice]',
  '[SEYUCAPPRICE]': '[PARAM:capPrice]',
  '[SEYUOTHERPRICE]': '[PARAM:otherPrice]',
  
  // Computed Fields
  '[SEYUALLIMAGES]': '[allImages]',
  '[SEYUTOTALIMAGES]': '[allImages]',
  '[SEYUTOTALUNDER40]': '[totalUnder40]',
  '[SEYUTOTALOVER40]': '[totalOver40]'
};

/**
 * WHAT: Apply formula migration by replacing old tokens with new field names
 * WHY: Standardize all formulas to use lowercase database field names
 * HOW: Iterate through mapping and replace all occurrences
 */
function migrateFormula(formula: string): { newFormula: string; changed: boolean } {
  let newFormula = formula;
  let changed = false;
  
  for (const [oldToken, newToken] of Object.entries(TOKEN_MIGRATION_MAP)) {
    if (newFormula.includes(oldToken)) {
      newFormula = newFormula.replace(new RegExp(oldToken.replace(/[[\]]/g, '\\$&'), 'g'), newToken);
      changed = true;
    }
  }
  
  return { newFormula, changed };
}

/**
 * WHAT: Main migration function
 * WHY: Update all chart configurations in MongoDB
 * HOW: Connect to DB, find charts, update formulas, report results
 */
async function migrateChartFormulas() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  
  const client = new MongoClient(uri);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db: Db = client.db(process.env.MONGODB_DB || 'messmass');
    const chartsCollection: Collection<ChartConfiguration> = db.collection('chartConfigurations');
    
    console.log('📊 Fetching all chart configurations...');
    const allCharts = await chartsCollection.find({}).toArray();
    console.log(`✅ Found ${allCharts.length} chart configurations`);
    
    let updatedCount = 0;
    let unchangedCount = 0;
    const migrationLog: Array<{ chartId: string; title: string; changes: string[] }> = [];
    
    for (const chart of allCharts) {
      let chartChanged = false;
      const changes: string[] = [];
      
      // Migrate formulas in each element
      for (const element of chart.elements) {
        const { newFormula, changed } = migrateFormula(element.formula);
        
        if (changed) {
          changes.push(`  - Element "${element.label}": ${element.formula} → ${newFormula}`);
          element.formula = newFormula;
          chartChanged = true;
        }
      }
      
      // Update chart if any formula changed
      if (chartChanged) {
        const now = new Date().toISOString();
        
        await chartsCollection.updateOne(
          { _id: chart._id },
          {
            $set: {
              elements: chart.elements,
              updatedAt: now,
              lastModifiedBy: 'migration-script-lowercase'
            }
          }
        );
        
        migrationLog.push({
          chartId: chart.chartId,
          title: chart.title,
          changes
        });
        
        updatedCount++;
        console.log(`✅ Updated chart: ${chart.title} (${chart.chartId})`);
      } else {
        unchangedCount++;
        console.log(`⏭️  No changes needed for: ${chart.title} (${chart.chartId})`);
      }
    }
    
    // Print migration summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total charts processed: ${allCharts.length}`);
    console.log(`Charts updated: ${updatedCount}`);
    console.log(`Charts unchanged: ${unchangedCount}`);
    console.log('='.repeat(80));
    
    if (migrationLog.length > 0) {
      console.log('\n📝 DETAILED CHANGES:');
      console.log('='.repeat(80));
      
      for (const log of migrationLog) {
        console.log(`\nChart: ${log.title} (${log.chartId})`);
        for (const change of log.changes) {
          console.log(change);
        }
      }
      
      console.log('\n' + '='.repeat(80));
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
if (require.main === module) {
  migrateChartFormulas()
    .then(() => {
      console.log('\n🎉 All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration error:', error);
      process.exit(1);
    });
}

export { migrateChartFormulas, migrateFormula, TOKEN_MIGRATION_MAP };
