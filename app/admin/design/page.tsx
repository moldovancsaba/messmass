'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageHero from '@/components/AdminPageHero';
import { PageStyle, DataVisualizationBlock, BlockChart } from '@/lib/pageStyleTypes';

// Available chart type for chart assignment
interface AvailableChart {
  chartId: string;
  title: string;
  type: string;
  order: number;
  isActive: boolean;
  emoji?: string;
}

export default function AdminDesignPage() {
  const router = useRouter();
  const [pageStyles, setPageStyles] = useState<PageStyle[]>([]);
  const [dataBlocks, setDataBlocks] = useState<DataVisualizationBlock[]>([]);
  const [availableCharts, setAvailableCharts] = useState<AvailableChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'styles' | 'blocks'>('styles');
  const [editingBlock, setEditingBlock] = useState<DataVisualizationBlock | null>(null);
  const [showCreateBlock, setShowCreateBlock] = useState(false);
  
  // Form states for new data block
  const [blockForm, setBlockForm] = useState({
    name: '',
    charts: [] as BlockChart[],
    order: 0,
    isActive: true
  });

  // Form states for page style
  const [styleForm, setStyleForm] = useState({
    name: 'New Style',
    backgroundGradient: '0deg, #ffffffff 0%, #ffffffff 100%',
    headerBackgroundGradient: '0deg, #f8fafc 0%, #f1f5f9 100%',
    titleBubble: {
      backgroundColor: '#6366f1',
      textColor: '#ffffff'
    }
  });

  useEffect(() => {
    loadPageStyles();
    loadDataBlocks();
    loadAvailableCharts();
  }, []);

  const loadPageStyles = async () => {
    try {
      const response = await fetch('/api/page-styles');
      const data = await response.json();
      if (data.success) {
        setPageStyles(data.styles);
      }
    } catch (error) {
      console.error('Failed to load page styles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDataBlocks = async () => {
    try {
      const response = await fetch('/api/data-blocks');
      const data = await response.json();
      if (data.success) {
        setDataBlocks(data.blocks);
      }
    } catch (error) {
      console.error('Failed to load data blocks:', error);
    }
  };
  
  const loadAvailableCharts = async () => {
    try {
      const response = await fetch('/api/chart-configs');
      const data = await response.json();
      if (data.success) {
        setAvailableCharts(data.configs);
      }
    } catch (error) {
      console.error('Failed to load available charts:', error);
    }
  };
  
  // Data Block Management Functions
  const handleCreateBlock = async () => {
    if (!blockForm.name.trim()) {
      alert('Block name is required');
      return;
    }
    
    try {
      // Add default gridColumns for backward compatibility
      const blockData = {
        ...blockForm,
        gridColumns: 4 // Default to 4 columns for PC layout
      };
      
      const response = await fetch('/api/data-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockData)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadDataBlocks();
        setShowCreateBlock(false);
        setBlockForm({
          name: '',
          charts: [],
          order: 0,
          isActive: true
        });
        alert('Data block created successfully!');
      } else {
        alert('Failed to create block: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create block:', error);
      alert('Failed to create block');
    }
  };
  
  const handleUpdateBlock = async (block: DataVisualizationBlock) => {
    try {
      const response = await fetch('/api/data-blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(block)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadDataBlocks();
        setEditingBlock(null);
        alert('Block updated successfully!');
      } else {
        alert('Failed to update block: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to update block:', error);
      alert('Failed to update block');
    }
  };
  
  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this data block?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/data-blocks?id=${blockId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        await loadDataBlocks();
        alert('Block deleted successfully!');
      } else {
        alert('Failed to delete block: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to delete block:', error);
      alert('Failed to delete block');
    }
  };
  
  const addChartToBlock = (block: DataVisualizationBlock, chartId: string) => {
    const chart = availableCharts.find(c => c.chartId === chartId);
    if (!chart) return;
    
    const newChart: BlockChart = {
      chartId,
      width: 1,
      order: block.charts.length
    };
    
    const updatedBlock = {
      ...block,
      charts: [...block.charts, newChart]
    };
    
    handleUpdateBlock(updatedBlock);
  };
  
  const removeChartFromBlock = (block: DataVisualizationBlock, chartIndex: number) => {
    const updatedCharts = block.charts.filter((_, index) => index !== chartIndex);
    // Reorder remaining charts
    const reorderedCharts = updatedCharts.map((chart, index) => ({ ...chart, order: index }));
    
    const updatedBlock = {
      ...block,
      charts: reorderedCharts
    };
    
    handleUpdateBlock(updatedBlock);
  };
  
  const updateChartWidth = (block: DataVisualizationBlock, chartIndex: number, newWidth: number) => {
    const updatedCharts = [...block.charts];
    // Only allow width 1 (Portrait) or 2 (Landscape)
    updatedCharts[chartIndex] = { ...updatedCharts[chartIndex], width: Math.min(Math.max(newWidth, 1), 2) };
    
    const updatedBlock = {
      ...block,
      charts: updatedCharts
    };
    
    handleUpdateBlock(updatedBlock);
  };

  const resetBlockForm = () => {
    setBlockForm({
      name: '',
      charts: [],
      order: 0,
      isActive: true
    });
  };
  
  const handleCreateStyle = async () => {
    try {
      const response = await fetch('/api/page-styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(styleForm)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadPageStyles();
        // Reset form
        setStyleForm({
          name: 'New Style',
          backgroundGradient: '0deg, #ffffffff 0%, #ffffffff 100%',
          headerBackgroundGradient: '0deg, #f8fafc 0%, #f1f5f9 100%',
          titleBubble: {
            backgroundColor: '#6366f1',
            textColor: '#ffffff'
          }
        });
      } else {
        alert('Failed to create style: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create style:', error);
      alert('Failed to create style');
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(99, 102, 241, 0.3)',
            borderTop: '4px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Loading design settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminPageHero 
        title="Design Manager"
        subtitle="Manage page styles and data visualization layouts"
        icon="🎨"
        showSearch={false}
        badges={[
          { text: `${pageStyles.length} Styles`, variant: 'primary' },
          { text: `${dataBlocks.length} Data Blocks`, variant: 'secondary' }
        ]}
        backLink="/admin"
      />

      {/* Tab Navigation */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
          padding: '0'
        }}>
          <button
            onClick={() => setActiveTab('styles')}
            style={{
              flex: 1,
              padding: '1rem 2rem',
              border: 'none',
              background: activeTab === 'styles' ? '#6366f1' : 'transparent',
              color: activeTab === 'styles' ? 'white' : '#6b7280',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: activeTab === 'styles' ? '8px 8px 0 0' : '0'
            }}
          >
            🎨 Page Styles
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            style={{
              flex: 1,
              padding: '1rem 2rem',
              border: 'none',
              background: activeTab === 'blocks' ? '#6366f1' : 'transparent',
              color: activeTab === 'blocks' ? 'white' : '#6b7280',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: activeTab === 'blocks' ? '8px 8px 0 0' : '0'
            }}
          >
            📊 Data Blocks
          </button>
        </div>
      </div>

      {/* Page Styles Tab */}
      {activeTab === 'styles' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '2rem', color: '#1f2937' }}>Page Style Configuration</h2>
          
          {/* Create New Style Form */}
          <div style={{
            background: 'rgba(248, 250, 252, 0.8)',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#374151' }}>Create New Style</h3>
            
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Style Name
                </label>
                <input
                  type="text"
                  value={styleForm.name}
                  onChange={(e) => setStyleForm({ ...styleForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Page Background Gradient
                </label>
                <input
                  type="text"
                  value={styleForm.backgroundGradient}
                  onChange={(e) => setStyleForm({ ...styleForm, backgroundGradient: e.target.value })}
                  placeholder="0deg, #ffffffff 0%, #ffffffff 100%"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Header Background Gradient
                </label>
                <input
                  type="text"
                  value={styleForm.headerBackgroundGradient}
                  onChange={(e) => setStyleForm({ ...styleForm, headerBackgroundGradient: e.target.value })}
                  placeholder="0deg, #f8fafc 0%, #f1f5f9 100%"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Title Bubble Background
                  </label>
                  <input
                    type="color"
                    value={styleForm.titleBubble.backgroundColor}
                    onChange={(e) => setStyleForm({
                      ...styleForm,
                      titleBubble: { ...styleForm.titleBubble, backgroundColor: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      height: '3rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Title Text Color
                  </label>
                  <input
                    type="color"
                    value={styleForm.titleBubble.textColor}
                    onChange={(e) => setStyleForm({
                      ...styleForm,
                      titleBubble: { ...styleForm.titleBubble, textColor: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      height: '3rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleCreateStyle}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  justifySelf: 'start'
                }}
              >
                Create Style
              </button>
            </div>
          </div>

          {/* Existing Styles */}
          <div>
            <h3 style={{ marginBottom: '1.5rem', color: '#374151' }}>Existing Styles ({pageStyles.length})</h3>
            {pageStyles.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No styles created yet</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {pageStyles.map((style) => (
                  <div key={style._id} style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, color: '#1f2937' }}>{style.name}</h4>
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          width: '30px',
                          height: '30px',
                          background: style.titleBubble.backgroundColor,
                          borderRadius: '50%',
                          border: '2px solid #e5e7eb'
                        }}></div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Created {new Date(style.createdAt || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Blocks Tab */}
      {activeTab === 'blocks' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '2rem', color: '#1f2937' }}>Data Visualization Blocks</h2>
          
          {/* Responsive Grid Info */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📐 Responsive Grid System
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem', color: '#374151' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📱</span>
                <div>
                  <strong>Mobile:</strong><br />
                  2 units per row
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📱</span>
                <div>
                  <strong>Tablet:</strong><br />
                  3 units per row
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>💻</span>
                <div>
                  <strong>PC:</strong><br />
                  4 units per row
                </div>
              </div>
            </div>
            <p style={{ margin: '1rem 0 0 0', fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
              Charts automatically adjust their width based on screen size. A 4-unit chart becomes 3 units on tablet and 2 units on mobile.
            </p>
          </div>
          
          {/* Create New Block Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#374151' }}>Current Blocks ({dataBlocks.length})</h3>
            <button
              onClick={() => {
                setShowCreateBlock(true);
                resetBlockForm();
              }}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ➕ New Block
            </button>
          </div>
          
          {/* Create Block Form */}
          {showCreateBlock && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h4 style={{ marginBottom: '1.5rem', color: '#059669' }}>➕ Create New Data Block</h4>
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Block Name</label>
                    <input
                      type="text"
                      value={blockForm.name}
                      onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
                      placeholder="e.g., Main Dashboard, Performance Metrics"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Order</label>
                    <input
                      type="number"
                      value={blockForm.order}
                      onChange={(e) => setBlockForm({ ...blockForm, order: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleCreateBlock}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 2rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Create Block
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateBlock(false);
                      resetBlockForm();
                    }}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 2rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Existing Blocks with Full Management */}
          {dataBlocks.length === 0 ? (
            <div style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>📊 No Data Blocks Yet</h4>
              <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem' }}>
                Create your first data visualization block to organize and display your charts.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '2rem' }}>
              {dataBlocks.map((block) => (
                <div key={block._id} style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '2rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  {/* Block Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '1.25rem' }}>{block.name}</h4>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        <span><strong>Charts:</strong> {block.charts?.length || 0}</span>
                        <span><strong>Order:</strong> {block.order}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        background: block.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: block.isActive ? '#059669' : '#dc2626',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {block.isActive ? 'Active' : 'Inactive'}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setEditingBlock(block)}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBlock(block._id!)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Charts in this Block */}
                  <div>
                    <h5 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Charts in this Block:</h5>
                    
                    {!block.charts || block.charts.length === 0 ? (
                      <div style={{
                        background: 'rgba(249, 250, 251, 0.8)',
                        border: '1px dashed #d1d5db',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        textAlign: 'center',
                        color: '#6b7280'
                      }}>
                        <p style={{ margin: 0 }}>No charts assigned to this block yet</p>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Use &quot;Add Chart&quot; to assign charts from available options</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                        {block.charts.map((chart, index) => {
                          const chartConfig = availableCharts.find(c => c.chartId === chart.chartId);
                          return (
                            <div key={`${chart.chartId}-${index}`} style={{
                              background: 'rgba(248, 250, 252, 0.8)',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '1rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>{chartConfig?.emoji || '📊'}</span>
                                <div>
                                  <div style={{ fontWeight: '600', color: '#1f2937' }}>
                                    {chartConfig?.title || chart.chartId}
                                  </div>
                                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                    Width: {chart.width} unit{chart.width > 1 ? 's' : ''} • Order: {chart.order}
                                    <br />
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                      📱 Mobile: max 2 units • 📱 Tablet: max 3 units • 💻 PC: max 4 units
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <select
                                  value={chart.width}
                                  onChange={(e) => updateChartWidth(block, index, parseInt(e.target.value))}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    background: 'white'
                                  }}
                                >
                                  <option value={1}>1 unit (Portrait)</option>
                                  <option value={2}>2 units (Landscape)</option>
                                </select>
                                
                                <button
                                  onClick={() => removeChartFromBlock(block, index)}
                                  style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Add Chart to Block */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {availableCharts
                        .filter(chart => !block.charts.some(blockChart => blockChart.chartId === chart.chartId))
                        .map(chart => (
                          <button
                            key={chart.chartId}
                            onClick={() => addChartToBlock(block, chart.chartId)}
                            style={{
                              background: '#f3f4f6',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              color: '#374151'
                            }}
                          >
                            {chart.emoji || '📊'} {chart.title}
                          </button>
                        ))
                      }
                    </div>
                    
                    {availableCharts.filter(chart => !block.charts.some(blockChart => blockChart.chartId === chart.chartId)).length === 0 && (
                      <p style={{ margin: '1rem 0 0 0', fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                        All available charts have been assigned to this block.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
