'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import { apiPost } from '@/lib/apiClient';
import styles from './page.module.css';

interface RawClub {
  name: string;
  count: number;
  canonicalSuggestion: string | null;
}

interface ClubClusterSuggestion {
  clusterKey: string;
  suggestedTarget: string;
  variants: Array<{ name: string; count: number }>;
  totalCount: number;
}

interface PartnerSummary {
  _id: string;
  name: string;
  emoji: string;
  viewSlug: string;
  sport: string | null;
}

interface ClubMapping {
  _id: string;
  alias: string;
  targetClub: string;
  partnerId: string | null;
  updatedAt: string;
}

export default function ClubClustersAdminPage() {
  const [loading, setLoading] = useState(true);
  const [rawClubs, setRawClubs] = useState<RawClub[]>([]);
  const [suggestions, setSuggestions] = useState<ClubClusterSuggestion[]>([]);
  const [mappings, setMappings] = useState<ClubMapping[]>([]);
  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set());
  const [targetClub, setTargetClub] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [merging, setMerging] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/club-clusters', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setRawClubs(data.rawClubs || []);
        setSuggestions(data.suggestions || []);
        setMappings(data.mappings || []);
        setPartners(data.partners || []);
      }
    } catch (err) {
      console.error('Failed to load club clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPartners = useMemo(() => {
    const q = targetClub.trim().toLowerCase();
    if (!q) return partners.slice(0, 50);
    return partners.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 50);
  }, [partners, targetClub]);

  const filteredRawClubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rawClubs;
    return rawClubs.filter((c) => c.name.toLowerCase().includes(q));
  }, [rawClubs, searchQuery]);

  const handleMerge = async (sources: string[], target: string, partnerId?: string) => {
    if (!target.trim() || sources.length === 0) return;
    setMerging(true);
    setFeedback(null);
    try {
      const res = await apiPost('/api/club-clusters', {
        sourceClubs: sources,
        targetClub: target.trim(),
        ...(partnerId ? { partnerId } : {}),
      });
      if (res.success) {
        setFeedback({ type: 'success', text: `Merged ${sources.length} variant(s) into "${target.trim()}".` });
        setSelectedClubs(new Set());
        setTargetClub('');
        setSelectedPartnerId('');
        await loadData();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Merge failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Merge failed' });
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className={styles.page}>
      <UnifiedAdminHeroWithSearch
        title="🏟️ Clubs & Teams Clustering"
        subtitle="Consolidate duplicate club/team detections into canonical Messmass Partner & Club Logos"
        backLink="/admin/club-logos"
      />

      <div className={styles.container}>
        <div className={styles.toolbar}>
          <input
            type="text"
            placeholder="Filter discovered club / team names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <Link href="/admin/club-logos" className={styles.secondaryBtn}>
            🛡️ Club Logos
          </Link>
          <Link href="/admin/brand-assets" className={styles.secondaryBtn}>
            🏷️ Brand Logos
          </Link>
        </div>

        {feedback && (
          <div className={feedback.type === 'success' ? styles.successBanner : styles.errorBanner}>
            {feedback.text}
          </div>
        )}

        {loading ? (
          <div className={styles.loadingState}>Loading club clusters and Partner registry...</div>
        ) : (
          <>
            {suggestions.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Suggested Duplicate Clusters ({suggestions.length})</h2>
                <div className={styles.grid}>
                  {suggestions.map((cluster) => (
                    <div key={cluster.clusterKey} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <strong>{cluster.suggestedTarget}</strong>
                        <span>{cluster.totalCount} sightings</span>
                      </div>
                      <div className={styles.aliasList}>
                        {cluster.variants.map((v) => (
                          <span key={v.name} className={styles.aliasChip}>
                            {v.name} ({v.count})
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={merging}
                        onClick={() =>
                          handleMerge(
                            cluster.variants.map((v) => v.name),
                            cluster.suggestedTarget,
                          )
                        }
                        className={styles.primaryBtn}
                      >
                        Merge Cluster into {cluster.suggestedTarget}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Manual Club Merge ({selectedClubs.size} selected)
              </h2>
              <div className={styles.mergeBar}>
                <input
                  type="text"
                  placeholder="Type canonical Partner/Club name to filter..."
                  value={targetClub}
                  onChange={(e) => setTargetClub(e.target.value)}
                  className={styles.searchInput}
                />
                <button
                  type="button"
                  disabled={merging || selectedClubs.size === 0 || !targetClub.trim()}
                  onClick={() => handleMerge([...selectedClubs], targetClub, selectedPartnerId || undefined)}
                  className={styles.primaryBtn}
                >
                  {merging ? 'Merging...' : `Merge ${selectedClubs.size} Selected`}
                </button>
              </div>
              {targetClub.trim() && filteredPartners.length > 0 && (
                <div className={styles.partnerPicker}>
                  {filteredPartners.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => {
                        setTargetClub(p.name);
                        setSelectedPartnerId(p._id);
                      }}
                      className={styles.partnerChip}
                    >
                      {p.emoji} {p.name} {p.sport ? `(${p.sport})` : ''}
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.grid}>
                {filteredRawClubs.map((club) => {
                  const checked = selectedClubs.has(club.name);
                  return (
                    <label key={club.name} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(selectedClubs);
                            if (next.has(club.name)) next.delete(club.name);
                            else next.add(club.name);
                            setSelectedClubs(next);
                          }}
                        />
                        <strong>{club.name}</strong>
                        <span>{club.count}</span>
                      </div>
                      {club.canonicalSuggestion && club.canonicalSuggestion !== club.name && (
                        <div className={styles.suggestionNote}>
                          Suggested: {club.canonicalSuggestion}
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </section>

            {mappings.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Saved Canonical Club Mappings ({mappings.length})</h2>
                <div className={styles.aliasList}>
                  {mappings.map((m) => (
                    <span key={m._id} className={styles.aliasChip}>
                      {m.alias} → {m.targetClub}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
