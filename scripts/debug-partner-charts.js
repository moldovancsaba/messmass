// Debug script to test partner report chart calculation
// Run with: node scripts/debug-partner-charts.js

const { MongoClient, ObjectId } = require('mongodb');

async function debugPartnerCharts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    // Test with SIHF partner
    const partnerId = '903f80ab-e105-4aaa-8c42-2caf71a46954';
    
    console.log('🔍 Testing partner report chart calculation...');
    console.log('Partner ID:', partnerId);
    
    // 1. Fetch partner
    const partner = await db.collection('partners').findOne({ viewSlug: partnerId });
    if (!partner) {
      console.error('❌ Partner not found');
      return;
    }
    
    console.log('✅ Partner found:', partner.name);
    console.log('Partner styleId:', partner.styleId);
    console.log('Partner reportTemplateId:', partner.reportTemplateId);
    
    // 2. Fetch partner events
    const partnerObjectId = new ObjectId(partner._id);
    const events = await db.collection('projects').find({
      $or: [
        { partner1: partnerObjectId },
        { partner2: partnerObjectId },
        { partner1Id: partnerObjectId },
        { partner2Id: partnerObjectId }
      ]
    }).toArray();
    
    console.log(`✅ Found ${events.length} events for partner`);
    
    // 3. Calculate aggregate stats
    const aggregateStats = {
      remoteImages: 0,
      hostessImages: 0,
      selfies: 0,
      remoteFans: 0,
      stadium: 0,
      indoor: 0,
      outdoor: 0,
      female: 0,
      male: 0,
      genAlpha: 0,
      genYZ: 0,
      genX: 0,
      boomer: 0,
      merched: 0,
      jersey: 0,
      scarf: 0,
      flags: 0,
      baseballCap: 0,
      other: 0,
      eventAttendees: 0,
      eventTicketPurchases: 0,
      visitQrCode: 0,
      visitShortUrl: 0,
      visitWeb: 0,
      visitFacebook: 0,
      visitInstagram: 0,
      visitYoutube: 0,
      visitTiktok: 0,
      visitX: 0,
      visitTrustpilot: 0,
      eventResultHome: 0,
      eventResultVisitor: 0,
      eventValuePropositionVisited: 0,
      eventValuePropositionPurchases: 0,
      approvedImages: 0,
      rejectedImages: 0
    };
    
    // Sum all stats across events
    events.forEach(event => {
      if (event.stats) {
        Object.keys(event.stats).forEach(key => {
          const value = event.stats[key];
          if (typeof value === 'number') {
            aggregateStats[key] = (aggregateStats[key] || 0) + value;
          }
        });
      }
    });
    
    console.log('📊 Aggregate stats calculated:');
    console.log('Total Images:', aggregateStats.remoteImages + aggregateStats.hostessImages + aggregateStats.selfies);
    console.log('Total Fans:', aggregateStats.female + aggregateStats.male);
    console.log('Total Merch:', aggregateStats.merched);
    console.log('Event Attendees:', aggregateStats.eventAttendees);
    
    // 4. Fetch chart configurations
    const chartConfigs = await db.collection('chart_configurations').find({ isActive: true }).toArray();
    console.log(`✅ Found ${chartConfigs.length} active chart configurations`);
    
    // 5. Test chart calculation (simulate what happens in frontend)
    console.log('\n🧮 Testing chart calculations...');
    
    chartConfigs.slice(0, 3).forEach(config => {
      console.log(`\nChart: ${config.title} (${config.type})`);
      console.log('Elements:', config.elements?.length || 0);
      
      if (config.elements && config.elements.length > 0) {
        config.elements.forEach(element => {
          console.log(`  - ${element.label}: ${element.formula}`);
          
          // Simple formula evaluation test
          if (element.formula) {
            // Test basic field access
            const fieldMatch = element.formula.match(/\[([a-zA-Z0-9]+)\]/);
            if (fieldMatch) {
              const fieldName = fieldMatch[1];
              const camelFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
              const value = aggregateStats[camelFieldName];
              console.log(`    → Field ${camelFieldName}: ${value}`);
            }
          }
        });
      }
    });
    
    // 6. Check report template
    console.log('\n📋 Checking report template...');
    
    let templateId = partner.reportTemplateId;
    if (!templateId) {
      // Try to find default template
      const defaultTemplate = await db.collection('report_templates').findOne({ isDefault: true });
      if (defaultTemplate) {
        templateId = defaultTemplate._id;
        console.log('Using default template:', defaultTemplate.name);
      }
    } else {
      const template = await db.collection('report_templates').findOne({ _id: new ObjectId(templateId) });
      if (template) {
        console.log('Using partner template:', template.name);
      }
    }
    
    if (templateId) {
      const template = await db.collection('report_templates').findOne({ _id: new ObjectId(templateId) });
      if (template && template.dataBlocks) {
        console.log(`Template has ${template.dataBlocks.length} data blocks`);
        
        // Check data blocks
        for (const blockRef of template.dataBlocks) {
          const block = await db.collection('data_blocks').findOne({ _id: new ObjectId(blockRef.blockId) });
          if (block) {
            console.log(`  Block: ${block.name} (${block.charts?.length || 0} charts)`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

debugPartnerCharts().catch(console.error);