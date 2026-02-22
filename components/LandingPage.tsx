'use client';

/**
 * WHAT: Main page (messmass.com) — static snapshot (from admin "Update") or live report
 * WHY: Admin can choose report and generate static content so the site does not hit DB on each visit
 * HOW: Fetch /api/landing-static; if staticSnapshot exists render it; else use live pipeline (useReportData, etc.)
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

export default function LandingPage() {
  const [staticPayload, setStaticPayload] = useState<LandingStaticPayload | null>(null);
  const [landingSlugFromApi, setLandingSlugFromApi] = useState<string | null>(null);
  const [staticChecked, setStaticChecked] = useState(false);

  useEffect(() => {
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
  }, []);

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
      />
    );
  }

  return (
    <LandingPageLive slug={landingSlugFromApi ?? LANDING_REPORT_SLUG} />
  );
}

function LandingPageStatic({
  snapshot,
  generatedAt,
}: {
  snapshot: StaticLandingSnapshot;
  generatedAt: string | null;
}) {
  const stats = snapshot.projectStats as Record<string, unknown> | undefined;
  const heroLabel = (stats?.reportTextHeroLabel as string) || 'Sovereign Decision Intelligence';
  const heroTitle = (stats?.reportTextHeroTitle as string) || 'Data Privacy and Agentic AI without compromises.';
  const heroSub = (stats?.reportTextHeroSub as string) || 'The platform that restores the freedom and security of decision-making to data-driven companies.';
  const rawFooter = stats?.reportTextFooterTitle;
  const footerTitle = typeof rawFooter === 'string' ? rawFooter : "Let's build the era of sovereign enterprise AI together.";

  const blocks = useMemo(() => {
    const list = Array.isArray(snapshot.blocks) ? snapshot.blocks : [];
    return list.map((b) => ({ ...b, id: b.id || String(b.order) }));
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
          ) : (
            <ReportContent
              blocks={blocks}
              chartResults={chartResults as unknown as Map<string, import('@/lib/report-calculator').ChartResult>}
              charts={null}
              gridSettings={gridSettings}
            />
          )}
        </div>
      </section>
      <PricingAndFooter footerTitle={footerTitle} />
    </div>
  );
}

function PricingAndFooter({ footerTitle }: { footerTitle: string }) {
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
          </nav>
        </div>
      </footer>
    </>
  );
}

function LandingPageLive({ slug }: { slug: string }) {

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
  const heroTitle = (stats as Record<string, unknown>)?.['reportTextHeroTitle'] as string || 'Data Privacy and Agentic AI without compromises.';
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

      <PricingAndFooter footerTitle={footerTitle} />
    </div>
  );
}
