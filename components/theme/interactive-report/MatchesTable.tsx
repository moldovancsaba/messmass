'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState, useMemo } from 'react';
import { MatchItem } from './types';
import styles from './interactive-report.module.css';

interface MatchesTableProps {
  matches: MatchItem[];
}

const SPORT_COLORS: Record<string, string> = {
  Football: '#059669',
  'Ice Hockey': '#0284c7',
  Basketball: '#b45309',
  Handball: '#e11d48',
  Other: '#64748b',
};

export default function MatchesTable({ matches }: MatchesTableProps) {
  const [search, setSearch] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'submitted' | 'date' | 'approved' | 'hostess'>('submitted');
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filteredMatches = useMemo(() => {
    return matches
      .filter((m) => {
        if (selectedSport !== 'All' && m.sport !== selectedSport) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          m.cleanName.toLowerCase().includes(q) ||
          m.partnerName.toLowerCase().includes(q) ||
          m.venue.toLowerCase().includes(q) ||
          m.date.includes(q)
        );
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'submitted') diff = a.submitted - b.submitted;
        else if (sortBy === 'approved') diff = a.approved - b.approved;
        else if (sortBy === 'hostess') diff = a.hostess - b.hostess;
        else if (sortBy === 'date') diff = a.date.localeCompare(b.date);
        return sortDesc ? -diff : diff;
      });
  }, [matches, search, selectedSport, sortBy, sortDesc]);

  // Sport filter pills come from the sports present in the data.
  const sportOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of matches) {
      if (m.sport) counts.set(m.sport, (counts.get(m.sport) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([sport]) => sport);
  }, [matches]);

  const totalPages = Math.ceil(filteredMatches.length / pageSize) || 1;
  const pagedMatches = filteredMatches.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: 'submitted' | 'date' | 'approved' | 'hostess') => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(true);
    }
  };

  return (
    <div className={styles.reportCard}>
      {/* Search & Filter Header */}
      <div className={styles.tableHeaderWrap}>
        <div>
          <h3 className={styles.cardTitle}>
            📋 All Events ({filteredMatches.length})
          </h3>
          <p className={styles.cardSubtitle}>
            Breakdown of every event in this report.
          </p>
        </div>

        <div className={styles.tableControls}>
          {/* Search Box */}
          <input
            type="text"
            placeholder="Search match, club, venue..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={styles.searchInput}
          />

          {/* Sport Pills: only offered when the data holds more than one sport */}
          {sportOptions.length > 1 && (
            <div className={styles.actionsGroup}>
              {['All', ...sportOptions].map((sport) => (
                <button
                  key={sport}
                  onClick={() => {
                    setSelectedSport(sport);
                    setPage(1);
                  }}
                  className={`${styles.tabBtn} ${selectedSport === sport ? styles.tabBtnActive : ''}`}
                >
                  {sport}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableScroll}>
        <table className={styles.tableRoot}>
          <thead>
            <tr className={styles.tableHeadRow}>
              <th className={styles.thCell}>Sport</th>
              <th className={styles.thCell}>Event / Match</th>
              <th
                onClick={() => handleSort('date')}
                className={styles.thSortable}
              >
                Date {sortBy === 'date' ? (sortDesc ? '↓' : '↑') : ''}
              </th>
              <th className={styles.thCell}>Venue & Capacity</th>
              <th className={styles.thCell}>Result</th>
              <th className={styles.thCell}>Gate Attendance</th>
              <th className={styles.thCell}>Weather</th>
              <th
                onClick={() => handleSort('submitted')}
                className={styles.thSortable}
              >
                Photos {sortBy === 'submitted' ? (sortDesc ? '↓' : '↑') : ''}
              </th>
              <th className={styles.thCell}>Approval</th>
            </tr>
          </thead>
          <tbody>
            {pagedMatches.map((m, idx) => {
              const hasScore =
                m.homeScore !== null &&
                m.homeScore !== undefined &&
                m.visitorScore !== null &&
                m.visitorScore !== undefined;
              const outcomeBadge =
                m.outcome === 'home_win'
                  ? { label: 'Home Win', bg: '#ecfdf5', color: '#065f46' }
                  : m.outcome === 'draw'
                    ? { label: 'Draw', bg: '#f3f4f6', color: '#374151' }
                    : m.outcome === 'away_win'
                      ? { label: 'Away Win', bg: '#eff6ff', color: '#1e40af' }
                      : null;

              return (
                <tr
                  key={m.id || idx}
                  className={`${styles.tableRow} ${idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}`}
                >
                  <td className={styles.thCell}>
                    <span
                      className={styles.sportTag}
                      style={{ background: SPORT_COLORS[m.sport] || '#64748b' }}
                    >
                      {m.sport}
                    </span>
                  </td>
                  <td className={`${styles.thCell} ${styles.matchTitle}`}>
                    {m.cleanName}
                  </td>
                  <td className={styles.thCell}>{m.date}</td>
                  <td className={styles.thCell}>
                    <div style={{ fontWeight: 500, color: '#111827' }}>
                      {m.venue || m.partnerName || '—'}
                    </div>
                    {m.venueCapacity && (
                      <div className={styles.cardSubtitle}>
                        {m.venueCapacity.toLocaleString()} seats{' '}
                        {m.weather?.isIndoor ? '• Indoor' : ''}
                      </div>
                    )}
                  </td>
                  <td className={styles.thCell}>
                    {hasScore ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                          {m.homeScore} : {m.visitorScore}
                        </span>
                        {outcomeBadge && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: outcomeBadge.bg,
                              color: outcomeBadge.color,
                              display: 'inline-block',
                              width: 'fit-content',
                            }}
                          >
                            {outcomeBadge.label}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={styles.cardSubtitle}>—</span>
                    )}
                  </td>
                  <td className={styles.thCell}>
                    {m.attendance && m.attendance > 0 ? (
                      <div>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {m.attendance.toLocaleString()}
                        </span>
                        {m.capacityUtilizationRate && (
                          <div className={styles.cardSubtitle} style={{ color: '#059669', fontWeight: 600 }}>
                            {m.capacityUtilizationRate}% fill
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={styles.cardSubtitle}>—</span>
                    )}
                  </td>
                  <td className={styles.thCell}>
                    {m.weather ? (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.weather.isIndoor ? (
                          <span title={`Outside: ${m.weather.tempC}°C, ${m.weather.condition}`}>
                            Outside: {m.weather.tempC}°C · 🏟️
                          </span>
                        ) : (
                          <span title={`${m.weather.condition}, ${m.weather.precipitationMm}mm rain`}>
                            {m.weather.tempC}°C {m.weather.condition}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={styles.cardSubtitle}>—</span>
                    )}
                  </td>
                  <td className={`${styles.thCell} ${styles.matchTitle}`}>
                    {m.submitted}
                  </td>
                  <td className={styles.thCell}>
                    {m.submitted > 0 ? (
                      <span className={m.approvalRate >= 95 ? styles.brandPassHigh : styles.brandPassMed}>
                        {m.approvalRate}%
                      </span>
                    ) : (
                      <span className={styles.cardSubtitle}>n/a</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className={styles.paginationBar}>
        <div>
          {filteredMatches.length > 0
            ? `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, filteredMatches.length)} of ${filteredMatches.length} events`
            : 'No events to show'}
        </div>
        <div className={styles.actionsGroup}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={styles.pageBtn}
          >
            Previous
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={styles.pageBtn}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
