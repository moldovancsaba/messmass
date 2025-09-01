'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageHero from '@/components/AdminPageHero';
import { DataVisualizationBlock } from '@/lib/pageStyleTypes';

export default function VisualizationPage() {
  const router = useRouter();
  const [dataBlocks, setDataBlocks] = useState<DataVisualizationBlock[]>([]);
  const [filteredBlocks, setFilteredBlocks] = useState<DataVisualizationBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch data blocks
  const fetchDataBlocks = async () => {
    try {
      const response = await fetch('/api/data-blocks');
      const data = await response.json();
      
      if (data.success) {
        setDataBlocks(data.dataBlocks || []);
        setFilteredBlocks(data.dataBlocks || []);
      } else {
        setError(data.error || 'Failed to load data blocks');
      }
    } catch (err) {
      console.error('Failed to fetch data blocks:', err);
      setError('Failed to load data blocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataBlocks();
  }, []);

  // Filter blocks based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredBlocks(dataBlocks || []);
    } else {
      const filtered = (dataBlocks || []).filter(block =>
        block.name && block.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBlocks(filtered);
    }
  }, [searchTerm, dataBlocks]);

  const handleCreateBlock = () => {
    // TODO: Open create data block modal/form
    console.log('Create new data block');
  };

  const handleEditBlock = (blockId: string) => {
    // TODO: Open edit data block modal/form
    console.log('Edit data block:', blockId);
  };

  const handleDeleteBlock = async (blockId: string, blockTitle: string) => {
    if (!confirm(`Are you sure you want to delete the data block "${blockTitle}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/data-blocks/${blockId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchDataBlocks();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete data block');
      }
    } catch (err) {
      console.error('Failed to delete data block:', err);
      alert('Failed to delete data block');
    }
  };

  const handleToggleVisibility = async (blockId: string, currentVisibility: boolean) => {
    try {
      const response = await fetch(`/api/data-blocks/${blockId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visible: !currentVisibility
        })
      });

      if (response.ok) {
        await fetchDataBlocks();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update data block');
      }
    } catch (err) {
      console.error('Failed to update data block:', err);
      alert('Failed to update data block');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chart': return '📊';
      case 'kpi': return '📈';
      case 'table': return '📋';
      case 'metric': return '🔢';
      case 'text': return '📝';
      default: return '📦';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chart': return '#3b82f6';
      case 'kpi': return '#10b981';
      case 'table': return '#f59e0b';
      case 'metric': return '#8b5cf6';
      case 'text': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
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
          <div>Loading data blocks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#ef4444'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <div>{error}</div>
          <button
            onClick={fetchDataBlocks}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      <AdminPageHero
        title="Visualization"
        subtitle="Manage data visualization blocks and components"
        icon="📊"
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search data blocks..."
        onAction={() => setShowCreateForm(true)}
        actionLabel="➕ New Block"
        backLink="/admin"
      />

      {/* Data Blocks Grid */}
      <div style={{ padding: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredBlocks.map((block) => (
            <div
              key={block._id}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                opacity: block.isActive ? 1 : 0.6
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
              {/* Block Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flex: 1
                }}>
                  <span style={{ fontSize: '1.5rem' }}>📊</span>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {block.name}
                    </h3>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#3b82f6',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Data Block
                    </span>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => handleToggleVisibility(block._id!, block.isActive)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      background: block.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      color: block.isActive ? '#10b981' : '#6b7280',
                      border: `1px solid ${block.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`,
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {block.isActive ? '👁️ Active' : '🙈 Inactive'}
                  </button>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleEditBlock(block._id!)}
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
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block._id!, block.name)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              {/* Block Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
                color: '#6b7280',
                borderTop: '1px solid rgba(107, 114, 128, 0.1)',
                paddingTop: '0.75rem'
              }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <span>Order: {block.order}</span>
                  <span>Charts: {block.charts?.length || 0}</span>
                </div>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: block.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: block.isActive ? '#10b981' : '#ef4444',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  {block.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredBlocks.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ marginBottom: '0.5rem' }}>
              {searchTerm ? 'No data blocks found' : 'No data blocks yet'}
            </h3>
            <p style={{ marginBottom: '1.5rem' }}>
              {searchTerm 
                ? `No data blocks match "${searchTerm}"`
                : 'Create your first data visualization block to get started'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateBlock}
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
                ➕ Create First Block
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
