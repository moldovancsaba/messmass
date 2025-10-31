/**
 * Seed Script: Default VALUE Chart Templates
 * 
 * WHAT: Creates professional default VALUE chart configurations ready for use
 *       in Chart Algorithm Manager and Visualization Manager.
 * 
 * WHY: Provide starting templates for common financial dashboard scenarios,
 *      accelerating chart creation and ensuring consistency.
 * 
 * TEMPLATES CREATED:
 * 1. Total Ad Value (€) - Marketing ROI breakdown
 * 2. Revenue Streams (€) - Merchandise and ticket revenue
 * 3. Fan Engagement Score (pts) - Multi-factor engagement metrics
 * 4. Geographic Reach (count) - Regional distribution
 * 5. Partnership Value ($) - Multi-currency partnership metrics
 * 
 * FEATURES:
 * - All templates use VALUE chart type with dual formatting
 * - Real formulas using SEYU tokens and PARAM tokens
 * - Professional color schemes
 * - Descriptive labels and metadata
 * - Ready for parameterization
 * 
 * SAFETY:
 * - Checks for existing charts before creating (no duplicates)
 * - Uses upsert pattern (idempotent)
 * - Assigns sequential order numbers
 * 
 * USAGE:
 * npm run seed:value-charts
 */

import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

interface ValueChartTemplate {
  chartId: string;
  title: string;
  type: 'value';
  emoji: string;
  description: string;
  kpiFormatting: {
    rounded: boolean;
    prefix: string;
    suffix: string;
  };
  barFormatting: {
    rounded: boolean;
    prefix: string;
    suffix: string;
  };
  elements: Array<{
    id: string;
    label: string;
    formula: string;
    color: string;
    description?: string;
    parameters?: Record<string, {
      value: number;
      label: string;
      description: string;
      unit?: string;
    }>;
  }>;
  order: number;
  active: boolean;
  category: string;
}

const VALUE_CHART_TEMPLATES: ValueChartTemplate[] = [
  {
    chartId: 'total-ad-value-euro',
    title: 'Total Ad Value',
    type: 'value',
    emoji: '💰',
    description: 'Marketing ROI breakdown across email, social, stadium, and premium channels',
    kpiFormatting: {
      rounded: true,
      prefix: '€',
      suffix: '',
    },
    barFormatting: {
      rounded: true,
      prefix: '€',
      suffix: '',
    },
    elements: [
      {
        id: 'email-value',
        label: 'Email',
        formula: '([SEYUREMOTEIMAGES] + [SEYUHOSTESSIMAGES] + [SEYUSELFIES]) * [PARAM:cpmEmailOptin]',
        color: '#3b82f6',
        description: 'Email opt-in value based on total images captured',
        parameters: {
          cpmEmailOptin: {
            value: 4.87,
            label: 'Email Opt-in CPM',
            description: '€4.87 avg market cost per email opt-in in Europe, 2025',
            unit: 'EUR',
          },
        },
      },
      {
        id: 'social-value',
        label: 'Social',
        formula: '([SEYUREMOTEIMAGES] + [SEYUHOSTESSIMAGES] + [SEYUSELFIES]) * [PARAM:exposureRatio] * [PARAM:sharedImages] * [PARAM:avgViews] * [PARAM:cpmSocialOrganic] / 1000',
        color: '#8b5cf6',
        description: 'Social media organic reach value',
        parameters: {
          exposureRatio: {
            value: 0.35,
            label: 'Exposure Ratio',
            description: 'Percentage of images shared on social media',
            unit: 'multiplier',
          },
          sharedImages: {
            value: 20,
            label: 'Shared Images',
            description: 'Average number of times each image is shared',
            unit: 'count',
          },
          avgViews: {
            value: 300,
            label: 'Avg Views per Share',
            description: 'Average views per social media share',
            unit: 'count',
          },
          cpmSocialOrganic: {
            value: 14.5,
            label: 'Social Organic CPM',
            description: '€14.50 CPM for organic social media impressions',
            unit: 'EUR',
          },
        },
      },
      {
        id: 'stadium-value',
        label: 'Stadium',
        formula: '[SEYUSTADIUMFANS] * [PARAM:cpmStadiumAd]',
        color: '#10b981',
        description: 'In-stadium advertising exposure value',
        parameters: {
          cpmStadiumAd: {
            value: 6.0,
            label: 'Stadium Ad CPM',
            description: '€6.00 CPM for in-stadium ad exposure',
            unit: 'EUR',
          },
        },
      },
      {
        id: 'premium-value',
        label: 'Premium',
        formula: '([SEYUGENALPHAFANS] + [SEYUGENYZFANS]) * [PARAM:premiumContactValue]',
        color: '#f59e0b',
        description: 'Premium youth demographic contact value',
        parameters: {
          premiumContactValue: {
            value: 2.14,
            label: 'Premium Contact Value',
            description: '€2.14 premium per Gen Alpha/YZ contact',
            unit: 'EUR',
          },
        },
      },
      {
        id: 'reoptin-value',
        label: 'Re-optin',
        formula: '([SEYUREMOTEIMAGES] + [SEYUHOSTESSIMAGES] + [SEYUSELFIES]) * [PARAM:exposureRatio] * [PARAM:cpmEmailAddon]',
        color: '#ec4899',
        description: 'Additional email re-engagement value',
        parameters: {
          exposureRatio: {
            value: 0.35,
            label: 'Email Open Rate',
            description: '35% average email open rate',
            unit: 'multiplier',
          },
          cpmEmailAddon: {
            value: 1.07,
            label: 'Email Addon CPM',
            description: '€1.07 CPM for additional email opens',
            unit: 'EUR',
          },
        },
      },
    ],
    order: 100,
    active: true,
    category: 'financial',
  },
  {
    chartId: 'revenue-streams-euro',
    title: 'Revenue Streams',
    type: 'value',
    emoji: '💵',
    description: 'Total revenue breakdown: merchandise, tickets, and partnerships',
    kpiFormatting: {
      rounded: true,
      prefix: '€',
      suffix: '',
    },
    barFormatting: {
      rounded: true,
      prefix: '€',
      suffix: '',
    },
    elements: [
      {
        id: 'merch-revenue',
        label: 'Merchandise',
        formula: '[SEYUMERCHEDFANS] * 30',
        color: '#3b82f6',
        description: 'Merchandise revenue (€30 avg per fan)',
      },
      {
        id: 'ticket-revenue',
        label: 'Tickets',
        formula: '[SEYUATTENDEES] * 25',
        color: '#10b981',
        description: 'Ticket sales revenue (€25 avg per ticket)',
      },
      {
        id: 'food-beverage',
        label: 'Food & Beverage',
        formula: '[SEYUATTENDEES] * 15',
        color: '#f59e0b',
        description: 'Food and beverage revenue (€15 avg per attendee)',
      },
      {
        id: 'parking',
        label: 'Parking',
        formula: '[SEYUATTENDEES] * 0.4 * 10',
        color: '#8b5cf6',
        description: 'Parking revenue (40% drive, €10 per car)',
      },
      {
        id: 'sponsorship',
        label: 'Sponsorship',
        formula: '[SEYUTOTALFANS] * 2',
        color: '#ec4899',
        description: 'Sponsorship value (€2 per fan impression)',
      },
    ],
    order: 101,
    active: true,
    category: 'financial',
  },
  {
    chartId: 'fan-engagement-score',
    title: 'Fan Engagement Score',
    type: 'value',
    emoji: '⭐',
    description: 'Multi-factor fan engagement scoring system',
    kpiFormatting: {
      rounded: true,
      prefix: '',
      suffix: ' pts',
    },
    barFormatting: {
      rounded: true,
      prefix: '',
      suffix: ' pts',
    },
    elements: [
      {
        id: 'photo-engagement',
        label: 'Photo',
        formula: '([SEYUREMOTEIMAGES] + [SEYUHOSTESSIMAGES] + [SEYUSELFIES]) * 10',
        color: '#3b82f6',
        description: 'Photo capture engagement (10 pts per image)',
      },
      {
        id: 'merch-engagement',
        label: 'Merchandise',
        formula: '[SEYUMERCHEDFANS] * 50',
        color: '#10b981',
        description: 'Merchandise purchase engagement (50 pts per fan)',
      },
      {
        id: 'social-engagement',
        label: 'Social',
        formula: '[SEYUSOCIALVISIT] * 20',
        color: '#8b5cf6',
        description: 'Social media engagement (20 pts per visit)',
      },
      {
        id: 'repeat-engagement',
        label: 'Repeat',
        formula: '[SEYUQRCODEVISIT] * 30',
        color: '#f59e0b',
        description: 'Repeat visit engagement (30 pts per QR scan)',
      },
      {
        id: 'referral-engagement',
        label: 'Referral',
        formula: '[SEYUSHORTURLVISIT] * 25',
        color: '#ec4899',
        description: 'Referral engagement (25 pts per link click)',
      },
    ],
    order: 102,
    active: true,
    category: 'engagement',
  },
  {
    chartId: 'geographic-reach',
    title: 'Geographic Reach',
    type: 'value',
    emoji: '🌍',
    description: 'Fan distribution across geographic regions',
    kpiFormatting: {
      rounded: true,
      prefix: '',
      suffix: ' fans',
    },
    barFormatting: {
      rounded: true,
      prefix: '',
      suffix: ' fans',
    },
    elements: [
      {
        id: 'local-fans',
        label: 'Local',
        formula: '[SEYUSTADIUMFANS] * 0.6',
        color: '#3b82f6',
        description: 'Local city fans (60% of stadium attendance)',
      },
      {
        id: 'regional-fans',
        label: 'Regional',
        formula: '[SEYUSTADIUMFANS] * 0.25',
        color: '#10b981',
        description: 'Regional fans (25% of stadium attendance)',
      },
      {
        id: 'national-fans',
        label: 'National',
        formula: '[SEYUSTADIUMFANS] * 0.1',
        color: '#f59e0b',
        description: 'National fans (10% of stadium attendance)',
      },
      {
        id: 'international-fans',
        label: 'International',
        formula: '[SEYUSTADIUMFANS] * 0.05',
        color: '#8b5cf6',
        description: 'International fans (5% of stadium attendance)',
      },
      {
        id: 'remote-global',
        label: 'Remote Global',
        formula: '[SEYUREMOTEFANS]',
        color: '#ec4899',
        description: 'Remote fans engaging globally',
      },
    ],
    order: 103,
    active: true,
    category: 'demographics',
  },
  {
    chartId: 'partnership-value-usd',
    title: 'Partnership Value',
    type: 'value',
    emoji: '🤝',
    description: 'Multi-channel partnership value calculation (USD)',
    kpiFormatting: {
      rounded: true,
      prefix: '$',
      suffix: '',
    },
    barFormatting: {
      rounded: true,
      prefix: '$',
      suffix: '',
    },
    elements: [
      {
        id: 'brand-exposure',
        label: 'Brand Exposure',
        formula: '[SEYUTOTALFANS] * 1.5',
        color: '#3b82f6',
        description: 'Brand exposure value ($1.50 per fan)',
      },
      {
        id: 'digital-reach',
        label: 'Digital Reach',
        formula: '([SEYUREMOTEIMAGES] + [SEYUHOSTESSIMAGES] + [SEYUSELFIES]) * 3',
        color: '#10b981',
        description: 'Digital content reach value ($3 per image)',
      },
      {
        id: 'event-sponsorship',
        label: 'Event Sponsorship',
        formula: '[SEYUATTENDEES] * 2',
        color: '#f59e0b',
        description: 'Event-level sponsorship value ($2 per attendee)',
      },
      {
        id: 'merch-visibility',
        label: 'Merchandise Visibility',
        formula: '[SEYUMERCHEDFANS] * 5',
        color: '#8b5cf6',
        description: 'Branded merchandise visibility value ($5 per fan)',
      },
      {
        id: 'media-coverage',
        label: 'Media Coverage',
        formula: '[SEYUSOCIALVISIT] * 4',
        color: '#ec4899',
        description: 'Media and social coverage value ($4 per social visit)',
      },
    ],
    order: 104,
    active: true,
    category: 'financial',
  },
];

async function seedValueChartTemplates(): Promise<void> {
  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db: Db = client.db(MONGODB_DB);
    const chartsCollection = db.collection('chart_configurations');

    console.log(`\n📊 Seeding ${VALUE_CHART_TEMPLATES.length} VALUE chart templates...\n`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const template of VALUE_CHART_TEMPLATES) {
      const existing = await chartsCollection.findOne({ chartId: template.chartId });

      if (existing) {
        console.log(`⏭️  SKIPPED: ${template.title} (${template.chartId}) - Already exists`);
        skippedCount++;
      } else {
        await chartsCollection.insertOne({
          ...template,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log(`✅ CREATED: ${template.title} (${template.chartId})`);
        console.log(`   Emoji: ${template.emoji}`);
        console.log(`   KPI Format: ${template.kpiFormatting.prefix}X${template.kpiFormatting.suffix}`);
        console.log(`   Bar Format: ${template.barFormatting.prefix}X${template.barFormatting.suffix}`);
        console.log(`   Elements: ${template.elements.length}`);
        console.log(`   Category: ${template.category}\n`);
        createdCount++;
      }
    }

    console.log('='.repeat(60));
    console.log(`\n📈 SEED SUMMARY:`);
    console.log(`   Templates created: ${createdCount}`);
    console.log(`   Templates skipped: ${skippedCount}`);
    console.log(`\n✅ VALUE chart templates ready for use!`);
    console.log(`   Access at: /admin/charts\n`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

console.log('\n' + '='.repeat(60));
console.log('🌱 VALUE Chart Templates Seeder (v8.17.0)');
console.log('='.repeat(60));

seedValueChartTemplates()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
