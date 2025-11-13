'use client';

// WHAT: Event-specific KYC data table view
// WHY: Display all KYC variables for a single event in structured format
// USAGE: Linked from Events list via "KYC Data" button

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

interface ProjectData {
  _id: string;
  eventName: string;
  eventDate: string;
  stats: Record<string, any>;
}

export default function EventKYCDataPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [variables, setVariables] = useState<VariableMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch project data
      const projectRes = await fetch(`/api/projects?projectId=${id}`);
      const projectData = await projectRes.json();
      
      if (!projectData.success || !projectData.projects?.[0]) {
        setError('Event not found');
        return;
      }
      
      setProject(projectData.projects[0]);
      
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
  };
  
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
  
  // Filter variables
  const filteredVariables = variables.filter(v => {
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
          <span>Back to Events</span>
        </button>
        
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          KYC Data
        </h1>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--mm-gray-600)', marginBottom: '0.25rem' }}>
          {project.eventName}
        </h2>
        <div style={{ fontSize: '0.875rem', color: 'var(--mm-gray-500)' }}>
          {new Date(project.eventDate).toLocaleDateString()} • ID: {project._id}
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
                      width: '35%'
                    }}>
                      Variable
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      fontWeight: 600,
                      width: '25%'
                    }}>
                      Field Name
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'right', 
                      fontWeight: 600,
                      width: '20%'
                    }}>
                      Value
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'center', 
                      fontWeight: 600,
                      width: '20%'
                    }}>
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
                        style={{ 
                          borderBottom: idx < vars.length - 1 ? '1px solid var(--mm-gray-100)' : 'none',
                          backgroundColor: isZero || isEmpty ? 'var(--mm-gray-50)' : 'transparent'
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
                          fontWeight: 500,
                          fontSize: '1.125rem'
                        }}>
                          {isEmpty ? (
                            <span style={{ color: 'var(--mm-gray-400)' }}>—</span>
                          ) : v.type === 'number' ? (
                            <span style={{ color: isZero ? 'var(--mm-gray-400)' : 'var(--mm-gray-900)' }}>
                              {typeof value === 'number' ? value.toLocaleString() : value}
                            </span>
                          ) : (
                            <span style={{ 
                              fontSize: '0.875rem', 
                              color: 'var(--mm-gray-700)',
                              maxWidth: '300px',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {String(value)}
                            </span>
                          )}
                        </td>
                        <td style={{ 
                          padding: '1rem', 
                          textAlign: 'center',
                          fontSize: '0.75rem'
                        }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            backgroundColor: 
                              v.type === 'number' ? 'var(--mm-blue-100)' :
                              v.type === 'text' ? 'var(--mm-green-100)' :
                              'var(--mm-purple-100)',
                            color:
                              v.type === 'number' ? 'var(--mm-blue-700)' :
                              v.type === 'text' ? 'var(--mm-green-700)' :
                              'var(--mm-purple-700)',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}>
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
