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
  reportSlug: _reportSlug = null,
  onViewTerritoryMap,
  variant = 'all',
  className = '',
}: MarketingCommercialSuiteProps) {
  const sponsorLabel = partnerName ? partnerName.trim() : null;

  const resolvedCampaignTitle =
    campaignTitle || `${sponsorLabel ? sponsorLabel.toUpperCase() : 'SPONSOR'} FAN ACTIVATION`;

  const resolvedCtaText =
    ctaText || `CLAIM EXCLUSIVE ${sponsorLabel ? sponsorLabel.toUpperCase() : 'SPONSOR'} OFFER`;

  const resolvedClicksSubtitle = sponsorLabel
    ? `Direct clicks to the ${sponsorLabel} digital activation portal`
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
    <div className={`${styles.commercialSuiteContainer} ${styles.suiteStack} ${className}`}>
      {showCommercial && (
        <div className={styles.suiteStack}>
          <div>
            <div className={styles.suiteSectionHeader}>
              <div>
                <span className={styles.gdsEyebrow}>Verified Direct Engagement & Leads</span>
                <h3 className={styles.gdsSectionTitle}>Marketing Consent & Fan Acquisition</h3>
              </div>
              <span className={styles.gdsCaption}>
                Confirmed direct GDPR opt-ins captured through matchday fan photo interactions
              </span>
            </div>

            <div className={styles.suiteGrid4}>
              {rightsConsentPct !== null && (
              <div className={`${styles.executiveCard} ${styles.suiteCardColumn}`}>
                <div className={styles.suiteCardTop}>
                  <span className={styles.gdsBody}>Privacy, Terms & Image Rights</span>
                  <div className={styles.suiteIconBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                </div>
                <div className={styles.suiteCardBottom}>
                  <div className={styles.gdsSectionKpi}>
                    {`${rightsConsentPct.toFixed(1)}%`}
                  </div>
                  <div className={styles.gdsCaption}>
                    {effectiveRegistered.toLocaleString()} of {rightsDenom.toLocaleString()} consented to Privacy, Terms & image rights
                  </div>
                </div>
              </div>
              )}

              <div className={`${styles.executiveCard} ${styles.suiteCardColumn}`}>
                <div className={styles.suiteCardTop}>
                  <span className={styles.gdsBody}>Marketing Opt-in Rate</span>
                  <div className={styles.suiteIconBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 11 18-5v12L3 14v-3z" />
                      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                    </svg>
                  </div>
                </div>
                <div className={styles.suiteCardBottom}>
                  <div className={styles.gdsSectionKpi}>{optInPct.toFixed(1)}%</div>
                  <div className={styles.gdsCaption}>
                    {effectiveOptIns.toLocaleString()} of {effectiveRegistered.toLocaleString()} opted into marketing communications
                  </div>
                </div>
              </div>

              <div className={`${styles.executiveCard} ${styles.suiteCardColumn}`}>
                <div className={styles.suiteCardTop}>
                  <span className={styles.gdsBody}>Verified Marketing Leads</span>
                  <div className={styles.suiteIconBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <polyline points="17 11 19 13 23 9" />
                    </svg>
                  </div>
                </div>
                <div className={styles.suiteCardBottom}>
                  <div className={styles.gdsSectionKpi}>{effectiveOptIns.toLocaleString()}</div>
                  <div className={styles.gdsCaption}>
                    Verified marketing communication opt-ins from active submissions
                  </div>
                </div>
              </div>

              <div className={`${styles.executiveCard} ${styles.suiteCardColumn}`}>
                <div className={styles.suiteCardTop}>
                  <span className={styles.gdsBody}>Active Fan Interactions</span>
                  <div className={styles.suiteIconBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                </div>
                <div className={styles.suiteCardBottom}>
                  <div className={styles.gdsSectionKpi}>
                    {(totalPhotosProcessed > 0 ? totalPhotosProcessed : effectiveRegistered).toLocaleString()}
                  </div>
                  <div className={styles.gdsCaption}>
                    Analyzed fan photos across verified matchday activations
                  </div>
                </div>
              </div>
            </div>
          </div>

          {bannerClicks > 0 && (
          <div>
            <div className={styles.suiteSectionHeader}>
              <div>
                <span className={styles.gdsEyebrow}>Digital Fan Activation</span>
                <h3 className={styles.gdsSectionTitle}>Pop-up Performance</h3>
              </div>
              <span className={styles.gdsCaption}>
                Engagement and click-through on in-flow activation banners
              </span>
            </div>

            <div className={styles.suiteGrid3}>
              <div className={`${styles.executiveCard} ${styles.suiteBanner}`}>
                <div className={styles.gdsCardTitle}>{resolvedCampaignTitle}</div>
                <div className={styles.suiteCardBottom}>
                  <span className={styles.suiteBannerCta}>{resolvedCtaText}</span>
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
              {popUpCtr !== null && (
              <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Pop-up Click Through Rate</span>
                  {popUpCtr >= 10 && (
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'var(--report-primary-soft, #eff6ff)', color: 'var(--report-primary, #1d4ed8)' }}>
                      High Intent
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                    {`${popUpCtr.toFixed(1)}%`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    {bannerImpressions > 0
                      ? `From ${bannerImpressions.toLocaleString()} consented submissions`
                      : 'No impression denominator recorded'}
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
          )}
        </div>
      )}

      {/* =========================================================================
          DEMOGRAPHICS & EMOTIONS BLOCK: Empirical Audience DNA
          ========================================================================= */}
      {showDemographics && (
        <div className={styles.suiteStack}>
          <div>
            <div className={styles.suiteSectionHeader}>
              <div>
                <span className={styles.gdsEyebrow}>Audience Composition & DNA</span>
                <h3 className={styles.gdsSectionTitle}>AI-Measured Audience Demographics</h3>
              </div>
              <div className={styles.suiteLegendItem}>
                {totalEmotionsCount > 0 && (
                  <span className={styles.suiteBadge}>😊 {happyPct}% Positive Valence</span>
                )}
                {onViewTerritoryMap && (
                  <button type="button" onClick={onViewTerritoryMap} className={styles.suiteBannerCta}>
                    🗺️ Explore Territory Map →
                  </button>
                )}
              </div>
            </div>

            <div className={styles.suiteGrid3}>
              {/* Gender Distribution Donut */}
              {totalGender > 0 && (
              <div className={`${styles.executiveCard} ${styles.suiteCardColumn}`}>
                <h4 className={styles.gdsCardTitle}>Gender Distribution</h4>
                  <>
                    <div className={styles.suiteDonutWrap}>
                      <svg width="144" height="144" viewBox="0 0 140 140" role="img" aria-label={`Gender split: ${malePct}% male, ${femalePct}% female`}>
                        <circle cx="70" cy="70" r="54" fill="transparent" stroke="var(--mm-gray-100)" strokeWidth="18" />
                        <circle
                          cx="70"
                          cy="70"
                          r="54"
                          fill="transparent"
                          stroke="var(--report-gender-male, var(--report-primary, #0284c7))"
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
                          stroke="var(--report-gender-female, var(--report-accent, #6366f1))"
                          strokeWidth="18"
                          strokeDasharray={`${(femalePct / 100) * 339.29} 339.29`}
                          strokeDashoffset={`${-((malePct / 100) * 339.29)}`}
                          transform="rotate(-90 70 70)"
                        />
                      </svg>
                      <div className={styles.suiteDonutCenter}>
                        <div className={styles.gdsSectionKpi}>
                          {malePct >= femalePct ? `${malePct}%` : `${femalePct}%`}
                        </div>
                        <div className={styles.gdsEyebrow}>
                          {malePct >= femalePct ? 'Male' : 'Female'}
                        </div>
                      </div>
                    </div>
                    <div className={styles.suiteLegendRow}>
                      <div className={styles.suiteLegendItem}>
                        <span className={styles.suiteSwatchMale} />
                        <span className={styles.gdsCaption}>Male</span>
                        <strong className={`${styles.gdsBody} ${styles.gdsNum}`}>{male.toLocaleString()} ({malePct}%)</strong>
                      </div>
                      <div className={styles.suiteLegendItem}>
                        <span className={styles.suiteSwatchFemale} />
                        <span className={styles.gdsCaption}>Female</span>
                        <strong className={`${styles.gdsBody} ${styles.gdsNum}`}>{female.toLocaleString()} ({femalePct}%)</strong>
                      </div>
                    </div>
                  </>
              </div>
              )}

              {/* Real Age Groups (Children, Teens, Adults, Seniors) */}
              <div className={`${styles.executiveCard} ${styles.suiteCardColumn}`}>
                <div>
                  <h4 className={styles.gdsCardTitle}>Age Groups</h4>
                  <div className={styles.gdsCaption}>
                    {totalAges > 0 ? `${totalAges.toLocaleString()} classified face samples` : 'Computer vision age classifications'}
                  </div>
                </div>
                {ageBrackets.length > 0 ? (
                  <div className={styles.suiteCardBottom}>
                    {ageBrackets.map((cohort) => (
                      <div key={cohort.label}>
                        <div className={styles.suiteCardTop}>
                          <span className={styles.gdsBody}>{cohort.label}</span>
                          <span className={`${styles.gdsBody} ${styles.gdsNum}`}>
                            {cohort.count.toLocaleString()} <span className={styles.gdsCaption}>({cohort.pct}%)</span>
                          </span>
                        </div>
                        <div className={styles.suiteTrack}>
                          <div className={styles.suiteTrackFill} style={{ width: `${Math.min(cohort.pct, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.suiteEmptyState}>No age-classified faces detected in this view</div>
                )}
              </div>

              {/* Total Fans Engaged KPI */}
              <div className={`${styles.executiveCard} ${styles.suiteCardColumn}`}>
                <div className={styles.suiteCardTop}>
                  <span className={styles.gdsBody}>Total Fans Engaged</span>
                </div>
                <div className={styles.suiteIconRowMiddle}>
                  <div className={styles.suiteIconBoxLarge}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
                <div className={styles.suiteCardBottom}>
                  <div className={styles.gdsSectionKpi}>{effectiveFans.toLocaleString()}</div>
                  <div className={styles.gdsCaption}>
                    Visual people detections across {venues.length > 0 ? `${venues.length} ${venues.length === 1 ? 'venue' : 'venues'}` : 'matchday sports venues'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {topEmotions.length > 0 && (
            <div>
              <div className={styles.suiteSectionHeader}>
                <div>
                  <span className={styles.gdsEyebrow}>Facial Expression Analysis</span>
                  <h3 className={styles.gdsSectionTitle}>Fan Emotion Atmosphere</h3>
                </div>
                <span className={styles.gdsCaption}>
                  Computer vision emotion detection measured across fan faces
                </span>
              </div>

              <div className={styles.executiveCard}>
                <div className={styles.suiteGrid4}>
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
                      <div key={e.emotion} className={styles.suiteEmotionCard}>
                        <div className={styles.suiteCardTop}>
                          <span className={styles.gdsBody}>
                            {emoji} {e.emotion}
                          </span>
                          <span className={`${styles.gdsBody} ${styles.gdsNum}`}>{pct}%</span>
                        </div>
                        <div className={styles.suiteTrack}>
                          <div className={styles.suiteTrackFill} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <div className={styles.gdsCaption}>
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
