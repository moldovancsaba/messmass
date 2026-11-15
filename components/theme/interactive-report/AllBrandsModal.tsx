'use client';
/* eslint-disable react/forbid-dom-props */
/* eslint-disable @next/next/no-img-element */

import React, { useState, useMemo } from 'react';
import { getBrandCluster, BrandClusterId } from '@/lib/brandEntityClustering';
import { CommercialBrandStat } from './ExecutivePodiumGrid';

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
                🏷️ All Detected Commercial Brands ({brands.length})
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
                Visual Exposure Directory
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Every apparel, retail, and commercial brand detected on stadium fan clothing and venue gear
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
            aria-label="Close directory"
          >
            ✕
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search by brand name or category (e.g. Nike, Puma, Retail)..."
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

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <button
              type="button"
              onClick={() => setSelectedCluster('all')}
              style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedCluster === 'all' ? '#0f2c4a' : '#cbd5e1',
                background: selectedCluster === 'all' ? '#0f2c4a' : '#ffffff',
                color: selectedCluster === 'all' ? '#ffffff' : '#475569',
                cursor: 'pointer',
              }}
            >
              All Categories ({brands.length})
            </button>
            {clusters.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCluster(c.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: selectedCluster === c.id ? '#0f2c4a' : '#cbd5e1',
                  background: selectedCluster === c.id ? '#0f2c4a' : '#ffffff',
                  color: selectedCluster === c.id ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.label} ({c.count})
              </button>
            ))}
          </div>
        </div>

        {/* Brand Grid / List */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {filteredBrands.map((b, idx) => {
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
                title={`Click to inspect ${b.brand}`}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
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
                  {b.logoUrl ? (
                    <img
                      src={b.logoUrl}
                      alt={b.brand}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '14px' }}>🏷️</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.brand}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f2c4a', flexShrink: 0 }}>
                      {b.count.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      {cluster.label}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#2563eb' }}>
                      {pct === null ? 'n/a' : `${pct}% share`}
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
