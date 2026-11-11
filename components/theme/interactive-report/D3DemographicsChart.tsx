'use client';
/* eslint-disable react/forbid-dom-props */

import React from 'react';
import { DemographicsData } from './types';
import styles from './interactive-report.module.css';

interface D3DemographicsChartProps {
  demographics: DemographicsData | null;
}

export default function D3DemographicsChart({ demographics }: D3DemographicsChartProps) {
  if (!demographics) {
    return (
      <div className={styles.reportCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>
              👥 Audience Demographics
            </h3>
            <p className={styles.cardSubtitle}>
              No audience measurements for this scope.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasGender = demographics.male + demographics.female > 0;
  const generations = demographics.generations.filter((gen) => gen.count > 0);
  const largestGeneration = generations.reduce<DemographicsData['generations'][number] | null>(
    (best, gen) => (best === null || gen.count > best.count ? gen : best),
    null
  );

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>
            👥 Audience Demographics
          </h3>
          <p className={styles.cardSubtitle}>
            Based on {demographics.totalAudience.toLocaleString()} people detected in analyzed images.
          </p>
        </div>
      </div>

      <div className={styles.twoColGrid}>
        {/* Gender Distribution */}
        {hasGender && (
          <div className={styles.demoCol}>
            <div className={styles.demoColTitle}>
              Gender Breakdown
            </div>

            <div className={styles.genderMeter}>
              {/* WHAT: Dynamic width percentage for male audience ratio
                  WHY: Reflects demographic distribution from computer vision face analytics */}
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <div
                className={styles.maleBar}
                style={{ width: `${demographics.maleRatio}%` }}
              >
                {demographics.maleRatio}%
              </div>
              {/* WHAT: Dynamic width percentage for female audience ratio
                  WHY: Reflects demographic distribution from computer vision face analytics */}
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <div
                className={styles.femaleBar}
                style={{ width: `${demographics.femaleRatio}%` }}
              >
                {demographics.femaleRatio}%
              </div>
            </div>

            <div className={styles.genderLegend}>
              <div className={styles.brandTitleGroup}>
                <span className={styles.genderDotMale} />
                <span>Male:</span>
                <strong>{demographics.male.toLocaleString()}</strong> ({demographics.maleRatio}%)
              </div>
              <div className={styles.brandTitleGroup}>
                <span className={styles.genderDotFemale} />
                <span>Female:</span>
                <strong>{demographics.female.toLocaleString()}</strong> ({demographics.femaleRatio}%)
              </div>
            </div>
          </div>
        )}

        {/* Age Groups */}
        {generations.length > 0 && (
          <div className={styles.demoCol}>
            <div className={styles.demoColTitle}>
              Age Segmentation
            </div>

            <div className={styles.generationList}>
              {generations.map((gen) => (
                <div key={gen.label}>
                  <div className={styles.generationHeader}>
                    <span>{gen.label}</span>
                    <strong>
                      {gen.percent}% ({gen.count.toLocaleString()})
                    </strong>
                  </div>
                  <div className={styles.genBarTrack}>
                    {/* WHAT: Dynamic width percentage for age group distribution
                        WHY: Visualizes the measured proportion of each age group */}
                    {/* eslint-disable-next-line react/forbid-dom-props */}
                    <div
                      className={`${styles.genBarFill} ${gen === largestGeneration ? styles.genBarFillHighlight : ''}`}
                      style={{ width: `${gen.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {largestGeneration && (
              <div className={styles.cardSubtitle}>
                Largest measured age group: <strong>{largestGeneration.label}</strong> ({largestGeneration.percent}%).
              </div>
            )}
          </div>
        )}

        {!hasGender && generations.length === 0 && (
          <div className={styles.cardSubtitle}>
            No audience measurements for this scope.
          </div>
        )}
      </div>
    </div>
  );
}
