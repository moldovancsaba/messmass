'use client';

// WHAT: Partner-level aggregated KYC data table
// WHY: Display aggregated KYC metrics across all events for a partner
// USAGE: Linked from Partners list via "KYC Data" button

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import MaterialIcon from '@/components/MaterialIcon';

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
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  
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
      
      // Fetch partner data with cache-busting
      const partnerRes = await fetch(`/api/partners?partnerId=${id}&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      const partnerData = await partnerRes.json();
      
      console.log('🔍 [KYC Partner] Loaded partner:', { id, name: partnerData.partners?.[0]?.name });
      
      if (!partnerData.success || !partnerData.partners?.[0]) {
        setError('Partner not found');
        return;
      }
      
      setPartner(partnerData.partners[0]);
      
      // Fetch partner events
      const eventsRes = await fetch(`/api/partners/${id}/events`);
      const eventsData = await eventsRes.json();
      
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
  
  // Apply filters
  const filteredVariables = numericVariables.filter(v => {
    const matchesSearch = !searchQuery || 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.alias.toLowerCase().includes(searchQuery.toLowerCase());
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
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => router.back()}
          className="back-link"
          style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <MaterialIcon name="arrow_back" />
          <span>Back to Partners</span>
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          {partner.emoji && <span style={{ fontSize: '2.5rem' }}>{partner.emoji}</span>}
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
            {partner.name}
          </h1>
        </div>
        
        <h2 style={{ fontSize: '1.25rem', color: 'var(--mm-gray-600)', marginBottom: '0.25rem' }}>
          Aggregated KYC Data
        </h2>
        <div style={{ fontSize: '0.875rem', color: 'var(--mm-gray-500)' }}>
          {events.length} event{events.length !== 1 ? 's' : ''} • Showing totals across all events
        </div>
      </div>
      
      {/* Search and Filter Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <input
            type="text"
            placeholder="Search variables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ width: '100%' }}
          />
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="form-input"
          style={{ minWidth: '200px' }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
        
        <div style={{ fontSize: '0.875rem', color: 'var(--mm-gray-500)' }}>
          {filteredVariables.length} variable{filteredVariables.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {/* Info Banner */}
      {events.length === 0 && (
        <div className="card" style={{ 
          padding: '1.5rem', 
          backgroundColor: 'var(--mm-yellow-50)', 
          border: '1px solid var(--mm-yellow-200)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MaterialIcon name="info" className="text-yellow-600" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--mm-yellow-900)' }}>No Events Found</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--mm-yellow-700)' }}>
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
          <div key={category} style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 600, 
              marginBottom: '1rem',
              color: 'var(--mm-gray-800)',
              textTransform: 'capitalize'
            }}>
              {category}
            </h3>
            
            <div className="card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: 'var(--mm-gray-50)', 
                    borderBottom: '2px solid var(--mm-gray-200)' 
                  }}>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      fontWeight: 600,
                      width: '40%'
                    }}>
                      Variable
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      fontWeight: 600,
                      width: '30%'
                    }}>
                      Field Name
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'right', 
                      fontWeight: 600,
                      width: '20%'
                    }}>
                      Total
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'right', 
                      fontWeight: 600,
                      width: '10%'
                    }}>
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
                        style={{ 
                          borderBottom: idx < vars.length - 1 ? '1px solid var(--mm-gray-100)' : 'none',
                          backgroundColor: isZero ? 'var(--mm-gray-50)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 500 }}>{v.alias}</div>
                          {v.isSystemVariable && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--mm-gray-500)',
                              marginTop: '0.25rem'
                            }}>
                              System Variable
                            </div>
                          )}
                        </td>
                        <td style={{ 
                          padding: '1rem', 
                          fontFamily: 'monospace', 
                          fontSize: '0.875rem',
                          color: 'var(--mm-gray-600)'
                        }}>
                          {v.name}
                        </td>
                        <td style={{ 
                          padding: '1rem', 
                          textAlign: 'right',
                          fontWeight: 600,
                          fontSize: '1.125rem',
                          color: isZero ? 'var(--mm-gray-400)' : 'var(--mm-gray-900)'
                        }}>
                          {total.toLocaleString()}
                        </td>
                        <td style={{ 
                          padding: '1rem', 
                          textAlign: 'right',
                          fontSize: '0.875rem',
                          color: 'var(--mm-gray-600)'
                        }}>
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
