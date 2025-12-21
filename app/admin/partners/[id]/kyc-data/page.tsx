'use client';

// WHAT: Partner-level aggregated KYC data table
// WHY: Display aggregated KYC metrics across all events for a partner
// USAGE: Linked from Partners list via "KYC Data" button

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import MaterialIcon from '@/components/MaterialIcon';
import styles from '@/app/styles/kyc-data.module.css';

interface VariableMetadata {
  name: string;
  alias: string;
  type: 'number' | 'text' | 'derived';
  category: string;
  isSystemVariable: boolean;
}

interface PartnerData {
  _id: string;
  name: string;
  emoji: string;
  logoUrl?: string;
}

interface EventSummary {
  eventName: string;
  eventDate: string;
  _id: string;
}

export default function PartnerKYCDataPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  
  // WHAT: Log URL parameters on mount
  // WHY: Debug if all partners are opening with same ID
  React.useEffect(() => {
    console.log('🌍 [KYC Partner] Page mounted with params:', { id, allParams: params });
  }, [id, params]);
  
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<Record<string, number>>({});
  const [variables, setVariables] = useState<VariableMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🔍 [KYC Partner] Starting load for partner ID:', id);
      
      // Fetch partner data with cache-busting
      const partnerUrl = `/api/partners?partnerId=${id}&_t=${Date.now()}`;
      console.log('🔍 [KYC Partner] Fetching partner from:', partnerUrl);
      
      const partnerRes = await fetch(partnerUrl, {
        cache: 'no-store'
      });
      const partnerData = await partnerRes.json();
      
      console.log('🔍 [KYC Partner] Partner API Response:', partnerData);
      
      // WHAT: API now returns { firstPartner: {...}, partnersCount: 1 } for single partner queries
      // WHY: Updated in v11.20.9 to support partnerId query parameter
      if (!partnerData.success || !partnerData.firstPartner) {
        console.error('❌ [KYC Partner] Partner not found for ID:', id);
        setError('Partner not found');
        return;
      }
      
      const loadedPartner = partnerData.firstPartner;
      console.log('✅ [KYC Partner] Setting partner state:', {
        _id: loadedPartner._id,
        name: loadedPartner.name
      });
      
      setPartner(loadedPartner);
      
      // Fetch partner events
      const eventsUrl = `/api/partners/${id}/events`;
      console.log('🔍 [KYC Partner] Fetching events from:', eventsUrl);
      
      const eventsRes = await fetch(eventsUrl);
      const eventsData = await eventsRes.json();
      
      console.log('🔍 [KYC Partner] Events API Response:', {
        success: eventsData.success,
        eventsCount: eventsData.events?.length,
        partnerFromResponse: eventsData.partner ? {
          _id: eventsData.partner._id,
          name: eventsData.partner.name
        } : null
      });
      
      if (eventsData.success && eventsData.events) {
        setEvents(eventsData.events);
        
        // Aggregate numeric stats across all events
        const aggregated: Record<string, number> = {};
        eventsData.events.forEach((event: any) => {
          if (event.stats) {
            Object.entries(event.stats).forEach(([key, value]) => {
              if (typeof value === 'number') {
                aggregated[key] = (aggregated[key] || 0) + value;
              }
            });
          }
        });
        setAggregatedStats(aggregated);
      }
      
      // Fetch variable metadata
      const varsRes = await fetch('/api/variables-config');
      const varsData = await varsRes.json();
      
      if (varsData.success) {
        setVariables(varsData.variables || []);
      }
      
    } catch (err) {
      console.error('Failed to load partner KYC data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id, loadData]);
  
  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-gray-600">Loading KYC Data...</div>
        </div>
      </div>
    );
  }
  
  if (error || !partner) {
    return (
      <div className="page-container">
        <div className="error-card">
          <MaterialIcon name="error" className="text-red-500 text-4xl mb-4" />
          <div className="text-lg">{error || 'Partner not found'}</div>
          <button onClick={() => router.back()} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Get unique categories
  const categories = ['all', ...new Set(variables.map(v => v.category))];
  
  // Filter to numeric variables only (text variables can't be aggregated)
  const numericVariables = variables.filter(v => v.type === 'number');
  
  // Apply filters with safe string access
  const filteredVariables = numericVariables.filter(v => {
    const alias = v.alias || v.name; // Fallback to name if alias missing
    const matchesSearch = !searchQuery || 
      (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      alias.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  
  // Group by category
  const groupedVariables = filteredVariables.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {} as Record<string, VariableMetadata[]>);
  
  return (
    <div className="page-container">
      {/* Header */}
      <div className={styles.headerSection}>
        <button
          onClick={() => router.back()}
          className={`back-link ${styles.backButton}`}
        >
          <MaterialIcon name="arrow_back" />
          <span>Back to Partners</span>
        </button>
        
        <div className={styles.partnerHero}>
          {partner.emoji && <span className={styles.partnerEmoji}>{partner.emoji}</span>}
          <h1 className={styles.pageTitle}>
            {partner.name}
          </h1>
        </div>
        
        <h2 className={styles.pageSubtitle}>
          Aggregated KYC Data
        </h2>
        <div className={styles.pageMeta}>
          {events.length} event{events.length !== 1 ? 's' : ''} • Showing totals across all events
        </div>
      </div>
      
      {/* Search and Filter Controls */}
      <div className={styles.controlsRow}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search variables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`form-input ${styles.searchInput}`}
          />
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={`form-input ${styles.categorySelect}`}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
        
        <div className={styles.variableCount}>
          {filteredVariables.length} variable{filteredVariables.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {/* Info Banner */}
      {events.length === 0 && (
        <div className={`card ${styles.infoBanner}`}>
          <div className={styles.bannerContent}>
            <MaterialIcon name="info" className="text-yellow-600" />
            <div>
              <div className={styles.bannerTitle}>No Events Found</div>
              <div className={styles.bannerDescription}>
                This partner has no events yet. KYC data will appear once events are created.
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* KYC Data Table */}
      {Object.keys(groupedVariables).length === 0 ? (
        <div className="empty-state">
          <MaterialIcon name="search_off" className="text-gray-400 text-6xl mb-4" />
          <div className="text-lg text-gray-600">No variables match your search</div>
        </div>
      ) : (
        Object.entries(groupedVariables).map(([category, vars]) => (
          <div key={category} className={styles.categorySection}>
            <h3 className={styles.categoryHeading}>
              {category}
            </h3>
            
            <div className={`card ${styles.tableCard}`}>
              <table className={styles.kycTable}>
                <thead>
                  <tr>
                    <th className={`${styles.headerLeft} ${styles.colVariableWide}`}>
                      Variable
                    </th>
                    <th className={`${styles.headerLeft} ${styles.colFieldNameWide}`}>
                      Field Name
                    </th>
                    <th className={`${styles.headerRight} ${styles.colTotal}`}>
                      Total
                    </th>
                    <th className={`${styles.headerRight} ${styles.colAvg}`}>
                      Avg
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vars.map((v, idx) => {
                    const total = aggregatedStats[v.name] || 0;
                    const average = events.length > 0 ? total / events.length : 0;
                    const isZero = total === 0;
                    
                    return (
                      <tr 
                        key={v.name}
                        className={isZero ? styles.rowZero : ''}
                      >
                        <td>
                          <div className={styles.variableName}>{v.alias || v.name}</div>
                          {v.isSystemVariable && (
                            <div className={styles.systemBadge}>
                              System Variable
                            </div>
                          )}
                        </td>
                        <td className={styles.fieldName}>
                          {v.name}
                        </td>
                        <td className={`${styles.numericValueLarge} ${isZero ? styles.numericValueZero : styles.numericValueNormal}`}>
                          {total.toLocaleString()}
                        </td>
                        <td className={styles.avgValue}>
                          {average.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
