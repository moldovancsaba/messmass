'use client';
/* eslint-disable react/forbid-dom-props */
/* eslint-disable @next/next/no-img-element */

import React, { useMemo } from 'react';
import { getBrandCluster } from '@/lib/brandEntityClustering';
import BrandEvidenceGallery from './BrandEvidenceGallery';

export interface BrandDetailStat {
  brand: string;
  count: number;
  logoUrl?: string;
  darkLogoUrl?: string;
  category?: string;
  accentColor?: string;
}

interface BrandDetailModalProps {
  brand: BrandDetailStat | null;
  totalPhotosProcessed: number;
  recentImages?: Array<{
    fileName: string;
    sport: string;
    peopleCount: number;
    emotions: string[];
    brands: string[];
    clubs: string[];
    scene: string;
  }>;
  onClose: () => void;
}

export default function BrandDetailModal({
  brand,
  totalPhotosProcessed,
  recentImages = [],
  onClose,
}: BrandDetailModalProps) {
  const cluster = useMemo(() => {
    if (!brand) return null;
    return getBrandCluster(brand.brand);
  }, [brand]);

  // Share of analysed photos in which this brand was detected, from the real counts only
  const photoShare = useMemo(() => {
    if (!brand || totalPhotosProcessed <= 0) return null;
    return Math.round((brand.count / totalPhotosProcessed) * 1000) / 10;
  }, [brand, totalPhotosProcessed]);

  // Matching recent images containing this brand
  const matchingImages = useMemo(() => {
    if (!brand || !recentImages) return [];
    const bName = brand.brand.toLowerCase();
    return recentImages.filter((img) =>
      img.brands?.some((b) => b.toLowerCase().includes(bName))
    );
  }, [brand, recentImages]);

  // Sport distribution within the sampled photos that contain this brand
  const sportBreakdown = useMemo(() => {
    if (matchingImages.length === 0) return [];
    const map: Record<string, number> = {};
    for (const img of matchingImages) {
      if (!img.sport) continue;
      map[img.sport] = (map[img.sport] || 0) + 1;
    }
    return Object.entries(map).map(([sport, cnt]) => {
      let icon = '🏅';
      if (sport.toLowerCase().includes('foot')) icon = '⚽';
      else if (sport.toLowerCase().includes('basket')) icon = '🏀';
      else if (sport.toLowerCase().includes('hockey')) icon = '🏒';
      else if (sport.toLowerCase().includes('hand')) icon = '🤾';
      return {
        sport,
        count: cnt,
        pct: Math.round((cnt / matchingImages.length) * 100),
        icon,
      };
    });
  }, [matchingImages]);

  if (!brand || !cluster) return null;

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
          maxWidth: '800px',
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
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.brand}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: '24px' }}>🏷️</span>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f2c4a' }}>
                  {brand.brand}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: cluster.badgeBg,
                    color: cluster.badgeColor,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                  }}
                >
                  {cluster.icon} {cluster.label}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Computer Vision Identification • <strong>{brand.count.toLocaleString()}</strong> appearances
              </div>
            </div>
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
            aria-label="Close brand modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Context note */}
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '12px',
              color: '#1e40af',
              lineHeight: 1.5,
            }}
          >
            💡 This brand was visually identified on fan attire, kit emblems, or venue gear in the analysed photos.
          </div>

          {/* Detection counts */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
            }}
          >
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Detected Photos</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f2c4a', marginTop: '2px' }}>
                {brand.count.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Photos with this brand</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Photo Share</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                {photoShare === null ? 'n/a' : `${photoShare}%`}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Of all analysed photos</div>
            </div>
          </div>

          {/* Sports in the sampled photos */}
          {sportBreakdown.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#0f2c4a' }}>
                🏆 Sports in the Sampled Photos ({matchingImages.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                {sportBreakdown.map((s) => (
                  <div
                    key={s.sport}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '2px' }}>{s.icon}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b' }}>{s.sport}</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                      {s.count} ({s.pct}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof from the pictures: crops where the name was read, the box and how it was identified */}
          <BrandEvidenceGallery kind="brand" name={brand.brand} />
        </div>
      </div>
    </div>
  );
}
