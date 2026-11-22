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
      const isHome = isPartnerScope && partnerName ? clubMatchesSide(parts[0] || '', partnerName) : true;
      const isAway = isPartnerScope && partnerName ? (!isHome && clubMatchesSide(parts[1] || '', partnerName)) : false;

      const att = m.attendance && m.attendance > 0 ? m.attendance : 0;
      const cap = m.venueCapacity && m.venueCapacity > 0 ? m.venueCapacity : 0;
      const outcome = m.outcome ?? (
        m.homeScore !== null && m.homeScore !== undefined && m.visitorScore !== null && m.visitorScore !== undefined
          ? (m.homeScore > m.visitorScore ? 'home_win' : m.homeScore < m.visitorScore ? 'away_win' : 'draw')
          : undefined
      );

      if (isAway) {
        awayCount++;
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
    const visualReachPct = totalAtt > 0 && totalPeopleDetected > 0
      ? Math.round((totalPeopleDetected / totalAtt) * 1000) / 10
      : 0;

    return {
      homeCount,
      awayCount,
      homeAvgAtt: homeAttMatches > 0 ? Math.round(homeAttSum / homeAttMatches) : 0,
      homeFillPct: homeCapSum > 0 ? Math.round((homeAttSum / homeCapSum) * 1000) / 10 : 0,
      awayAvgAtt: awayAttMatches > 0 ? Math.round(awayAttSum / awayAttMatches) : 0,
      awayFillPct: awayCapSum > 0 ? Math.round((awayAttSum / awayCapSum) * 1000) / 10 : 0,
      homeRecord: `${homeW}W - ${homeD}D - ${homeL}L`,
      awayRecord: `${awayW}W - ${awayD}D - ${awayL}L`,
      avgPhotosPerMatch,
      avgPeoplePerMatch,
      fansPerPhoto,
      visualReachPct,
    };
  }, [matches, isPartnerScope, partnerName, totalPhotosProcessed, totalPeopleDetected]);

  if (!insights) return null;

  return (
    <div className={`${styles.executiveCard} ${styles.gdsStack}`}>
      <div className={styles.gdsRowBetween}>
        <div>
          <div className={styles.gdsEyebrow}>Sports Executive Intelligence</div>
          <h3 className={styles.gdsCardTitle}>Matchday Activation Efficiency &amp; Home/Away Split</h3>
        </div>
        <span className={styles.gdsCaption}>
          Empirical matchday turnout, capture density, and sponsor reach per fixture
        </span>
      </div>

      <div className={styles.suiteGrid4}>
        <div className={styles.gdsSubCard}>
          <div className={styles.gdsEyebrow}>Visual Capture Efficiency</div>
          <div className={styles.gdsSectionKpi}>{insights.visualReachPct}%</div>
          <div className={styles.gdsCaption}>
            {totalPeopleDetected.toLocaleString()} fans captured across gate turnout • {insights.fansPerPhoto} fans/photo
          </div>
        </div>

        <div className={styles.gdsSubCard}>
          <div className={styles.gdsEyebrow}>Avg Matchday Output</div>
          <div className={styles.gdsSectionKpi}>
            {insights.avgPhotosPerMatch.toLocaleString()} <span className={styles.gdsCaption}>photos</span>
          </div>
          <div className={styles.gdsCaption}>
            {insights.avgPeoplePerMatch.toLocaleString()} people/match • {totalBrandsDetected} commercial brands detected
          </div>
        </div>

        {insights.homeCount > 0 && (
          <div className={styles.gdsSubCard}>
            <div className={styles.gdsEyebrow}>Home Fixtures ({insights.homeCount})</div>
            <div className={styles.gdsSectionKpi}>
              {insights.homeAvgAtt.toLocaleString()} <span className={styles.gdsCaption}>avg gate</span>
            </div>
            <div className={styles.gdsCaption}>
              {insights.homeFillPct}% avg stadium fill • Record: <strong>{insights.homeRecord}</strong>
            </div>
          </div>
        )}

        {isPartnerScope && insights.awayCount > 0 && (
          <div className={styles.gdsSubCard}>
            <div className={styles.gdsEyebrow}>Away Fixtures ({insights.awayCount})</div>
            <div className={styles.gdsSectionKpi}>
              {insights.awayAvgAtt.toLocaleString()} <span className={styles.gdsCaption}>avg gate</span>
            </div>
            <div className={styles.gdsCaption}>
              {insights.awayFillPct}% avg stadium fill • Record: <strong>{insights.awayRecord}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
