// scripts/add-vent-variables-and-charts.js
// WHAT: Add unique users variable, vent.* variables, and Marketing Opt-in % chart
// WHY: Enable manual tracking of vent campaign metrics and marketing opt-in percentage
// HOW: Add variables to variables_metadata, create KPI chart for opt-in percentage

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function addVentVariablesAndCharts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const variablesCollection = db.collection('variables_metadata');
    const chartsCollection = db.collection('chart_configurations');
    
    const now = new Date().toISOString();
    
    // ==========================================
    // STEP 1: Add Unique Users variable
    // ==========================================
    console.log('\n📊 Step 1: Adding Unique Users variable...');
    
    const uniqueUsersVar = {
      name: 'stats.uniqueUsers',
      label: 'Unique Users',
      type: 'count',
      category: 'Marketing',
      description: 'Total number of unique users who interacted with the event',
      unit: 'users',
      derived: false,
      flags: {
        visibleInClicker: true,  // Visible in clicker for manual editing
        editableInManual: true   // Can be edited manually
      },
      isSystem: false,  // Custom variable, not schema field
      order: 100,
      createdAt: now,
      updatedAt: now
    };
    
    const uniqueUsersResult = await variablesCollection.updateOne(
      { name: 'stats.uniqueUsers' },
      { $set: uniqueUsersVar },
      { upsert: true }
    );
    
    if (uniqueUsersResult.upsertedCount > 0) {
      console.log('  ✅ Created: Unique Users');
    } else {
      console.log('  ℹ️  Updated: Unique Users');
    }
    
    // ==========================================
    // STEP 2: Add vent.* variables (aligned with bitly structure)
    // ==========================================
    console.log('\n📊 Step 2: Adding vent.* variables...');
    
    // WHAT: vent.* variables mimic bitly variables but for manual campaign tracking
    // WHY: Track campaign performance from different sources manually
    const ventVariables = [
      {
        name: 'stats.ventFacebook',
        label: 'Vent: Facebook',
        description: 'Manual count of visitors from Facebook campaign',
        unit: 'visitors'
      },
      {
        name: 'stats.ventInstagram',
        label: 'Vent: Instagram',
        description: 'Manual count of visitors from Instagram campaign',
        unit: 'visitors'
      },
      {
        name: 'stats.ventGoogle',
        label: 'Vent: Google',
        description: 'Manual count of visitors from Google campaign',
        unit: 'visitors'
      },
      {
        name: 'stats.ventQr',
        label: 'Vent: QR Code',
        description: 'Manual count of visitors from QR code scans',
        unit: 'visitors'
      },
      {
        name: 'stats.ventUrl',
        label: 'Vent: Direct URL',
        description: 'Manual count of visitors from direct URL access',
        unit: 'visitors'
      },
      {
        name: 'stats.ventIos',
        label: 'Vent: iOS',
        description: 'Manual count of visitors from iOS devices',
        unit: 'visitors'
      },
      {
        name: 'stats.ventAndroid',
        label: 'Vent: Android',
        description: 'Manual count of visitors from Android devices',
        unit: 'visitors'
      },
      {
        name: 'stats.ventCtaPopup',
        label: 'Vent: CTA Popup',
        description: 'Manual count of interactions with CTA popup',
        unit: 'interactions'
      },
      {
        name: 'stats.ventCtaEmail',
        label: 'Vent: CTA Email',
        description: 'Manual count of email CTA click-throughs',
        unit: 'clicks'
      }
    ];
    
    let ventCreatedCount = 0;
    let ventUpdatedCount = 0;
    
    for (const ventVar of ventVariables) {
      const fullVentVar = {
        ...ventVar,
        type: 'count',
        category: 'Vent Campaign',
        derived: false,
        flags: {
          visibleInClicker: true,  // Visible in clicker for manual editing
          editableInManual: true   // Can be edited manually
        },
        isSystem: false,
        order: 200,
        createdAt: now,
        updatedAt: now
      };
      
      const result = await variablesCollection.updateOne(
        { name: ventVar.name },
        { $set: fullVentVar },
        { upsert: true }
      );
      
      if (result.upsertedCount > 0) {
        console.log(`  ✅ Created: ${ventVar.label}`);
        ventCreatedCount++;
      } else {
        console.log(`  ℹ️  Updated: ${ventVar.label}`);
        ventUpdatedCount++;
      }
    }
    
    console.log(`\n📈 Vent Variables Summary: ${ventCreatedCount} created, ${ventUpdatedCount} updated`);
    
    // ==========================================
    // STEP 3: Create Marketing Opt-in % KPI chart
    // ==========================================
    console.log('\n📊 Step 3: Creating Marketing Opt-in % chart...');
    
    // WHAT: Check if chart already exists
    const existingChart = await chartsCollection.findOne({ chartId: 'marketing-opt-in-percentage' });
    
    if (existingChart) {
      console.log('  ℹ️  Chart already exists: Marketing Opt-in %');
      console.log('  💡 To update the chart, please use the Chart Algorithm Manager in admin UI');
    } else {
      const marketingOptInChart = {
        chartId: 'marketing-opt-in-percentage',
        title: 'Marketing Opt-in %',
        type: 'kpi',
        order: 50,  // Display order in charts
        isActive: true,
        emoji: '📧',
        subtitle: 'Percentage of unique users who opted in to marketing',
        elements: [
          {
            id: 'opt-in-percentage',
            label: 'Opt-in Rate',
            // WHAT: Formula calculates percentage of unique users who opted in
            // WHY: Shows conversion rate from visitors to marketing subscribers
            // HOW: (eventValuePropositionPurchases / uniqueUsers) * 100
            formula: '([STATS.EVENTVALUEPROPOSITIONPURCHASES] / [STATS.UNIQUEUSERS]) * 100',
            color: '#10b981',
            type: 'percentage',
            description: 'Percentage of unique users who opted in to marketing communications'
          }
        ],
        createdAt: now,
        updatedAt: now
      };
      
      await chartsCollection.insertOne(marketingOptInChart);
      console.log('  ✅ Created: Marketing Opt-in % KPI chart');
      console.log('     Formula: (eventValuePropositionPurchases / uniqueUsers) * 100');
      console.log('     Type: KPI with percentage formatting');
    }
    
    // ==========================================
    // Summary
    // ==========================================
    console.log('\n✅ Setup Complete!');
    console.log('\n📋 Summary:');
    console.log('   • Unique Users variable: Ready for clicker');
    console.log(`   • Vent variables: ${ventCreatedCount + ventUpdatedCount} variables added`);
    console.log('   • Marketing Opt-in % chart: KPI chart created');
    console.log('\n📖 Next Steps:');
    console.log('   1. Go to /admin/charts to verify the chart appears');
    console.log('   2. Go to /edit/[slug] to see the clicker with new variables');
    console.log('   3. Go to /admin/variables to manage variable settings');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run setup
addVentVariablesAndCharts();
