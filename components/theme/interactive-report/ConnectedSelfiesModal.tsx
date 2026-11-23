'use client';
/* eslint-disable react/forbid-dom-props */
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo } from 'react';
import BrandEvidenceGallery from './BrandEvidenceGallery';
import { findCameraProof, type CameraProofEntry } from '@/lib/hashtagReport/cameraProof';
import styles from './interactive-report.module.css';

export interface ClubStat {
  club: string;
  count: number;
  logoUrl?: string;
  partnerId?: string;
  partnerSlug?: string;
  partnerName?: string;
  sport?: string;
  homeVenue?: string;
  venueCapacity?: number;
  website?: string;
}

interface ConnectedSelfiesModalProps {
  club: ClubStat | null;
  onClose: () => void;
  /** The names read in the report's Camera photos with their proof (vision.cameraProof). */
  cameraProof?: CameraProofEntry[];
}

export default function ConnectedSelfiesModal({ club, onClose, cameraProof }: ConnectedSelfiesModalProps) {
  const [selfiesLoading, setSelfiesLoading] = useState(false);
  const [selfiesData, setSelfiesData] = useState<any>(null);
  const [selectedFanGroup, setSelectedFanGroup] = useState<string>('all');

  useEffect(() => {
    if (!club) {
      setSelfiesData(null);
      setSelectedFanGroup('all');
      return;
    }

    let isMounted = true;
    setSelfiesLoading(true);
    setSelectedFanGroup('all');

    const q = new URLSearchParams({
      club: club.club,
      partnerId: club.partnerId || '',
      partnerSlug: club.partnerSlug || '',
    });

    fetch(`/api/interactive-report/partner-selfies?${q.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (isMounted) {
          setSelfiesData(data);
          setSelfiesLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSelfiesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [club]);

  const displaySelfies = useMemo(() => {
    if (!selfiesData?.selfies) return [];
    if (selectedFanGroup === 'all') return selfiesData.selfies;
    return selfiesData.selfies.filter(
      (s: any) =>
        s.fanGroups?.some((fg: string) => fg.toLowerCase().includes(selectedFanGroup.toLowerCase())) ||
        s.scene?.toLowerCase().includes(selectedFanGroup.toLowerCase())
    );
  }, [selfiesData, selectedFanGroup]);

  if (!club) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={styles.modalBackdrop}
      onClick={onClose}
    >
      <div
        role="document"
        className={styles.modalDialog}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLead}>
            <div className={styles.modalHeaderThumb}>
              {club.logoUrl ? (
                <img
                  src={club.logoUrl}
                  alt={club.club}
                  className={styles.modalEntityThumbImg}
                />
              ) : (
                <span className={styles.gdsSectionTitle}>🛡️</span>
              )}
            </div>
            <div>
              <div className={styles.modalTitleRow}>
                <h3 className={styles.modalTitle}>
                  {club.partnerName || club.club}
                </h3>
                {club.sport && (
                  <span className={styles.modalBadge}>
                    {club.sport}
                  </span>
                )}
              </div>
              <div className={styles.modalSub}>
                {club.homeVenue && <>🏟️ {club.homeVenue} • </>}
                <strong className={styles.gdsNum}>{club.count}</strong> appearances detected
              </div>
            </div>
          </div>

          <div className={styles.modalHeaderActions}>
            {club.partnerSlug && (
              <a
                href={`/partner-report/${club.partnerSlug}`}
                target="_blank"
                rel="noreferrer"
                className={styles.modalActionBtn}
              >
                Open Partner Report ↗
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className={styles.modalCloseBtn}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className={styles.modalBodyScroll}>
          {selfiesLoading ? (
            <div className={styles.modalEmptyState}>
              <div className={styles.gdsSectionKpi}>⏳</div>
              Loading selfies and supporter groups for <strong>{club.club}</strong>...
            </div>
          ) : selfiesData ? (
            <>
              {/* Partner DB Metadata Banner */}
              {selfiesData.partnerInfo && (
                <div className={styles.modalCallout}>
                  <div className={styles.modalTitleRow}>
                    <span>✅</span>
                    <span>
                      Linked partner record: <strong>{selfiesData.partnerInfo.name}</strong>
                      {selfiesData.partnerInfo.city && ` • ${selfiesData.partnerInfo.city}`}
                      {selfiesData.partnerInfo.venueCapacity && ` • Capacity: ${selfiesData.partnerInfo.venueCapacity.toLocaleString()}`}
                    </span>
                  </div>
                  {selfiesData.partnerInfo.website && (
                    <a
                      href={selfiesData.partnerInfo.website}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.modalCalloutLink}
                    >
                      Website ↗
                    </a>
                  )}
                </div>
              )}

              {/* Per-selfie figures exist only when selfies were analysed and approved for this report */}
              {Number(selfiesData.totalSelfies) > 0 && (
                <div className={styles.modalStatGrid}>
                  <div className={styles.modalStatCard}>
                    <div className={styles.modalStatLabel}>Connected Selfies</div>
                    <div className={`${styles.modalStatVal} ${styles.gdsNum}`}>
                      {selfiesData.totalSelfies ?? club.count}
                    </div>
                  </div>

                  <div className={styles.modalStatCard}>
                    <div className={styles.modalStatLabel}>Gender Split</div>
                    <div className={`${styles.modalStatVal} ${styles.gdsNum}`}>
                      {typeof selfiesData.demographics?.malePct === 'number' &&
                      typeof selfiesData.demographics?.femalePct === 'number'
                        ? `♂ ${selfiesData.demographics.malePct}% • ♀ ${selfiesData.demographics.femalePct}%`
                        : 'n/a'}
                    </div>
                  </div>

                  <div className={styles.modalStatCard}>
                    <div className={styles.modalStatLabel}>Home Arena</div>
                    <div className={styles.modalEntityName}>
                      {club.homeVenue || 'n/a'}
                    </div>
                  </div>
                </div>
              )}

              {/* Fan Emotions Badges */}
              {selfiesData.topEmotions && selfiesData.topEmotions.length > 0 && (
                <div className={styles.modalTagRow}>
                  <span className={styles.modalStatLabel}>
                    Fan Atmosphere:
                  </span>
                  {selfiesData.topEmotions.map((em: any) => (
                    <span key={em.emotion} className={styles.modalNeutralPill}>
                      😊 {em.emotion} ({em.count})
                    </span>
                  ))}
                </div>
              )}

              {/* Supporter Groups Filter Chips */}
              {selfiesData.fanGroups && selfiesData.fanGroups.length > 0 && (
                <div className={styles.modalTagRow}>
                  <span className={styles.modalStatLabel}>
                    🏴 Supporter Groups:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFanGroup('all')}
                    className={`${styles.modalChipBtn} ${selectedFanGroup === 'all' ? styles.modalChipBtnActive : ''}`}
                  >
                    All Allegiance ({selfiesData.totalSelfies ?? club.count})
                  </button>
                  {selfiesData.fanGroups.map((fg: any) => (
                    <button
                      key={fg.group}
                      type="button"
                      onClick={() => setSelectedFanGroup(fg.group)}
                      className={`${styles.modalChipBtn} ${selectedFanGroup === fg.group ? styles.modalChipBtnActive : ''}`}
                    >
                      🏴‍☠️ {fg.group} ({fg.count})
                    </button>
                  ))}
                </div>
              )}

              {/* Proof from the pictures */}
              <BrandEvidenceGallery kind="club" name={club.club} camera={findCameraProof(cameraProof, 'club', club.club)} />

              {Number(selfiesData.totalSelfies) > 0 && (
                <div>
                  <h4 className={styles.modalSectionHeading}>
                    📸 Captured Fan Selfies with {club.partnerName || club.club} Allegiance
                    {selectedFanGroup !== 'all' && (
                      <span className={styles.modalEntityShare}>
                        {' '}• Filtered to {selectedFanGroup} ({displaySelfies.length})
                      </span>
                    )}
                  </h4>

                  {displaySelfies.length > 0 ? (
                    <div className={styles.selfieGrid}>
                      {displaySelfies.map((s: any, idx: number) => (
                        <div key={s.fileName || idx} className={styles.selfieCard}>
                          <div className={styles.modalSelfieHead}>
                            <span className={styles.modalSelfieIndex}>
                              #{idx + 1} {s.sport}
                            </span>
                            <span className={styles.modalEntityMeta}>
                              👤 {s.peopleCount} {s.peopleCount === 1 ? 'person' : 'people'}
                            </span>
                          </div>

                          {s.scene && (
                            <div className={styles.modalSelfieScene}>
                              &ldquo;{s.scene}&rdquo;
                            </div>
                          )}

                          <div className={styles.modalTagRow}>
                            {s.fanGroups?.map((fg: string) => (
                              <span key={fg} className={styles.modalMicroTag}>
                                🏴 {fg}
                              </span>
                            ))}
                            {s.emotions?.map((e: string) => (
                              <span key={e} className={styles.modalMicroTag}>
                                {e}
                              </span>
                            ))}
                            {s.brands?.map((b: string) => (
                              <span key={b} className={styles.modalMicroTag}>
                                🏷️ {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.modalEmptyState}>
                      No selfies found matching this specific supporter group filter.
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.modalEmptyState}>
              Unable to load connected selfies. Please retry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
