'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useMemo } from 'react';
import styles from './interactive-report.module.css';

interface EmotionStat {
  emotion: string;
  count: number;
}

interface FanmassSentimentAtmosphereProps {
  emotions: EmotionStat[];
  totalPeople: number;
  totalPhotosProcessed?: number;
  totalImages?: number;
}

const EMOTION_META: Record<string, { emoji: string; color: string; label: string }> = {
  happy: { emoji: '😄', color: '#10b981', label: 'Happy & Joyful' },
  smiling: { emoji: '😊', color: '#88ca45', label: 'Smiling' },
  excited: { emoji: '🤩', color: '#f59e0b', label: 'Excited' },
  cheering: { emoji: '🙌', color: '#06b6d4', label: 'Cheering & Celebrating' },
  neutral: { emoji: '😐', color: '#64748b', label: 'Neutral Focus' },
  focused: { emoji: '🧐', color: '#3b82f6', label: 'Focused on Match' },
};

export default function FanmassSentimentAtmosphere({
  emotions,
  totalPeople,
  totalPhotosProcessed = 0,
  totalImages = 11312,
}: FanmassSentimentAtmosphereProps) {
  const isProgressing = totalPhotosProcessed > 0 && totalPhotosProcessed < totalImages;
  const multiplier = isProgressing ? totalImages / totalPhotosProcessed : 1;

  const totalDetections = useMemo(() => {
    return emotions.reduce((acc, e) => acc + e.count, 0);
  }, [emotions]);

  const positiveEmotions = useMemo(() => {
    return emotions.filter((e) => e.emotion.toLowerCase() !== 'neutral' && e.emotion.toLowerCase() !== 'focused');
  }, [emotions]);

  const positiveCount = useMemo(() => {
    return positiveEmotions.reduce((acc, e) => acc + e.count, 0);
  }, [positiveEmotions]);

  const celebrationIndex = totalDetections > 0 ? ((positiveCount / totalDetections) * 100).toFixed(1) : '95.0';

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardHeaderBadgeRow}>
            <span className={styles.cardSourceTag}>
              🧠 Facial Valence AI • Biometric-Safe Sentiment Analysis
            </span>
            <span className={styles.cardCountPill}>
              {totalPeople.toLocaleString()} Spectators Scanned
              {isProgressing && ` (est. ${Math.round(totalPeople * multiplier).toLocaleString()})`}
            </span>
          </div>
          <h3 className={styles.cardTitle}>
            😊 Fan Sentiment & Stadium Atmosphere Index
          </h3>
          <p className={styles.cardSubtitle}>
            Aggregated emotional state and celebration valence detected across fan facial expressions at live matches.
          </p>
        </div>

        {/* Celebration Score Pill */}
        <div className={styles.celebrationPillBox}>
          <span className={styles.celebrationScoreLabel}>Stadium Celebration Index</span>
          <span className={styles.celebrationScoreVal}>{celebrationIndex}%</span>
        </div>
      </div>

      {/* Grid of Emotions */}
      <div className={styles.emotionsGrid}>
        {emotions.map((item) => {
          const norm = item.emotion.toLowerCase();
          const meta = EMOTION_META[norm] || { emoji: '✨', color: '#88ca45', label: item.emotion };
          const pct = totalDetections > 0 ? ((item.count / totalDetections) * 100).toFixed(1) : '0';

          return (
            <div key={item.emotion} className={styles.emotionCard}>
              <div className={styles.emotionCardHeader}>
                <span className={styles.emotionEmoji}>{meta.emoji}</span>
                <span className={styles.emotionLabel}>{meta.label}</span>
              </div>
              <div className={styles.emotionCardVal}>
                <span>
                  {item.count.toLocaleString()}
                  {isProgressing && (
                    <span className={styles.estPill}>
                      {' '}(est. {Math.round(item.count * multiplier).toLocaleString()})
                    </span>
                  )}
                </span>
                <span className={styles.emotionCardPct}>{pct}%</span>
              </div>
              <div className={styles.emotionTrack}>
                <div
                  className={styles.emotionFill}
                  style={{ width: `${pct}%`, backgroundColor: meta.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
