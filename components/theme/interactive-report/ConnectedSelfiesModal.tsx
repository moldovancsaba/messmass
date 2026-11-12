'use client';
/* eslint-disable react/forbid-dom-props */
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo } from 'react';
import BrandEvidenceGallery from './BrandEvidenceGallery';
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
}

export default function ConnectedSelfiesModal({ club, onClose }: ConnectedSelfiesModalProps) {
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
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        role="document"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {club.logoUrl ? (
                <img
                  src={club.logoUrl}
                  alt={club.club}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: '24px' }}>🛡️</span>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f2c4a' }}>
                  {club.partnerName || club.club}
                </h3>
                {club.sport && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {club.sport}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {club.homeVenue && <>🏟️ {club.homeVenue} • </>}
                <strong style={{ color: '#0f2c4a' }}>{club.count}</strong> appearances detected
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {club.partnerSlug && (
              <a
                href={`/partner-report/${club.partnerSlug}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: '#0f2c4a',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background 0.15s ease',
                }}
              >
                Open Partner Report ↗
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {selfiesLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
              Loading selfies and supporter groups for <strong>{club.club}</strong>...
            </div>
          ) : selfiesData ? (
            <>
              {/* Partner DB Metadata Banner */}
              {selfiesData.partnerInfo && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '12px',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>✅</span>
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
                      style={{ color: '#15803d', fontWeight: 700, textDecoration: 'underline' }}
                    >
                      Website ↗
                    </a>
                  )}
                </div>
              )}

              {/* Demographics & Highlights Summary Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                }}
              >
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Connected Selfies</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f2c4a', marginTop: '2px' }}>
                    {selfiesData.totalSelfies ?? club.count}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Gender Split</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f2c4a', marginTop: '4px' }}>
                    {typeof selfiesData.demographics?.malePct === 'number' &&
                    typeof selfiesData.demographics?.femalePct === 'number'
                      ? `♂ ${selfiesData.demographics.malePct}% • ♀ ${selfiesData.demographics.femalePct}%`
                      : 'n/a'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Home Arena</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f2c4a', marginTop: '4px' }}>
                    {club.homeVenue || 'n/a'}
                  </div>
                </div>
              </div>

              {/* Fan Emotions Badges */}
              {selfiesData.topEmotions && selfiesData.topEmotions.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                    Fan Atmosphere:
                  </span>
                  {selfiesData.topEmotions.map((em: any) => (
                    <span
                      key={em.emotion}
                      style={{
                        fontSize: '11px',
                        background: '#f1f5f9',
                        color: '#334155',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      😊 {em.emotion} ({em.count})
                    </span>
                  ))}
                </div>
              )}

              {/* Supporter Groups Filter Chips */}
              {selfiesData.fanGroups && selfiesData.fanGroups.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                    🏴 Supporter Groups:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFanGroup('all')}
                    style={{
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '9999px',
                      border: '1px solid',
                      borderColor: selectedFanGroup === 'all' ? '#1d4ed8' : '#cbd5e1',
                      background: selectedFanGroup === 'all' ? '#dbeafe' : '#ffffff',
                      color: selectedFanGroup === 'all' ? '#1e40af' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    All Allegiance ({selfiesData.totalSelfies ?? club.count})
                  </button>
                  {selfiesData.fanGroups.map((fg: any) => (
                    <button
                      key={fg.group}
                      type="button"
                      onClick={() => setSelectedFanGroup(fg.group)}
                      style={{
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '9999px',
                        border: '1px solid',
                        borderColor: selectedFanGroup === fg.group ? '#1d4ed8' : '#cbd5e1',
                        background: selectedFanGroup === fg.group ? '#dbeafe' : '#ffffff',
                        color: selectedFanGroup === fg.group ? '#1e40af' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      🏴‍☠️ {fg.group} ({fg.count})
                    </button>
                  ))}
                </div>
              )}

              {/* Proof from the pictures: where the club name or crest text was read from the image */}
              <BrandEvidenceGallery kind="club" name={club.club} />

              {/* Connected Selfies List */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  📸 Captured Fan Selfies with {club.partnerName || club.club} Allegiance
                  {selectedFanGroup !== 'all' && (
                    <span style={{ marginLeft: '6px', fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>
                      • Filtered to {selectedFanGroup} ({displaySelfies.length})
                    </span>
                  )}
                </h4>

                {displaySelfies.length > 0 ? (
                  <div className={styles.selfieGrid}>
                    {displaySelfies.map((s: any, idx: number) => (
                      <div key={s.fileName || idx} className={styles.selfieCard}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700, color: '#2563eb' }}>
                            #{idx + 1} {s.sport}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '10px' }}>
                            👤 {s.peopleCount} {s.peopleCount === 1 ? 'person' : 'people'}
                          </span>
                        </div>

                        {s.scene && (
                          <div style={{ color: '#1e293b', lineHeight: 1.4, fontSize: '11px' }}>
                            &ldquo;{s.scene}&rdquo;
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                          {s.fanGroups?.map((fg: string) => (
                            <span
                              key={fg}
                              style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                background: '#fef3c7',
                                color: '#92400e',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                border: '1px solid #fde68a',
                              }}
                            >
                              🏴 {fg}
                            </span>
                          ))}
                          {s.emotions?.map((e: string) => (
                            <span
                              key={e}
                              style={{
                                fontSize: '9px',
                                background: '#ecfdf5',
                                color: '#065f46',
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              {e}
                            </span>
                          ))}
                          {s.brands?.map((b: string) => (
                            <span
                              key={b}
                              style={{
                                fontSize: '9px',
                                background: '#eff6ff',
                                color: '#1e40af',
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              🏷️ {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                    No selfies found matching this specific supporter group filter.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
              Unable to load connected selfies. Please retry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
