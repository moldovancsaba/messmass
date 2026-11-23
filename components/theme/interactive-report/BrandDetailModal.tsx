'use client';
/* eslint-disable react/forbid-dom-props */
/* eslint-disable @next/next/no-img-element */

import React, { useMemo } from 'react';
import { getBrandCluster } from '@/lib/brandEntityClustering';
import BrandEvidenceGallery from './BrandEvidenceGallery';
import { findCameraProof, type CameraProofEntry } from '@/lib/hashtagReport/cameraProof';
import styles from './interactive-report.module.css';

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
  /** The names read in the report's Camera photos with their proof (vision.cameraProof). */
  cameraProof?: CameraProofEntry[];
}

export default function BrandDetailModal({
  brand,
  totalPhotosProcessed,
  recentImages = [],
  onClose,
  cameraProof,
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
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.brand}
                  className={styles.modalEntityThumbImg}
                />
              ) : (
                <span className={styles.gdsSectionTitle}>🏷️</span>
              )}
            </div>
            <div>
              <div className={styles.modalTitleRow}>
                <h3 className={styles.modalTitle}>
                  {brand.brand}
                </h3>
                <span className={styles.modalBadge}>
                  {cluster.icon} {cluster.label}
                </span>
              </div>
              <div className={styles.modalSub}>
                Computer Vision Identification • <strong className={styles.gdsNum}>{brand.count.toLocaleString()}</strong> appearances
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseBtn}
            aria-label="Close brand modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBodyScroll}>
          <div className={styles.modalCallout}>
            💡 This brand was visually identified on fan attire, kit emblems, or venue gear in the analysed photos.
          </div>

          {/* Detection counts */}
          <div className={styles.modalStatGrid}>
            <div className={styles.modalStatCard}>
              <div className={styles.modalStatLabel}>Detected Photos</div>
              <div className={`${styles.modalStatVal} ${styles.gdsNum}`}>
                {brand.count.toLocaleString()}
              </div>
              <div className={styles.modalStatSub}>Photos with this brand</div>
            </div>

            <div className={styles.modalStatCard}>
              <div className={styles.modalStatLabel}>Photo Share</div>
              <div className={`${styles.modalStatVal} ${styles.gdsNum}`}>
                {photoShare === null ? 'n/a' : `${photoShare}%`}
              </div>
              <div className={styles.modalStatSub}>Of all analysed photos</div>
            </div>
          </div>

          {/* Sports in the sampled photos */}
          {sportBreakdown.length > 0 && (
            <div>
              <h4 className={styles.modalSectionHeading}>
                🏆 Sports in the Sampled Photos ({matchingImages.length})
              </h4>
              <div className={styles.modalSportGrid}>
                {sportBreakdown.map((s) => (
                  <div key={s.sport} className={styles.modalSportCard}>
                    <div className={styles.gdsSectionTitle}>{s.icon}</div>
                    <div className={styles.modalStatLabel}>{s.sport}</div>
                    <div className={`${styles.modalEntityCount} ${styles.gdsNum}`}>
                      {s.count} ({s.pct}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof from the pictures */}
          <BrandEvidenceGallery kind="brand" name={brand.brand} camera={findCameraProof(cameraProof, 'brand', brand.brand)} />
        </div>
      </div>
    </div>
  );
}
