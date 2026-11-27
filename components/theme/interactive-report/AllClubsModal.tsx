'use client';
/* eslint-disable react/forbid-dom-props */
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState, useMemo } from 'react';
import styles from './interactive-report.module.css';
import { ClubPodiumStat } from './ExecutivePodiumGrid';

interface AllClubsModalProps {
  isOpen: boolean;
  clubs: ClubPodiumStat[];
  totalPhotosProcessed: number;
  onSelectClub: (club: ClubPodiumStat) => void;
  onClose: () => void;
}

export default function AllClubsModal({
  isOpen,
  clubs,
  totalPhotosProcessed,
  onSelectClub,
  onClose,
}: AllClubsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');

  // Sport filter options come from the clubs actually present in the data.
  const sportOptions = useMemo(() => {
    const sports = new Set<string>();
    for (const c of clubs) {
      if (c.sport && c.sport.trim()) sports.add(c.sport.trim());
    }
    return [
      { id: 'all', label: 'All Sports' },
      ...Array.from(sports)
        .sort((a, b) => a.localeCompare(b))
        .map((sport) => ({ id: sport, label: sport })),
    ];
  }, [clubs]);

  const filteredClubs = useMemo(() => {
    // Deduplicate incoming clubs list by partner or display name
    const clubMap = new Map<string, ClubPodiumStat>();
    const partnerIdToKey = new Map<string, string>();
    for (const c of clubs) {
      if (!c.club || c.count <= 0) continue;
      const canonicalKey = (c.partnerName || c.club).toLowerCase().trim();
      let targetKey = canonicalKey;
      if (c.partnerId && partnerIdToKey.has(c.partnerId)) {
        targetKey = partnerIdToKey.get(c.partnerId)!;
      }
      const existing = clubMap.get(targetKey);
      if (existing) {
        existing.count += c.count;
        if (!existing.logoUrl && c.logoUrl) existing.logoUrl = c.logoUrl;
        if (!existing.partnerId && c.partnerId) existing.partnerId = c.partnerId;
        if (!existing.partnerName && c.partnerName) existing.partnerName = c.partnerName;
      } else {
        clubMap.set(targetKey, { ...c });
        if (c.partnerId) {
          partnerIdToKey.set(c.partnerId, targetKey);
        }
      }
    }
    const dedupedClubs = Array.from(clubMap.values()).sort((a, b) => b.count - a.count);

    return dedupedClubs.filter((c) => {
      if (selectedSport !== 'all') {
        const cSport = c.sport?.toLowerCase() || '';
        if (!cSport.includes(selectedSport.toLowerCase())) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesClub = c.club.toLowerCase().includes(q);
        const matchesPartner = c.partnerName?.toLowerCase().includes(q) || false;
        const matchesVenue = c.homeVenue?.toLowerCase().includes(q) || false;
        if (!matchesClub && !matchesPartner && !matchesVenue) return false;
      }
      return true;
    });
  }, [clubs, selectedSport, searchQuery]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="All Detected Sports Teams and Clubs"
      className={styles.modalBackdrop}
      onClick={onClose}
    >
      <div
        role="document"
        className={styles.modalDialog}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitleRow}>
              <h3 className={styles.modalTitle}>
                🛡️ All Detected Sports Teams &amp; Clubs ({clubs.length})
              </h3>
              <span className={styles.modalBadge}>
                Connected Sports Directory
              </span>
            </div>
            <p className={styles.modalSub}>
              Clubs and franchises identified on fan jerseys, scarves, flags, and banners (click to inspect fan selfies)
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseBtn}
            aria-label="Close clubs directory"
          >
            ✕
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className={styles.modalFilterBar}>
          <div className={styles.modalSearchWrap}>
            <input
              aria-label="Search detected sports teams and clubs"
              type="text"
              placeholder="Search by club name, partner, or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.modalSearchInput}
            />
            <span className={styles.modalSearchIcon} aria-hidden="true">
              🔍
            </span>
          </div>

          <div className={styles.modalChipRow}>
            {sportOptions.map((sp) => (
              <button
                key={sp.id}
                type="button"
                onClick={() => setSelectedSport(sp.id)}
                className={`${styles.modalChipBtn} ${selectedSport === sp.id ? styles.modalChipBtnActive : ''}`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clubs Grid */}
        <div className={styles.modalGrid}>
          {filteredClubs.map((c) => {
            const pct =
              totalPhotosProcessed > 0
                ? Math.round((c.count / totalPhotosProcessed) * 1000) / 10
                : null;

            return (
              <div
                key={c.club}
                onClick={() => {
                  onSelectClub(c);
                }}
                className={styles.modalEntityCard}
                title={`Click to inspect connected selfies for ${c.partnerName || c.club}`}
              >
                <div className={styles.modalEntityThumb}>
                  {c.logoUrl ? (
                    <img
                      src={c.logoUrl}
                      alt={c.partnerName || c.club}
                      className={styles.modalEntityThumbImg}
                    />
                  ) : (
                    <span className={styles.gdsBody}>🛡️</span>
                  )}
                </div>

                <div className={styles.modalEntityBody}>
                  <div className={styles.modalEntityHead}>
                    <span className={styles.modalEntityName}>
                      {c.partnerName || c.club}
                    </span>
                    <span className={`${styles.modalEntityCount} ${styles.gdsNum}`}>
                      {c.count.toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.modalEntityFoot}>
                    <span className={styles.modalEntityMeta}>
                      {c.homeVenue || c.sport || ''}
                    </span>
                    {pct !== null && (
                    <span className={`${styles.modalEntityShare} ${styles.gdsNum}`}>
                      {pct}% share
                    </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
