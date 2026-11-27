'use client';
/* eslint-disable react/forbid-dom-props */
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState, useMemo } from 'react';
import { getBrandCluster, BrandClusterId } from '@/lib/brandEntityClustering';
import { CommercialBrandStat } from './ExecutivePodiumGrid';
import styles from './interactive-report.module.css';

interface AllBrandsModalProps {
  isOpen: boolean;
  brands: CommercialBrandStat[];
  totalPhotosProcessed: number;
  onSelectBrand: (brand: CommercialBrandStat) => void;
  onClose: () => void;
}

export default function AllBrandsModal({
  isOpen,
  brands,
  totalPhotosProcessed,
  onSelectBrand,
  onClose,
}: AllBrandsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');

  const clusters = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    for (const b of brands) {
      const c = getBrandCluster(b.brand);
      const existing = map.get(c.id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(c.id, { id: c.id, label: c.label, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [brands]);

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const c = getBrandCluster(b.brand);
      if (selectedCluster !== 'all' && c.id !== selectedCluster) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          b.brand.toLowerCase().includes(q) ||
          c.label.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [brands, selectedCluster, searchQuery]);

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
      aria-label="All Detected Commercial Brands"
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
                🏷️ All Detected Commercial Brands ({brands.length})
              </h3>
              <span className={styles.modalBadge}>
                Visual Exposure Directory
              </span>
            </div>
            <p className={styles.modalSub}>
              Every apparel, retail, and commercial brand detected on stadium fan clothing and venue gear
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseBtn}
            aria-label="Close directory"
          >
            ✕
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className={styles.modalFilterBar}>
          <div className={styles.modalSearchWrap}>
            <input
              aria-label="Search detected commercial brands"
              type="text"
              placeholder="Search by brand name or category (e.g. Nike, Puma, Retail)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.modalSearchInput}
            />
            <span className={styles.modalSearchIcon} aria-hidden="true">
              🔍
            </span>
          </div>

          <div className={styles.modalChipRow}>
            <button
              type="button"
              onClick={() => setSelectedCluster('all')}
              className={`${styles.modalChipBtn} ${selectedCluster === 'all' ? styles.modalChipBtnActive : ''}`}
            >
              All Categories ({brands.length})
            </button>
            {clusters.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCluster(c.id)}
                className={`${styles.modalChipBtn} ${selectedCluster === c.id ? styles.modalChipBtnActive : ''}`}
              >
                {c.label} ({c.count})
              </button>
            ))}
          </div>
        </div>

        {/* Brand Grid / List */}
        <div className={styles.modalGrid}>
          {filteredBrands.map((b) => {
            const cluster = getBrandCluster(b.brand);
            const pct =
              totalPhotosProcessed > 0
                ? Math.round((b.count / totalPhotosProcessed) * 1000) / 10
                : null;

            return (
              <div
                key={b.brand}
                onClick={() => {
                  onSelectBrand(b);
                }}
                className={styles.modalEntityCard}
                title={`Click to inspect ${b.brand}`}
              >
                <div className={styles.modalEntityThumb}>
                  {b.logoUrl ? (
                    <img
                      src={b.logoUrl}
                      alt={b.brand}
                      className={styles.modalEntityThumbImg}
                    />
                  ) : (
                    <span className={styles.gdsBody}>🏷️</span>
                  )}
                </div>

                <div className={styles.modalEntityBody}>
                  <div className={styles.modalEntityHead}>
                    <span className={styles.modalEntityName}>
                      {b.brand}
                    </span>
                    <span className={`${styles.modalEntityCount} ${styles.gdsNum}`}>
                      {b.count.toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.modalEntityFoot}>
                    <span className={styles.modalEntityMeta}>
                      {cluster.label}
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
