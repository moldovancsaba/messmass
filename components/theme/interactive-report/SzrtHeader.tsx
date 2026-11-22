'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState } from 'react';
import { InteractiveReportData } from './types';
import { getReportSlug } from './reportSlug';
import type { DashboardTab } from './InteractiveReportDashboard';
import type { HashtagReport } from '@/lib/hashtagReport/types';
import { proofNameKey } from '@/lib/hashtagReport/cameraProof';
import { isSportFranchise, isVenue, mergeBrandVariants } from '@/lib/brandEntityClustering';
import styles from './interactive-report.module.css';

interface SzrtHeaderProps {
  data: InteractiveReportData;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  /** The Fanmass report: Fanmass header figures and tabs only (InteractiveReportDashboard). */
  fanmass?: HashtagReport;
}

export default function SzrtHeader({ data, activeTab, onTabChange, fanmass }: SzrtHeaderProps) {
  const [copied, setCopied] = useState(false);
  const { summary, partner, scope } = data;

  const isHashtag = scope?.type === 'hashtag';
  const isEvent = scope?.type === 'event';
  const isFilter = scope?.type === 'filter';
  const isOrganization = scope?.type === 'organization';

  const badgeText = isOrganization
    ? 'Organization Report'
    : isHashtag
      ? 'Campaign Analytics Report'
      : isFilter
        ? 'Campaign Filter Report'
        : isEvent
          ? 'Event Activation Report'
          : 'Interactive Analytics Report';

  const subBadgeText = isFilter && scope?.hashtags && scope.hashtags.length > 0
    ? scope.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')
    : null;

  const titleText = scope?.name || partner.name;
  const descriptionText =
    scope?.subtitle ||
    (summary.totalMatches > 0
      ? `Fan engagement, photo volume and marketing opt-in metrics across ${summary.totalMatches.toLocaleString()} ${summary.totalMatches === 1 ? 'event' : 'events'}.`
      : null);

  const reportSlug = getReportSlug(data);
  // The dedicated map page reads the clicker matches; the Fanmass report keeps its map in the Territory tab
  const mapHref = reportSlug && !fanmass ? `/interactive-report/${reportSlug}/map` : null;
  const emoji = scope?.emoji || partner.emoji;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Names read in the drive photos and in the Camera photos, each name once
  const brandsRead = fanmass
    ? [...fanmass.measured.drive.brands, ...fanmass.measured.photos.brands]
        .reduce<Array<{ name: string; count: number }>>((list, row) => {
          const found = list.find((item) => proofNameKey(item.name) === proofNameKey(row.name));
          if (found) found.count += row.count;
          else list.push({ ...row });
          return list;
        }, [])
        .sort((a, b) => b.count - a.count)
    : [];
  const optIn = fanmass ? fanmass.calculated.photoOptInShare : null;

  const vision = data.vision;
  const rawTopBrands = vision?.aggregates?.topBrands;
  const commercialBrands = React.useMemo(() => {
    const raw = rawTopBrands || [];
    if (raw.length === 0) {
      return brandsRead.map((b) => ({ brand: b.name, count: b.count }));
    }
    return mergeBrandVariants(
      raw.filter((b) => b.brand && b.count > 0 && !isSportFranchise(b.brand) && !isVenue(b.brand))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawTopBrands, fanmass]);

  const hasTerritoryData = (data.matches?.length ?? 0) > 0 || !!vision;
  const visionLabel =
    vision && vision.totalImages > 0
      ? `Fan Photo & Brand Proof (${vision.processedCount.toLocaleString()}/${vision.totalImages.toLocaleString()})`
      : 'Fan Photo & Brand Proof';

  const tabs: Array<{ id: typeof activeTab; label: string; icon: string }> = fanmass ? [
    ...(vision ? [{ id: 'overview' as const, label: 'Executive Overview', icon: '🏆' }] : []),
    ...(vision ? [{ id: 'vision' as const, label: visionLabel, icon: '📸' }] : []),
    ...((data.matches?.length ?? 0) > 0 ? [{ id: 'table' as const, label: `Matches & Event Reports (${data.matches.length})`, icon: '⚽' }] : []),
    ...(hasTerritoryData ? [{ id: 'territory' as const, label: 'Territory Map', icon: '🗺️' }] : []),
    { id: 'figures', label: 'Data Audit & Figures', icon: '📋' },
  ] : [
    { id: 'overview', label: 'Executive Overview', icon: '📊' },
    // The vision tab only exists for scopes that have vision data.
    ...(vision ? [{ id: 'vision' as const, label: visionLabel, icon: '📸' }] : []),
    ...(hasTerritoryData ? [{ id: 'territory' as const, label: 'Territory Map', icon: '🗺️' }] : []),
    { id: 'bubble', label: 'Match Explorer', icon: '🫧' },
    { id: 'funnel', label: 'Marketing Funnel', icon: '📈' },
    { id: 'demographics', label: 'Audience Demographics', icon: '👥' },
    { id: 'table', label: 'All Match Data', icon: '📋' },
  ];

  return (
    <header className={styles.headerContainer}>
      {/* Brand Hero Banner */}
      <div className={styles.brandHero}>
        <div className={styles.brandTop}>
          <div>
            <div className={styles.brandTitleGroup}>
              {partner.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={partner.logoUrl}
                  alt={titleText}
                  style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '10px', background: 'rgba(255,255,255,0.92)', padding: '4px' }}
                />
              ) : (
                emoji && <span className={styles.partnerEmoji}>{emoji}</span>
              )}
              <span className={styles.badgePill}>
                {badgeText}
              </span>
              {subBadgeText && (
                <span className={styles.tippmixPill}>
                  {subBadgeText}
                </span>
              )}
            </div>
            <h1 className={styles.partnerTitle}>
              {titleText}
            </h1>
            {descriptionText && (
              <p className={styles.partnerDescription}>
                {descriptionText}
              </p>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className={styles.actionsGroup}>
            {mapHref && (
              <a
                href={mapHref}
                className={styles.mapActionBtn}
                title="Open dedicated full-screen territory and venue analytics map"
              >
                🗺️ Territory Map ➔
              </a>
            )}
            <button onClick={handleCopyLink} className={styles.shareActionBtn}>
              🔗 {copied ? 'Copied Link!' : 'Share Report'}
            </button>
            <button onClick={() => window.print()} className={styles.printActionBtn}>
              🖨️ Print / PDF
            </button>
          </div>
        </div>

        {/* High-level KPI Cards Strip: every value comes from the report data, n/a when nothing is stored */}
        {fanmass ? (
          /* Fanmass figures only: what the local AI measured (lib/hashtagReport), n/a when nothing is measured */
          <div className={styles.kpiGrid}>
            {(() => {
              const photosVal = vision?.processedCount ?? (fanmass.measured.drive.analysed + fanmass.measured.photos.analysed);
              const peopleVal = vision?.aggregates?.totalPeople ?? (fanmass.measured.drive.people + fanmass.measured.photos.people.measured);
              const peoplePerPhoto = photosVal > 0 && peopleVal > 0 ? (peopleVal / photosVal).toFixed(2) : null;
              const tileClasses = [styles.kpiTile1, styles.kpiTile2, styles.kpiTile3, styles.kpiTile4, styles.kpiTile5, styles.kpiTile6];
              const cards: Array<{ label: string; valueText: string; subtext: string | null }> = [
                {
                  label: 'Analysed Fan Photos',
                  valueText: photosVal > 0 ? photosVal.toLocaleString() : 'n/a',
                  subtext: vision && vision.totalImages > 0 ? `of ${vision.totalImages.toLocaleString()} total photos` : null,
                },
                {
                  label: 'People Detected',
                  valueText: peopleVal > 0 ? peopleVal.toLocaleString() : 'n/a',
                  subtext: peoplePerPhoto ? `${peoplePerPhoto} people / photo` : null,
                },
                {
                  label: 'Brands Detected',
                  valueText: commercialBrands.length > 0 ? commercialBrands.length.toLocaleString() : 'n/a',
                  subtext: commercialBrands[0] ? `Top: ${commercialBrands[0].brand} (${commercialBrands[0].count.toLocaleString()})` : null,
                },
                {
                  label: 'Events',
                  valueText: fanmass.coverage.events > 0 ? fanmass.coverage.events.toLocaleString() : 'n/a',
                  subtext: `${data.matches?.length ?? fanmass.coverage.events} fixtures in scope`,
                },
              ];
              if (optIn) {
                cards.push({
                  label: 'PP, GTC & Image Rights',
                  valueText: optIn.value !== null ? `${optIn.value}%` : 'Not measured',
                  subtext: optIn.numerator !== null && optIn.denominator !== null
                    ? `${optIn.numerator.toLocaleString()} of ${optIn.denominator.toLocaleString()} ${optIn.basis}`
                    : null,
                });
              }
              if (vision?.marketingOptInImages !== undefined && (vision.optInImages ?? 0) > 0) {
                cards.push({
                  label: 'Marketing Opt-in',
                  valueText: `${Math.round((vision.marketingOptInImages / (vision.optInImages || 1)) * 1000) / 10}%`,
                  subtext: `${vision.marketingOptInImages.toLocaleString()} of ${(vision.optInImages || 0).toLocaleString()} consented`,
                });
              }
              return cards.map((card, i) => (
                <div key={card.label} className={`${styles.kpiCard} ${tileClasses[i % tileClasses.length]}`}>
                  <span className={styles.kpiLabel}>{card.label}</span>
                  <span className={card.valueText === 'Not measured' ? styles.kpiValueStatus : styles.kpiValue}>
                    {card.valueText}
                  </span>
                  {card.subtext && <span className={styles.kpiSubtext}>{card.subtext}</span>}
                </div>
              ));
            })()}
          </div>
        ) : (
        <div className={styles.kpiGrid}>
          <div className={`${styles.kpiCard} ${styles.kpiTile1}`}>
            <span className={styles.kpiLabel}>Total Photos Taken</span>
            <span className={styles.kpiValue}>
              {summary.totalPhotos > 0 ? summary.totalPhotos.toLocaleString() : 'n/a'}
            </span>
            {summary.totalPhotos > 0 && summary.hostessPhotos > 0 && summary.selfies > 0 && (
              <span className={styles.kpiSubtext}>
                {summary.hostessShare}% Hostess • {summary.selfieShare}% Fan Selfies
              </span>
            )}
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiTile2}`}>
            <span className={styles.kpiLabel}>Fan Registrations</span>
            <span className={styles.kpiValue}>
              {summary.totalRegistered > 0 ? summary.totalRegistered.toLocaleString() : 'n/a'}
            </span>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiTile3}`}>
            <span className={styles.kpiLabel}>Marketing Opt-In</span>
            {/* The stored count is the figure; the rate is shown under it only when it can be derived from the stored counts */}
            <span className={styles.kpiValue}>
              {summary.totalOptIns > 0 ? summary.totalOptIns.toLocaleString() : 'n/a'}
            </span>
            {summary.optInRate !== null ? (
              <span className={styles.kpiSubtext}>{summary.optInRate}% of registrations</span>
            ) : summary.totalOptIns > summary.totalRegistered && summary.totalRegistered > 0 ? (
              <span className={styles.kpiSubtext}>
                Rate not shown: more opt-ins than registrations ({summary.totalRegistered.toLocaleString()}) are stored
              </span>
            ) : null}
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiTile4}`}>
            <span className={styles.kpiLabel}>Vetting Approval</span>
            <span className={styles.kpiValue}>
              {summary.vettingApprovalRate !== null ? `${summary.vettingApprovalRate}%` : 'n/a'}
            </span>
            {summary.vettingApprovalRate !== null && (
              <span className={styles.kpiSubtext}>Approved of submitted photos</span>
            )}
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiTile5}`}>
            <span className={styles.kpiLabel}>People / Photo</span>
            <span className={styles.kpiValue}>
              {vision && vision.processedCount > 0 && (vision.aggregates?.totalPeople ?? 0) > 0
                ? ((vision.aggregates?.totalPeople ?? 0) / vision.processedCount).toFixed(2)
                : 'n/a'}
            </span>
            {vision && (vision.aggregates?.totalPeople ?? 0) > 0 && (
              <span className={styles.kpiSubtext}>
                {(vision.aggregates?.totalPeople ?? 0).toLocaleString()} detected appearances
              </span>
            )}
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiTile6}`}>
            <span className={styles.kpiLabel}>Events</span>
            <span className={styles.kpiValue}>
              {summary.totalMatches > 0 ? summary.totalMatches.toLocaleString() : 'n/a'}
            </span>
          </div>
        </div>
        )}
      </div>

      {/* Navigation Tab Pills */}
      <nav className={styles.tabNav} role="tablist" aria-label="Report sections">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
