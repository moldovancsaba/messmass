'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useEffect, useState } from 'react';
import { VisionProgressData } from './types';
import styles from './interactive-report.module.css';

interface FanmassVisionSectionProps {
  vision: VisionProgressData;
  partnerSlug?: string;
}

export default function FanmassVisionSection({
  vision: initialVision,
  partnerSlug = 'szrt',
}: FanmassVisionSectionProps) {
  const [vision, setVision] = useState<VisionProgressData>(initialVision);

  // Poll for live stream updates every 4 seconds while running
  useEffect(() => {
    if (vision.status !== 'running') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/interactive-report/${partnerSlug}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data?.vision) {
            setVision(json.data.vision);
          }
        }
      } catch {
        // Silently continue polling on network jitter
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [vision.status, partnerSlug]);

  const { aggregates, recentImages } = vision;
  const isRunning = vision.status === 'running';

  return (
    <div className={styles.visionCard}>
      {/* Live Stream Banner Header */}
      <div className={styles.visionHeader}>
        <div className={styles.visionTitleWrap}>
          <div className={styles.visionBeaconRow}>
            <span className={`${styles.liveBeacon} ${isRunning ? styles.liveBeaconActive : ''}`} />
            <span className={styles.liveBadge}>
              {isRunning ? 'FANMASS AI VISION STREAM (LIVE)' : 'FANMASS VISION ANALYSIS'}
            </span>
            <span className={styles.visionSportChip}>
              🏀 Football • Ice Hockey • Basketball • Handball
            </span>
          </div>
          <h2 className={styles.visionTitle}>
            Computer Vision & Multi-Sport Fan Intelligence
          </h2>
          <p className={styles.visionSubtitle}>
            Continuous automated identification of brands, genders, age, emotions, and clubs across all SZRT sports events.
          </p>
        </div>

        {/* Live Counter Badge */}
        <div className={styles.visionProgressStats}>
          <div className={styles.visionCounterVal}>
            {vision.processedCount.toLocaleString()}{' '}
            <span className={styles.visionCounterTotal}>
              of {vision.totalImages.toLocaleString()}
            </span>
          </div>
          <div className={styles.visionCounterPercent}>
            {vision.percent}% processed
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.visionTrack}>
        {/* WHAT: Dynamic progress bar showing real-time processed image percentage
            WHY: Visual indicator of current ingestion pipeline status */}
        <div
          className={styles.visionFill}
          style={{ width: `${Math.max(1.5, Math.min(100, vision.percent))}%` }}
        />
      </div>

      {/* Active File Inspection Notice */}
      <div className={styles.activeFileBar}>
        <div className={styles.activeFileInfo}>
          <span className={styles.activeFileLabel}>Analyzing Now:</span>{' '}
          <strong className={styles.activeFileName}>
            {vision.currentSport} / {vision.currentFile || 'Scanning batch...'}
          </strong>
        </div>
        <div className={styles.activeFileMeta}>
          Total Identified Spectators: <strong>{aggregates.totalPeople.toLocaleString()}</strong>
        </div>
      </div>

      {/* 4 Pillars Analytics Grid */}
      <div className={styles.visionGrid}>
        {/* Card 1: Genders & Demographics */}
        <div className={styles.visionMiniCard}>
          <div className={styles.miniCardIcon}>👥</div>
          <div className={styles.miniCardTitle}>Genders & Age Distribution</div>
          <div className={styles.miniCardVal}>
            {aggregates.genders.malePct}% M / {aggregates.genders.femalePct}% F
          </div>
          <div className={styles.miniCardSub}>
            {aggregates.genders.male} Male • {aggregates.genders.female} Female
          </div>
          <div className={styles.agePillsGroup}>
            <span className={styles.agePill}>
              Adults: {aggregates.ageGroups.adults}
            </span>
            <span className={styles.agePill}>
              Teens: {aggregates.ageGroups.teens}
            </span>
            <span className={styles.agePill}>
              Children: {aggregates.ageGroups.children}
            </span>
            <span className={styles.agePill}>
              Seniors: {aggregates.ageGroups.seniors}
            </span>
          </div>
        </div>

        {/* Card 2: Identified Brands & Sponsors */}
        <div className={styles.visionMiniCard}>
          <div className={styles.miniCardIcon}>🏷️</div>
          <div className={styles.miniCardTitle}>Identified Brands & Sponsors</div>
          <div className={styles.miniCardVal}>
            {aggregates.topBrands.length > 0 ? aggregates.topBrands[0].brand : 'Scanning...'}
          </div>
          <div className={styles.miniCardSub}>
            {aggregates.topBrands.length} distinct sponsor & apparel brands detected
          </div>
          <div className={styles.tagChipsWrap}>
            {aggregates.topBrands.slice(0, 6).map((b) => (
              <span key={b.brand} className={styles.brandChip}>
                {b.brand} ({b.count})
              </span>
            ))}
          </div>
        </div>

        {/* Card 3: Emotions & Fan Valence */}
        <div className={styles.visionMiniCard}>
          <div className={styles.miniCardIcon}>😊</div>
          <div className={styles.miniCardTitle}>Emotions & Atmosphere</div>
          <div className={styles.miniCardVal}>
            {aggregates.topEmotions.length > 0 ? aggregates.topEmotions[0].emotion : 'Joy / Cheering'}
          </div>
          <div className={styles.miniCardSub}>
            Facial expressions & celebration detection
          </div>
          <div className={styles.tagChipsWrap}>
            {aggregates.topEmotions.map((e) => (
              <span key={e.emotion} className={styles.emotionChip}>
                {e.emotion} ({e.count})
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: Clubs & Sports Breakdown */}
        <div className={styles.visionMiniCard}>
          <div className={styles.miniCardIcon}>🏟️</div>
          <div className={styles.miniCardTitle}>Clubs & Merchandise</div>
          <div className={styles.miniCardVal}>
            {aggregates.topClubs.length > 0 ? aggregates.topClubs[0].club : '4 Sports Leagues'}
          </div>
          <div className={styles.miniCardSub}>
            Team jerseys, scarves & arena colors
          </div>
          <div className={styles.tagChipsWrap}>
            {aggregates.topClubs.length > 0 ? (
              aggregates.topClubs.slice(0, 5).map((c) => (
                <span key={c.club} className={styles.clubChip}>
                  {c.club} ({c.count})
                </span>
              ))
            ) : (
              <span className={styles.cardSubtitle}>
                Extracting crests across Basketball, Football, Ice Hockey, Handball
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live Analyzed Image Stream */}
      {recentImages && recentImages.length > 0 && (
        <div className={styles.recentStreamWrap}>
          <div className={styles.recentStreamHeader}>
            <h4 className={styles.recentStreamTitle}>
              📸 Live Analyzed Stream (Latest Detections)
            </h4>
            <span className={styles.cardSubtitle}>
              Real-time multi-dimensional extraction from MongoDB Atlas
            </span>
          </div>

          <div className={styles.recentCardsGrid}>
            {recentImages.map((img) => (
              <div key={img.fileName} className={styles.recentItemCard}>
                <div className={styles.recentItemTop}>
                  <span className={styles.recentSportBadge}>
                    {img.sport}
                  </span>
                  <span className={styles.recentPeopleCount}>
                    👤 {img.peopleCount} {img.peopleCount === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <div className={styles.recentItemScene}>
                  {img.scene || 'Fan selfie captured at event.'}
                </div>
                <div className={styles.recentItemMeta}>
                  {img.brands.length > 0 && (
                    <div className={styles.recentTagRow}>
                      <span className={styles.recentTagLabel}>Brands:</span>{' '}
                      {img.brands.join(', ')}
                    </div>
                  )}
                  {img.emotions.length > 0 && (
                    <div className={styles.recentTagRow}>
                      <span className={styles.recentTagLabel}>Emotions:</span>{' '}
                      {img.emotions.join(', ')}
                    </div>
                  )}
                </div>
                <div className={styles.recentFileFooter}>
                  {img.fileName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
