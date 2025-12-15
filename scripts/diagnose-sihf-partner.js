#!/usr/bin/env node

// scripts/diagnose-sihf-partner.js
// WHAT: Diagnose SIHF partner report specifically
// WHY: SIHF partner report shows no charts despite having custom template
// HOW: Check partner, template, blocks, and chart configurations

const { MongoClient, ObjectId } = require('mongodb');

// Load configuration
require('dotenv').config({ path: '.env.local' });
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function diagnoseSihfPartner() {
  console.log('🔍 Diagnosing SIHF partner report...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    
    // 1. Find SIHF partner
    console.log('\n👥 SIHF Partner Details:');
    const sihfPartner = await db.collection('partners').findOne({ 
      name: { $regex: /SIHF|Swiss Ice Hockey/i } 
    });
    
    if (!sihfPartner) {
      console.log('❌ SIHF partner not found');
      return;
    }
    
    console.log(`Partner: ${sihfPartner.name}`);
    console.log(`ID: ${sihfPartner._id}`);
    console.log(`View Slug: ${sihfPartner.viewSlug}`);
    console.log(`Template ID: ${sihfPartner.reportTemplateId}`);
    console.log(`Style ID: ${sihfPartner.styleId || 'None'}`);
    
    // 2. Check partner's template
    if (sihfPartner.reportTemplateId) {
      console.log('\n📋 SIHF Template Details:');
      const template = await db.collection('report_templates').findOne({ 
        _id: sihfPartner.reportTemplateId 
      });
      
      if (template) {
        console.log(`Template: ${template.name}`);
        console.log(`Type: ${template.type}`);
        console.log(`Default: ${template.isDefault}`);
        console.log(`Blocks: ${template.dataBlocks?.length || 0}`);
        
        if (template.dataBlocks && template.dataBlocks.length > 0) {
          console.log('\nTemplate Block References:');
          for (let i = 0; i < template.dataBlocks.length; i++) {
            const blockRef = template.dataBlocks[i];
            console.log(`  ${i + 1}. Block ID: ${blockRef.blockId}, Order: ${blockRef.order}`);
          }
          
          // 3. Check actual data blocks
          console.log('\n📦 Actual Data Blocks:');
          for (const blockRef of template.dataBlocks) {
            const block = await db.collection('data_blocks').findOne({ 
              _id: typeof blockRef.blockId === 'string' ? new ObjectId(blockRef.blockId) : blockRef.blockId 
            });
            
            if (block) {
              console.log(`\n  📦 Block: ${block.name}`);
              console.log(`     Type: ${block.type}`);
              console.log(`     Charts: ${block.charts?.length || 0}`);
              
              if (block.charts && block.charts.length > 0) {
                console.log('     Chart IDs:');
                for (const chart of block.charts) {
                  console.log(`       - ${chart.chartId} (order: ${chart.order})`);
                }
                
                // 4. Check if these charts exist and are active
                console.log('\n     Chart Status:');
                for (const chart of block.charts) {
                  const chartConfig = await db.collection('chart_configurations').findOne({ 
                    chartId: chart.chartId 
                  });
                  
                  if (chartConfig) {
                    console.log(`       ✅ ${chart.chartId}: ${chartConfig.title} (active: ${chartConfig.isActive})`);
                    
                    // Check elements
                    if (chartConfig.elements && chartConfig.elements.length > 0) {
                      console.log(`          Elements: ${chartConfig.elements.length}`);
                      for (let i = 0; i < chartConfig.elements.length; i++) {
                        const element = chartConfig.elements[i];
                        console.log(`            ${i + 1}. ${element.label || 'No label'} - ${element.formula || 'No formula'}`);
                      }
                    } else {
                      console.log(`          ❌ No elements found`);
                    }
                  } else {
                    console.log(`       ❌ ${chart.chartId}: Chart configuration not found`);
                  }
                }
              } else {
                console.log('     ❌ No charts in this block');
              }
            } else {
              console.log(`\n  ❌ Block not found: ${blockRef.blockId}`);
            }
          }
        } else {
          console.log('❌ Template has no data blocks');
        }
      } else {
        console.log('❌ Template not found');
      }
    } else {
      console.log('\n⚠️  Partner has no template ID');
    }
    
    // 5. Check SIHF events for aggregate stats
    console.log('\n📊 SIHF Events:');
    const sihfEvents = await db.collection('projects').find({ 
      partner1: sihfPartner._id 
    }).toArray();
    
    console.log(`Found ${sihfEvents.length} events for SIHF`);
    
    if (sihfEvents.length > 0) {
      console.log('\nEvent Stats Summary:');
      let totalImages = 0;
      let totalFans = 0;
      let totalAttendees = 0;
      
      for (const event of sihfEvents) {
        const stats = event.stats || {};
        const eventImages = (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0);
        const eventFans = (stats.remoteFans || stats.indoor + stats.outdoor || 0) + (stats.stadium || 0);
        const eventAttendees = stats.eventAttendees || 0;
        
        totalImages += eventImages;
        totalFans += eventFans;
        totalAttendees += eventAttendees;
        
        console.log(`  ${event.eventName}: ${eventImages} images, ${eventFans} fans, ${eventAttendees} attendees`);
      }
      
      console.log(`\nAggregate Totals:`);
      console.log(`  Total Images: ${totalImages}`);
      console.log(`  Total Fans: ${totalFans}`);
      console.log(`  Total Attendees: ${totalAttendees}`);
    }
    
  } catch (error) {
    console.error('❌ Error diagnosing SIHF partner:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the diagnosis
diagnoseSihfPartner().catch(console.error);