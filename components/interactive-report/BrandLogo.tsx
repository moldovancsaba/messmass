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
 * Enforces strict frame containment so ultra-wide (e.g. Macron, Pepsi) or tall SVGs
 * never overflow outside their designated frame.
 */
export default function BrandLogo({
  brand,
  logoUrl,
  darkLogoUrl,
  className,
  size = 38,
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
          padding: '2px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeUrl}
          alt={`${brand} official logo`}
          onError={() => setImageError(true)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
            display: 'block',
          }}
          loading="lazy"
        />
      </div>
    );
  }

  // 2. Fallback: Clean, dignified typographic brand wordmark
  const initial = brand.trim().charAt(0).toUpperCase();
  const badgeColor = accentColor || '#1e293b';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '2px',
      }}
      title={`${brand} (Official logo pending upload in Settings)`}
    >
      <span
        style={{
          width: '22px',
          height: '22px',
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
          maxWidth: 'calc(100% - 28px)',
        }}
      >
        {brand}
      </span>
    </div>
  );
}
