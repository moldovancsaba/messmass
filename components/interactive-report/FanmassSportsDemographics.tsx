'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState } from 'react';
import styles from './interactive-report.module.css';

interface SportBreakdownItem {
  images: number;
  people: number;
  genders?: {
    male: number;
    female: number;
    malePct?: number;
    femalePct?: number;
  };
  ageGroups?: {
    children: number;
    teens: number;
    adults: number;
    seniors: number;
  };
}

interface FanmassSportsDemographicsProps {
  sportsBreakdown: Record<string, SportBreakdownItem>;
  totalPeople: number;
}

const SPORT_META: Record<string, { icon: string; color: string; label: string }> = {
  Basketball: { icon: '🏀', color: '#b45309', label: 'Basketball (Tippmix Férfi/Női NB1)' },
  Football: { icon: '⚽', color: '#059669', label: 'Football (OTP Bank Liga NB1 / NB2)' },
  Handball: { icon: '🤾', color: '#e11d48', label: 'Handball (K&H Liga Férfi/Női)' },
  'Ice Hockey': { icon: '🏒', color: '#0284c7', label: 'Ice Hockey (Erste Liga)' },
};

export default function FanmassSportsDemographics({
  sportsBreakdown,
  totalPeople,
}: FanmassSportsDemographicsProps) {
  const [activeTab, setActiveTab] = useState<'gender' | 'age'>('gender');

  const sportsList = ['Basketball', 'Football', 'Handball', 'Ice Hockey'];

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardHeaderBadgeRow}>
            <span className={styles.cardSourceTag}>
              🔬 Visual Demographics Engine • Facial & Feature Recognition
            </span>
            <span className={styles.cardCountPill}>
              {totalPeople.toLocaleString()} Spectators Analyzed
            </span>
          </div>
          <h3 className={styles.cardTitle}>
            🏆 Cross-Sport Demographics & Age Comparison
          </h3>
          <p className={styles.cardSubtitle}>
            Empirical comparison of gender ratios and generational age brackets identified across the 4 sponsored sports leagues.
          </p>
        </div>

        {/* View Toggle */}
        <div className={styles.granularityToggle}>
          <button
            onClick={() => setActiveTab('gender')}
            className={`${styles.granularityBtn} ${
              activeTab === 'gender' ? styles.granularityBtnActive : ''
            }`}
          >
            Gender Comparison
          </button>
          <button
            onClick={() => setActiveTab('age')}
            className={`${styles.granularityBtn} ${
              activeTab === 'age' ? styles.granularityBtnActive : ''
            }`}
          >
            Age Brackets by Sport
          </button>
        </div>
      </div>

      {/* Grid of 4 Sports Cards */}
      <div className={styles.sportsDemoGrid}>
        {sportsList.map((sport) => {
          const meta = SPORT_META[sport] || { icon: '🏅', color: '#64748b', label: sport };
          const data = sportsBreakdown[sport] || {
            images: 0,
            people: 0,
            genders: { male: 0, female: 0, malePct: 50, femalePct: 50 },
            ageGroups: { children: 0, teens: 0, adults: 0, seniors: 0 },
          };

          const maleCount = data.genders?.male || 0;
          const femaleCount = data.genders?.female || 0;
          const totGender = maleCount + femaleCount;
          const malePct =
            totGender > 0 ? Number(((maleCount / totGender) * 100).toFixed(1)) : 50.0;
          const femalePct =
            totGender > 0 ? Number(((femaleCount / totGender) * 100).toFixed(1)) : 50.0;

          const ag = data.ageGroups || { children: 0, teens: 0, adults: 0, seniors: 0 };
          const totAge = ag.children + ag.teens + ag.adults + ag.seniors;
          const adultsPct = totAge > 0 ? Math.round((ag.adults / totAge) * 100) : 0;
          const teensPct = totAge > 0 ? Math.round((ag.teens / totAge) * 100) : 0;
          const childrenPct = totAge > 0 ? Math.round((ag.children / totAge) * 100) : 0;
          const seniorsPct = totAge > 0 ? Math.round((ag.seniors / totAge) * 100) : 0;

          return (
            <div key={sport} className={styles.sportDemoCard}>
              {/* Card Header */}
              <div className={styles.sportCardHeader}>
                <div className={styles.sportCardTitleWrap}>
                  <span className={styles.sportCardIcon}>{meta.icon}</span>
                  <div>
                    <h4 className={styles.sportCardName}>{sport}</h4>
                    <span className={styles.sportCardLeague}>{meta.label}</span>
                  </div>
                </div>
                <div className={styles.sportVolumeBadge}>
                  <strong>{data.people.toLocaleString()}</strong> fans / {data.images} photos
                </div>
              </div>

              {activeTab === 'gender' ? (
                /* Gender Comparison View */
                <div className={styles.sportGenderView}>
                  <div className={styles.genderSplitBar}>
                    <div
                      className={styles.genderSplitMale}
                      style={{ width: `${malePct}%` }}
                      title={`Male: ${malePct}%`}
                    />
                    <div
                      className={styles.genderSplitFemale}
                      style={{ width: `${femalePct}%` }}
                      title={`Female: ${femalePct}%`}
                    />
                  </div>

                  <div className={styles.genderStatsRow}>
                    <div className={styles.genderStatItem}>
                      <span className={styles.genderDotMale} />
                      <span className={styles.genderLabel}>Male</span>
                      <strong className={styles.genderVal}>{malePct}%</strong>
                      <span className={styles.genderCount}>({maleCount.toLocaleString()})</span>
                    </div>
                    <div className={styles.genderStatItem}>
                      <span className={styles.genderDotFemale} />
                      <span className={styles.genderLabel}>Female</span>
                      <strong className={styles.genderVal}>{femalePct}%</strong>
                      <span className={styles.genderCount}>({femaleCount.toLocaleString()})</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Age Bracket Distribution View */
                <div className={styles.sportAgeView}>
                  <div className={styles.ageBarsStack}>
                    {/* Adults */}
                    <div className={styles.ageBarRow}>
                      <div className={styles.ageBarLabelGroup}>
                        <span>Adults (19-55)</span>
                        <strong>{adultsPct}% ({ag.adults})</strong>
                      </div>
                      <div className={styles.ageBarTrack}>
                        <div
                          className={styles.ageBarFillAdults}
                          style={{ width: `${adultsPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Teens */}
                    <div className={styles.ageBarRow}>
                      <div className={styles.ageBarLabelGroup}>
                        <span>Teens (14-18)</span>
                        <strong>{teensPct}% ({ag.teens})</strong>
                      </div>
                      <div className={styles.ageBarTrack}>
                        <div
                          className={styles.ageBarFillTeens}
                          style={{ width: `${teensPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Children */}
                    <div className={styles.ageBarRow}>
                      <div className={styles.ageBarLabelGroup}>
                        <span>Children (&lt;13)</span>
                        <strong>{childrenPct}% ({ag.children})</strong>
                      </div>
                      <div className={styles.ageBarTrack}>
                        <div
                          className={styles.ageBarFillChildren}
                          style={{ width: `${childrenPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Seniors */}
                    <div className={styles.ageBarRow}>
                      <div className={styles.ageBarLabelGroup}>
                        <span>Seniors (55+)</span>
                        <strong>{seniorsPct}% ({ag.seniors})</strong>
                      </div>
                      <div className={styles.ageBarTrack}>
                        <div
                          className={styles.ageBarFillSeniors}
                          style={{ width: `${seniorsPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
