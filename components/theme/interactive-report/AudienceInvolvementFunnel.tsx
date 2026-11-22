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
  const rawLeads = totalOptIns > 0 ? totalOptIns : totalRegistered;
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
      description: 'Unique fan appearances recognized by Fanmass computer vision',
    },
    {
      id: 'rights',
      title: 'PP, GTC & Image Usage Rights',
      icon: '🛡️',
      value: rightsConsents,
      unit: 'Consented Photos',
      pctOfTop: totalVenueCapacity > 0 ? Math.round((rightsConsents / totalVenueCapacity) * 1000) / 10 : 0,
      conversionFromPrev: `${rightsRate}% Image Consent`,
      conversionDetail: rawRightsConsents > 0
        ? `100% of ${rightsPhotoDenominator.toLocaleString()} analyzed photos accepted Privacy Policy, GTC & full image usage rights`
        : 'No consent records stored for this scope',
      badgeText: rawRightsConsents > 0 ? '100% PP & GTC Accepted' : 'Not Measured',
      badgeColor: '#4f46e5',
      bgColor: 'rgba(79, 70, 229, 0.04)',
      borderColor: 'rgba(79, 70, 229, 0.2)',
      description: 'Photos where fans accepted Privacy Policy & General Terms and granted full commercial image usage rights',
    },
    {
      id: 'leads',
      title: 'Active Marketing Opt-ins',
      icon: '🎯',
      value: leads,
      unit: 'GDPR Marketing Leads',
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
    <div className={`${styles.executiveCard} ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className={styles.cardSubtitle}>Audience Conversion & Monetization</div>
          <h3 className={styles.cardTitle}>Multi-Tier Audience Involvement Funnel</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--gds-sys-color-neutral-60, #64748b)' }}>
            Hierarchical conversion from nominal stadium capacity to actual attendance, visual capture, and sponsor opt-ins
          </p>
        </div>

        {eventCount > 1 && (
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--gds-sys-color-surface-container-high, #f1f5f9)',
              padding: '3px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <button
              type="button"
              onClick={() => setShowAveragePerMatch(false)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: !showAveragePerMatch ? '#ffffff' : 'transparent',
                color: !showAveragePerMatch ? 'var(--gds-sys-color-on-surface, #0f172a)' : '#64748b',
                boxShadow: !showAveragePerMatch ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Campaign Total
            </button>
            <button
              type="button"
              onClick={() => setShowAveragePerMatch(true)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: showAveragePerMatch ? '#ffffff' : 'transparent',
                color: showAveragePerMatch ? 'var(--gds-sys-color-on-surface, #0f172a)' : '#64748b',
                boxShadow: showAveragePerMatch ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Avg. Per Match ({eventCount})
            </button>
          </div>
        )}
      </div>

      {/* Funnel Steps Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {stages.map((stage, idx) => (
          <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                background: stage.bgColor,
                border: `1px solid ${stage.borderColor}`,
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                <span style={{ fontSize: '24px' }}>{stage.icon}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gds-sys-color-on-surface, #0f172a)' }}>
                    {stage.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {stage.description}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gds-sys-color-on-surface, #0f172a)', fontVariantNumeric: 'tabular-nums' }}>
                    {stage.value.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                    {stage.unit}
                  </div>
                </div>

                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: '#ffffff',
                    border: `1px solid ${stage.borderColor}`,
                    color: stage.badgeColor,
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {stage.badgeText}
                </div>
              </div>
            </div>

            {/* Stepped Conversion Connector between stages */}
            {idx < stages.length - 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0 24px',
                  fontSize: '12px',
                  color: '#64748b',
                }}
              >
                <div style={{ width: '2px', height: '16px', background: '#cbd5e1', marginLeft: '12px' }} />
                <span>
                  ↓ <strong>{stages[idx + 1].conversionFromPrev}</strong> ({stages[idx + 1].conversionDetail})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Narrative Callout */}
      <div
        style={{
          borderTop: '1px solid var(--gds-sys-color-surface-container, #e2e8f0)',
          paddingTop: '12px',
          fontSize: '12px',
          color: '#64748b',
          lineHeight: 1.5,
        }}
      >
        💡 <strong>Executive Summary:</strong> Across {eventCount} matchday fixtures, the nominal venue footprint of{' '}
        <strong>{totalVenueCapacity.toLocaleString()} seats</strong> yielded{' '}
        <strong>{totalGateAttendance.toLocaleString()} attendees</strong> ({fillRate}% utilization). Photographic sampling
        captured <strong>{totalPeopleDetected.toLocaleString()} fan exposures</strong> ({captureRate}% visual reach),
        culminating in <strong>{leads.toLocaleString()} direct sponsor leads</strong>.
      </div>
    </div>
  );
}
