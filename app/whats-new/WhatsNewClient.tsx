'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ReleaseCategoryFilter, ReleaseItemType, ReleaseNoteSection } from '@/lib/releaseNotesParser';
import styles from './whats-new.module.css';

const CATEGORIES: Array<{ id: ReleaseCategoryFilter; label: string }> = [
  { id: 'all', label: 'All Updates' },
  { id: 'new', label: 'New Features' },
  { id: 'changed', label: 'Improvements' },
  { id: 'fix', label: 'Fixes' },
  { id: 'security', label: 'Security & Privacy' },
  { id: 'doc', label: 'Docs & Guides' },
];

const TYPE_LABELS: Record<ReleaseItemType, string> = {
  new: 'Added',
  changed: 'Changed',
  fix: 'Fixed',
  security: 'Security',
  doc: 'Docs',
};

export default function WhatsNewClient({ initialNotes }: { initialNotes: ReleaseNoteSection[] }) {
  const [category, setCategory] = useState<ReleaseCategoryFilter>('all');
  const [query, setQuery] = useState('');

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialNotes
      .map((section) => {
        const items = section.items.filter((item) => {
          if (category !== 'all' && item.type !== category) return false;
          if (!q) return true;
          return (
            item.summary.toLowerCase().includes(q) ||
            (item.scope && item.scope.toLowerCase().includes(q)) ||
            section.title.toLowerCase().includes(q) ||
            section.version.toLowerCase().includes(q)
          );
        });
        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);
  }, [initialNotes, category, query]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.heroTop}>
            <span className={styles.eyebrow}>What&apos;s New &amp; Release Notes</span>
            <Link href="/admin" className={styles.backLink}>
              ← Back to Admin Workspace
            </Link>
          </div>
          <h1 className={styles.title}>Messmass Product Updates</h1>
          <p className={styles.subtitle}>
            Chronological release history, newly shipped capabilities, Fanmass visual intelligence upgrades, and platform fixes.
          </p>
          <div className={styles.controls}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search versions, features, or fixes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className={styles.pills}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.pill} ${category === cat.id ? styles.pillActive : ''}`}
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {filteredNotes.length === 0 ? (
          <div className={styles.emptyState}>No release notes match your current filter.</div>
        ) : (
          <section className={styles.timeline}>
            {filteredNotes.map((section) => (
              <article key={`${section.version}-${section.date}`} className={styles.releaseCard}>
                <div className={styles.releaseHeader}>
                  <div className={styles.versionGroup}>
                    <span className={styles.versionBadge}>{section.version}</span>
                    <span className={styles.dateText}>{section.formattedDate}</span>
                  </div>
                  <span className={styles.ageBadge}>{section.relativeAge}</span>
                </div>
                <h2 className={styles.releaseTitle}>{section.title}</h2>
                <ul className={styles.itemList}>
                  {section.items.map((item, idx) => {
                    const typeClass =
                      item.type === 'new'
                        ? styles.typeNew
                        : item.type === 'fix'
                          ? styles.typeFix
                          : item.type === 'security'
                            ? styles.typeSecurity
                            : '';
                    return (
                      <li key={idx} className={styles.itemRow}>
                        <span className={`${styles.typeTag} ${typeClass}`}>{TYPE_LABELS[item.type]}</span>
                        <span>
                          {item.scope && <span className={styles.scopeTag}>({item.scope}) </span>}
                          {item.summary}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
