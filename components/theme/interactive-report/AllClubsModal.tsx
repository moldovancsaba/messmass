'use client';
/* eslint-disable react/forbid-dom-props */
/* eslint-disable @next/next/no-img-element */

import React, { useState, useMemo } from 'react';
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

  const filteredClubs = useMemo(() => {
    // Deduplicate incoming clubs list by partner or display name
    const clubMap = new Map<string, ClubPodiumStat>();
    for (const c of clubs) {
      if (!c.club || c.count <= 0) continue;
      const entityKey = c.partnerId || (c.partnerName ? c.partnerName.toLowerCase().trim() : c.club.toLowerCase().trim());
      const existing = clubMap.get(entityKey);
      if (existing) {
        existing.count += c.count;
        if (!existing.logoUrl && c.logoUrl) existing.logoUrl = c.logoUrl;
      } else {
        clubMap.set(entityKey, { ...c });
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

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
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
          maxWidth: '860px',
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
        {/* Header */}
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f2c4a' }}>
                🛡️ All Detected Sports Teams & Clubs ({clubs.length})
              </h3>
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
                Connected Sports Directory
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Clubs and franchises identified on fan jerseys, scarves, flags, and banners (click to inspect fan selfies)
            </p>
          </div>

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
            aria-label="Close clubs directory"
          >
            ✕
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search by club name, partner, or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}>
              🔍
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'all', label: 'All Leagues' },
              { id: 'Basketball', label: '🏀 Basketball' },
              { id: 'Football', label: '⚽ Football' },
              { id: 'Handball', label: '🤾 Handball' },
              { id: 'Ice Hockey', label: '🏒 Ice Hockey' },
            ].map((sp) => (
              <button
                key={sp.id}
                type="button"
                onClick={() => setSelectedSport(sp.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: selectedSport === sp.id ? '#0f2c4a' : '#cbd5e1',
                  background: selectedSport === sp.id ? '#0f2c4a' : '#ffffff',
                  color: selectedSport === sp.id ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clubs Grid */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
          {filteredClubs.map((c) => {
            const pct =
              totalPhotosProcessed > 0
                ? Math.round((c.count / totalPhotosProcessed) * 1000) / 10
                : 1;

            return (
              <div
                key={c.club}
                onClick={() => {
                  onSelectClub(c);
                }}
                style={{
                  padding: '12px 14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                }}
                title={`Click to inspect connected selfies for ${c.partnerName || c.club}`}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {c.logoUrl ? (
                    <img
                      src={c.logoUrl}
                      alt={c.partnerName || c.club}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '16px' }}>🛡️</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f2c4a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.partnerName || c.club}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f2c4a', flexShrink: 0 }}>
                      {c.count.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.homeVenue || c.sport || 'Sports Arena'}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#2563eb' }}>
                      {pct}% share
                    </span>
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
