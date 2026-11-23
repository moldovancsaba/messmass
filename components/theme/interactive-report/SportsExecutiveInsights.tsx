'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useMemo } from 'react';
import { MatchItem } from './types';
import styles from './interactive-report.module.css';

interface SportsExecutiveInsightsProps {
  matches: MatchItem[];
  partnerName?: string;
  scopeType?: string;
  totalPhotosProcessed: number;
  totalPeopleDetected: number;
  totalBrandsDetected: number;
}

function clubMatchesSide(side: string, partnerName: string): boolean {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const s = norm(side);
  const p = norm(partnerName);
  if (!s || !p) return false;
  if (s.includes(p) || p.includes(s)) return true;
  const words = partnerName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter((w) => w.length >= 3 && !['fc', 'sc', 'kc', 'hc', 'budapest', 'sport'].includes(w));
  return words.some((w) => s.includes(w));
}

export default function SportsExecutiveInsights({
  matches,
  partnerName,
  scopeType,
  totalPhotosProcessed,
  totalPeopleDetected,
  totalBrandsDetected,
}: SportsExecutiveInsightsProps) {
  const isPartnerScope = scopeType === 'partner' && Boolean(partnerName);

  const insights = useMemo(() => {
    if (!matches || matches.length === 0) return null;

    let homeCount = 0;
    let awayCount = 0;
    let homePhotos = 0;
    let awayPhotos = 0;
    let homeAttSum = 0;
    let homeAttMatches = 0;
    let homeCapSum = 0;
    let awayAttSum = 0;
    let awayAttMatches = 0;
    let awayCapSum = 0;
    let homeW = 0;
    let homeD = 0;
    let homeL = 0;
    let awayW = 0;
    let awayD = 0;
    let awayL = 0;

    for (const m of matches) {
      const parts = (m.cleanName || m.matchName || '').split(/\s+(?:x|vs\.?)\s+|\s*#\s*/i);
      const isHomeByRole = m.partnerRole === 'home';
      const isAwayByRole = m.partnerRole === 'away';
      const isHome = isPartnerScope && partnerName
        ? (isHomeByRole ? true : isAwayByRole ? false : clubMatchesSide(parts[0] || '', partnerName))
        : true;
      const isAway = isPartnerScope && partnerName
        ? (isAwayByRole ? true : isHomeByRole ? false : (!isHome && clubMatchesSide(parts[1] || '', partnerName)))
        : false;

      const att = m.attendance && m.attendance > 0 ? m.attendance : 0;
      const cap = m.venueCapacity && m.venueCapacity > 0 ? m.venueCapacity : 0;
      const outcome = m.outcome ?? (
        m.homeScore !== null && m.homeScore !== undefined && m.visitorScore !== null && m.visitorScore !== undefined
          ? (m.homeScore > m.visitorScore ? 'home_win' : m.homeScore < m.visitorScore ? 'away_win' : 'draw')
          : undefined
      );

      if (isAway) {
        awayCount++;
        awayPhotos += m.submitted || 0;
        if (att > 0) {
          awayAttSum += att;
          awayAttMatches++;
          if (cap > 0) awayCapSum += cap;
        }
        if (outcome === 'away_win') awayW++;
        else if (outcome === 'draw') awayD++;
        else if (outcome === 'home_win') awayL++;
      } else {
        homeCount++;
        homePhotos += m.submitted || 0;
        if (att > 0) {
          homeAttSum += att;
          homeAttMatches++;
          if (cap > 0) homeCapSum += cap;
        }
        if (outcome === 'home_win') homeW++;
        else if (outcome === 'draw') homeD++;
        else if (outcome === 'away_win') homeL++;
      }
    }

    const totalEvents = matches.length;
    const avgPhotosPerMatch = totalEvents > 0 ? Math.round(totalPhotosProcessed / totalEvents) : 0;
    const avgPeoplePerMatch = totalEvents > 0 ? Math.round(totalPeopleDetected / totalEvents) : 0;
    const fansPerPhoto = totalPhotosProcessed > 0 ? (totalPeopleDetected / totalPhotosProcessed).toFixed(1) : '0.0';
    const totalAtt = homeAttSum + awayAttSum;
    const allAttMatches = homeAttMatches + awayAttMatches;
    const allCapSum = homeCapSum + awayCapSum;
    const visualReachPct = totalAtt > 0 && totalPeopleDetected > 0
      ? Math.round((totalPeopleDetected / totalAtt) * 1000) / 10
      : 0;

    return {
      homeCount,
      awayCount,
      homePhotos,
      awayPhotos,
      allPhotos: homePhotos + awayPhotos,
      homeAvgPhotos: homeCount > 0 ? Math.round(homePhotos / homeCount) : 0,
      allAvgPhotos: totalEvents > 0 ? Math.round((homePhotos + awayPhotos) / totalEvents) : 0,
      homeAvgAtt: homeAttMatches > 0 ? Math.round(homeAttSum / homeAttMatches) : 0,
      homeFillPct: homeCapSum > 0 ? Math.round((homeAttSum / homeCapSum) * 1000) / 10 : 0,
      allAvgAtt: allAttMatches > 0 ? Math.round(totalAtt / allAttMatches) : 0,
      allFillPct: allCapSum > 0 ? Math.round((totalAtt / allCapSum) * 1000) / 10 : 0,
      awayAvgAtt: awayAttMatches > 0 ? Math.round(awayAttSum / awayAttMatches) : 0,
      awayFillPct: awayCapSum > 0 ? Math.round((awayAttSum / awayCapSum) * 1000) / 10 : 0,
      homeRecord: `${homeW}W - ${homeD}D - ${homeL}L`,
      allRecord: `${homeW + awayW}W - ${homeD + awayD}D - ${homeL + awayL}L`,
      awayRecord: `${awayW}W - ${awayD}D - ${awayL}L`,
      avgPhotosPerMatch,
      avgPeoplePerMatch,
      fansPerPhoto,
      visualReachPct,
    };
  }, [matches, isPartnerScope, partnerName, totalPhotosProcessed, totalPeopleDetected]);

  if (!insights) return null;

  return (
    <article className={styles.bentoPanel}>
      <header className={styles.bentoPanelHeader}>
        <div className={styles.bentoPanelTitle}>
          <span className={styles.bentoPanelIcon} aria-hidden="true">🎯</span>
          <h2 className={styles.gdsCardTitle}>Matchday activation efficiency &amp; home/away split</h2>
        </div>
        <span className={styles.bentoPanelStatus}>
          {matches.length} {matches.length === 1 ? 'fixture' : 'fixtures'}
        </span>
      </header>

      <div className={`${styles.bentoPanelBody} ${styles.gdsStack}`}>
        {isPartnerScope && insights.awayCount > 0 ? (
          <>
            <div className={styles.bentoFourCol}>
              <div className={styles.bentoSummaryStat}>
                <div className={styles.gdsEyebrow}>Home fixtures (Primary)</div>
                <div className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                  {insights.homeCount} <span className={styles.gdsCaption}>matches</span>
                </div>
                <div className={styles.gdsCaption}>
                  {insights.homePhotos.toLocaleString()} photos ({insights.homeAvgPhotos.toLocaleString()}/match)
                </div>
              </div>

              <div className={styles.bentoSummaryStat}>
                <div className={styles.gdsEyebrow}>Home avg gate &amp; record</div>
                <div className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                  {insights.homeAvgAtt.toLocaleString()} <span className={styles.gdsCaption}>avg gate</span>
                </div>
                <div className={styles.gdsCaption}>
                  {insights.homeFillPct}% avg fill • <strong>{insights.homeRecord}</strong>
                </div>
              </div>

              <div className={styles.bentoSummaryStat}>
                <div className={styles.gdsEyebrow}>All fixtures (incl. Team 2)</div>
                <div className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                  {matches.length} <span className={styles.gdsCaption}>matches</span>
                </div>
                <div className={styles.gdsCaption}>
                  {insights.allPhotos.toLocaleString()} photos ({insights.allAvgPhotos.toLocaleString()}/match) · +{insights.awayCount} away
                </div>
              </div>

              <div className={styles.bentoSummaryStat}>
                <div className={styles.gdsEyebrow}>All avg gate &amp; record</div>
                <div className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                  {insights.allAvgAtt.toLocaleString()} <span className={styles.gdsCaption}>avg gate</span>
                </div>
                <div className={styles.gdsCaption}>
                  {insights.allFillPct}% avg fill • <strong>{insights.allRecord}</strong>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.bentoFourCol}>
            <div className={styles.bentoSummaryStat}>
              <div className={styles.gdsEyebrow}>Visual capture efficiency</div>
              <div className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>{insights.visualReachPct}%</div>
              <div className={styles.gdsCaption}>
                {totalPeopleDetected.toLocaleString()} fans captured • {insights.fansPerPhoto} fans/photo
              </div>
            </div>

            <div className={styles.bentoSummaryStat}>
              <div className={styles.gdsEyebrow}>Avg matchday output</div>
              <div className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                {insights.avgPhotosPerMatch.toLocaleString()} <span className={styles.gdsCaption}>photos</span>
              </div>
              <div className={styles.gdsCaption}>
                {insights.avgPeoplePerMatch.toLocaleString()} people/match • {totalBrandsDetected} brands
              </div>
            </div>

            {insights.homeCount > 0 && (
              <div className={styles.bentoSummaryStat}>
                <div className={styles.gdsEyebrow}>Home fixtures ({insights.homeCount})</div>
                <div className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                  {insights.homeAvgAtt.toLocaleString()} <span className={styles.gdsCaption}>avg gate</span>
                </div>
                <div className={styles.gdsCaption}>
                  {insights.homeFillPct}% avg fill • <strong>{insights.homeRecord}</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
