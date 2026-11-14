'use client';
/* eslint-disable react/forbid-dom-props */

import React from 'react';
import { FunnelStep } from './types';
import styles from './interactive-report.module.css';

interface D3FunnelFlowProps {
  funnel: FunnelStep[];
  summary: {
    optInRate: number | null;
    totalOptIns: number;
    totalRegistered: number;
    vettingApprovalRate: number | null;
    totalCtaClicks: number;
  };
}

const formatPercent = (value: number | null): string => (value === null ? 'n/a' : `${value}%`);

export default function D3FunnelFlow({ funnel, summary }: D3FunnelFlowProps) {
  const maxValue = Math.max(0, ...funnel.map((item) => item.value));

  // Without a single non-zero step there is nothing to chart.
  if (maxValue <= 0) {
    return (
      <div className={styles.reportCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>
              📈 Marketing Conversion Funnel
            </h3>
            <p className={styles.cardSubtitle}>
              No funnel measurements for this scope.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { optInRate, totalOptIns, totalRegistered, vettingApprovalRate, totalCtaClicks } = summary;

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>
            📈 Marketing Conversion Funnel
          </h3>
          <p className={styles.cardSubtitle}>
            Fan conversion journey from first touchpoint to marketing opt-in.
          </p>
        </div>
      </div>

      <div className={styles.funnelList}>
        {funnel.map((item, index) => {
          // A step with no recorded value is shown as n/a with an empty bar.
          const hasValue = item.value > 0;
          const valueText = hasValue ? item.value.toLocaleString() : 'n/a';
          const widthPercent = hasValue ? Math.max(12, Math.round((item.value / maxValue) * 100)) : 0;
          const prevValue = index > 0 ? funnel[index - 1].value : null;
          const stepConversion =
            hasValue && prevValue && prevValue > 0 ? Math.round((item.value / prevValue) * 100) : null;
          const isOptIn = /opt-?in/i.test(item.step);
          const isRegistration = /registration/i.test(item.step);

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
                      {valueText}
                    </span>
                  )}
                </div>
                {widthPercent <= 20 && (
                  <span className={styles.barValOutside}>
                    {valueText}
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
                    {index === 0 && hasValue ? '100% Baseline' : 'n/a'}
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
          <div className={styles.highlightLabelGreen}>Marketing Opt-In</div>
          {/* The stored count is the figure; the rate is shown next to it only when it can be derived from the stored counts */}
          <div className={styles.highlightValGreen}>{totalOptIns > 0 ? totalOptIns.toLocaleString() : 'n/a'}</div>
          <div className={styles.highlightLabelGreen}>
            {optInRate !== null
              ? `${optInRate}% of registrations`
              : totalOptIns > 0
                ? totalRegistered > 0
                  ? `Rate not shown: more opt-ins (${totalOptIns.toLocaleString()}) than registrations (${totalRegistered.toLocaleString()}) are stored`
                  : 'Rate not shown: no registrations stored'
                : 'No opt-ins stored'}
          </div>
        </div>
        <div className={styles.highlightBoxGray}>
          <div className={styles.highlightLabelGray}>Vetting Approval</div>
          <div className={styles.highlightValGray}>{formatPercent(vettingApprovalRate)}</div>
          <div className={styles.cardSubtitle}>
            {vettingApprovalRate !== null
              ? 'Approved of submitted photos'
              : 'No photo vetting data'}
          </div>
        </div>
        <div className={styles.highlightBoxGray}>
          <div className={styles.highlightLabelGray}>Total CTA Click Actions</div>
          <div className={styles.highlightValGray}>
            {totalCtaClicks > 0 ? totalCtaClicks.toLocaleString() : 'n/a'}
          </div>
          <div className={styles.cardSubtitle}>Call-to-action clicks recorded</div>
        </div>
      </div>
    </div>
  );
}
