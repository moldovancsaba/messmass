'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Chart, { type ChartConfiguration } from 'chart.js/auto';
import { InteractiveReportData } from './types';
import { REPORT_CHART_PALETTE } from '@/lib/theme/interactiveReportPalette';
import styles from './interactive-report.module.css';

interface MessmassAlgorithmsSuiteProps {
  data: InteractiveReportData;
  fanAppearances: number | null;
  resolvedOptIns: number;
  resolvedPhotosProcessed: number;
  resolvedCtaClicks: number;
  clubsCountSum: number;
  primaryColor?: string;
}

export default function MessmassAlgorithmsSuite({
  data,
  fanAppearances,
  resolvedOptIns,
  resolvedPhotosProcessed,
  resolvedCtaClicks,
  clubsCountSum,
  primaryColor = REPORT_CHART_PALETTE.blue,
}: MessmassAlgorithmsSuiteProps) {
  const { summary, vision, matches = [], matchdayAnalytics } = data;
  const valCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Group A: Empirical Supporter & Engagement Metrics
  const totalGate = matchdayAnalytics?.totalGateAttendance ?? 0;
  const totalFansBase = fanAppearances ?? (summary.totalPhotos > 0 ? summary.totalPhotos : resolvedPhotosProcessed);

  const merchItems = useMemo(() => vision?.aggregates?.merchandise ?? [], [vision?.aggregates?.merchandise]);
  const merchItemsSum = useMemo(() => merchItems.reduce((s, m) => s + m.count, 0), [merchItems]);
  const merchedFans = merchItemsSum > 0 ? merchItemsSum : clubsCountSum;

  const hasMerchData = merchedFans > 0 && totalFansBase > 0;
  const frontRunnersPct = hasMerchData
    ? Math.min(100, Math.round((merchedFans / totalFansBase) * 1000) / 10)
    : null;
  const casualsPct = frontRunnersPct !== null ? Math.round((100 - frontRunnersPct) * 10) / 10 : null;

  const fanaticCount = useMemo(() => {
    let sum = 0;
    for (const item of merchItems) {
      if (/flag|scarf|scarves/i.test(item.item)) sum += item.count;
    }
    return sum;
  }, [merchItems]);
  const fanaticalsPct = merchItemsSum > 0 && fanaticCount > 0
    ? Math.min(100, Math.round((fanaticCount / merchItemsSum) * 1000) / 10)
    : null;

  const fanEngagementPct = totalGate > 0 && fanAppearances !== null && fanAppearances > 0
    ? Math.round((fanAppearances / totalGate) * 1000) / 10
    : null;

  const coreFanTeamProjection = frontRunnersPct !== null && totalGate > 0
    ? Math.round((frontRunnersPct / 100) * totalGate)
    : null;

  const age = vision?.aggregates?.ageGroups;
  const ageTotal = age ? age.children + age.teens + age.adults + age.seniors : 0;
  const under40Count = age ? age.children + age.teens + age.adults : 0;
  const under40Pct = ageTotal > 0 ? Math.round((under40Count / ageTotal) * 1000) / 10 : null;

  // Per-sport Fan Engagement (Capture Rate %) when matches have attendance & submitted
  const sportEngagement = useMemo(() => {
    const map = new Map<string, { sport: string; gate: number; photos: number }>();
    for (const m of matches) {
      if ((m.attendance ?? 0) <= 0) continue;
      const cur = map.get(m.sport) ?? { sport: m.sport, gate: 0, photos: 0 };
      cur.gate += m.attendance || 0;
      cur.photos += m.submitted || 0;
      map.set(m.sport, cur);
    }
    return Array.from(map.values())
      .map((r) => ({
        sport: r.sport,
        photosPer1k: r.gate > 0 ? Math.round((r.photos / r.gate) * 10000) / 10 : 0,
      }))
      .sort((a, b) => b.photosPer1k - a.photosPer1k);
  }, [matches]);

  // Group B: Modelled Commercial EUR Valuation (Default Messmass rates)
  const edmValue = (resolvedOptIns > 0 ? resolvedOptIns : resolvedPhotosProcessed) * 5;
  const adsValue = (fanAppearances ?? 0) * 3;
  const u40Value = under40Count * 4;
  const potentialMerchValue = hasMerchData ? Math.max(0, totalFansBase - merchedFans) * 10 : 0;
  const totalModelledEur = edmValue + adsValue + u40Value + potentialMerchValue;

  // Group C: Clicker / Bitly / Touchpoint Metrics (shown when stored)
  const { qr, url, social } = summary.touchpoints;
  const totalTouchpoints = qr + url + social;
  const qrUrlWeight = qr + url;
  const fanInteractionPct = summary.totalPhotos > 0 && (social + resolvedCtaClicks) > 0
    ? Math.round(((social + resolvedCtaClicks) / summary.totalPhotos) * 1000) / 10
    : null;
  const cpmValue = resolvedCtaClicks > 0 ? resolvedCtaClicks * 15 : null;
  const brandingValue = totalTouchpoints > 0 || summary.totalRegistered > 0
    ? (summary.totalRegistered > 0 ? summary.totalRegistered : totalTouchpoints) * 1
    : null;
  const hasGroupC = totalTouchpoints > 0 || fanInteractionPct !== null || cpmValue !== null;

  const valChartConfig = useMemo<ChartConfiguration>(
    () => ({
      type: 'bar',
      data: {
        labels: [
          'eDM Lead Value (€5/lead)',
          'Ad Exposure (€3/fan)',
          'Under-40 Reach (€4/fan)',
          'Potential Merch (€10/fan)',
        ],
        datasets: [
          {
            label: 'Modelled Value (€)',
            data: [edmValue, adsValue, u40Value, potentialMerchValue],
            backgroundColor: [
              primaryColor,
              REPORT_CHART_PALETTE.teal,
              REPORT_CHART_PALETTE.violet,
              REPORT_CHART_PALETTE.amber,
            ],
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } },
      },
    }),
    [edmValue, adsValue, u40Value, potentialMerchValue, primaryColor]
  );

  useEffect(() => {
    const canvas = valCanvasRef.current;
    if (!canvas || totalModelledEur <= 0) return;
    const chart = new Chart(canvas, valChartConfig);
    return () => {
      chart.destroy();
    };
  }, [valChartConfig, totalModelledEur]);

  const hasGroupA =
    fanEngagementPct !== null ||
    frontRunnersPct !== null ||
    coreFanTeamProjection !== null ||
    fanaticalsPct !== null ||
    under40Pct !== null ||
    sportEngagement.length > 1;

  if (!hasGroupA && totalModelledEur <= 0 && !hasGroupC) return null;

  return (
    <section className={styles.suiteStack} aria-label="Messmass Classic Algorithms and Valuation">
      {/* Group A: Empirical Supporter & Engagement Algorithms */}
      {hasGroupA && (
      <article className={styles.bentoPanel}>
        <header className={styles.bentoPanelHeader}>
          <div className={styles.bentoPanelTitle}>
            <span className={styles.bentoPanelIcon} aria-hidden="true">🧮</span>
            <h2 className={styles.gdsCardTitle}>How loyal &amp; engaged are your fans?</h2>
          </div>
          <span className={styles.bentoPanelStatus}>Fan loyalty</span>
        </header>
        <div className={`${styles.bentoPanelBody} ${styles.gdsStack}`}>
          <p className={styles.bentoBenefit}>
            Separates merch-wearing supporters from casual visitors so you know how big your loyal core fanbase is.
          </p>
          <div className={styles.bentoFourCol}>
            {fanEngagementPct !== null && (
            <div className={styles.bentoSummaryStat}>
              <span className={styles.gdsEyebrow}>Photo Participation Rate</span>
              <strong className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                {`${fanEngagementPct}%`}
              </strong>
              <span className={styles.gdsCaption}>
                {`${fanAppearances?.toLocaleString()} fans / ${totalGate.toLocaleString()} attendance`}
              </span>
            </div>
            )}

            {frontRunnersPct !== null && (
            <div className={styles.bentoSummaryStat}>
              <span className={styles.gdsEyebrow}>Merchandise Wearers vs. Casual Fans</span>
              <strong className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                {`${frontRunnersPct}% / ${casualsPct}%`}
              </strong>
              <span className={styles.gdsCaption}>
                {`${merchedFans.toLocaleString()} wearing merch vs. ${Math.max(0, totalFansBase - merchedFans).toLocaleString()} casual`}
              </span>
            </div>
            )}

            {coreFanTeamProjection !== null && (
            <div className={styles.bentoSummaryStat}>
              <span className={styles.gdsEyebrow}>Estimated Core Fanbase</span>
              <strong className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                {coreFanTeamProjection.toLocaleString()}
              </strong>
              <span className={styles.gdsCaption}>
                Projected merchandise-wearing attendees
              </span>
            </div>
            )}

            {(fanaticalsPct !== null || under40Pct !== null) && (
            <div className={styles.bentoSummaryStat}>
              <span className={styles.gdsEyebrow}>
                {fanaticalsPct !== null ? 'Die-Hard Supporters' : 'Under-60 Audience Share'}
              </span>
              <strong className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                {fanaticalsPct !== null ? `${fanaticalsPct}%` : `${under40Pct}%`}
              </strong>
              <span className={styles.gdsCaption}>
                {fanaticalsPct !== null
                  ? `${fanaticCount.toLocaleString()} flags & scarves of ${merchItemsSum.toLocaleString()} items`
                  : `${under40Count.toLocaleString()} of ${ageTotal.toLocaleString()} age samples`}
              </span>
            </div>
            )}
          </div>

          {sportEngagement.length > 1 && (
            <div className={styles.bentoBarList}>
              {sportEngagement.map((row) => (
                <div key={row.sport} className={styles.bentoVenueRow}>
                  <div className={styles.bentoVenueHead}>
                    <span className={styles.gdsBody}><strong>{row.sport}</strong></span>
                    <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>
                      {row.photosPer1k} photos / 1k attendees
                    </span>
                  </div>
                  <div className={styles.bentoBarTrackWrap}>
                    <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                      <rect
                        x="0"
                        y="0"
                        width={Math.max(2, Math.min(100, (row.photosPer1k / Math.max(sportEngagement[0].photosPer1k, 1)) * 100))}
                        height="8"
                        rx="0"
                        className={styles.bentoBarFillRect}
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>
      )}

      {/* Group B & Group C */}
      <div className={hasGroupC ? styles.bentoTwoCol : undefined}>
        {totalModelledEur > 0 && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">💶</span>
                <h2 className={styles.gdsCardTitle}>Estimated Media Value (EMV)</h2>
              </div>
              <span className={styles.bentoPanelStatus}>
                €{totalModelledEur.toLocaleString()} estimated total
              </span>
            </header>
            <div className={styles.bentoPanelBody}>
              <p className={styles.bentoBenefit}>
                Turns fan photos, opt-ins, and un-merched fans into euro estimates so you can price sponsorships and spot missed merch sales.
              </p>
              <div className={styles.chartCanvasBox}>
                <canvas ref={valCanvasRef} />
              </div>
              <div className={styles.bentoFootnote}>
                Illustrative modelled estimates using default Messmass unit rates (€3–€10); not realized revenue.
              </div>
            </div>
          </article>
        )}

        {hasGroupC && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">🔗</span>
                <h2 className={styles.gdsCardTitle}>Digital Engagement</h2>
              </div>
              <span className={styles.bentoPanelStatus}>Link Clicks &amp; QR Scans</span>
            </header>
            <div className={`${styles.bentoPanelBody} ${styles.gdsStack}`}>
              <p className={styles.bentoBenefit}>
                Shows how many fans scanned QR codes or clicked sponsor links after taking a photo—proving post-match digital action.
              </p>
              <div className={styles.bentoTwoCol}>
                {fanInteractionPct !== null && (
                <div className={styles.bentoSummaryStat}>
                  <span className={styles.gdsEyebrow}>Engagement Rate</span>
                  <strong className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                    {`${fanInteractionPct}%`}
                  </strong>
                  <span className={styles.gdsCaption}>Social + link clicks / photos</span>
                </div>
                )}
                <div className={styles.bentoSummaryStat}>
                  <span className={styles.gdsEyebrow}>Estimated CPM &amp; Branding</span>
                  <strong className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                    €{((cpmValue ?? 0) + (brandingValue ?? 0)).toLocaleString()}
                  </strong>
                  <span className={styles.gdsCaption}>
                    {cpmValue !== null ? `CPM €${cpmValue.toLocaleString()} · ` : ''}
                    {brandingValue !== null ? `Branding €${brandingValue.toLocaleString()}` : ''}
                  </span>
                </div>
              </div>
              {totalTouchpoints > 0 && (
                <div className={styles.bentoVenueRow}>
                  <div className={styles.bentoVenueHead}>
                    <span className={styles.gdsBody}><strong>QR + Short URL vs. Social</strong></span>
                    <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>
                      {qrUrlWeight.toLocaleString()} QR/URL · {social.toLocaleString()} Social
                    </span>
                  </div>
                  <div className={styles.bentoBarTrackWrap}>
                    <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                      <rect
                        x="0"
                        y="0"
                        width={Math.max(2, Math.round((qrUrlWeight / totalTouchpoints) * 100))}
                        height="8"
                        rx="0"
                        className={styles.bentoBarFillRect}
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
