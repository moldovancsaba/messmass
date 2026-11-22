'use client';
/* eslint-disable react/forbid-dom-props */

import React from 'react';
import styles from './interactive-report.module.css';

export interface MarketingCommercialSuiteProps {
  totalFansEngaged?: number;
  totalOptIns?: number;
  totalRegistered?: number;
  totalCtaClicks?: number;
  totalPhotosProcessed?: number;
  campaignTitle?: string;
  ctaText?: string;
  partnerName?: string;
  genders?: {
    male: number;
    female: number;
    malePct: number;
    femalePct: number;
  } | null;
  ageGroups?: {
    children: number;
    teens: number;
    adults: number;
    seniors: number;
  } | null;
  merchandise?: Array<{ item: string; count: number; percentage: number }>;
  topEmotions?: Array<{ emotion: string; count: number }>;
  venues?: string[];
  reportSlug?: string | null;
  onViewTerritoryMap?: () => void;
  variant?: 'all' | 'commercial' | 'demographics';
  className?: string;
}

export default function MarketingCommercialSuite({
  totalFansEngaged = 0,
  totalOptIns = 0,
  totalRegistered = 0,
  totalCtaClicks = 0,
  totalPhotosProcessed = 0,
  campaignTitle,
  ctaText,
  partnerName,
  genders,
  ageGroups,
  topEmotions = [],
  venues = [],
  reportSlug = null,
  onViewTerritoryMap,
  variant = 'all',
  className = '',
}: MarketingCommercialSuiteProps) {
  const isSzrtOrTippmix =
    Boolean(partnerName && (partnerName.toLowerCase().includes('tippmix') || partnerName.toLowerCase().includes('szerencsej'))) ||
    Boolean(reportSlug && (reportSlug.toLowerCase().includes('tippmix') || reportSlug.toLowerCase().includes('szrt')));

  const resolvedCampaignTitle = campaignTitle || (
    isSzrtOrTippmix
      ? 'TIPPMIX DIGITAL FAN ACTIVATION'
      : `${partnerName ? partnerName.toUpperCase() : 'SPONSOR'} FAN ACTIVATION`
  );

  const resolvedCtaText = ctaText || (
    isSzrtOrTippmix
      ? 'CLAIM EXCLUSIVE TIPPMIX OFFER'
      : 'CLAIM EXCLUSIVE SPONSOR OFFER'
  );

  const resolvedClicksSubtitle = isSzrtOrTippmix
    ? 'Direct clicks to the Tippmix digital activation portal'
    : 'Direct clicks to official sponsor activation portal';

  // 1. Direct Marketing & Opt-in Metrics (Empirical Verified Leads)
  const effectiveFans = totalFansEngaged > 0 ? totalFansEngaged : 0;
  const effectiveOptIns = totalOptIns > 0 ? totalOptIns : 0;
  const effectiveRegistered = totalRegistered > 0 ? totalRegistered : effectiveOptIns;
  const rightsDenom = totalPhotosProcessed > 0 ? totalPhotosProcessed : effectiveRegistered;
  const rightsConsentPct = rightsDenom > 0 && effectiveRegistered > 0
    ? Math.min(100, Math.round((effectiveRegistered / rightsDenom) * 1000) / 10)
    : null;
  const optInPct = effectiveRegistered > 0 && effectiveOptIns > 0
    ? Math.min(Math.round((effectiveOptIns / effectiveRegistered) * 10000) / 100, 100)
    : (effectiveOptIns > 0 ? 100 : 0);

  // 2. Pop-up Performance (Empirical Digital Activation — never invent impressions)
  const bannerClicks = totalCtaClicks > 0 ? totalCtaClicks : 0;
  const bannerImpressions = effectiveRegistered > 0 ? effectiveRegistered : 0;
  const popUpCtr = bannerImpressions > 0 && bannerClicks > 0
    ? Math.min(Math.round((bannerClicks / bannerImpressions) * 1000) / 10, 100)
    : null;

  // 3. Real Gender Breakdown (from measured face classifications)
  const male = genders?.male ?? 0;
  const female = genders?.female ?? 0;
  const totalGender = male + female;
  const malePct = genders?.malePct ?? (totalGender > 0 ? Math.round((male / totalGender) * 100) : 0);
  const femalePct = genders?.femalePct ?? (totalGender > 0 ? Math.round((female / totalGender) * 100) : 0);

  // 4. Real Age Brackets (Empirical AI Face Classifications: Children, Teens, Adults, Seniors)
  const children = ageGroups?.children ?? 0;
  const teens = ageGroups?.teens ?? 0;
  const adults = ageGroups?.adults ?? 0;
  const seniors = ageGroups?.seniors ?? 0;
  const totalAges = children + teens + adults + seniors;

  const ageBrackets = totalAges > 0
    ? [
        { label: 'Children (< 12 yrs)', count: children, pct: Math.round((children / totalAges) * 100) },
        { label: 'Teens (13 - 19 yrs)', count: teens, pct: Math.round((teens / totalAges) * 100) },
        { label: 'Adults (20 - 64 yrs)', count: adults, pct: Math.round((adults / totalAges) * 100) },
        {
          label: 'Seniors (65+ yrs)',
          count: seniors,
          pct: Math.max(
            0,
            100 -
              Math.round((children / totalAges) * 100) -
              Math.round((teens / totalAges) * 100) -
              Math.round((adults / totalAges) * 100)
          ),
        },
      ]
    : [];

  // 5. Emotion Sentiment Valence (Empirical Facial Sentiment Analysis)
  const totalEmotionsCount = topEmotions.reduce((acc, e) => acc + e.count, 0);
  const positiveEmotions = topEmotions
    .filter((e) => {
      const em = e.emotion.toLowerCase();
      return em === 'happy' || em === 'cheering' || em === 'excited' || em === 'joy';
    })
    .reduce((acc, e) => acc + e.count, 0);
  const happyPct = totalEmotionsCount > 0 ? Math.round((positiveEmotions / totalEmotionsCount) * 100) : 0;

  const showDemographics = variant === 'all' || variant === 'demographics';
  const showCommercial = variant === 'all' || variant === 'commercial';

  return (
    <div className={`${styles.commercialSuiteContainer} ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* =========================================================================
          COMMERCIAL BLOCK: Verified Direct Lead Consent & Digital Activation
          ========================================================================= */}
      {showCommercial && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--report-primary, #1d4ed8)' }}>
                  Verified Direct Engagement & Leads
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Marketing Consent & Fan Acquisition
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Confirmed direct GDPR opt-ins captured through matchday fan photo interactions
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '20px' }}>
              {/* Privacy, Terms & Image Usage Rights */}
              <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Privacy, Terms & Image Rights</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--report-primary-soft, #eff6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--report-primary, #1d4ed8)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                    {rightsConsentPct !== null ? `${rightsConsentPct.toFixed(1)}%` : 'Not measured'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    {effectiveRegistered.toLocaleString()} of {rightsDenom.toLocaleString()} consented to Privacy, Terms & image rights
                  </div>
                </div>
              </div>

              {/* Marketing Opt-in % */}
              <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Marketing Opt-in Rate</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--report-primary-soft, #eff6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--report-primary, #1d4ed8)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 11 18-5v12L3 14v-3z" />
                      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                    </svg>
                  </div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                    {optInPct.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    {effectiveOptIns.toLocaleString()} of {effectiveRegistered.toLocaleString()} opted into marketing communications
                  </div>
                </div>
              </div>

              {/* Verified Direct Leads */}
              <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Verified Marketing Leads</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--report-primary-soft, #eff6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--report-primary, #1d4ed8)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <polyline points="17 11 19 13 23 9" />
                    </svg>
                  </div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                    {effectiveOptIns.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    Verified marketing communication opt-ins from active submissions
                  </div>
                </div>
              </div>

              {/* Photos Analyzed / Matchday Interactions */}
              <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Active Fan Interactions</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                    {(totalPhotosProcessed > 0 ? totalPhotosProcessed : effectiveRegistered).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    Analyzed fan photos across verified matchday activations
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pop-up Digital Performance (only rendered when CTA clicks were recorded) */}
          {bannerClicks > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669' }}>
                  Digital Fan Activation
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Pop-up Performance
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Engagement and click-through on in-flow activation banners
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '20px' }}>
              {/* Banner Graphic Card */}
              <div
                className={styles.executiveCard}
                style={{
                  padding: '0',
                  overflow: 'hidden',
                  borderRadius: '12px',
                  minHeight: '160px',
                  background: isSzrtOrTippmix
                    ? 'linear-gradient(135deg, #022c22 0%, #064e3b 60%, #047857 100%)'
                    : 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: isSzrtOrTippmix
                      ? 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.45) 0%, transparent 60%)'
                      : 'radial-gradient(circle at 80% 20%, rgba(2, 132, 199, 0.45) 0%, transparent 60%)',
                    pointerEvents: 'none',
                  }}
                />
                <div style={{ padding: '24px', textAlign: 'center', zIndex: 1 }}>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {resolvedCampaignTitle}
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: isSzrtOrTippmix ? '#10b981' : '#0284c7',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '6px 14px',
                        borderRadius: '4px',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        boxShadow: isSzrtOrTippmix ? '0 2px 8px rgba(16, 185, 129, 0.4)' : '0 2px 8px rgba(2, 132, 199, 0.4)',
                      }}
                    >
                      {resolvedCtaText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pop-up banner clicks */}
              <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Pop-up banner clicks</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--report-primary-soft, #eff6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--report-primary, #1d4ed8)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                      <path d="m13 13 6 6" />
                    </svg>
                  </div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                    {bannerClicks.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    {resolvedClicksSubtitle}
                  </div>
                </div>
              </div>

              {/* Pop-up Click Through Rate */}
              <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Pop-up Click Through Rate</span>
                  {popUpCtr !== null && popUpCtr >= 10 && (
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'var(--report-primary-soft, #eff6ff)', color: 'var(--report-primary, #1d4ed8)' }}>
                      High Intent
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                    {popUpCtr !== null ? `${popUpCtr.toFixed(1)}%` : 'Not measured'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    {bannerImpressions > 0
                      ? `From ${bannerImpressions.toLocaleString()} consented submissions`
                      : 'No impression denominator recorded'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* =========================================================================
          DEMOGRAPHICS & EMOTIONS BLOCK: Empirical Audience DNA
          ========================================================================= */}
      {showDemographics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--report-primary, #1d4ed8)' }}>
                  Audience Composition & DNA
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  AI-Measured Audience Demographics
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {totalEmotionsCount > 0 && (
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                    😊 {happyPct}% Positive Valence
                  </span>
                )}
                {onViewTerritoryMap && (
                  <button
                    type="button"
                    onClick={onViewTerritoryMap}
                    style={{
                      background: 'var(--report-primary, #1d4ed8)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    🗺️ Explore Territory Map →
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '20px' }}>
              {/* Gender Distribution Donut */}
              <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Gender Distribution</h4>
                {totalGender > 0 ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '14px 0', position: 'relative' }}>
                      <svg width="144" height="144" viewBox="0 0 140 140" role="img" aria-label={`Gender split: ${malePct}% male, ${femalePct}% female`}>
                        <circle cx="70" cy="70" r="54" fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
                        <circle
                          cx="70"
                          cy="70"
                          r="54"
                          fill="transparent"
                          stroke="var(--report-gender-male, #0284c7)"
                          strokeWidth="18"
                          strokeDasharray={`${(malePct / 100) * 339.29} 339.29`}
                          strokeDashoffset="0"
                          transform="rotate(-90 70 70)"
                        />
                        <circle
                          cx="70"
                          cy="70"
                          r="54"
                          fill="transparent"
                          stroke="var(--report-gender-female, #6366f1)"
                          strokeWidth="18"
                          strokeDasharray={`${(femalePct / 100) * 339.29} 339.29`}
                          strokeDashoffset={`${-((malePct / 100) * 339.29)}`}
                          transform="rotate(-90 70 70)"
                        />
                      </svg>
                      <div style={{ position: 'absolute', textAlign: 'center', lineHeight: 1.1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                          {malePct >= femalePct ? `${malePct}%` : `${femalePct}%`}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
                          {malePct >= femalePct ? 'Male' : 'Female'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--report-gender-male, #0284c7)' }} />
                        <span style={{ color: '#64748b' }}>Male</span>
                        <strong style={{ color: '#0f172a' }}>{male.toLocaleString()} ({malePct}%)</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--report-gender-female, #6366f1)' }} />
                        <span style={{ color: '#64748b' }}>Female</span>
                        <strong style={{ color: '#0f172a' }}>{female.toLocaleString()} ({femalePct}%)</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No gender classifications recorded in this view
                  </div>
                )}
              </div>

              {/* Real Age Groups (Children, Teens, Adults, Seniors) */}
              <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Age Groups</h4>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                    {totalAges > 0 ? `${totalAges.toLocaleString()} classified face samples` : 'Computer vision age classifications'}
                  </div>
                </div>
                {ageBrackets.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', flex: 1, justifyContent: 'center' }}>
                    {ageBrackets.map((cohort) => (
                      <div key={cohort.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ color: '#475569', fontWeight: 500 }}>{cohort.label}</span>
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>
                            {cohort.count.toLocaleString()} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({cohort.pct}%)</span>
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(cohort.pct, 100)}%`,
                              height: '100%',
                              background: 'var(--report-primary, #1d4ed8)',
                              borderRadius: '4px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No age-classified faces detected in this view
                  </div>
                )}
              </div>

              {/* Total Fans Engaged KPI */}
              <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Total Fans Engaged</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--report-primary-soft, #eff6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--report-primary, #1d4ed8)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                    {effectiveFans.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    Visual people detections across {venues.length > 0 ? `${venues.length} venues` : 'matchday sports venues'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Real Facial Emotion Sentiment */}
          {topEmotions.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--report-primary, #1d4ed8)' }}>
                    Facial Expression Analysis
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    Fan Emotion Atmosphere
                  </h3>
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Computer vision emotion detection measured across fan faces
                </span>
              </div>

              <div className={styles.executiveCard} style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {topEmotions.slice(0, 5).map((e) => {
                    const pct = totalEmotionsCount > 0 ? Math.round((e.count / totalEmotionsCount) * 100) : 0;
                    const emojiMap: Record<string, string> = {
                      happy: '😊',
                      cheering: '🎉',
                      focused: '🎯',
                      surprised: '😮',
                      neutral: '😐',
                      sad: '😔',
                      fearful: '😨',
                      angry: '😠',
                    };
                    const emoji = emojiMap[e.emotion.toLowerCase()] || '✨';
                    return (
                      <div key={e.emotion} style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                            {emoji} {e.emotion}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#059669' }}>{pct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                          {e.count.toLocaleString()} face detections
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
