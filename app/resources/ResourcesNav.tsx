'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './resources.module.css';

interface ResourcesNavProps {
  active: 'hub' | 'brands' | 'partners' | 'icons';
}

export default function ResourcesNav({ active }: ResourcesNavProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyShareUrl = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <div className={styles.navLinks}>
          <Link href="/resources" className={styles.brandIdentity}>
            <img src="/messmass-logo.png" alt="messmass" className={styles.brandMark} />
            <span className={styles.brandTitle}>Asset &amp; Brand Resources</span>
          </Link>
          <span className={styles.readOnlyBadge}>Read-Only • Downloadable</span>
        </div>

        <nav className={styles.navLinks} aria-label="Resource collections">
          <Link
            href="/resources"
            className={`${styles.navLink} ${active === 'hub' ? styles.navLinkActive : ''}`}
          >
            Overview
          </Link>
          <Link
            href="/resources/brands"
            className={`${styles.navLink} ${active === 'brands' ? styles.navLinkActive : ''}`}
          >
            Brands
          </Link>
          <Link
            href="/resources/partners"
            className={`${styles.navLink} ${active === 'partners' ? styles.navLinkActive : ''}`}
          >
            Partners &amp; Clubs
          </Link>
          <Link
            href="/resources/icons"
            className={`${styles.navLink} ${active === 'icons' ? styles.navLinkActive : ''}`}
          >
            Icons
          </Link>
          <button type="button" onClick={handleCopyShareUrl} className={styles.secondaryBtn}>
            {copied ? '✓ Link Copied' : '🔗 Share Page'}
          </button>
        </nav>
      </div>
    </header>
  );
}
