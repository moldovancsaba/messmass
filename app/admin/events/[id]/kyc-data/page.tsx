'use client';

// WHAT: Event-specific KYC data table view
// WHY: Display all KYC variables for a single event in structured format
// USAGE: Linked from Events list via "KYC Data" button

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

interface ProjectData {
  _id: string;
  eventName: string;
  eventDate: string;
  stats: Record<string, any>;
}

export default function EventKYCDataPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  
  // WHAT: Log URL parameters on mount
  // WHY: Debug if all events are opening with same ID
  React.useEffect(() => {
    console.log('🌍 [KYC Event] Page mounted with params:', { id, allParams: params });
  }, [id, params]);
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [variables, setVariables] = useState<VariableMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // WHAT: Fetch project data with cache-busting
      // WHY: Ensure fresh data on every load
      console.log('🔍 [KYC Event] Starting load for project ID:', id);
      
      const projectRes = await fetch(`/api/projects?projectId=${id}&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      const projectData = await projectRes.json();
      
      console.log('🔍 [KYC Event] API Response:', projectData);
      
      // WHAT: API now returns { project: {...} } for single project queries
      // WHY: Updated in v11.20.10 to support projectId query parameter
      if (!projectData.success || !projectData.project) {
        console.error('❌ [KYC Event] Event not found for ID:', id);
        setError('Event not found');
        return;
      }
      
      const loadedProject = projectData.project;
      console.log('✅ [KYC Event] Setting project state:', {
        _id: loadedProject._id,
        eventName: loadedProject.eventName
      });
      
      setProject(loadedProject);
      
      // Fetch variable metadata
      const varsRes = await fetch('/api/variables-config');
      const varsData = await varsRes.json();
      
      if (varsData.success) {
        setVariables(varsData.variables || []);
      }
      
    } catch (err) {
      console.error('Failed to load KYC data:', err);
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
  
  if (error || !project) {
    return (
      <div className="page-container">
        <div className="error-card">
          <MaterialIcon name="error" className="text-red-500 text-4xl mb-4" />
          <div className="text-lg">{error || 'Event not found'}</div>
          <button onClick={() => router.back()} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Get unique categories
  const categories = ['all', ...new Set(variables.map(v => v.category))];
  
  // Filter variables with safe string access
  const filteredVariables = variables.filter(v => {
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
          <span>Back to Events</span>
        </button>
        
        <h1 className={styles.pageTitle}>
          KYC Data
        </h1>
        <h2 className={styles.pageSubtitle}>
          {project.eventName}
        </h2>
        <div className={styles.pageMeta}>
          {new Date(project.eventDate).toLocaleDateString()} • ID: {project._id}
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
                    <th className={`${styles.headerLeft} ${styles.colVariable}`}>
                      Variable
                    </th>
                    <th className={`${styles.headerLeft} ${styles.colFieldName}`}>
                      Field Name
                    </th>
                    <th className={`${styles.headerRight} ${styles.colValue}`}>
                      Value
                    </th>
                    <th className={`${styles.headerCenter} ${styles.colType}`}>
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vars.map((v, idx) => {
                    const value = project.stats[v.name];
                    const isZero = value === 0 || value === '0';
                    const isEmpty = value === null || value === undefined || value === '';
                    
                    return (
                      <tr 
                        key={v.name}
                        className={isZero || isEmpty ? styles.rowZero : ''}
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
                        <td className={styles.numericValue}>
                          {isEmpty ? (
                            <span className={styles.emptyValue}>—</span>
                          ) : v.type === 'number' ? (
                            <span className={isZero ? styles.numericValueZero : styles.numericValueNormal}>
                              {typeof value === 'number' ? value.toLocaleString() : value}
                            </span>
                          ) : (
                            <span className={styles.textValue}>
                              {String(value)}
                            </span>
                          )}
                        </td>
                        <td className={styles.typeCell}>
                          <span className={`${styles.typeBadge} ${
                            v.type === 'number' ? styles.typeBadgeNumber :
                            v.type === 'text' ? styles.typeBadgeText :
                            styles.typeBadgeDerived
                          }`}>
                            {v.type}
                          </span>
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
