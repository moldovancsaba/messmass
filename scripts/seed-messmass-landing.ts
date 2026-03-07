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

    // 4. Chart configurations: ValueChain (icon + 2 text fields)
    const chartConfigs = db.collection('chart_configurations');
    const valueChainCharts = [
      { chartId: 'kpi-valuechain-private', title: 'Private', icon: 'lock', textA: 'reportText1', textB: 'reportText2', color: '#3b82f6' },
      { chartId: 'kpi-valuechain-actionable', title: 'Actionable', icon: 'bolt', textA: 'reportText3', textB: 'reportText4', color: '#10b981' },
      { chartId: 'kpi-valuechain-secure', title: 'Secure', icon: 'shield', textA: 'reportText5', textB: 'reportText6', color: '#22c55e' },
    ];
    const problemCharts = [
      { chartId: 'kpi-valuechain-problem1', title: 'Insight → Action gap', icon: 'trending_up', textA: 'reportText7', textB: 'reportText8', color: '#3b82f6' },
      { chartId: 'kpi-valuechain-problem2', title: 'Compliance fear', icon: 'gpp_bad', textA: 'reportText9', textB: 'reportText10', color: '#f59e0b' },
      { chartId: 'kpi-valuechain-problem3', title: 'The reality', icon: 'campaign', textA: 'reportText11', textB: 'reportText12', color: '#3b82f6' },
    ];
    const productCharts = [
      { chartId: 'kpi-valuechain-product1', title: '1. Ingest & process', icon: 'upload', textA: 'reportText13', textB: 'reportText14', color: '#3b82f6' },
      { chartId: 'kpi-valuechain-product2', title: '2. Interpret', icon: 'insights', textA: 'reportText15', textB: 'reportText16', color: '#3b82f6' },
      { chartId: 'kpi-valuechain-product3', title: '3. Act', icon: 'touch_app', textA: 'reportText17', textB: 'reportText18', color: '#3b82f6' },
      { chartId: 'kpi-valuechain-product4', title: '4. Governance', icon: 'admin_panel_settings', textA: 'reportText19', textB: 'reportText20', color: '#3b82f6' },
    ];
    const allValueChainCharts = [...valueChainCharts, ...problemCharts, ...productCharts];
    for (const v of allValueChainCharts) {
      const existing = await chartConfigs.findOne({ chartId: v.chartId });
      const payload = {
        chartId: v.chartId,
        title: v.title,
        type: 'valuechain',
        formula: '',
        order: allValueChainCharts.indexOf(v),
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

    // 5. Data blocks: Landing Value Chain, Landing Problem, Landing Product
    const dataBlocks = db.collection('data_blocks');
    const block1Charts = valueChainCharts.map((v, i) => ({ chartId: v.chartId, width: 1, order: i }));
    let dataBlock1 = await dataBlocks.findOne({ name: 'Landing Value Chain' });
    if (!dataBlock1) {
      const res = await dataBlocks.insertOne({
        name: 'Landing Value Chain',
        showTitle: false,
        isActive: true,
        charts: block1Charts,
        createdAt: now,
        updatedAt: now,
      });
      dataBlock1 = await dataBlocks.findOne({ _id: res.insertedId });
      console.log('✅ Created data block: Landing Value Chain');
    } else {
      await dataBlocks.updateOne(
        { _id: (dataBlock1 as any)._id },
        { $set: { charts: block1Charts, updatedAt: now } }
      );
    }
    const blockId1 = (dataBlock1 as any)._id;

    const block2Charts = problemCharts.map((v, i) => ({ chartId: v.chartId, width: 1, order: i }));
    let dataBlock2 = await dataBlocks.findOne({ name: 'Landing Problem' });
    if (!dataBlock2) {
      const res = await dataBlocks.insertOne({
        name: 'Landing Problem',
        showTitle: false,
        isActive: true,
        charts: block2Charts,
        createdAt: now,
        updatedAt: now,
      });
      dataBlock2 = await dataBlocks.findOne({ _id: res.insertedId });
      console.log('✅ Created data block: Landing Problem');
    } else {
      await dataBlocks.updateOne(
        { _id: (dataBlock2 as any)._id },
        { $set: { charts: block2Charts, updatedAt: now } }
      );
    }
    const blockId2 = (dataBlock2 as any)._id;

    const block3Charts = productCharts.map((v, i) => ({ chartId: v.chartId, width: 1, order: i }));
    let dataBlock3 = await dataBlocks.findOne({ name: 'Landing Product' });
    if (!dataBlock3) {
      const res = await dataBlocks.insertOne({
        name: 'Landing Product',
        showTitle: false,
        isActive: true,
        charts: block3Charts,
        createdAt: now,
        updatedAt: now,
      });
      dataBlock3 = await dataBlocks.findOne({ _id: res.insertedId });
      console.log('✅ Created data block: Landing Product');
    } else {
      await dataBlocks.updateOne(
        { _id: (dataBlock3 as any)._id },
        { $set: { charts: block3Charts, updatedAt: now } }
      );
    }
    const blockId3 = (dataBlock3 as any)._id;

    // 6. Report template "messmass.com" — 3 blocks: Value Chain, Problem, Product
    const templates = db.collection('report_templates');
    const dataBlocksRef = [
      { blockId: blockId1, order: 0 },
      { blockId: blockId2, order: 1 },
      { blockId: blockId3, order: 2 },
    ];
    let template = await templates.findOne({ name: LANDING_TEMPLATE_NAME });
    if (!template) {
      const res = await templates.insertOne({
        name: LANDING_TEMPLATE_NAME,
        description: 'Landing page report (messmass.com)',
        type: 'event',
        isDefault: false,
        styleId,
        dataBlocks: dataBlocksRef,
        gridSettings: { desktopUnits: 6, tabletUnits: 3, mobileUnits: 2 },
        createdAt: now,
        updatedAt: now,
      });
      template = await templates.findOne({ _id: res.insertedId });
      console.log('✅ Created report template:', LANDING_TEMPLATE_NAME);
    } else {
      await templates.updateOne(
        { _id: (template as any)._id },
        { $set: { dataBlocks: dataBlocksRef, styleId: (template as any).styleId || styleId, updatedAt: now } }
      );
      console.log('✓ Template exists, updated data blocks:', LANDING_TEMPLATE_NAME);
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
      reportText7: 'Insight → Action gap',
      reportText8: 'Data abundance, but processing is often manual and slow.',
      reportText9: 'Compliance fear',
      reportText10: 'PII and KYC data cannot go to public cloud AIs (e.g. ChatGPT).',
      reportText11: 'The reality',
      reportText12: "If employees use cloud models secretly, that's a breach. If management bans it, growth slows.",
      reportText13: '1. Ingest & process',
      reportText14: 'Automated data ingestion and cleaning.',
      reportText15: '2. Interpret',
      reportText16: 'Trends and anomalies powered by a local AI engine.',
      reportText17: '3. Act',
      reportText18: 'Decision points, personas, playbooks, and task delegation.',
      reportText19: '4. Governance',
      reportText20: '100% auditability and access control. Every byte stays where it belongs.',
      reportTextHeroLabel: 'Sovereign Decision Intelligence',
      reportTextHeroTitle: 'Agentic AI that reads and understands your data at scale, and delivers actionable dashboards—without compromising privacy.',
      reportTextHeroSub: 'The platform that restores the freedom and security of decision-making to data-driven companies—and opens the door for those who want to become one.',
      reportTextSectionCoreTitle: 'Our core belief',
      reportTextBeliefLead: "You shouldn't have to choose between intelligence and security.",
      reportTextBeliefBody: 'No company should hand over sensitive data to the cloud to be smart—or give up the power of AI to stay compliant. We believe in decision sovereignty: your data stays with you, and the AI comes to it.',
      reportTextProblemTitle: 'The cost of decision paralysis',
      reportTextProblemLead: 'Teams are paralyzed. We have data, but we lack the courage to use the tools that could interpret it.',
      reportTextSolutionTitle: 'The solution: local-first agentic AI',
      reportTextSolutionLead: 'We flip the logic: **the AI goes to the data, not the data to the AI.**',
      reportTextSolutionBody: 'We bring local AI agents directly into your secure infrastructure. The data doesn\'t move; the intelligence runs locally. Proactive decision-making processes, not passive dashboards—without the compliance nightmare.',
      reportTextProductTitle: 'The messmass platform',
      reportTextDiffTitle: 'Why messmass',
      reportTextDiffLead: 'BI tools are secure but passive. Cloud AI is proactive but no DPO will allow PII. **messmass is the only player that brings proactive AI with physical hardware isolation.**',
      reportTextFooterTitle: "Let's build the era of sovereign enterprise AI together.",
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
      const mergedStats = { ...currentStats };
      for (const key of Object.keys(defaultStats)) {
        if (key.startsWith('reportText') && (mergedStats[key] === undefined || mergedStats[key] === null || mergedStats[key] === '')) {
          mergedStats[key] = defaultStats[key];
        }
      }
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
    console.log('  Edit event stats in admin Events to change all landing text (reportText1..20 + reportTextHero*, reportTextSection*, etc.).');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
