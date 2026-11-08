'use client';
/* eslint-disable react/forbid-dom-props */

import React from 'react';
import { FunnelStep } from './types';
import styles from './interactive-report.module.css';

interface D3FunnelFlowProps {
  funnel: FunnelStep[];
}

export default function D3FunnelFlow({ funnel }: D3FunnelFlowProps) {
  const maxValue = funnel[0]?.value || 1;

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>
            📈 Marketing Conversion Funnel & Sponsor Value
          </h3>
          <p className={styles.cardSubtitle}>
            End-to-end fan conversion journey from stadium QR/Web touchpoints to Tippmix marketing opt-ins.
          </p>
        </div>
      </div>

      <div className={styles.funnelList}>
        {funnel.map((item, index) => {
          const widthPercent = Math.max(12, Math.round((item.value / maxValue) * 100));
          const prevValue = index > 0 ? funnel[index - 1].value : null;
          const stepConversion = prevValue && prevValue > 0 ? Math.round((item.value / prevValue) * 100) : null;
          const isOptIn = index === 4;
          const isRegistration = index === 3;

          const barColorClass = isOptIn
            ? styles.barFillHighlight
            : isRegistration
            ? styles.barFillDarkGreen
            : styles.barFillNeutral;

          return (
            <div key={item.step} className={styles.funnelRow}>
              {/* Step Title & Detail */}
              <div>
                <div className={styles.brandTitleGroup}>
                  <span className={`${styles.stepBadge} ${isOptIn ? styles.stepBadgeHighlight : ''}`}>
                    {index + 1}
                  </span>
                  <span className={`${styles.stepTitle} ${isOptIn ? styles.stepTitleHighlight : ''}`}>
                    {item.step}
                  </span>
                </div>
                <div className={styles.stepDetail}>
                  {item.detail}
                </div>
              </div>

              {/* Progress Bar */}
              <div className={styles.barWrap}>
                {/* WHAT: Dynamic width percentage calculated from step conversion ratio
                    WHY: Bar represents the proportional drop-off at each funnel step */}
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <div
                  className={`${styles.barFill} ${barColorClass}`}
                  style={{ width: `${widthPercent}%` }}
                >
                  {widthPercent > 20 && (
                    <span className={styles.barValInside}>
                      {item.value.toLocaleString()}
                    </span>
                  )}
                </div>
                {widthPercent <= 20 && (
                  <span className={styles.barValOutside}>
                    {item.value.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Step Conversion Badge */}
              <div className={styles.valRight}>
                {stepConversion !== null ? (
                  <span className={`${styles.conversionBadge} ${isOptIn ? styles.conversionBadgeHighlight : ''}`}>
                    {stepConversion}% step-through
                  </span>
                ) : (
                  <span className={styles.cardSubtitle}>
                    100% Baseline
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Highlights Bar */}
      <div className={styles.highlightsGrid}>
        <div className={styles.highlightBoxGreen}>
          <div className={styles.highlightLabelGreen}>Tippmix Marketing Opt-In</div>
          <div className={styles.highlightValGreen}>71.4%</div>
          <div className={styles.highlightLabelGreen}>20,130 active consent registrations</div>
        </div>
        <div className={styles.highlightBoxGray}>
          <div className={styles.highlightLabelGray}>Brand Protection Gate</div>
          <div className={styles.highlightValGray}>97.6%</div>
          <div className={styles.cardSubtitle}>AI & hostess content screening pass</div>
        </div>
        <div className={styles.highlightBoxGray}>
          <div className={styles.highlightLabelGray}>Total CTA Click Actions</div>
          <div className={styles.highlightValGray}>1,435</div>
          <div className={styles.cardSubtitle}>Direct referral to Tippmixpro portal</div>
        </div>
      </div>
    </div>
  );
}
