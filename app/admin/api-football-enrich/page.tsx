// WHAT: Admin page to manually trigger API-Football partner enrichment
// WHY: Allow admin to enrich next 5 partners via button (24-hour cooldown)
// HOW: Check status via GET, trigger via POST, show results

'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface EnrichmentStatus {
  canRun: boolean;
  remaining: number;
  lastRun: string | null;
  nextAvailable: string | null;
  hoursRemaining: number;
}

export default function ApiFootballEnrichPage() {
  const [status, setStatus] = useState<EnrichmentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Fetch enrichment status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/api-football/enrich-partners');
      const data = await response.json();
      if (data.success) {
        setStatus({
          canRun: data.canRun,
          remaining: data.remaining,
          lastRun: data.lastRun,
          nextAvailable: data.nextAvailable,
          hoursRemaining: data.hoursRemaining,
        });
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Trigger enrichment
  const handleEnrich = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/api-football/enrich-partners', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setMessageType('success');
        setMessage(`✅ Enriched ${data.enriched} of ${data.processed} partners. ${data.remaining} remaining.`);
        await fetchStatus(); // Refresh status
      } else {
        setMessageType('error');
        setMessage(`❌ ${data.error}${data.hoursRemaining ? ` (Next available in ${data.hoursRemaining}h)` : ''}`);
      }
    } catch (error) {
      setMessageType('error');
      setMessage(`❌ Failed to trigger enrichment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>API-Football Partner Enrichment</h1>
        <p className={styles.subtitle}>Enrich partners with official team data from API-Football</p>
      </div>

      {status && (
        <div className={styles.statusCard}>
          <div className={styles.statusRow}>
            <span className={styles.label}>Partners Remaining:</span>
            <span className={styles.value}>{status.remaining}</span>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.label}>Last Run:</span>
            <span className={styles.value}>
              {status.lastRun ? new Date(status.lastRun).toLocaleString() : 'Never'}
            </span>
          </div>
          {!status.canRun && status.nextAvailable && (
            <div className={styles.statusRow}>
              <span className={styles.label}>Next Available:</span>
              <span className={styles.value}>
                {new Date(status.nextAvailable).toLocaleString()} ({status.hoursRemaining}h remaining)
              </span>
            </div>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.enrichButton}
          onClick={handleEnrich}
          disabled={loading || !status?.canRun}
        >
          {loading ? '🔄 Enriching...' : '🚀 Enrich Next 5 Partners'}
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {message}
        </div>
      )}

      <div className={styles.info}>
        <h2>How It Works</h2>
        <ul>
          <li>Processes <strong>5 partners per run</strong> (oldest created first)</li>
          <li>Searches across 5 sports: Soccer, Basketball, Handball, Hockey, Volleyball</li>
          <li>Stores multi-source data side-by-side (TheSportsDB + API-Football)</li>
          <li>Respects API rate limits: 10 requests/minute, 100 requests/day</li>
          <li>Can only run <strong>once every 24 hours</strong></li>
        </ul>

        <h3>Enriched Data Includes</h3>
        <ul>
          <li>Official team name and logo</li>
          <li>Venue name, capacity, and address</li>
          <li>Country, founding year, team code</li>
          <li>Venue surface type and image</li>
        </ul>
      </div>
    </div>
  );
}
