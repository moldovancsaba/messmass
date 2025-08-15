'use client';

import React, { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
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

  const downloadCSV = () => {
    const csvData = [
      ['Event Name', eventName || 'Untitled Event'],
      ['Event Date', eventDate],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Category', 'Metric', 'Count'],
      ['Images & Fans', 'Remote Images', stats.remoteImages],
      ['Images & Fans', 'Remote Fans', stats.remoteFans],
      ['Images & Fans', 'On Location Fan', stats.onLocationFan],
      ['Images & Fans', 'Hostess Images', stats.hostessImages],
      ['Demographics', 'Female', stats.female],
      ['Demographics', 'Male', stats.male],
      ['Age Groups', 'Under 16', stats.under16],
      ['Age Groups', '16 to 40', stats.age16to40],
      ['Age Groups', 'Over 40', stats.over40],
      ['Merchandise', 'Merched', stats.merched],
      ['Merchandise', 'Jersey', stats.jersey],
      ['Merchandise', 'Scarf + Flags', stats.scarfFlags],
      ['Merchandise', 'Baseball Cap', stats.baseballCap],
      [''],
      ['Total Count', '', Object.values(stats).reduce((sum, val) => sum + val, 0)]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${eventName || 'event'}_stats_${eventDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportToGoogleSheets = () => {
    const data = [
      ['Event Name:', eventName || 'Untitled Event'],
      ['Event Date:', eventDate],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Category', 'Metric', 'Count'],
      ['Images & Fans', 'Remote Images', stats.remoteImages],
      ['Images & Fans', 'Remote Fans', stats.remoteFans],
      ['Images & Fans', 'On Location Fan', stats.onLocationFan],
      ['Images & Fans', 'Hostess Images', stats.hostessImages],
      ['Demographics', 'Female', stats.female],
      ['Demographics', 'Male', stats.male],
      ['Age Groups', 'Under 16', stats.under16],
      ['Age Groups', '16 to 40', stats.age16to40],
      ['Age Groups', 'Over 40', stats.over40],
      ['Merchandise', 'Merched', stats.merched],
      ['Merchandise', 'Jersey', stats.jersey],
      ['Merchandise', 'Scarf + Flags', stats.scarfFlags],
      ['Merchandise', 'Baseball Cap', stats.baseballCap],
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const encodedData = encodeURIComponent(csvContent);
    const googleSheetsUrl = `https://docs.google.com/spreadsheets/create?usp=drive_web#paste=${encodedData}`;
    
    window.open(googleSheetsUrl, '_blank');
  };

  const StatCard = ({ label, value, statKey }: { label: string; value: number; statKey: keyof typeof stats }) => (
    <div className={styles.statCard} onClick={() => incrementStat(statKey)}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );

  const totalCount = Object.values(stats).reduce((sum, val) => sum + val, 0);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>MessMass</h1>
          <p className={styles.subtitle}>Event Statistics Dashboard</p>
        </div>

        <div className={styles.eventInfo}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Event Name:</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter event name..."
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Event Date:</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.totalCounter}>
            <span className={styles.totalLabel}>Total Count:</span>
            <span className={styles.totalValue}>{totalCount}</span>
          </div>
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
            Reset Stats
          </button>
          <button className={styles.exportButton} onClick={downloadCSV}>
            📁 Download CSV
          </button>
          <button className={styles.googleButton} onClick={exportToGoogleSheets}>
            📊 Export to Google Sheets
          </button>
        </div>
      </div>
    </main>
  );
}