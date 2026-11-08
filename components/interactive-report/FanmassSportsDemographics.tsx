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
  totalPhotosProcessed?: number;
  totalImages?: number;
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
  totalPhotosProcessed = 0,
  totalImages = 11312,
}: FanmassSportsDemographicsProps) {
  const [activeTab, setActiveTab] = useState<'comparison' | 'gender' | 'age'>('comparison');
  const isProgressing = totalPhotosProcessed > 0 && totalPhotosProcessed < totalImages;
  const multiplier = isProgressing ? totalImages / totalPhotosProcessed : 1;

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
              {isProgressing && ` (est. ${Math.round(totalPeople * multiplier).toLocaleString()})`}
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
            onClick={() => setActiveTab('comparison')}
            className={`${styles.granularityBtn} ${
              activeTab === 'comparison' ? styles.granularityBtnActive : ''
            }`}
          >
            📊 Side-by-Side Comparison
          </button>
          <button
            onClick={() => setActiveTab('gender')}
            className={`${styles.granularityBtn} ${
              activeTab === 'gender' ? styles.granularityBtnActive : ''
            }`}
          >
            Gender Breakdown
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

      {activeTab === 'comparison' ? (
        /* Unified Side-by-Side Comparison View */
        <div className={styles.compChartContainer}>
          {/* Chart 1: Gender Distribution Side-by-Side */}
          <div className={styles.compSectionCard}>
            <div className={styles.compSectionTitle}>
              <span>⚖️ Gender Balance Across Sports (with 50/50 Parity Line)</span>
              <div className={styles.compLegendRow}>
                <span className={styles.compLegendItem}>
                  <span className={styles.compLegendDot} style={{ background: '#0284c7' }} />
                  Male Spectators
                </span>
                <span className={styles.compLegendItem}>
                  <span className={styles.compLegendDot} style={{ background: '#ec4899' }} />
                  Female Spectators
                </span>
              </div>
            </div>

            <div className={styles.compRowsStack}>
              {sportsList.map((sport) => {
                const meta = SPORT_META[sport] || { icon: '🏅', label: sport };
                const data = sportsBreakdown[sport] || {
                  images: 0,
                  people: 0,
                  genders: { male: 0, female: 0 },
                };
                const maleCount = data.genders?.male || 0;
                const femaleCount = data.genders?.female || 0;
                const totGender = maleCount + femaleCount;
                const malePct =
                  totGender > 0 ? Number(((maleCount / totGender) * 100).toFixed(1)) : 50.0;
                const femalePct =
                  totGender > 0 ? Number(((femaleCount / totGender) * 100).toFixed(1)) : 50.0;

                return (
                  <div key={sport} className={styles.compRowItem}>
                    <div className={styles.compSportLabelWrap}>
                      <span className={styles.compSportIcon}>{meta.icon}</span>
                      <div>
                        <div className={styles.compSportName}>{sport}</div>
                        <div className={styles.compSportPhotos}>{data.people.toLocaleString()} fans</div>
                      </div>
                    </div>

                    <div className={styles.compBarWrapper}>
                      <div className={styles.compSplitBar}>
                        <div
                          style={{
                            width: `${malePct}%`,
                            background: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            paddingLeft: '8px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {malePct > 15 ? `${malePct}%` : ''}
                        </div>
                        <div
                          style={{
                            width: `${femalePct}%`,
                            background: '#ec4899',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: '8px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {femalePct > 15 ? `${femalePct}%` : ''}
                        </div>
                      </div>
                      <div className={styles.compParityMarkerLine} title="50% Gender Parity" />
                    </div>

                    <div style={{ fontSize: '11px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <strong style={{ color: '#0284c7' }}>{malePct}%</strong> M •{' '}
                      <strong style={{ color: '#ec4899' }}>{femalePct}%</strong> F
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.compCallout}>
              <span>💡</span>
              <div>
                <strong>Demographic Finding:</strong> Handball (K&amp;H Liga) exhibits the highest female audience participation at live matches, while Football maintains the strongest male concentration.
              </div>
            </div>
          </div>

          {/* Chart 2: Generational Age Bracket Stacked Distribution */}
          <div className={styles.compSectionCard}>
            <div className={styles.compSectionTitle}>
              <span>👥 Generational Breakdown Across Sports</span>
              <div className={styles.compLegendRow}>
                <span className={styles.compLegendItem}>
                  <span className={styles.compLegendDot} style={{ background: '#f59e0b' }} />
                  Children (&lt;13)
                </span>
                <span className={styles.compLegendItem}>
                  <span className={styles.compLegendDot} style={{ background: '#0284c7' }} />
                  Teens (14-18)
                </span>
                <span className={styles.compLegendItem}>
                  <span className={styles.compLegendDot} style={{ background: '#059669' }} />
                  Adults (19-55)
                </span>
                <span className={styles.compLegendItem}>
                  <span className={styles.compLegendDot} style={{ background: '#8b5cf6' }} />
                  Seniors (55+)
                </span>
              </div>
            </div>

            <div className={styles.compRowsStack}>
              {sportsList.map((sport) => {
                const meta = SPORT_META[sport] || { icon: '🏅', label: sport };
                const data = sportsBreakdown[sport] || {
                  images: 0,
                  people: 0,
                  ageGroups: { children: 0, teens: 0, adults: 0, seniors: 0 },
                };
                const ag = data.ageGroups || { children: 0, teens: 0, adults: 0, seniors: 0 };
                const totAge = ag.children + ag.teens + ag.adults + ag.seniors;
                const adultsPct = totAge > 0 ? Math.round((ag.adults / totAge) * 100) : 0;
                const teensPct = totAge > 0 ? Math.round((ag.teens / totAge) * 100) : 0;
                const childrenPct = totAge > 0 ? Math.round((ag.children / totAge) * 100) : 0;
                const seniorsPct =
                  totAge > 0 ? Math.max(0, 100 - (adultsPct + teensPct + childrenPct)) : 0;

                return (
                  <div key={sport} className={styles.compRowItem}>
                    <div className={styles.compSportLabelWrap}>
                      <span className={styles.compSportIcon}>{meta.icon}</span>
                      <div>
                        <div className={styles.compSportName}>{sport}</div>
                        <div className={styles.compSportPhotos}>
                          {data.people.toLocaleString()} spectators
                        </div>
                      </div>
                    </div>

                    <div className={styles.compBarWrapper}>
                      <div className={styles.compSplitBar}>
                        <div
                          style={{
                            width: `${childrenPct}%`,
                            background: '#f59e0b',
                            title: `Children: ${childrenPct}%`,
                          }}
                        />
                        <div
                          style={{
                            width: `${teensPct}%`,
                            background: '#0284c7',
                            title: `Teens: ${teensPct}%`,
                          }}
                        />
                        <div
                          style={{
                            width: `${adultsPct}%`,
                            background: '#059669',
                            title: `Adults: ${adultsPct}%`,
                          }}
                        />
                        <div
                          style={{
                            width: `${seniorsPct}%`,
                            background: '#8b5cf6',
                            title: `Seniors: ${seniorsPct}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#f59e0b' }}>{childrenPct}% Ch</span> •{' '}
                      <span style={{ color: '#0284c7' }}>{teensPct}% Te</span> •{' '}
                      <span style={{ color: '#059669' }}>{adultsPct}% Ad</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.compCallout} style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
              <span>💡</span>
              <div>
                <strong>Youth &amp; Family Insight:</strong> Ice Hockey and Basketball attract the highest proportion of young spectators (children and teenagers account for ~20-22% of attendees), creating strong multi-generational family engagement.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Grid of 4 Sports Cards */
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
                  <strong>{data.people.toLocaleString()}</strong>
                  {isProgressing && <span className={styles.estPill}> (est. {Math.round(data.people * multiplier).toLocaleString()})</span>} fans / {data.images.toLocaleString()}
                  {isProgressing && <span className={styles.estPill}> (est. {Math.round(data.images * multiplier).toLocaleString()})</span>} photos
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
                      <span className={styles.genderCount}>
                        ({maleCount.toLocaleString()}
                        {isProgressing && (
                          <span className={styles.estPill}>
                            {' '}est. {Math.round(maleCount * multiplier).toLocaleString()}
                          </span>
                        )})
                      </span>
                    </div>
                    <div className={styles.genderStatItem}>
                      <span className={styles.genderDotFemale} />
                      <span className={styles.genderLabel}>Female</span>
                      <strong className={styles.genderVal}>{femalePct}%</strong>
                      <span className={styles.genderCount}>
                        ({femaleCount.toLocaleString()}
                        {isProgressing && (
                          <span className={styles.estPill}>
                            {' '}est. {Math.round(femaleCount * multiplier).toLocaleString()}
                          </span>
                        )})
                      </span>
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
                        <strong>
                          {adultsPct}% ({ag.adults.toLocaleString()}
                          {isProgressing && (
                            <span className={styles.estPill}>
                              {' '}est. {Math.round(ag.adults * multiplier).toLocaleString()}
                            </span>
                          )})
                        </strong>
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
                        <strong>
                          {teensPct}% ({ag.teens.toLocaleString()}
                          {isProgressing && (
                            <span className={styles.estPill}>
                              {' '}est. {Math.round(ag.teens * multiplier).toLocaleString()}
                            </span>
                          )})
                        </strong>
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
                        <strong>
                          {childrenPct}% ({ag.children.toLocaleString()}
                          {isProgressing && (
                            <span className={styles.estPill}>
                              {' '}est. {Math.round(ag.children * multiplier).toLocaleString()}
                            </span>
                          )})
                        </strong>
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
                        <strong>
                          {seniorsPct}% ({ag.seniors.toLocaleString()}
                          {isProgressing && (
                            <span className={styles.estPill}>
                              {' '}est. {Math.round(ag.seniors * multiplier).toLocaleString()}
                            </span>
                          )})
                        </strong>
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
      )}
    </div>
  );
}
