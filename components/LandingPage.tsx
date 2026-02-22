'use client';

/**
 * WHAT: Main page (messmass.com) — static snapshot (from admin "Update") or live report
 * WHY: Admin can choose report and generate static content so the site does not hit DB on each visit
 * HOW: Snapshot is loaded on server (initialStaticPayload); client uses it for first paint. No client fetch required for static path.
 */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ReportCalculator } from '@/lib/report-calculator';
import type { Chart } from '@/lib/report-calculator';
import { ensureDerivedMetrics } from '@/lib/dataValidator';
import { useReportData } from '@/hooks/useReportData';
import { useReportLayoutForProject } from '@/hooks/useReportLayout';
import { useReportStyle } from '@/hooks/useReportStyle';
import ReportContent from '@/app/report/[slug]/ReportContent';
import ContactForm from '@/components/ContactForm';
import { LANDING_REPORT_SLUG } from '@/lib/landingReportSlug';
import type { StaticLandingSnapshot } from '@/lib/landingSettings';
import styles from '@/app/page.module.css';
import reportPageStyles from '@/app/styles/report-page.module.css';

const LOAD_TIMEOUT_MS = 12000;

interface LandingStaticPayload {
  staticSnapshot: StaticLandingSnapshot;
  landingReportSlug: string;
  generatedAt: string | null;
}

interface LandingPageProps {
  /** When set, server already loaded snapshot; use for first paint so no client fetch needed */
  initialStaticPayload?: LandingStaticPayload | null;
  /** App version shown in footer (e.g. from package.json) */
  version?: string | null;
}

export default function LandingPage({ initialStaticPayload = null, version = null }: LandingPageProps) {
  const [staticPayload, setStaticPayload] = useState<LandingStaticPayload | null>(initialStaticPayload ?? null);
  const [landingSlugFromApi, setLandingSlugFromApi] = useState<string | null>(initialStaticPayload?.landingReportSlug ?? null);
  const [staticChecked, setStaticChecked] = useState(!!initialStaticPayload);

  useEffect(() => {
    if (initialStaticPayload) return;
    let cancelled = false;
    fetch('/api/landing-static', { cache: 'no-store' })
      .then(async (r) => {
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return { success: false };
        try {
          return await r.json();
        } catch {
          return { success: false };
        }
      })
      .then((d) => {
        if (cancelled || !d?.success) return;
        setLandingSlugFromApi(d.landingReportSlug || null);
        if (d.staticSnapshot)
          setStaticPayload({
            staticSnapshot: d.staticSnapshot,
            landingReportSlug: d.landingReportSlug || LANDING_REPORT_SLUG,
            generatedAt: d.generatedAt ?? null,
          });
      })
      .finally(() => { if (!cancelled) setStaticChecked(true); });
    return () => { cancelled = true; };
  }, [initialStaticPayload]);

  if (!staticChecked) {
    return (
      <div className={styles.landing}>
        <div className={reportPageStyles.loading} style={{ minHeight: '50vh' }}>
          <div className={reportPageStyles.loadingSpinner} />
          <p className={reportPageStyles.loadingText}>Loading…</p>
        </div>
      </div>
    );
  }

  if (staticPayload?.staticSnapshot) {
    return (
      <LandingPageStatic
        snapshot={staticPayload.staticSnapshot}
        generatedAt={staticPayload.generatedAt}
        version={version}
      />
    );
  }

  return (
    <LandingPageLive slug={landingSlugFromApi ?? LANDING_REPORT_SLUG} version={version} />
  );
}

function LandingPageStatic({
  snapshot,
  generatedAt,
  version,
}: {
  snapshot: StaticLandingSnapshot;
  generatedAt: string | null;
  version?: string | null;
}) {
  const stats = snapshot.projectStats as Record<string, unknown> | undefined;
  const heroLabel = (stats?.reportTextHeroLabel as string) || 'Sovereign Decision Intelligence';
  const heroTitle = (stats?.reportTextHeroTitle as string) || 'Agentic AI that reads and understands your data at scale, and delivers actionable dashboards—without compromising privacy.';
  const heroSub = (stats?.reportTextHeroSub as string) || 'The platform that restores the freedom and security of decision-making to data-driven companies.';
  const rawFooter = stats?.reportTextFooterTitle;
  const footerTitle = typeof rawFooter === 'string' ? rawFooter : "Let's build the era of sovereign enterprise AI together.";

  const blocks = useMemo(() => {
    const list = Array.isArray(snapshot.blocks) ? snapshot.blocks : [];
    return list.map((b) => ({
      ...b,
      id: typeof b.id === 'string' ? b.id : String(b.id ?? b.order ?? ''),
      charts: (b.charts || []).map((c) => ({
        ...c,
        chartId: typeof c.chartId === 'string' ? c.chartId : String(c.chartId),
      })),
    }));
  }, [snapshot.blocks]);
  const chartResults = useMemo(() => {
    const m = new Map<string, Record<string, unknown>>();
    const list = Array.isArray(snapshot.chartResults) ? snapshot.chartResults : [];
    for (const entry of list) {
      if (entry?.chartId != null && entry.result != null) m.set(String(entry.chartId), entry.result as Record<string, unknown>);
    }
    return m;
  }, [snapshot.chartResults]);
  const gridSettings = useMemo(
    () => ({
      desktop: Number(snapshot.gridSettings?.desktop) || 3,
      tablet: Number(snapshot.gridSettings?.tablet) || 2,
      mobile: Number(snapshot.gridSettings?.mobile) || 1,
    }),
    [snapshot.gridSettings]
  );

  return (
    <div className={styles.landing}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBrand}>
            <Image src="/messmass-logo-white.png" alt="" width={160} height={48} priority />
            <span className={styles.heroSiteName}>MessMass</span>
          </div>
          <p className={styles.heroLabel}>{heroLabel}</p>
          <h1 className={styles.heroTitle}>{heroTitle}</h1>
          <p className={styles.heroSub}>{heroSub}</p>
          <div className={styles.heroCtas}>
            <Link href="/admin/login" className="btn btn-primary">Go to Dashboard</Link>
            <a href="#report-content" className="btn btn-outline-light">See how it works</a>
          </div>
        </div>
      </header>
      <section id="report-content" className={reportPageStyles.page} aria-label="Report content">
        <div className={reportPageStyles.container}>
          {blocks.length === 0 ? (
            <div className={reportPageStyles.error} style={{ minHeight: '40vh', padding: 'var(--mm-space-8)' }}>
              <span className={reportPageStyles.errorIcon}>📊</span>
              <h2 className={reportPageStyles.errorTitle}>No static content yet</h2>
              <p className={reportPageStyles.errorText}>
                Go to <strong>Admin → Main page</strong>, choose an event report, then click <strong>Update static content</strong>.
              </p>
              <Link href="/admin/mainpage" className="btn btn-primary">Open Main page settings</Link>
            </div>
          ) : chartResults.size === 0 ? (
            <div className={reportPageStyles.error} style={{ minHeight: '40vh', padding: 'var(--mm-space-8)' }}>
              <span className={reportPageStyles.errorIcon}>📈</span>
              <h2 className={reportPageStyles.errorTitle}>Chart data missing</h2>
              <p className={reportPageStyles.errorText}>
                The snapshot has blocks but no chart data. In <strong>Admin → Main page</strong> click <strong>Update static content</strong> again.
              </p>
              <Link href="/admin/mainpage" className="btn btn-primary">Open Main page settings</Link>
            </div>
          ) : (
            <div
              className={reportPageStyles.landingReportWrap}
              style={
                {
                  /* Title = 32px; Description (KPI value row) = 13px; icon = 32px. Value row uses --landing-value-font so clamp is not used. */
                  '--block-base-font-size': '32px',
                  '--block-subtitle-font-size': '13px',
                  '--landing-max-font': '13px',
                  '--landing-max-icon-font': '32px',
                  '--landing-value-font': '13px',
                } as React.CSSProperties
              }
            >
              <ReportContent
                blocks={blocks}
                chartResults={chartResults as unknown as Map<string, import('@/lib/report-calculator').ChartResult>}
                charts={null}
                gridSettings={gridSettings}
                allowNA={true}
              />
            </div>
          )}
        </div>
      </section>
      <PricingAndFooter footerTitle={footerTitle} version={version} />
    </div>
  );
}

function PricingAndFooter({ footerTitle, version }: { footerTitle: string; version?: string | null }) {
  return (
    <>
      <section id="pricing" className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Pricing</h2>
          <div className={styles.pricingGrid}>
            <div className={styles.pricingCard}>
              <h3 className={styles.pricingCardTitle}>Welcome</h3>
              <p className={styles.pricingCardPrice}>Free <span className={styles.pricingCardPriceSub}>forever</span></p>
              <ul className={styles.pricingCardFeatures}>
                <li>1 personal profile</li>
                <li>1 public site</li>
                <li>10 public reports</li>
                <li>Basic KYC Dataset</li>
              </ul>
              <p className={styles.pricingCardNote}>(POC required)</p>
              <div className={styles.pricingCardCta}>
                <Link href="/#contact" className="btn btn-secondary">Contact us</Link>
              </div>
            </div>
            <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
              <h3 className={styles.pricingCardTitle}>Business</h3>
              <p className={styles.pricingCardPrice}>$99 <span className={styles.pricingCardPriceSub}>USD / month</span></p>
              <ul className={styles.pricingCardFeatures}>
                <li>Everything in Welcome +</li>
                <li>1 organisation profile</li>
                <li>1 private site</li>
                <li>Unlimited public sites</li>
                <li>10 private reports</li>
                <li>Unlimited public reports</li>
                <li>Advanced KYC Dataset</li>
              </ul>
              <p className={styles.pricingCardNote}>(Consultancy required)</p>
              <div className={styles.pricingCardCta}>
                <Link href="/#contact" className="btn btn-primary">Contact us</Link>
              </div>
            </div>
            <div className={styles.pricingCard}>
              <h3 className={styles.pricingCardTitle}>Organisation</h3>
              <p className={styles.pricingCardPrice}>Custom</p>
              <ul className={styles.pricingCardFeatures}>
                <li>Everything in Business +</li>
                <li>1 organisation profile</li>
                <li>Unlimited private sites</li>
                <li>Unlimited private reports</li>
                <li>Unlimited KYC Dataset</li>
              </ul>
              <p className={styles.pricingCardNote}>(Training required)</p>
              <div className={styles.pricingCardCta}>
                <Link href="/#contact" className="btn btn-secondary">Contact us</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="faq" className={styles.sectionAlt} aria-label="Frequently asked questions">
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Frequently asked questions</h2>
          <dl className={styles.faqList}>
            <div className={styles.faqItem}>
              <dt className={styles.faqQuestion}>Does any data leave our environment?</dt>
              <dd className={styles.faqAnswer}>
                No, never. Raw data is only ingested into your environment and is never read out of your system by us. All outcomes - reports, documents, and insights - remain under your control. You decide what to share and with whom.
              </dd>
            </div>
            <div className={styles.faqItem}>
              <dt className={styles.faqQuestion}>Do you train models on customer data?</dt>
              <dd className={styles.faqAnswer}>
                No, never. You train your model inside our system, and you are the only one who can use it. We do not use your data to train shared or third-party models.
              </dd>
            </div>
            <div className={styles.faqItem}>
              <dt className={styles.faqQuestion}>What deployment options exist (local / VPC / on-prem)?</dt>
              <dd className={styles.faqAnswer}>
                We offer three deployment types: a free tier that runs in the cloud, Business runs in our VPC, and Organisation is deployed on-premise in your infrastructure for maximum control.
              </dd>
            </div>
            <div className={styles.faqItem}>
              <dt className={styles.faqQuestion}>How do audit logs work and what&apos;s recorded?</dt>
              <dd className={styles.faqAnswer}>
                We provide an immutable, chronological record of every action taken within the platform—who did what, when, and how. For on-premise deployments, we have no access to your logs; they stay entirely in your environment.
              </dd>
            </div>
            <div className={styles.faqItem}>
              <dt className={styles.faqQuestion}>Can we control which datasets an agent can access?</dt>
              <dd className={styles.faqAnswer}>
                Yes. During the POC we work with you to fine-tune the ecosystem and access rules so that agents only see the datasets you allow, in line with your requirements.
              </dd>
            </div>
            <div className={styles.faqItem}>
              <dt className={styles.faqQuestion}>How long to get value? (typical POC timeline)</dt>
              <dd className={styles.faqAnswer}>
                The system starts reporting as soon as the first ingestion is in place; value grows with the quantity and quality of data you feed it. Based on our experience, even the first reports deliver real value for our partners.
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <ContactForm />
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Image src="/messmass-logo-white.png" alt="" width={120} height={36} />
            <span className={styles.footerSiteName}>MessMass</span>
          </div>
          <h2 className={styles.footerTitle}>{footerTitle}</h2>
          <Link href="/admin/login" className="btn btn-primary">Start using the system</Link>
          <p className={styles.footerSite}>messmass.com</p>
          <nav className={styles.footerLegal} aria-label="Legal">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms &amp; Conditions</Link>
            {version ? <span className={styles.footerVersion} aria-label="App version">v{version}</span> : null}
          </nav>
        </div>
      </footer>
    </>
  );
}

function LandingPageLive({ slug, version }: { slug: string; version?: string | null }) {

  const { data: reportData, loading: dataLoading, error: dataError } = useReportData(slug);
  const project = reportData?.project;
  const stats = project?.stats;

  const {
    report,
    blocks,
    gridSettings,
    loading: layoutLoading,
    error: layoutError,
  } = useReportLayoutForProject(slug);

  const { loading: styleLoading } = useReportStyle({
    styleId: report?.styleId ? String(report.styleId) : null,
    enabled: !!report,
  });

  const [charts, setCharts] = useState<Chart[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState<string | null>(null);
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  useEffect(() => {
    const loading = dataLoading || layoutLoading || chartsLoading || styleLoading;
    if (!loading) {
      setLoadTimedOut(false);
      return;
    }
    const t = setTimeout(() => setLoadTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [dataLoading, layoutLoading, chartsLoading, styleLoading]);

  useEffect(() => {
    if (!blocks || blocks.length === 0) return;
    const chartIds = Array.from(
      new Set(blocks.flatMap((block) => block.charts.map((c) => c.chartId)))
    );
    if (chartIds.length === 0) {
      setCharts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setChartsLoading(true);
      setChartsError(null);
      try {
        const response = await fetch('/api/chart-config/public', { cache: 'no-store' });
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch charts');
        }
        const byId: Record<string, unknown> = {};
        for (const cfg of (data.configurations as any[]) || []) {
          byId[(cfg as { chartId: string }).chartId] = cfg;
        }
        const ordered = chartIds.map((id) => byId[id]).filter(Boolean) as Chart[];
        setCharts(ordered);
      } catch (err) {
        if (!cancelled) {
          setChartsError(err instanceof Error ? err.message : 'Failed to load charts');
        }
      } finally {
        if (!cancelled) setChartsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [blocks]);

  const chartResults = useMemo(() => {
    if (!stats || !charts || charts.length === 0) return new Map();
    const enrichedStats = ensureDerivedMetrics(stats);
    const calculator = new ReportCalculator(charts, enrichedStats as any);
    const results = new Map();
    for (const chart of charts) {
      const result = calculator.calculateChart(chart.chartId);
      if (result) results.set(chart.chartId, result);
    }
    return results;
  }, [stats, charts]);

  const loading = dataLoading || layoutLoading || chartsLoading || styleLoading;
  const error = dataError || layoutError || chartsError;

  const rawFooter = stats && (stats as Record<string, unknown>).reportTextFooterTitle;
  const footerTitle =
    typeof rawFooter === 'string' ? rawFooter : "Let's build the era of sovereign enterprise AI together.";

  const heroLabel = (stats as Record<string, unknown>)?.['reportTextHeroLabel'] as string || 'Sovereign Decision Intelligence';
  const heroTitle = (stats as Record<string, unknown>)?.['reportTextHeroTitle'] as string || 'Agentic AI that reads and understands your data at scale, and delivers actionable dashboards—without compromising privacy.';
  const heroSub = (stats as Record<string, unknown>)?.['reportTextHeroSub'] as string ||
    'The platform that restores the freedom and security of decision-making to data-driven companies.';

  function renderReportSection() {
    if (loadTimedOut) {
      return (
        <div className={reportPageStyles.error} style={{ minHeight: '40vh', padding: 'var(--mm-space-8)' }}>
          <span className={reportPageStyles.errorIcon}>⏱️</span>
          <h2 className={reportPageStyles.errorTitle}>Report load timed out</h2>
          <p className={reportPageStyles.errorText}>
            Check that <strong>MONGODB_URI</strong> is set in <code>.env.local</code> and MongoDB is reachable.
            The landing project must exist with viewSlug: <code>{slug}</code>.
          </p>
          <Link href="/" className="btn btn-primary">Reload</Link>
        </div>
      );
    }
    if (loading) {
      return (
        <div className={reportPageStyles.loading} style={{ minHeight: '40vh' }}>
          <div className={reportPageStyles.loadingSpinner} />
          <p className={reportPageStyles.loadingText}>Loading report content…</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className={reportPageStyles.error} style={{ minHeight: '40vh', padding: 'var(--mm-space-8)' }}>
          <span className={reportPageStyles.errorIcon}>⚠️</span>
          <h2 className={reportPageStyles.errorTitle}>Failed to load report</h2>
          <p className={reportPageStyles.errorText}>{error}</p>
          <Link href="/" className="btn btn-primary">Reload</Link>
        </div>
      );
    }
    if (!report || !project) {
      return (
        <div className={reportPageStyles.error} style={{ minHeight: '40vh', padding: 'var(--mm-space-8)' }}>
          <span className={reportPageStyles.errorIcon}>📊</span>
          <h2 className={reportPageStyles.errorTitle}>Report not configured</h2>
          <p className={reportPageStyles.errorText}>
            Set NEXT_PUBLIC_LANDING_REPORT_SLUG to a project viewSlug. Current: <code>{slug}</code>
          </p>
          <Link href="/admin/login" className="btn btn-primary">Go to Dashboard</Link>
        </div>
      );
    }
    return (
      <ReportContent
        blocks={blocks}
        chartResults={chartResults}
        charts={charts?.length ? new Map(charts.map((c) => [c.chartId, c])) : null}
        gridSettings={gridSettings}
      />
    );
  }

  return (
    <div className={styles.landing}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBrand}>
            <Image src="/messmass-logo-white.png" alt="" width={160} height={48} priority />
            <span className={styles.heroSiteName}>MessMass</span>
          </div>
          <p className={styles.heroLabel}>{heroLabel}</p>
          <h1 className={styles.heroTitle}>{heroTitle}</h1>
          <p className={styles.heroSub}>{heroSub}</p>
          <div className={styles.heroCtas}>
            <Link href="/admin/login" className="btn btn-primary">Go to Dashboard</Link>
            <a href="#report-content" className="btn btn-outline-light">See how it works</a>
          </div>
        </div>
      </header>

      <section id="report-content" className={reportPageStyles.page} aria-label="Report content">
        <div className={reportPageStyles.container}>
          {renderReportSection()}
        </div>
      </section>

      <PricingAndFooter footerTitle={footerTitle} version={version} />
    </div>
  );
}
