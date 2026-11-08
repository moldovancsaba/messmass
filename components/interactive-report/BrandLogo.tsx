'use client';
/* eslint-disable react/forbid-dom-props */

import React from 'react';

interface BrandLogoProps {
  brand: string;
  className?: string;
  size?: number;
}

export default function BrandLogo({ brand, className, size = 36 }: BrandLogoProps) {
  const norm = brand.trim().toLowerCase();

  // 1. Tippmix
  if (norm.includes('tippmix')) {
    return (
      <svg
        width={size * 1.5}
        height={size}
        viewBox="0 0 72 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Tippmix Logo"
      >
        <rect width="72" height="40" rx="8" fill="#003f2e" />
        <path d="M12 20L20 28L36 12" stroke="#88ca45" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="38" y="25" fill="#ffffff" fontSize="11" fontWeight="800" fontFamily="sans-serif">
          TIPPMIX
        </text>
      </svg>
    );
  }

  // 2. Szerencsejáték Zrt
  if (norm.includes('szerencsejáték') || norm.includes('szerencsejatek') || norm.includes('szrt')) {
    return (
      <svg
        width={size * 1.5}
        height={size}
        viewBox="0 0 72 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Szerencsejáték Zrt Logo"
      >
        <rect width="72" height="40" rx="8" fill="#1b4332" />
        <circle cx="20" cy="20" r="10" fill="#2d6a4f" />
        {/* Clover leaves */}
        <circle cx="17" cy="17" r="3.5" fill="#88ca45" />
        <circle cx="23" cy="17" r="3.5" fill="#88ca45" />
        <circle cx="17" cy="23" r="3.5" fill="#88ca45" />
        <circle cx="23" cy="23" r="3.5" fill="#88ca45" />
        <text x="36" y="24" fill="#ffffff" fontSize="10" fontWeight="800" fontFamily="sans-serif">
          SZRT
        </text>
      </svg>
    );
  }

  // 3. Nike
  if (norm === 'nike') {
    return (
      <svg
        width={size * 1.4}
        height={size}
        viewBox="0 0 60 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Nike Swoosh Logo"
      >
        <rect width="60" height="40" rx="8" fill="#111827" />
        <path
          d="M12 25.5C20.5 29.5 32 23 48 11C41 19 28 32 17.5 31C13.5 30.5 11 28 12 25.5Z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  // 4. Adidas
  if (norm === 'adidas') {
    return (
      <svg
        width={size * 1.4}
        height={size}
        viewBox="0 0 60 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Adidas Logo"
      >
        <rect width="60" height="40" rx="8" fill="#0f172a" />
        <polygon points="16,28 22,28 26,18 20,18" fill="#ffffff" />
        <polygon points="26,28 32,28 37,13 31,13" fill="#ffffff" />
        <polygon points="36,28 42,28 48,8 42,8" fill="#ffffff" />
      </svg>
    );
  }

  // 5. Puma
  if (norm === 'puma') {
    return (
      <svg
        width={size * 1.4}
        height={size}
        viewBox="0 0 60 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Puma Logo"
      >
        <rect width="60" height="40" rx="8" fill="#881337" />
        {/* Leaping Puma Silhouette */}
        <path
          d="M44 14C41 12 37 13 34 16C31 19 28 21 24 20C21 19 18 16 16 19C14 22 17 25 21 26C26 27 30 25 33 22C36 19 39 18 43 20C45 21 47 20 48 18C49 16 47 14 44 14Z"
          fill="#ffffff"
        />
        <text x="30" y="34" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" letterSpacing="1">
          PUMA
        </text>
      </svg>
    );
  }

  // 6. Macron
  if (norm === 'macron') {
    return (
      <svg
        width={size * 1.4}
        height={size}
        viewBox="0 0 60 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Macron Hero Logo"
      >
        <rect width="60" height="40" rx="8" fill="#0369a1" />
        {/* Macron Hero Icon */}
        <circle cx="30" cy="14" r="3.5" fill="#ffffff" />
        <path d="M22 26C25 20 35 20 38 26C35 24 25 24 22 26Z" fill="#ffffff" />
        <text x="30" y="34" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800" letterSpacing="1">
          MACRON
        </text>
      </svg>
    );
  }

  // 7. Novomatic Arena
  if (norm.includes('novomatic')) {
    return (
      <svg
        width={size * 1.5}
        height={size}
        viewBox="0 0 72 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Novomatic Arena Logo"
      >
        <rect width="72" height="40" rx="8" fill="#1e1b4b" />
        <rect x="8" y="10" width="16" height="20" rx="4" fill="#6366f1" />
        <text x="16" y="24" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900">
          N
        </text>
        <text x="30" y="21" fill="#ffffff" fontSize="8" fontWeight="800">
          NOVOMATIC
        </text>
        <text x="30" y="30" fill="#a5b4fc" fontSize="7" fontWeight="600">
          ARENA
        </text>
      </svg>
    );
  }

  // 8. Veolia
  if (norm.includes('veolia')) {
    return (
      <svg
        width={size * 1.5}
        height={size}
        viewBox="0 0 72 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Veolia Logo"
      >
        <rect width="72" height="40" rx="8" fill="#be123c" />
        <circle cx="20" cy="20" r="9" stroke="#ffffff" strokeWidth="2.5" />
        <text x="34" y="24" fill="#ffffff" fontSize="10" fontWeight="800">
          VEOLIA
        </text>
      </svg>
    );
  }

  // 9. Columbia
  if (norm.includes('columbia')) {
    return (
      <svg
        width={size * 1.5}
        height={size}
        viewBox="0 0 72 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Columbia Logo"
      >
        <rect width="72" height="40" rx="8" fill="#0f766e" />
        <rect x="12" y="14" width="4" height="4" fill="#ffffff" />
        <rect x="18" y="14" width="4" height="4" fill="#ffffff" />
        <rect x="12" y="20" width="4" height="4" fill="#ffffff" />
        <rect x="18" y="20" width="4" height="4" fill="#ffffff" />
        <text x="27" y="23" fill="#ffffff" fontSize="9" fontWeight="800">
          Columbia
        </text>
      </svg>
    );
  }

  // 10. VEO
  if (norm === 'veo') {
    return (
      <svg
        width={size * 1.4}
        height={size}
        viewBox="0 0 60 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="VEO Logo"
      >
        <rect width="60" height="40" rx="8" fill="#14532d" />
        <circle cx="20" cy="20" r="7" stroke="#22c55e" strokeWidth="3" />
        <text x="32" y="24" fill="#ffffff" fontSize="11" fontWeight="900">
          VEO
        </text>
      </svg>
    );
  }

  // 11. MVM
  if (norm.includes('mvm')) {
    return (
      <svg
        width={size * 1.4}
        height={size}
        viewBox="0 0 60 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="MVM Logo"
      >
        <rect width="60" height="40" rx="8" fill="#1e3a8a" />
        <text x="30" y="25" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" letterSpacing="1">
          MVM
        </text>
      </svg>
    );
  }

  // Default Monogram Badge for other brands
  const initial = brand.charAt(0).toUpperCase();
  return (
    <svg
      width={size * 1.4}
      height={size}
      viewBox="0 0 60 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`${brand} Logo`}
    >
      <rect width="60" height="40" rx="8" fill="#334155" />
      <circle cx="20" cy="20" r="9" fill="#475569" />
      <text x="20" y="24" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="800">
        {initial}
      </text>
      <text x="34" y="23" fill="#f8fafc" fontSize="9" fontWeight="700">
        {brand.length > 5 ? `${brand.substring(0, 4)}.` : brand}
      </text>
    </svg>
  );
}
