/**
 * WHAT: Seed partner messmass.com, event messmass.com, clicker set messmass.com,
 *       KPI (ValueChain) chart configs, data block, template/style links, and event stats.
 * WHY: Drive the main landing page from report system (event data + style + charts).
 * HOW: Run with: npx tsx -r dotenv/config scripts/seed-messmass-landing.ts
 *
 * Prerequisites: You have already created report template "messmass.com" and style "messmass.com" in admin.
 * This script finds them by name and links everything; if missing, it creates minimal template/style.
 */

import { MongoClient, ObjectId } from 'mongodb';

const LANDING_EVENT_NAME = 'messmass.com';
const LANDING_PARTNER_NAME = 'messmass.com';
const LANDING_CLICKER_NAME = 'messmass.com';
const LANDING_TEMPLATE_NAME = 'messmass.com';
const LANDING_STYLE_NAME = 'messmass.com';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }
  const client = new MongoClient(uri);
  const dbName = process.env.MONGODB_DB || 'messmass';
  const db = client.db(dbName);

  try {
    await client.connect();
    const now = new Date().toISOString();

    // 1. Clicker set "messmass.com"
    const clickerSets = db.collection('clickerSets');
    let clickerSet = await clickerSets.findOne({ name: LANDING_CLICKER_NAME });
    if (!clickerSet) {
      const res = await clickerSets.insertOne({
        name: LANDING_CLICKER_NAME,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      });
      clickerSet = await clickerSets.findOne({ _id: res.insertedId });
      console.log('✅ Created clicker set:', LANDING_CLICKER_NAME);
    } else {
      console.log('✓ Clicker set exists:', LANDING_CLICKER_NAME);
    }
    const clickerSetId = (clickerSet as any)._id;

    // 2. Partner "messmass.com"
    const partners = db.collection('partners');
    const viewSlugPartner = LANDING_PARTNER_NAME.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
    let partner = await partners.findOne({ name: LANDING_PARTNER_NAME });
    if (!partner) {
      await partners.insertOne({
        name: LANDING_PARTNER_NAME,
        emoji: '🌐',
        hashtags: [],
        categorizedHashtags: {},
        viewSlug: viewSlugPartner,
        clickerSetId,
        createdAt: now,
        updatedAt: now,
      });
      partner = await partners.findOne({ name: LANDING_PARTNER_NAME });
      console.log('✅ Created partner:', LANDING_PARTNER_NAME);
    } else {
      await partners.updateOne(
        { _id: (partner as any)._id },
        { $set: { clickerSetId, updatedAt: now } }
      );
      console.log('✓ Partner exists, updated clickerSetId:', LANDING_PARTNER_NAME);
    }
    const partnerId = (partner as any)._id;

    // 3. Style "messmass.com" (report_styles)
    const reportStyles = db.collection('report_styles');
    let style = await reportStyles.findOne({ name: LANDING_STYLE_NAME });
    if (!style) {
      const defaultColors = {
        heroBackground: '#0f172aff',
        headingColor: '#f8fafcff',
        exportButtonBackground: '#3b82f6ff',
        exportButtonText: '#ffffffff',
        exportButtonHoverBackground: '#2563ebff',
        chartBackground: '#ffffffff',
        chartBorder: '#e2e8f0ff',
        chartTitleColor: '#1e293bff',
        chartLabelColor: '#64748bff',
        chartValueColor: '#0f172aff',
        textColor: '#334155ff',
        kpiIconColor: '#3b82f6ff',
        barColor1: '#3b82f6ff',
        barColor2: '#10b981ff',
        barColor3: '#f59e0bff',
        barColor4: '#8b5cf6ff',
        barColor5: '#ec4899ff',
        pieColor1: '#3b82f6ff',
        pieColor2: '#10b981ff',
        pieBorderColor: '#e2e8f0ff',
        chartNoDataBackground: '#f8fafcff',
        chartNoDataBorder: '#e2e8f0ff',
        chartNoDataText: '#64748bff',
        chartErrorBackground: '#fef2f2ff',
        chartErrorText: '#dc2626ff',
        chartTooltipBackground: '#1e293bff',
        chartTooltipText: '#f8fafcff',
      };
      const res = await reportStyles.insertOne({
        name: LANDING_STYLE_NAME,
        description: 'Landing page / messmass.com',
        ...defaultColors,
        createdAt: now,
        updatedAt: now,
      });
      style = await reportStyles.findOne({ _id: res.insertedId });
      console.log('✅ Created style:', LANDING_STYLE_NAME);
    } else {
      console.log('✓ Style exists:', LANDING_STYLE_NAME);
    }
    const styleId = (style as any)._id;

    // 4. Chart configurations: ValueChain (icon + 2 text fields) — Private, Actionable, Secure
    const chartConfigs = db.collection('chart_configurations');
    const valueChainCharts = [
      { chartId: 'kpi-valuechain-private', title: 'Private', icon: 'lock', textA: 'reportText1', textB: 'reportText2', color: '#3b82f6' },
      { chartId: 'kpi-valuechain-actionable', title: 'Actionable', icon: 'bolt', textA: 'reportText3', textB: 'reportText4', color: '#10b981' },
      { chartId: 'kpi-valuechain-secure', title: 'Secure', icon: 'shield', textA: 'reportText5', textB: 'reportText6', color: '#22c55e' },
    ];
    for (const v of valueChainCharts) {
      const existing = await chartConfigs.findOne({ chartId: v.chartId });
      const payload = {
        chartId: v.chartId,
        title: v.title,
        type: 'valuechain',
        formula: '', // valuechain uses elements[].formula only
        order: valueChainCharts.indexOf(v),
        isActive: true,
        icon: v.icon,
        iconVariant: 'outlined',
        elements: [
          { id: '1', label: 'Title', formula: `[${v.textA}]`, color: v.color },
          { id: '2', label: 'Description', formula: `[${v.textB}]`, color: v.color },
        ],
        createdAt: now,
        updatedAt: now,
      };
      if (!existing) {
        await chartConfigs.insertOne(payload);
        console.log('✅ Created chart config:', v.chartId);
      } else {
        await chartConfigs.updateOne({ chartId: v.chartId }, { $set: { ...payload, updatedAt: now } });
        console.log('✓ Chart config updated:', v.chartId);
      }
    }

    // 5. Data block "Landing Value Chain"
    const dataBlocks = db.collection('data_blocks');
    const blockCharts = valueChainCharts.map((v, i) => ({
      chartId: v.chartId,
      width: 1,
      order: i,
    }));
    let dataBlock = await dataBlocks.findOne({ name: 'Landing Value Chain' });
    if (!dataBlock) {
      const res = await dataBlocks.insertOne({
        name: 'Landing Value Chain',
        showTitle: false,
        isActive: true,
        charts: blockCharts,
        createdAt: now,
        updatedAt: now,
      });
      dataBlock = await dataBlocks.findOne({ _id: res.insertedId });
      console.log('✅ Created data block: Landing Value Chain');
    } else {
      await dataBlocks.updateOne(
        { _id: (dataBlock as any)._id },
        { $set: { charts: blockCharts, updatedAt: now } }
      );
      console.log('✓ Data block exists, updated charts: Landing Value Chain');
    }
    const blockId = (dataBlock as any)._id;

    // 6. Report template "messmass.com"
    const templates = db.collection('report_templates');
    let template = await templates.findOne({ name: LANDING_TEMPLATE_NAME });
    if (!template) {
      const res = await templates.insertOne({
        name: LANDING_TEMPLATE_NAME,
        description: 'Landing page report (messmass.com)',
        type: 'event',
        isDefault: false,
        styleId,
        dataBlocks: [{ blockId, order: 0 }],
        gridSettings: { desktopUnits: 6, tabletUnits: 3, mobileUnits: 2 },
        createdAt: now,
        updatedAt: now,
      });
      template = await templates.findOne({ _id: res.insertedId });
      console.log('✅ Created report template:', LANDING_TEMPLATE_NAME);
    } else {
      const hasBlock = (template as any).dataBlocks?.some(
        (ref: any) => ref.blockId?.toString() === blockId.toString()
      );
      if (!hasBlock) {
        await templates.updateOne(
          { _id: (template as any)._id },
          {
            $set: {
              dataBlocks: [{ blockId, order: 0 }],
              styleId: (template as any).styleId || styleId,
              updatedAt: now,
            },
          }
        );
        console.log('✓ Template exists, linked data block:', LANDING_TEMPLATE_NAME);
      } else {
        console.log('✓ Template exists:', LANDING_TEMPLATE_NAME);
      }
    }
    const templateId = (template as any)._id;

    // 7. Partner: set styleId and reportTemplateId
    await partners.updateOne(
      { _id: partnerId },
      {
        $set: {
          styleId,
          reportTemplateId: templateId,
          updatedAt: now,
        },
      }
    );
    console.log('✓ Partner linked to style and template');

    // 8. Project/event "messmass.com"
    const projects = db.collection('projects');
    let project = await projects.findOne({ eventName: LANDING_EVENT_NAME });
    const defaultStats: Record<string, number | string> = {
      remoteImages: 0,
      hostessImages: 0,
      selfies: 0,
      female: 0,
      male: 0,
      genAlpha: 0,
      genYZ: 0,
      genX: 0,
      boomer: 0,
      indoor: 0,
      outdoor: 0,
      stadium: 0,
      merched: 0,
      jersey: 0,
      scarf: 0,
      flags: 0,
      baseballCap: 0,
      other: 0,
      reportText1: 'Private',
      reportText2: 'Strictly proprietary.',
      reportText3: 'Actionable',
      reportText4: 'Ready for immediate action.',
      reportText5: 'Secure',
      reportText6: '100% safe.',
    };
    if (!project) {
      const { v4: uuidv4 } = await import('uuid');
      const viewSlug = uuidv4();
      const editSlug = uuidv4();
      await projects.insertOne({
        eventName: LANDING_EVENT_NAME,
        eventDate: new Date().toISOString().slice(0, 10),
        hashtags: [],
        categorizedHashtags: {},
        stats: defaultStats,
        viewSlug,
        editSlug,
        partner1Id: partnerId,
        reportTemplateId: templateId,
        styleIdEnhanced: styleId.toString(),
        createdAt: now,
        updatedAt: now,
      });
      project = await projects.findOne({ eventName: LANDING_EVENT_NAME });
      console.log('✅ Created event:', LANDING_EVENT_NAME, 'viewSlug:', (project as any).viewSlug);
    } else {
      const currentStats = (project as any).stats || {};
      const mergedStats = {
        ...currentStats,
        reportText1: currentStats.reportText1 ?? defaultStats.reportText1,
        reportText2: currentStats.reportText2 ?? defaultStats.reportText2,
        reportText3: currentStats.reportText3 ?? defaultStats.reportText3,
        reportText4: currentStats.reportText4 ?? defaultStats.reportText4,
        reportText5: currentStats.reportText5 ?? defaultStats.reportText5,
        reportText6: currentStats.reportText6 ?? defaultStats.reportText6,
      };
      await projects.updateOne(
        { _id: (project as any)._id },
        {
          $set: {
            partner1Id: partnerId,
            reportTemplateId: templateId,
            styleIdEnhanced: styleId.toString(),
            stats: mergedStats,
            updatedAt: now,
          },
        }
      );
      console.log('✓ Event exists, updated:', LANDING_EVENT_NAME);
    }

    console.log('\n✅ Seed complete. Landing project viewSlug:', (project as any).viewSlug);
    console.log('  Use this slug in report URL: /report/' + (project as any).viewSlug);
    console.log('  Edit event stats in admin Events to change value chain text (reportText1..6: title + description per card).');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
