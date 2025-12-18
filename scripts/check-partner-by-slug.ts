// WHAT: Check which partner and report are associated with a viewSlug
// WHY: Debug which report is being used for partner report page
// HOW: Query partners collection by viewSlug

import clientPromise from '../lib/mongodb';
import config from '../lib/config';

const viewSlug = process.argv[2];

async function checkPartnerBySlug() {
  try {
    if (!viewSlug) {
      console.error('❌ Please provide viewSlug as argument');
      console.log('Usage: npm run check:partner-slug <viewSlug>');
      process.exit(1);
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);

    console.log(`🔍 Looking for partner with viewSlug: ${viewSlug}\n`);

    const partner = await db
      .collection('partners')
      .findOne({ viewSlug });

    if (!partner) {
      console.log('❌ No partner found with this viewSlug');
      process.exit(0);
    }

    console.log('👤 Partner Found:');
    console.log(`  Name: ${partner.name}`);
    console.log(`  ID: ${partner._id}`);
    console.log(`  viewSlug: ${partner.viewSlug}`);
    console.log(`  reportId: ${partner.reportId || 'NOT SET'}`);
    console.log('');

    // If partner has reportId, fetch the report
    if (partner.reportId) {
      const report = await db
        .collection('reports')
        .findOne({ _id: partner.reportId });

      if (report) {
        console.log('📊 Assigned Report:');
        console.log(`  Name: ${report.name}`);
        console.log(`  ID: ${report._id}`);
        console.log(`  type: ${report.type}`);
        console.log(`  styleId: ${report.styleId || 'NOT SET'}`);
        console.log('');

        // If report has styleId, fetch the style
        if (report.styleId) {
          const style = await db
            .collection('page_styles_enhanced')
            .findOne({ _id: report.styleId });

          if (style) {
            console.log('🎨 Applied Style:');
            console.log(`  Name: ${style.name}`);
            console.log(`  ID: ${style._id}`);
            console.log(`  isGlobalDefault: ${style.isGlobalDefault}`);
          }
        } else {
          console.log('⚠️  Report has no styleId set - will use default styling');
        }
      } else {
        console.log('⚠️  Report not found');
      }
    } else {
      console.log('⚠️  Partner has no reportId set - will use default report');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPartnerBySlug();
