'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageHero from '@/components/AdminPageHero';

interface Variable {
  name: string;
  label: string;
  type: 'numeric' | 'percentage' | 'currency' | 'count';
  category: string;
  description?: string;
  defaultValue?: number;
  icon?: string;
}

export default function VariablesPage() {
  const router = useRouter();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [filteredVariables, setFilteredVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Pagination (UI-only): show first 20, then load more by 20
  const [visibleCount, setVisibleCount] = useState(20);
  // Modal state (must be declared before any early returns to keep hook order stable)
  const [activeVar, setActiveVar] = useState<Variable | null>(null);

  // Variables now come from API
  const mockVariables: Variable[] = [
    // Image-related variables
    { name: 'remoteImages', label: 'Remote Images', type: 'count', category: 'Images', icon: '📸', description: 'Images taken from remote locations' },
    { name: 'hostessImages', label: 'Hostess Images', type: 'count', category: 'Images', icon: '👥', description: 'Images featuring hostesses' },
    { name: 'selfies', label: 'Selfies', type: 'count', category: 'Images', icon: '🤳', description: 'Self-taken photographs' },
    
    // Location variables
    { name: 'remoteFans', label: 'Remote Fans', type: 'count', category: 'Location', icon: '🛰️', description: 'Indoor + Outdoor (aggregated)' },
    { name: 'stadium', label: 'Location', type: 'count', category: 'Location', icon: '🏟️', description: 'On-site (stadium) attendees' },
    
    // Demographics
    { name: 'female', label: 'Female', type: 'count', category: 'Demographics', icon: '👩', description: 'Female attendees' },
    { name: 'male', label: 'Male', type: 'count', category: 'Demographics', icon: '👨', description: 'Male attendees' },
    { name: 'genAlpha', label: 'Gen Alpha', type: 'count', category: 'Demographics', icon: '👶', description: 'Generation Alpha (2010+)' },
    { name: 'genYZ', label: 'Gen Y/Z', type: 'count', category: 'Demographics', icon: '🧑', description: 'Generation Y and Z (1981-2009)' },
    { name: 'genX', label: 'Gen X', type: 'count', category: 'Demographics', icon: '👤', description: 'Generation X (1965-1980)' },
    { name: 'boomer', label: 'Boomers', type: 'count', category: 'Demographics', icon: '👴', description: 'Baby Boomers (1946-1964)' },
    
    // Merchandise
    { name: 'merched', label: 'People with Merch', type: 'count', category: 'Merchandise', icon: '🛍️', description: 'Fans wearing merch (formerly "Merched")' },
    { name: 'jersey', label: 'Jerseys', type: 'count', category: 'Merchandise', icon: '👕', description: 'Jersey sales' },
    { name: 'scarf', label: 'Scarves', type: 'count', category: 'Merchandise', icon: '🧣', description: 'Scarf sales' },
    { name: 'flags', label: 'Flags', type: 'count', category: 'Merchandise', icon: '🏴', description: 'Flag sales' },
    { name: 'baseballCap', label: 'Baseball Caps', type: 'count', category: 'Merchandise', icon: '🧢', description: 'Baseball cap sales' },
    { name: 'other', label: 'Other Items', type: 'count', category: 'Merchandise', icon: '📦', description: 'Other merchandise' },
    
    // Success Manager (Engagement & Event)
    { name: 'approvedImages', label: 'Approved Images', type: 'count', category: 'Success Manager', icon: '✅', description: 'Approved images' },
    { name: 'rejectedImages', label: 'Rejected Images', type: 'count', category: 'Success Manager', icon: '❌', description: 'Rejected images' },
    { name: 'visitQrCode', label: 'QR Code Visits', type: 'count', category: 'Success Manager', icon: '📱', description: 'QR code scans' },
    { name: 'visitShortUrl', label: 'Short URL Visits', type: 'count', category: 'Success Manager', icon: '🔗', description: 'Short URL clicks' },
    { name: 'visitWeb', label: 'Web Visits', type: 'count', category: 'Success Manager', icon: '🌐', description: 'Direct website visits' },
    { name: 'socialVisit', label: 'Social Visit (Total)', type: 'count', category: 'Success Manager', icon: '📣', description: 'Sum of Facebook, Instagram, YouTube, TikTok, X, Trustpilot' },
    { name: 'eventValuePropositionVisited', label: 'Value Prop Visited', type: 'count', category: 'Success Manager', icon: '✉️', description: 'eDM page visits' },
    { name: 'eventValuePropositionPurchases', label: 'Value Prop Purchases', type: 'count', category: 'Success Manager', icon: '🛒', description: 'eDM purchases' },
    { name: 'eventAttendees', label: 'Event Attendees', type: 'count', category: 'Success Manager', icon: '👥', description: 'Total event attendees' },
    { name: 'eventResultHome', label: 'Event Result Home', type: 'count', category: 'Success Manager', icon: '🏠', description: 'Home team result' },
    { name: 'eventResultVisitor', label: 'Event Result Visitor', type: 'count', category: 'Success Manager', icon: '🧳', description: 'Visitor team result' },
  ];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/variables', { cache: 'no-store' });
        const data = await res.json();
        if (data?.success && Array.isArray(data.variables)) {
          // Normalize API variables to UI Variable type
          const vars: Variable[] = data.variables.map((v: any) => ({
            name: v.name,
            label: v.label,
            type: v.type || 'count',
            category: v.category,
            description: v.derived && v.formula ? v.formula : v.description || undefined,
            icon: v.type === 'text' ? '🏷️' : undefined,
          }))
          setVariables(vars);
          setFilteredVariables(vars);
        } else {
          setVariables(mockVariables);
          setFilteredVariables(mockVariables);
        }
      } catch (e) {
        console.error('Failed to load variables', e);
        setVariables(mockVariables);
        setFilteredVariables(mockVariables);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter variables based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredVariables(variables);
    } else {
      const q = searchTerm.toLowerCase();
      const filtered = variables.filter(variable =>
        variable.name.toLowerCase().includes(q) ||
        variable.label.toLowerCase().includes(q) ||
        variable.category.toLowerCase().includes(q) ||
        (variable.description?.toLowerCase().includes(q) ?? false)
      );
      setFilteredVariables(filtered);
    }
    // Reset visible count on new search
    setVisibleCount(20);
  }, [searchTerm, variables]);

  const handleCreateVariable = () => {
    // TODO: Open create variable modal/form
    console.log('Create new variable');
  };

  const handleEditVariable = (variableName: string) => {
    // TODO: Open edit variable modal/form
    console.log('Edit variable:', variableName);
  };

  // Group variables by category
  const variablesByCategory = filteredVariables.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, Variable[]>);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'count': return '#3b82f6';
      case 'currency': return '#10b981';
      case 'percentage': return '#f59e0b';
      case 'numeric': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="admin-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
          <div>Loading variables...</div>
        </div>
      </div>
    );
  }

  // Simple read-only modal for variable details

  return (
    <div className="admin-container">
      {activeVar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
             onClick={() => setActiveVar(null)}>
          <div className="glass-card" style={{ maxWidth: 520, width: '90%', padding: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{activeVar.label}</h3>
            <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>Category: {activeVar.category}</p>
            <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>Type: {activeVar.type.toUpperCase()}</p>
            <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>Reference: {[ 'count','numeric','currency','percentage' ].includes(activeVar.type) ? `[${activeVar.name.toUpperCase()}]` : activeVar.name}</p>
            {activeVar.description && (
              <p style={{ marginTop: '0.75rem', color: '#374151' }}>{activeVar.description}</p>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setActiveVar(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      <AdminPageHero
        title="Variables"
        subtitle="Manage data variables and metrics"
        icon="⚙️"
        badges={[
          { text: 'Data Manager', variant: 'primary' },
          { text: 'Variables', variant: 'secondary' },
          { text: `${filteredVariables.length} Variables`, variant: 'success' }
        ]}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search variables..."
        onAction={() => setShowCreateForm(true)}
        actionLabel="➕ New Variable"
        backLink="/admin"
      />

      {/* Variables by Category */}
      <div style={{ padding: '2rem' }}>
        {Object.entries(variablesByCategory).map(([category, categoryVariables]) => (
          <div key={category} style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '1rem'
              }}>
                {category}
              </span>
              <span style={{ color: '#6b7280', fontSize: '1rem', fontWeight: '400' }}>
                ({categoryVariables.length} variables)
              </span>
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {categoryVariables.slice(0, visibleCount).map((variable) => (
                <div
                  key={variable.name}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Variable Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flex: 1
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>{variable.icon}</span>
                      <div>
                        <h3 style={{
                          margin: 0,
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#1f2937'
                        }}>
                          {variable.label}
                        </h3>
                        <code style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          background: 'rgba(107, 114, 128, 0.1)',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px'
                        }}>
                          {[ 'count','numeric','currency','percentage' ].includes(variable.type)
                            ? `[${variable.name.toUpperCase()}]`
                            : `${variable.name}`}
                        </code>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setActiveVar(variable)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Edit
                    </button>
                  </div>

                  {/* Description */}
                  {variable.description && (
                    <p style={{
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      marginBottom: '0.75rem',
                      lineHeight: '1.4'
                    }}>
                      {variable.description}
                    </p>
                  )}

                  {/* Type Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: `${getTypeColor(variable.type)}20`,
                      color: getTypeColor(variable.type),
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {variable.type}
                    </span>
                    
                    {variable.defaultValue !== undefined && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>
                        Default: {variable.defaultValue}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Load more within this category if there are more */}
            {categoryVariables.length > visibleCount && (
              <div style={{ textAlign: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setVisibleCount(prev => prev + 20)}
                >
                  Load 20 more
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {filteredVariables.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ marginBottom: '0.5rem' }}>
              {searchTerm ? 'No variables found' : 'No variables yet'}
            </h3>
            <p style={{ marginBottom: '1.5rem' }}>
              {searchTerm 
                ? `No variables match "${searchTerm}"`
                : 'Create your first data variable to get started'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateVariable}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                ➕ Create First Variable
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
