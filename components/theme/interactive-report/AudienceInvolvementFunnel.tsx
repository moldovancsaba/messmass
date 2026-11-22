'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState } from 'react';
import styles from './interactive-report.module.css';

interface AudienceInvolvementFunnelProps {
  totalVenueCapacity: number;
  totalGateAttendance: number;
  totalPeopleDetected: number;
  totalOptIns: number;
  totalRegistered?: number;
  totalPhotosProcessed?: number;
  eventCount?: number;
  className?: string;
}

export default function AudienceInvolvementFunnel({
  totalVenueCapacity,
  totalGateAttendance,
  totalPeopleDetected,
  totalOptIns,
  totalRegistered = 0,
  totalPhotosProcessed = 0,
  eventCount = 1,
  className = '',
}: AudienceInvolvementFunnelProps) {
  const [showAveragePerMatch, setShowAveragePerMatch] = useState(false);

  const divisor = showAveragePerMatch && eventCount > 0 ? eventCount : 1;

  const cap = Math.round(totalVenueCapacity / divisor);
  const att = Math.round(totalGateAttendance / divisor);
  const photo = Math.round(totalPeopleDetected / divisor);
  const rawRightsConsents = totalRegistered > 0 ? totalRegistered : totalOptIns;
  const rightsConsents = Math.round(rawRightsConsents / divisor);
  const rawLeads = totalOptIns;
  const leads = Math.round(rawLeads / divisor);

  // Conversion calculations
  const fillRate = totalVenueCapacity > 0 ? Math.round((totalGateAttendance / totalVenueCapacity) * 1000) / 10 : 0;
  const captureRate = totalGateAttendance > 0 ? Math.round((totalPeopleDetected / totalGateAttendance) * 1000) / 10 : 0;
  const rightsPhotoDenominator = totalPhotosProcessed > 0 ? totalPhotosProcessed : rawRightsConsents;
  const rightsRate = rightsPhotoDenominator > 0 && rightsConsents > 0
    ? Math.min(100, Math.round((rawRightsConsents / rightsPhotoDenominator) * 1000) / 10)
    : 0;
  const optInConsentPct = rawRightsConsents > 0 && rawLeads > 0
    ? Math.min(100, Math.round((rawLeads / rawRightsConsents) * 1000) / 10)
    : (rawLeads > 0 ? 100 : 0);

  const stages = [
    {
      id: 'capacity',
      title: 'Nominal Stadium Capacity',
      icon: '🏟️',
      value: cap,
      unit: 'Seat Inventory',
      pctOfTop: 100,
      badgeText: 'Base Footprint',
      badgeColor: '#64748b',
      bgColor: '#f8fafc',
      borderColor: '#e2e8f0',
      description: 'Cumulative nominal seat inventory across all matchday venues',
    },
    {
      id: 'attendance',
      title: 'Actual Gate Attendance',
      icon: '🎟️',
      value: att,
      unit: 'Turnstile Attendees',
      pctOfTop: fillRate,
      conversionFromPrev: `${fillRate}% Fill Rate`,
      conversionDetail: `${Math.round(100 - fillRate)}% Unoccupied Seats`,
      badgeText: `${fillRate}% Utilization`,
      badgeColor: '#0284c7',
      bgColor: 'rgba(2, 132, 199, 0.04)',
      borderColor: 'rgba(2, 132, 199, 0.2)',
      description: 'Official ticketed gate turnout recorded by venues & leagues',
    },
    {
      id: 'photos',
      title: 'Detected Photo Audience',
      icon: '📸',
      value: photo,
      unit: 'Visible Fans in Photos',
      pctOfTop: totalVenueCapacity > 0 ? Math.round((totalPeopleDetected / totalVenueCapacity) * 1000) / 10 : 0,
      conversionFromPrev: `${captureRate}% Visual Capture`,
      conversionDetail: `from ${totalPhotosProcessed.toLocaleString()} analyzed photos`,
      badgeText: `${captureRate}% Exposure`,
      badgeColor: 'var(--report-primary, #1d4ed8)',
      bgColor: 'var(--report-primary-soft, rgba(29, 78, 216, 0.04))',
      borderColor: '#cbd5e1',
      description: 'Total fan appearances detected across analyzed matchday photos',
    },
    {
      id: 'rights',
      title: 'Privacy, Terms & Image Usage Rights',
      icon: '🛡️',
      value: rightsConsents,
      unit: 'Consented Photos',
      pctOfTop: totalVenueCapacity > 0 ? Math.round((rightsConsents / totalVenueCapacity) * 1000) / 10 : 0,
      conversionFromPrev: `${rightsRate}% Image Consent`,
      conversionDetail: rawRightsConsents > 0
        ? `${rightsRate}% of ${rightsPhotoDenominator.toLocaleString()} analyzed photos accepted Privacy Policy, Terms & image usage rights`
        : 'No consent records stored for this scope',
      badgeText: rawRightsConsents > 0 ? `${rightsRate}% Terms Accepted` : 'Not Measured',
      badgeColor: '#4f46e5',
      bgColor: 'rgba(79, 70, 229, 0.04)',
      borderColor: 'rgba(79, 70, 229, 0.2)',
      description: 'Photos where fans accepted Privacy Policy & Terms and granted commercial image usage rights',
    },
    {
      id: 'leads',
      title: 'Active Marketing Opt-ins',
      icon: '🎯',
      value: leads,
      unit: 'Marketing Leads',
      pctOfTop: totalVenueCapacity > 0 ? Math.round((leads / totalVenueCapacity) * 1000) / 10 : 0,
      conversionFromPrev: `${optInConsentPct}% Marketing Opt-in Rate`,
      conversionDetail: rawLeads > 0
        ? `${rawLeads.toLocaleString()} of ${rawRightsConsents.toLocaleString()} consented submissions opted into marketing communications`
        : 'No marketing opt-in records stored for this scope',
      badgeText: rawLeads > 0 ? `${optInConsentPct}% Marketing Opt-in` : 'Not Measured',
      badgeColor: 'var(--report-primary-dark, #0f172a)',
      bgColor: 'var(--report-primary-soft, #eff6ff)',
      borderColor: '#cbd5e1',
      description: 'Fans who explicitly opted into commercial & club marketing communications',
    },
  ];

  return (
    <div className={`${styles.executiveCard} ${styles.gdsStack} ${className}`}>
      <div className={styles.gdsRowBetween}>
        <div>
          <div className={styles.gdsEyebrow}>Audience Conversion & Monetization</div>
          <h3 className={styles.gdsCardTitle}>Multi-Tier Audience Involvement Funnel</h3>
          <p className={styles.gdsCaption}>
            Hierarchical conversion from nominal stadium capacity to actual attendance, visual capture, and sponsor opt-ins
          </p>
        </div>

        {eventCount > 1 && (
          <div className={styles.gdsSegmentGroup}>
            <button
              type="button"
              onClick={() => setShowAveragePerMatch(false)}
              className={`${styles.gdsSegmentBtn} ${!showAveragePerMatch ? styles.gdsSegmentBtnActive : ''}`}
            >
              Campaign Total
            </button>
            <button
              type="button"
              onClick={() => setShowAveragePerMatch(true)}
              className={`${styles.gdsSegmentBtn} ${showAveragePerMatch ? styles.gdsSegmentBtnActive : ''}`}
            >
              Avg. Per Match ({eventCount})
            </button>
          </div>
        )}
      </div>

      {/* Funnel Steps Breakdown */}
      <div className={styles.gdsStackSm}>
        {stages.map((stage, idx) => (
          <div key={stage.id} className={styles.gdsStackSm}>
            <div className={styles.gdsFunnelCard}>
              <div className={styles.gdsRow}>
                <span className={styles.gdsSectionTitle}>{stage.icon}</span>
                <div>
                  <div className={styles.gdsCardTitle}>{stage.title}</div>
                  <div className={styles.gdsCaption}>{stage.description}</div>
                </div>
              </div>

              <div className={styles.gdsRow}>
                <div className={styles.gdsRight}>
                  <div className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                    {stage.value.toLocaleString()}
                  </div>
                  <div className={styles.gdsCaption}>{stage.unit}</div>
                </div>

                <div className={`${styles.gdsPill} ${styles.gdsPillAccent}`}>
                  {stage.badgeText}
                </div>
              </div>
              <div className={styles.suiteTrack}>
                <div
                  className={styles.suiteTrackFill}
                  style={{ width: `${Math.max(3, Math.min(100, stage.pctOfTop))}%` }}
                />
              </div>
            </div>

            {/* Stepped Conversion Connector between stages */}
            {idx < stages.length - 1 && (
              <div className={styles.gdsFunnelConnector}>
                <div className={styles.gdsFunnelLine} />
                <span className={styles.gdsCaption}>
                  ↓ <strong className={styles.gdsNum}>{stages[idx + 1].conversionFromPrev}</strong> ({stages[idx + 1].conversionDetail})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Narrative Callout */}
      <div className={`${styles.gdsFooterNote} ${styles.gdsCaption}`}>
        💡 <strong>Executive Summary:</strong> Across {eventCount} matchday fixtures, the nominal venue footprint of{' '}
        <strong className={styles.gdsNum}>{totalVenueCapacity.toLocaleString()} seats</strong> yielded{' '}
        <strong className={styles.gdsNum}>{totalGateAttendance.toLocaleString()} attendees</strong> ({fillRate}% utilization). Photographic sampling
        captured <strong className={styles.gdsNum}>{totalPeopleDetected.toLocaleString()} fan exposures</strong> ({captureRate}% visual reach),
        culminating in <strong className={styles.gdsNum}>{leads.toLocaleString()} direct sponsor leads</strong>.
      </div>
    </div>
  );
}
