'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState, useMemo } from 'react';
import { MatchItem } from './types';
import { REPORT_CHART_PALETTE } from '@/lib/theme/interactiveReportPalette';
import styles from './interactive-report.module.css';

interface MatchesTableProps {
  matches: MatchItem[];
  isFanmass?: boolean;
}

const SPORT_COLORS: Record<string, string> = {
  Football: REPORT_CHART_PALETTE.blue,
  'Ice Hockey': REPORT_CHART_PALETTE.teal,
  Basketball: REPORT_CHART_PALETTE.amber,
  Handball: REPORT_CHART_PALETTE.rose,
  Other: REPORT_CHART_PALETTE.slate,
};

export default function MatchesTable({ matches, isFanmass = false }: MatchesTableProps) {
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
              <th className={styles.thCell}>Match</th>
              <th
                onClick={() => handleSort('date')}
                className={styles.thSortable}
              >
                Date {sortBy === 'date' ? (sortDesc ? '↓' : '↑') : ''}
              </th>
              <th className={styles.thCell}>Venue &amp; Capacity</th>
              <th className={styles.thCell}>Result</th>
              <th className={styles.thCell}>Attendance</th>
              <th className={styles.thCell}>Weather</th>
                <th
                  onClick={() => handleSort('submitted')}
                  className={styles.thSortable}
                >
                  Photos {sortBy === 'submitted' ? (sortDesc ? '↓' : '↑') : ''}
                </th>
                {!isFanmass && <th className={styles.thCell}>Approval</th>}
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
                  ? { label: 'Home Win', cls: styles.matchOutcomeWin }
                  : m.outcome === 'draw'
                    ? { label: 'Draw', cls: styles.matchOutcomeDraw }
                    : m.outcome === 'away_win'
                      ? { label: 'Away Win', cls: styles.matchOutcomeLoss }
                      : null;

              const teamParts = m.cleanName.split(/\s+[x×#]\s+/i);

              return (
                <tr
                  key={m.id || idx}
                  className={`${styles.tableRow} ${idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}`}
                >
                  <td className={`${styles.thCell} ${styles.gdsNowrap}`}>
                    <span className={`${styles.sportTag} ${styles.gdsNowrap}`}>
                      {m.sport}
                    </span>
                  </td>
                  <td className={`${styles.thCell} ${styles.matchTitle}`}>
                    {m.id && /^[a-f0-9]{24}$/i.test(m.id) ? (
                      <a href={`/interactive-report/event/${m.id}`} className={styles.gdsMatchLink}>
                        <span>{teamParts[0]}</span>
                        {teamParts.length > 1 && (
                          <span className={styles.gdsMatchAway}>vs {teamParts.slice(1).join(' × ')}</span>
                        )}
                      </a>
                    ) : (
                      <>
                        <div>{teamParts[0]}</div>
                        {teamParts.length > 1 && (
                          <div className={styles.gdsMatchAway}>vs {teamParts.slice(1).join(' × ')}</div>
                        )}
                      </>
                    )}
                  </td>
                  <td className={`${styles.thCell} ${styles.gdsNum} ${styles.gdsNowrap}`}>{m.date}</td>
                  <td className={styles.thCell}>
                    <div className={styles.matchVenueTitle}>
                      {m.venue || m.partnerName || '—'}
                    </div>
                    {m.venueCapacity && (
                      <div className={styles.cardSubtitle}>
                        {m.venueCapacity.toLocaleString()} seats{' '}
                        {m.weather?.isIndoor ? '• Indoor' : ''}
                      </div>
                    )}
                  </td>
                  <td className={`${styles.thCell} ${styles.gdsNowrap}`}>
                    {hasScore ? (
                      <div className={styles.matchScoreCol}>
                        <span className={`${styles.matchScoreNum} ${styles.gdsNum}`}>
                          {m.homeScore} : {m.visitorScore}
                        </span>
                        {outcomeBadge && (
                          <span className={`${styles.matchOutcomeBadge} ${outcomeBadge.cls} ${styles.gdsNowrap}`}>
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
                        <span className={`${styles.matchAttNum} ${styles.gdsNum}`}>
                          {m.attendance.toLocaleString()}
                        </span>
                        {m.capacityUtilizationRate && (
                          <div className={`${styles.matchFillRate} ${styles.gdsNum}`}>
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
                      <div className={styles.matchWeatherCell}>
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
                  <td className={`${styles.thCell} ${styles.matchTitle} ${styles.gdsNum} ${styles.gdsNowrap}`}>
                    {m.submitted}
                  </td>
                  {!isFanmass && (
                    <td className={`${styles.thCell} ${styles.gdsNum} ${styles.gdsNowrap}`}>
                      {m.submitted > 0 ? (
                        <span className={m.approvalRate >= 95 ? styles.brandPassHigh : styles.brandPassMed}>
                          {m.approvalRate}%
                        </span>
                      ) : (
                        <span className={styles.cardSubtitle}>n/a</span>
                      )}
                    </td>
                  )}
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
