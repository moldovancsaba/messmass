// WHAT: Assign styleId to reports with matching custom styles
// WHY: Reports need styleId to apply custom branding/themes
// HOW: Match report names with style names and set styleId

import clientPromise from '../lib/mongodb';
import config from '../lib/config';
import { ObjectId } from 'mongodb';

async function assignReportStyles() {
  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);

    console.log('🎨 Assigning styleId to reports...\n');

    // Fetch all styles
    const styles = await db.collection('page_styles_enhanced').find({}).toArray();
    
    const styleMap = new Map(
      styles.map(s => [s.name.toLowerCase(), s._id])
    );

    console.log(`📋 Available styles: ${styles.map(s => s.name).join(', ')}\n`);

    // Fetch all reports
    const reports = await db.collection('reports').find({}).toArray();

    let updatedCount = 0;

    for (const report of reports) {
      // Match report name with style name
      const reportNameLower = report.name.toLowerCase();
      
      let matchedStyleId = null;
      
      // Try exact match first
      if (styleMap.has(reportNameLower)) {
        matchedStyleId = styleMap.get(reportNameLower);
      } else {
        // Try partial match
        for (const [styleName, styleId] of styleMap.entries()) {
          if (reportNameLower.includes(styleName) || styleName.includes(reportNameLower.split(' ')[0])) {
            matchedStyleId = styleId;
            break;
          }
        }
      }

      if (matchedStyleId) {
        const matchedStyle = styles.find(s => s._id.toString() === matchedStyleId.toString());
        console.log(`✅ Assigning "${matchedStyle.name}" style to "${report.name}" report`);
        
        await db.collection('reports').updateOne(
          { _id: report._id },
          { 
            $set: { 
              styleId: matchedStyleId,
              updatedAt: new Date().toISOString()
            } 
          }
        );
        
        updatedCount++;
      } else {
        console.log(`⏭️  No matching style for "${report.name}"`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} reports with styleId`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignReportStyles();
