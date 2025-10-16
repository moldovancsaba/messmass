// scripts/parameterize-value-chart.js
// WHAT: Replace hardcoded constants in value chart formulas with [PARAM:x] tokens
// WHY: Enable marketing team to adjust CPM/ratio values without code changes

const { MongoClient } = require('mongodb');
const config = require('./config');

const MONGODB_URI = config.mongodbUri;
const DATABASE_NAME = config.dbName;
const COLLECTION_NAME = 'chartConfigurations';

function nowIso() { return new Date().toISOString(); }

async function main() {
  let client;
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const col = db.collection(COLLECTION_NAME);

    console.log('\n▶ Updating "value" chart with parameterized formulas');

    // Find the value chart
    const valueChart = await col.findOne({ chartId: 'value' });
    if (!valueChart) {
      console.error('❌ Value chart not found!');
      process.exit(1);
    }

    console.log(`\nCurrent value chart has ${valueChart.elements.length} elements`);

    // Update each element with parameters
    const updatedElements = [
      // Element 0: Marketing Opt-in Users
      {
        id: 'marketing-optin',
        label: 'Marketing Opt-in Users',
        formula: '([SEYUREMOTEIMAGES] + [SEYUHOSTESSIMAGES] + [SEYUSELFIES]) * [PARAM:cpmEmailOptin]',
        color: '#3b82f6',
        description: 'Every image corresponds to a GDPR-compliant opt-in fan. Each contact has measurable acquisition cost in digital marketing.',
        parameters: {
          cpmEmailOptin: {
            value: 4.87,
            label: 'Email Opt-in CPM',
            unit: 'EUR',
            description: '€4.87 avg market cost per email opt-in in Europe, 2025'
          }
        }
      },
      // Element 1: Value Proposition Emails
      {
        id: 'value-prop-emails',
        label: 'Value Proposition Emails',
        formula: '([SEYUREMOTEIMAGES] + [SEYUHOSTESSIMAGES] + [SEYUSELFIES]) * [PARAM:cpmEmailAddon]',
        color: '#10b981',
        description: 'Every email delivered includes branded fan photo plus sponsor offer. Add-on ad space valued at €1.07 avg CPM email value add per send.',
        parameters: {
          cpmEmailAddon: {
            value: 1.07,
            label: 'Email Add-on CPM',
            unit: 'EUR',
            description: '€1.07 avg CPM email value add per send'
          }
        }
      },
      // Element 2: Ads on Giant Screen
      {
        id: 'giant-screen-ads',
        label: 'Ads on Giant Screen',
        formula: '([SEYUATTENDEES] / 1000) * [PARAM:cpmStadiumAd] * [PARAM:exposureRatio] * ([SEYUREMOTEIMAGES] + [SEYUHOSTESSIMAGES] + [SEYUSELFIES])',
        color: '#f59e0b',
        description: 'Fans + brands shown on stadium big screen = in-stadium advertising equivalent. Stadium advertising CPM ≈ €6.00 per 1,000 attendees per 30s slot. 6s exposure = 0.2 of CPM.',
        parameters: {
          cpmStadiumAd: {
            value: 6,
            label: 'Stadium Ad CPM',
            unit: 'EUR',
            description: '€6.00 per 1,000 attendees per 30s slot'
          },
          exposureRatio: {
            value: 0.2,
            label: 'Exposure Ratio',
            unit: 'multiplier',
            description: '6s exposure = 0.2 of 30s CPM'
          }
        }
      },
      // Element 3: Under-40 Engagement
      {
        id: 'under40-engagement',
        label: 'Under-40 Engagement',
        formula: '([SEYUGENALPHA] + [SEYUGENYZ]) * [PARAM:premiumContactValue]',
        color: '#8b5cf6',
        description: '80% of engaged fans are under 40 - critical target for most brands. Each identified contact carries premium value.',
        parameters: {
          premiumContactValue: {
            value: 2.14,
            label: 'Premium Contact Value',
            unit: 'EUR',
            description: '€2.14 avg value of youth contact vs older groups'
          }
        }
      },
      // Element 4: Brand Awareness Boost
      {
        id: 'brand-awareness',
        label: 'Brand Awareness Boost',
        formula: '[PARAM:sharedImages] * [PARAM:avgViews] * [PARAM:cpmSocialOrganic]',
        color: '#ef4444',
        description: 'Organic shares amplify brand presence into social feeds. Benchmarked to social organic impressions CPM.',
        parameters: {
          sharedImages: {
            value: 200,
            label: 'Shared Images',
            unit: 'count',
            description: 'Estimated number of shared images'
          },
          avgViews: {
            value: 300,
            label: 'Avg Views per Share',
            unit: 'count',
            description: 'Average views per shared image'
          },
          cpmSocialOrganic: {
            value: 0.0145,
            label: 'Social Organic CPM',
            unit: 'EUR',
            description: '€14.50 CPM / 1000 = €0.0145 per impression'
          }
        }
      }
    ];

    // Update the chart
    const result = await col.updateOne(
      { chartId: 'value' },
      {
        $set: {
          elements: updatedElements,
          updatedAt: nowIso()
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Value chart parameterized successfully');
      console.log(`\nParameters added:`);
      updatedElements.forEach((elem, idx) => {
        console.log(`\n  Element ${idx + 1}: ${elem.label}`);
        console.log(`  Formula: ${elem.formula}`);
        if (elem.parameters) {
          Object.entries(elem.parameters).forEach(([key, param]) => {
            console.log(`    - [PARAM:${key}] = ${param.value} ${param.unit} (${param.label})`);
          });
        }
      });
    } else {
      console.log('⚠️  No changes made (chart may already be parameterized)');
    }

  } catch (err) {
    console.error('❌ Error parameterizing value chart:', err);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✅ Database connection closed');
    }
  }
}

main();
