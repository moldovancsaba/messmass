'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState } from 'react';

interface BrandLogoProps {
  brand: string;
  logoUrl?: string;
  darkLogoUrl?: string;
  className?: string;
  size?: number;
  accentColor?: string;
}

/**
 * BrandLogo
 * Displays the original, official brand logo from the unified Messmass Brand Asset Registry.
 * If no official logo has been uploaded yet, displays a clean typographic badge.
 * Never uses approximated or redrawn brand artwork.
 */
export default function BrandLogo({
  brand,
  logoUrl,
  darkLogoUrl,
  className,
  size = 36,
  accentColor,
}: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);

  const activeUrl = logoUrl || darkLogoUrl;

  // 1. If an official logo URL is provided and has not errored, render original image
  if (activeUrl && !imageError) {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: `${size}px`,
          minWidth: `${size * 1.2}px`,
          padding: '2px 6px',
          borderRadius: '6px',
          background: 'transparent',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeUrl}
          alt={`${brand} official logo`}
          onError={() => setImageError(true)}
          style={{
            maxHeight: `${size}px`,
            maxWidth: `${Math.round(size * 2.5)}px`,
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
          loading="lazy"
        />
      </div>
    );
  }

  // 2. Fallback: Clean, dignified typographic brand wordmark (no redrawn artwork)
  const initial = brand.trim().charAt(0).toUpperCase();
  const badgeColor = accentColor || '#1e293b';

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        height: `${size}px`,
        borderRadius: '6px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        boxSizing: 'border-box',
      }}
      title={`${brand} (Official logo pending upload in Settings)`}
    >
      <span
        style={{
          width: `${size - 10}px`,
          height: `${size - 10}px`,
          borderRadius: '4px',
          background: badgeColor,
          color: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 800,
          fontFamily: 'sans-serif',
          flexShrink: 0,
        }}
      >
        {initial}
      </span>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#1e293b',
          fontFamily: 'sans-serif',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '120px',
        }}
      >
        {brand}
      </span>
    </div>
  );
}
