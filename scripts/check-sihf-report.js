// WHAT: Check SIHF partner report configuration and styleId
// WHY: Debug why partner report doesn't show SIHF red colors
// HOW: Query partner, report template, and style

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// Swiss Ice Hockey Federation IDs
const SIHF_PARTNER_ID = '68f626b4eaea906244f28925';
const SIHF_STYLE_ID = '693fe86456d7006458901c25';

async function checkSIHFReport() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    
    // 1. Check partner
    console.log('📊 CHECKING PARTNER:');
    const partner = await db.collection('partners').findOne(
      { _id: ObjectId.createFromHexString(SIHF_PARTNER_ID) },
      { projection: { name: 1, reportTemplateId: 1 } }
    );
    console.log(JSON.stringify(partner, null, 2));
    console.log();
    
    // 2. Check report template (if exists)
    if (partner?.reportTemplateId) {
      console.log('📄 CHECKING REPORT TEMPLATE:');
      const reportTemplateId = typeof partner.reportTemplateId === 'object' 
        ? partner.reportTemplateId 
        : ObjectId.createFromHexString(partner.reportTemplateId);
      
      const report = await db.collection('reports_v12').findOne(
        { _id: reportTemplateId },
        { projection: { type: 1, styleId: 1, name: 1 } }
      );
      console.log(JSON.stringify(report, null, 2));
      console.log();
      
      // 3. Check style (if exists)
      if (report?.styleId) {
        console.log('🎨 CHECKING STYLE:');
        const styleId = typeof report.styleId === 'object'
          ? report.styleId
          : ObjectId.createFromHexString(report.styleId);
        
        const style = await db.collection('page_styles_enhanced').findOne(
          { _id: styleId },
          { projection: { name: 1, 'typography.headingColor': 1, 'chartColors.kpiIconColor': 1 } }
        );
        console.log(JSON.stringify(style, null, 2));
        console.log();
      } else {
        console.log('❌ Report has NO styleId!');
      }
    } else {
      console.log('❌ Partner has NO reportTemplateId!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkSIHFReport();
