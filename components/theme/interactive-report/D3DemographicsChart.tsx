'use client';
/* eslint-disable react/forbid-dom-props */

import React from 'react';
import { DemographicsData } from './types';
import styles from './interactive-report.module.css';

interface D3DemographicsChartProps {
  demographics: DemographicsData;
}

export default function D3DemographicsChart({ demographics }: D3DemographicsChartProps) {
  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>
            👥 Audience Demographics & Fan Intelligence
          </h3>
          <p className={styles.cardSubtitle}>
            Based on 60,666 scanned stadium attendee impressions across sponsored arenas.
          </p>
        </div>
      </div>

      <div className={styles.twoColGrid}>
        {/* Gender Distribution */}
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

          {/* Fan Merch & Presence */}
          <div className={styles.demoMetricsRow}>
            <div>
              <div className={styles.cardSubtitle}>Merch Adoption</div>
              <div className={styles.sportPhotos}>{demographics.merchAdoption}%</div>
              <div className={styles.cardSubtitle}>Jerseys, scarves & caps</div>
            </div>
            <div>
              <div className={styles.cardSubtitle}>Stadium Presence</div>
              <div className={styles.sportPhotos}>{demographics.stadiumAtmosphere}%</div>
              <div className={styles.cardSubtitle}>Live in-arena fans</div>
            </div>
          </div>
        </div>

        {/* Age Groups Pyramid */}
        <div className={styles.demoCol}>
          <div className={styles.demoColTitle}>
            Generation & Age Segmentation
          </div>

          <div className={styles.generationList}>
            {demographics.generations.map((gen) => (
              <div key={gen.label}>
                <div className={styles.generationHeader}>
                  <span>{gen.label}</span>
                  <strong>
                    {gen.percent}% ({gen.count.toLocaleString()})
                  </strong>
                </div>
                <div className={styles.genBarTrack}>
                  {/* WHAT: Dynamic width percentage for age generation distribution
                      WHY: Visualizes proportion of fans in each age tier */}
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <div
                    className={`${styles.genBarFill} ${gen.label.includes('Y+Z') ? styles.genBarFillHighlight : ''}`}
                    style={{ width: `${gen.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.cardSubtitle}>
            ⚡ <strong>Gen Y+Z (14-35)</strong> represents over 57% of active attendees — optimal key demographic for Tippmix digital engagement.
          </div>
        </div>
      </div>
    </div>
  );
}
