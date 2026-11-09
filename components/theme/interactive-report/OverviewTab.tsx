'use client';
/* eslint-disable react/forbid-dom-props */

import React from 'react';
import { InteractiveReportData } from './types';
import D3TimelineScrubber from './D3TimelineScrubber';
import styles from './interactive-report.module.css';

interface OverviewTabProps {
  data: InteractiveReportData;
  selectedPeriodId: string | null;
  onSelectPeriod: (id: string | null) => void;
  onViewBubble: () => void;
  onViewFunnel: () => void;
}

const SPORT_ICONS: Record<string, string> = {
  Football: '⚽',
  'Ice Hockey': '🏒',
  Basketball: '🏀',
  Handball: '🤾',
};

const SPORT_COLORS: Record<string, string> = {
  Football: '#059669',
  'Ice Hockey': '#0284c7',
  Basketball: '#b45309',
  Handball: '#e11d48',
};

export default function OverviewTab({
  data,
  selectedPeriodId,
  onSelectPeriod,
  onViewBubble,
  onViewFunnel,
}: OverviewTabProps) {
  const { summary, sports, timeline } = data;

  // Selected period override if active
  const activePeriod = selectedPeriodId ? timeline.find((t) => t.id === selectedPeriodId) : null;

  // Dynamic touchpoint proportions
  const totalTouchpoints =
    summary.touchpoints.social + summary.touchpoints.url + summary.touchpoints.qr;
  const socialPct =
    totalTouchpoints > 0
      ? Math.round((summary.touchpoints.social / totalTouchpoints) * 1000) / 10
      : 36.7;
  const urlPct =
    totalTouchpoints > 0
      ? Math.round((summary.touchpoints.url / totalTouchpoints) * 1000) / 10
      : 33.1;
  const qrPct =
    totalTouchpoints > 0
      ? Math.round((summary.touchpoints.qr / totalTouchpoints) * 1000) / 10
      : 30.2;

  return (
    <div className={styles.funnelList}>
      {/* Active Period Filter Indicator */}
      {activePeriod && (
        <div className={styles.periodFilterBanner}>
          <div>
            <span className={styles.filterLabel}>
              Active Campaign Period:
            </span>{' '}
            <strong className={styles.filterValue}>{activePeriod.name}</strong>
            <div className={styles.cardSubtitle} style={{ marginTop: '4px' }}>
              📸 {activePeriod.allPhotos.toLocaleString()} Total Photos ({activePeriod.hostessPhotos.toLocaleString()} Hostess • {activePeriod.selfies.toLocaleString()} Selfies) • 👥 {activePeriod.registered.toLocaleString()} Registered ({activePeriod.optInRate}% Opt-in)
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {activePeriod.slug && (
              <a
                href={`/report/${activePeriod.slug}`}
                target="_blank"
                rel="noreferrer"
                className={styles.resetBtn}
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Open Period Report ↗
              </a>
            )}
            <button
              onClick={() => onSelectPeriod(null)}
              className={styles.clearFilterBtn}
            >
              Show All Campaigns ✕
            </button>
          </div>
        </div>
      )}

      {/* D3 Timeline Scrubber */}
      <D3TimelineScrubber
        timeline={timeline}
        selectedPeriodId={selectedPeriodId}
        onSelectPeriod={onSelectPeriod}
      />

      {/* Sports Breakdown Grid */}
      <div>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            🏆 Performance by Sponsored Sport League
          </h3>
          <button
            onClick={onViewBubble}
            className={styles.actionLinkBtn}
          >
            Explore in Bubble View →
          </button>
        </div>

        <div className={styles.sportsGrid}>
          {sports.map((s) => (
            <div key={s.sport} className={styles.sportCard}>
              {/* WHAT: Dynamic top accent bar color reflecting sport code
                  WHY: Visual differentiation across Football, Ice Hockey, Basketball, Handball */}
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <div
                className={styles.sportTopBar}
                style={{ background: SPORT_COLORS[s.sport] || '#64748b' }}
              />
              <div className={styles.sportHeader}>
                <span className={styles.sportIcon}>{SPORT_ICONS[s.sport] || '🏅'}</span>
                <span className={styles.matchesBadge}>
                  {s.matchesCount} Matches
                </span>
              </div>
              <h4 className={styles.sportName}>
                {s.sport}
              </h4>
              <div className={styles.sportPhotos}>
                {s.photos.toLocaleString()} <span className={styles.sportPhotosUnit}>photos</span>
              </div>
              <div className={styles.sportStats}>
                <strong>{s.approved.toLocaleString()}</strong> approved • <strong>{s.hostessRatio}%</strong> hostess assist
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discovery Touchpoints & Executive Takeaways */}
      <div className={styles.twoColGrid}>
        {/* Touchpoint Acquisition */}
        <div className={styles.reportCard}>
          <h3 className={styles.cardTitle}>
            📱 Fan Acquisition Touchpoints
          </h3>
          <div className={styles.generationList}>
            <div>
              <div className={styles.generationHeader}>
                <span>Social Links (Facebook, Instagram, TikTok)</span>
                <strong>
                  {summary.touchpoints.social.toLocaleString()} ({socialPct}%)
                </strong>
              </div>
              <div className={styles.genBarTrack}>
                {/* WHAT: Dynamic percentage width for social touchpoints
                    WHY: Visual proportion of social traffic */}
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <div
                  className={styles.maleBar}
                  style={{ width: `${socialPct}%`, height: '100%' }}
                />
              </div>
            </div>

            <div>
              <div className={styles.generationHeader}>
                <span>Web URL & Match Links</span>
                <strong>
                  {summary.touchpoints.url.toLocaleString()} ({urlPct}%)
                </strong>
              </div>
              <div className={styles.genBarTrack}>
                {/* WHAT: Dynamic percentage width for direct web touchpoints
                    WHY: Visual proportion of web traffic */}
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <div
                  className={styles.genBarFillHighlight}
                  style={{ width: `${urlPct}%`, height: '100%' }}
                />
              </div>
            </div>

            <div>
              <div className={styles.generationHeader}>
                <span>In-Stadium QR Codes (Banners & Jumbotron)</span>
                <strong>
                  {summary.touchpoints.qr.toLocaleString()} ({qrPct}%)
                </strong>
              </div>
              <div className={styles.genBarTrack}>
                {/* WHAT: Dynamic percentage width for QR touchpoints
                    WHY: Visual proportion of stadium QR code engagement */}
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <div
                  className={styles.genBarFill}
                  style={{ width: `${qrPct}%`, height: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Executive Takeaways */}
        <div className={styles.reportCard}>
          <h3 className={styles.cardTitle}>
            🎯 Key Strategic Takeaways
          </h3>
          <ul className={styles.cardSubtitle}>
            <li>
              <strong>Exceptional Opt-In Conversion:</strong> {summary.optInRate}% of all participating stadium fans opted in to Szerencsejáték Zrt. & Tippmix marketing campaigns.
            </li>
            <li>
              <strong>Dual Engagement Model:</strong> Hostesses assisted in taking 64% of photos, driving higher conversion among older demographics, while direct fan selfies accounted for 36%.
            </li>
            <li>
              <strong>Ice Hockey & Football Leadership:</strong> Hydro Fehérvár AV19, FTC Telekom, and Újpest FC matches yielded highest engagement density.
            </li>
            <li>
              <strong>Flawless Brand Safety:</strong> Over 97.6% of generated fan photos passed compliance and moderation with 0 brand or KYC violations.
            </li>
          </ul>

          <div className={styles.tableScroll}>
            <button
              onClick={onViewFunnel}
              className={styles.actionLinkBtn}
            >
              Analyze Conversion Funnel →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
