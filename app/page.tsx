'use client';

import React, { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [stats, setStats] = useState({
    remoteImages: 0,
    remoteFans: 0,
    onLocationFan: 0,
    hostessImages: 0,
    female: 0,
    male: 0,
    under16: 0,
    age16to40: 0,
    over40: 0,
    merched: 0,
    jersey: 0,
    scarfFlags: 0,
    baseballCap: 0
  });

  const incrementStat = (key: keyof typeof stats) => {
    setStats(prev => ({
      ...prev,
      [key]: prev[key] + 1
    }));
  };

  const resetStats = () => {
    setStats({
      remoteImages: 0,
      remoteFans: 0,
      onLocationFan: 0,
      hostessImages: 0,
      female: 0,
      male: 0,
      under16: 0,
      age16to40: 0,
      over40: 0,
      merched: 0,
      jersey: 0,
      scarfFlags: 0,
      baseballCap: 0
    });
  };

  const StatCard = ({ label, value, statKey }: { label: string; value: number; statKey: keyof typeof stats }) => (
    <div className={styles.statCard} onClick={() => incrementStat(statKey)}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>MessMass</h1>
          <p className={styles.subtitle}>Event Statistics Dashboard</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Images & Fans</h3>
            <div className={styles.statsRow}>
              <StatCard label="Remote Images" value={stats.remoteImages} statKey="remoteImages" />
              <StatCard label="Remote Fans" value={stats.remoteFans} statKey="remoteFans" />
              <StatCard label="On Location Fan" value={stats.onLocationFan} statKey="onLocationFan" />
              <StatCard label="Hostess Images" value={stats.hostessImages} statKey="hostessImages" />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Demographics</h3>
            <div className={styles.statsRow}>
              <StatCard label="Female" value={stats.female} statKey="female" />
              <StatCard label="Male" value={stats.male} statKey="male" />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Age Groups</h3>
            <div className={styles.statsRow}>
              <StatCard label="Under 16" value={stats.under16} statKey="under16" />
              <StatCard label="16 to 40" value={stats.age16to40} statKey="age16to40" />
              <StatCard label="Over 40" value={stats.over40} statKey="over40" />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Merchandise</h3>
            <div className={styles.statsRow}>
              <StatCard label="Merched" value={stats.merched} statKey="merched" />
              <StatCard label="Jersey" value={stats.jersey} statKey="jersey" />
              <StatCard label="Scarf + Flags" value={stats.scarfFlags} statKey="scarfFlags" />
              <StatCard label="Baseball Cap" value={stats.baseballCap} statKey="baseballCap" />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.resetButton} onClick={resetStats}>
            Reset All Stats
          </button>
        </div>
      </div>
    </main>
  );
}