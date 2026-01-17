'use client';

/**
 * Insights Dashboard
 * 
 * WHAT: Dedicated dashboard for viewing and managing AI-generated insights
 * WHY: Centralized view of all actionable intelligence across events
 * HOW: Real-time insights feed with filtering, prioritization, and action tracking
 * 
 * Features:
 * - All insights from Phase 2 insights engine
 * - Filter by priority (critical, high, medium, low)
 * - Filter by category (anomaly, trend, benchmark, opportunity)
 * - Search by keyword
 * - Sort by confidence, date, priority
 * - Action tracking (mark as actioned, dismiss)
 * - Export insights as CSV/PDF
 * 
 * Version: 11.55.1 (Phase 3 - Insights Dashboard)
 * Created: 2025-10-19T13:45:00.000Z
 */

import React, { useState, useEffect, useCallback } from 'react';
import { InsightCard } from '@/components/analytics';
import type { Insight } from '@/lib/insightsEngine';
import styles from './InsightsDashboard.module.css';

type PriorityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type CategoryFilter = 'all' | 'anomaly' | 'trend' | 'benchmark' | 'opportunity';
type SortBy = 'priority' | 'confidence' | 'date';

export default function InsightsDashboard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInsights();
  }, []);

  /**
   * WHAT: Fetch all insights from analytics aggregates
   * WHY: Get comprehensive view across all events
   */
  async function fetchInsights() {
    setLoading(true);
    try {
      // WHAT: Fetch recent insights across all events
      const response = await fetch('/api/analytics/insights/all?limit=100');
      
      if (response.ok) {
        const data = await response.json();
        setInsights(data.data.insights || []);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * WHAT: Apply filters and sorting to insights
   * WHY: Show relevant insights based on user selection
   */
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...insights];

    // WHAT: Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(i => i.priority === priorityFilter);
    }

    // WHAT: Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(i => i.category === categoryFilter);
    }

    // WHAT: Filter by search term (title or message)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        i => 
          i.title.toLowerCase().includes(term) ||
          i.message.toLowerCase().includes(term)
      );
    }

    // WHAT: Sort insights
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (diff !== 0) return diff;
        return b.confidence - a.confidence; // Tie-break with confidence
      } else if (sortBy === 'confidence') {
        return b.confidence - a.confidence;
      }
      return 0; // Date sorting would require timestamp
    });

    setFilteredInsights(filtered);
  }, [insights, priorityFilter, categoryFilter, sortBy, searchTerm]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  /**
   * WHAT: Handle insight action (mark as reviewed/actioned)
   * WHY: Track which insights have been addressed
   */
  function handleAction(insightId: string) {
    // TODO: Implement action tracking in backend
    console.log('Actioned insight:', insightId);
    // Optimistically update UI
    setInsights(insights.filter(i => i.id !== insightId));
  }

  /**
   * WHAT: Handle insight dismissal
   * WHY: Remove non-relevant insights from view
   */
  function handleDismiss(insightId: string) {
    // TODO: Implement dismiss tracking in backend
    console.log('Dismissed insight:', insightId);
    // Optimistically update UI
    setInsights(insights.filter(i => i.id !== insightId));
  }

  // WHAT: Calculate summary statistics
  const stats = {
    total: insights.length,
    critical: insights.filter(i => i.priority === 'critical').length,
    high: insights.filter(i => i.priority === 'high').length,
    medium: insights.filter(i => i.priority === 'medium').length,
    low: insights.filter(i => i.priority === 'low').length,
  };

  return (
    <div className={styles.insightsDashboard}>
      {/* WHAT: Dashboard header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🧠 Insights Dashboard</h1>
          <p className={styles.subtitle}>AI-generated actionable intelligence across all events</p>
        </div>
      </div>

      {/* WHAT: Summary stats bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total Insights</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statValue} ${styles.critical}`}>{stats.critical}</span>
          <span className={styles.statLabel}>Critical</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statValue} ${styles.high}`}>{stats.high}</span>
          <span className={styles.statLabel}>High</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statValue} ${styles.medium}`}>{stats.medium}</span>
          <span className={styles.statLabel}>Medium</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statValue} ${styles.low}`}>{stats.low}</span>
          <span className={styles.statLabel}>Low</span>
        </div>
      </div>

      {/* WHAT: Filters and controls */}
      <div className={styles.controls}>
        <div className={styles.filters}>
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            className={styles.select}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            className={styles.select}
          >
            <option value="all">All Categories</option>
            <option value="anomaly">Anomalies</option>
            <option value="trend">Trends</option>
            <option value="benchmark">Benchmarks</option>
            <option value="opportunity">Opportunities</option>
          </select>

          {/* Sort by */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className={styles.select}
          >
            <option value="priority">Sort by Priority</option>
            <option value="confidence">Sort by Confidence</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search insights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.actionButton} onClick={fetchInsights}>
            🔄 Refresh
          </button>
          <button className={styles.actionButton}>
            📄 Export
          </button>
        </div>
      </div>

      {/* WHAT: Results count */}
      <div className={styles.resultsBar}>
        <span className={styles.resultsText}>
          Showing {filteredInsights.length} of {insights.length} insights
        </span>
      </div>

      {/* WHAT: Insights feed */}
      <div className={styles.insightsFeed}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading insights...</p>
          </div>
        ) : filteredInsights.length > 0 ? (
          filteredInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onAction={handleAction}
              onDismiss={handleDismiss}
              showActions={true}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <h3>No insights found</h3>
            <p>Try adjusting your filters or check back later</p>
          </div>
        )}
      </div>
    </div>
  );
}
