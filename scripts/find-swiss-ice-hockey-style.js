#!/usr/bin/env node

// WHAT: Find Swiss Ice Hockey style in database
// WHY: Debug color issues with the style
// HOW: Query page_styles_enhanced collection

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function findSwissIceHockeyStyle() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment');
    console.error('   Make sure .env.local exists with MONGODB_URI');
    process.exit(1);
  }

  console.log('🔍 Connecting to MongoDB...\n');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('messmass');
    const collection = db.collection('page_styles_enhanced');
    
    // Search for styles with "Swiss" or "Ice" in the name
    const styles = await collection.find({
      name: { $regex: /swiss|ice|sihf/i }
    }).toArray();
    
    console.log(`📊 Found ${styles.length} matching style(s):\n`);
    
    if (styles.length === 0) {
      console.log('❌ No Swiss Ice Hockey style found');
      console.log('\n💡 Available styles:');
      const allStyles = await collection.find({}).project({ name: 1, _id: 1 }).toArray();
      allStyles.forEach(s => {
        console.log(`   - ${s.name} (ID: ${s._id})`);
      });
    } else {
      styles.forEach((style, idx) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Style ${idx + 1}: ${style.name}`);
        console.log(`${'='.repeat(60)}`);
        console.log(`ID: ${style._id}`);
        console.log(`Is Global Default: ${style.isGlobalDefault || false}`);
        console.log(`Description: ${style.description || 'N/A'}`);
        
        console.log('\n🎨 COLOR SCHEME:');
        if (style.colorScheme) {
          console.log(`   Primary:   ${style.colorScheme.primary || 'NOT SET'}`);
          console.log(`   Secondary: ${style.colorScheme.secondary || 'NOT SET'}`);
          console.log(`   Success:   ${style.colorScheme.success || 'NOT SET'}`);
          console.log(`   Warning:   ${style.colorScheme.warning || 'NOT SET'}`);
          console.log(`   Error:     ${style.colorScheme.error || 'NOT SET'}`);
        } else {
          console.log('   ❌ colorScheme not set!');
        }
        
        console.log('\n🖼️  HERO BACKGROUND:');
        if (style.heroBackground) {
          console.log(`   Type: ${style.heroBackground.type}`);
          if (style.heroBackground.type === 'solid') {
            console.log(`   Color: ${style.heroBackground.solidColor || 'NOT SET'}`);
          } else {
            console.log(`   Angle: ${style.heroBackground.gradientAngle}°`);
            if (style.heroBackground.gradientStops) {
              style.heroBackground.gradientStops.forEach((stop, i) => {
                console.log(`   Stop ${i + 1}: ${stop.color} at ${stop.position}%`);
              });
            }
          }
        } else {
          console.log('   ❌ heroBackground not set!');
        }
        
        console.log('\n✍️  TYPOGRAPHY:');
        if (style.typography) {
          console.log(`   Font Family:      ${style.typography.fontFamily || 'NOT SET'}`);
          console.log(`   Primary Text:     ${style.typography.primaryTextColor || 'NOT SET'}`);
          console.log(`   Secondary Text:   ${style.typography.secondaryTextColor || 'NOT SET'}`);
          console.log(`   Heading Color:    ${style.typography.headingColor || 'NOT SET'}`);
        } else {
          console.log('   ❌ typography not set!');
        }
        
        console.log('\n📦 CHART COLORS:');
        if (style.chartColors) {
          console.log(`   ✅ Chart colors ARE configured`);
          console.log(`   Chart Background:  ${style.chartColors.chartBackground}`);
          console.log(`   Chart Title:       ${style.chartColors.chartTitleColor}`);
          console.log(`   Chart Label:       ${style.chartColors.chartLabelColor}`);
          console.log(`   Chart Value:       ${style.chartColors.chartValueColor}`);
        } else {
          console.log('   ⚠️  Chart colors NOT configured (will use defaults)');
        }
        
        console.log('\n📝 METADATA:');
        console.log(`   Created: ${style.createdAt || 'N/A'}`);
        console.log(`   Updated: ${style.updatedAt || 'N/A'}`);
        console.log(`   Created By: ${style.createdBy || 'N/A'}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Query complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

findSwissIceHockeyStyle()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
