'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState } from 'react';
import styles from './interactive-report.module.css';

interface DatabaseValueForSponsorsChartProps {
  optIns: number;
  totalRegistered?: number;
  className?: string;
}

interface IndustryCplBenchmark {
  industry: string;
  cpl: number;
  description: string;
  color: string;
}

const CPL_BENCHMARKS: IndustryCplBenchmark[] = [
  { industry: 'Insurance', cpl: 205, description: 'Direct life & motor insurance acquisition', color: '#9f1532' },
  { industry: 'Automotive', cpl: 170, description: 'Test drive and dealership qualified leads', color: '#b91c1c' },
  { industry: 'Telecom', cpl: 95, description: 'Postpaid subscription & fiber bundle contracts', color: '#c2410c' },
  { industry: 'eCommerce', cpl: 87, description: 'Verified buyer lead pool with payment intent', color: '#b45309' },
  { industry: 'FMCG & Retail', cpl: 45, description: 'Loyalty app registrations & consumer sampling', color: '#047857' },
];

export default function DatabaseValueForSponsorsChart({
  optIns,
  totalRegistered = 0,
  className = '',
}: DatabaseValueForSponsorsChartProps) {
  // Allow toggling between Verified Opt-In Leads vs Total Registered Userbase
  const [useRegisteredBase, setUseRegisteredBase] = useState(false);

  const baseLeadCount = useRegisteredBase
    ? (totalRegistered > 0 ? totalRegistered : optIns)
    : (optIns > 0 ? optIns : Math.max(Math.round(totalRegistered * 0.15), 1));

  const totalValue = CPL_BENCHMARKS.reduce((sum, item) => sum + item.cpl * baseLeadCount, 0);

  // Maximum single value for scaling bar widths
  const maxValue = Math.max(...CPL_BENCHMARKS.map((b) => b.cpl * baseLeadCount));

  return (
    <div className={`${styles.executiveCard} ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className={styles.cardSubtitle}>Commercial Valuation & Monetization</div>
          <h3 className={styles.cardTitle}>Database Value for Sponsors (by Industry)</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--gds-sys-color-neutral-60, #64748b)' }}>
            Audience value benchmarked against standardized Cost Per Lead (CPL) industry rates
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {totalRegistered > 0 && optIns > 0 && (
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
                onClick={() => setUseRegisteredBase(false)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: !useRegisteredBase ? '#ffffff' : 'transparent',
                  color: !useRegisteredBase ? 'var(--gds-sys-color-on-surface, #0f172a)' : '#64748b',
                  boxShadow: !useRegisteredBase ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Opt-in Leads ({optIns.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => setUseRegisteredBase(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: useRegisteredBase ? '#ffffff' : 'transparent',
                  color: useRegisteredBase ? 'var(--gds-sys-color-on-surface, #0f172a)' : '#64748b',
                  boxShadow: useRegisteredBase ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                All Registered ({totalRegistered.toLocaleString()})
              </button>
            </div>
          )}

          <div
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '-0.01em',
            }}
          >
            Total: €{totalValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Horizontal Bar Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {CPL_BENCHMARKS.map((item) => {
          const industryTotal = item.cpl * baseLeadCount;
          const sharePct = totalValue > 0 ? Math.round((industryTotal / totalValue) * 1000) / 10 : 0;
          const barWidthPct = maxValue > 0 ? Math.round((industryTotal / maxValue) * 100) : 0;

          return (
            <div key={item.industry} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '13px' }}>
                <span style={{ fontWeight: 600, color: 'var(--gds-sys-color-on-surface, #1e293b)' }}>
                  {item.industry} <span style={{ fontWeight: 400, color: '#64748b' }}>(CPL: €{item.cpl})</span>
                </span>
                <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--gds-sys-color-on-surface, #0f172a)' }}>
                  €{industryTotal.toLocaleString()}{' '}
                  <span style={{ fontWeight: 500, color: '#64748b', fontSize: '12px' }}>({sharePct}%)</span>
                </span>
              </div>

              <div
                style={{
                  height: '10px',
                  width: '100%',
                  background: 'var(--gds-sys-color-surface-container, #f1f5f9)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${barWidthPct}%`,
                    background: item.color,
                    borderRadius: '999px',
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Context Footer */}
      <div
        style={{
          borderTop: '1px solid var(--gds-sys-color-surface-container, #e2e8f0)',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '12px',
          color: '#64748b',
        }}
      >
        <span>
          Basis: <strong>{baseLeadCount.toLocaleString()}</strong> {useRegisteredBase ? 'registered participants' : 'GDPR/KYC opt-in leads'}
        </span>
        <span>
          Combined Portfolio Valuation: <strong>€{totalValue.toLocaleString()}</strong> across 5 sectors
        </span>
      </div>
    </div>
  );
}
