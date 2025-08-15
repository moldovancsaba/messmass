'use client';

import React, { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    remoteImages: 0,
    hostessImages: 0,
    remoteFans: 0,
    onLocationFan: 0,
    female: 0,
    male: 0,
    genAlpha: 0,
    genYZ: 0,
    genX: 0,
    boomer: 0,
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
      hostessImages: 0,
      remoteFans: 0,
      onLocationFan: 0,
      female: 0,
      male: 0,
      genAlpha: 0,
      genYZ: 0,
      genX: 0,
      boomer: 0,
      merched: 0,
      jersey: 0,
      scarfFlags: 0,
      baseballCap: 0
    });
  };

  // Calculated totals
  const totalSelfies = stats.remoteImages + stats.hostessImages;
  const totalFans = stats.remoteFans + stats.onLocationFan;
  const totalDemographic = stats.female + stats.male;
  const totalUnder40 = stats.genAlpha + stats.genYZ;
  const totalOver40 = stats.genX + stats.boomer;
  const totalAge = stats.genAlpha + stats.genYZ + stats.genX + stats.boomer;

  const downloadCSV = () => {
    const csvData = [
      ['Event Name', eventName || 'Untitled Event'],
      ['Event Date', eventDate],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Category', 'Metric', 'Count'],
      ['Images', 'Remote Images', stats.remoteImages],
      ['Images', 'Hostess Images', stats.hostessImages],
      ['Images', 'All Selfies', totalSelfies],
      ['Fans', 'Remote Fans', stats.remoteFans],
      ['Fans', 'On Location Fan', stats.onLocationFan],
      ['Fans', 'Total Fans', totalFans],
      ['Demographics', 'Female', stats.female],
      ['Demographics', 'Male', stats.male],
      ['Demographics', 'Total Demographic', totalDemographic],
      ['Age Groups', 'Gen Alpha', stats.genAlpha],
      ['Age Groups', 'Gen Y+Z', stats.genYZ],
      ['Age Groups', 'Total Under 40', totalUnder40],
      ['Age Groups', 'Gen X', stats.genX],
      ['Age Groups', 'Boomer', stats.boomer],
      ['Age Groups', 'Total Over 40', totalOver40],
      ['Age Groups', 'Total Age Groups', totalAge],
      ['Merchandise', 'Merched', stats.merched],
      ['Merchandise', 'Jersey', stats.jersey],
      ['Merchandise', 'Scarf + Flags', stats.scarfFlags],
      ['Merchandise', 'Baseball Cap', stats.baseballCap]
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
      ['Images', 'Remote Images', stats.remoteImages],
      ['Images', 'Hostess Images', stats.hostessImages],
      ['Images', 'All Selfies', totalSelfies],
      ['Fans', 'Remote Fans', stats.remoteFans],
      ['Fans', 'On Location Fan', stats.onLocationFan],
      ['Fans', 'Total Fans', totalFans],
      ['Demographics', 'Female', stats.female],
      ['Demographics', 'Male', stats.male],
      ['Demographics', 'Total Demographic', totalDemographic],
      ['Age Groups', 'Gen Alpha', stats.genAlpha],
      ['Age Groups', 'Gen Y+Z', stats.genYZ],
      ['Age Groups', 'Total Under 40', totalUnder40],
      ['Age Groups', 'Gen X', stats.genX],
      ['Age Groups', 'Boomer', stats.boomer],
      ['Age Groups', 'Total Over 40', totalOver40],
      ['Age Groups', 'Total Age Groups', totalAge],
      ['Merchandise', 'Merched', stats.merched],
      ['Merchandise', 'Jersey', stats.jersey],
      ['Merchandise', 'Scarf + Flags', stats.scarfFlags],
      ['Merchandise', 'Baseball Cap', stats.baseballCap]
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const encodedData = encodeURIComponent(csvContent);
    const googleSheetsUrl = `https://docs.google.com/spreadsheets/create?usp=drive_web#paste=${encodedData}`;
    
    window.open(googleSheetsUrl, '_blank');
  };

  const StatCard = ({ label, value, statKey, isCalculated = false }: { 
    label: string; 
    value: number; 
    statKey?: keyof typeof stats;
    isCalculated?: boolean;
  }) => (
    <div 
      className={`${styles.statCard} ${isCalculated ? styles.calculatedCard : ''}`} 
      onClick={statKey ? () => incrementStat(statKey) : undefined}
      style={{ cursor: isCalculated ? 'default' : 'pointer' }}
    >
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );

  const WarningCard = ({ label, value, isWarning }: { 
    label: string; 
    value: number; 
    isWarning: boolean;
  }) => (
    <div className={`${styles.statCard} ${styles.calculatedCard} ${isWarning ? styles.warningCard : ''}`}>
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
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Images & Fans</h3>
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>Images</h4>
              <div className={styles.statsRow}>
                <StatCard label="Remote Images" value={stats.remoteImages} statKey="remoteImages" />
                <StatCard label="Hostess Images" value={stats.hostessImages} statKey="hostessImages" />
                <StatCard label="All Selfies" value={totalSelfies} isCalculated={true} />
              </div>
            </div>
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>Fans</h4>
              <div className={styles.statsRow}>
                <StatCard label="Remote Fans" value={stats.remoteFans} statKey="remoteFans" />
                <StatCard label="On Location Fan" value={stats.onLocationFan} statKey="onLocationFan" />
                <StatCard label="Total Fans" value={totalFans} isCalculated={true} />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Demographics</h3>
            <div className={styles.statsRow}>
              <StatCard label="Female" value={stats.female} statKey="female" />
              <StatCard label="Male" value={stats.male} statKey="male" />
              <WarningCard 
                label="Total Demographic" 
                value={totalDemographic} 
                isWarning={totalDemographic !== totalFans} 
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Age Groups</h3>
            <div className={styles.ageGrid}>
              <StatCard label="Gen Alpha" value={stats.genAlpha} statKey="genAlpha" />
              <StatCard label="Gen Y+Z" value={stats.genYZ} statKey="genYZ" />
              <StatCard label="Total Under 40" value={totalUnder40} isCalculated={true} />
              <StatCard label="Gen X" value={stats.genX} statKey="genX" />
              <StatCard label="Boomer" value={stats.boomer} statKey="boomer" />
              <StatCard label="Total Over 40" value={totalOver40} isCalculated={true} />
            </div>
            <div className={styles.ageTotal}>
              <WarningCard 
                label="Total Age Groups" 
                value={totalAge} 
                isWarning={totalAge !== totalFans} 
              />
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