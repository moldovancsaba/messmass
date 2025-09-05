'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageHero from '@/components/AdminPageHero';
import { DataVisualizationBlock, BlockChart } from '@/lib/pageStyleTypes';

// Available chart type for chart assignment
interface AvailableChart {
  chartId: string;
  title: string;
  type: string;
  order: number;
  isActive: boolean;
  emoji?: string;
}

export default function VisualizationPage() {
  const router = useRouter();
  const [dataBlocks, setDataBlocks] = useState<DataVisualizationBlock[]>([]);
  const [availableCharts, setAvailableCharts] = useState<AvailableChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBlock, setEditingBlock] = useState<DataVisualizationBlock | null>(null);
  const [showCreateBlock, setShowCreateBlock] = useState(false);
  
  // Form states for new data block
  const [blockForm, setBlockForm] = useState({
    name: '',
    charts: [] as BlockChart[],
    order: 0,
    isActive: true
  });

  useEffect(() => {
    loadDataBlocks();
    loadAvailableCharts();
  }, []);

  const loadDataBlocks = async () => {
    try {
      const response = await fetch('/api/data-blocks');
      const data = await response.json();
      if (data.success) {
        setDataBlocks(data.blocks);
      }
    } catch (error) {
      console.error('Failed to load data blocks:', error);
    } finally {
      setLoading(false);
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
          <p>Loading data visualization blocks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminPageHero 
        title="Data Visualization Manager"
        subtitle="Manage data visualization blocks and chart layouts"
        icon="📊"
        showSearch={false}
        badges={[
          { text: `${dataBlocks.length} Data Blocks`, variant: 'primary' }
        ]}
        backLink="/admin"
      />

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 className="section-title">Data Visualization Blocks</h2>
        
        {/* Responsive Grid Info */}
        <div className="info-box">
          <h4 className="info-box-title">
            📐 Responsive Grid System
          </h4>
          <div className="info-grid">
            <div className="info-grid-item">
              <span className="info-grid-emoji">📱</span>
              <div>
                <strong>Mobile:</strong><br />
                2 units per row
              </div>
            </div>
            <div className="info-grid-item">
              <span className="info-grid-emoji">📱</span>
              <div>
                <strong>Tablet:</strong><br />
                3 units per row
              </div>
            </div>
            <div className="info-grid-item">
              <span className="info-grid-emoji">💻</span>
              <div>
                <strong>PC:</strong><br />
                4 units per row
              </div>
            </div>
          </div>
          <p className="info-note">
            Charts automatically adjust their width based on screen size. A 4-unit chart becomes 3 units on tablet and 2 units on mobile.
          </p>
        </div>
        
        {/* Create New Block Button */}
        <div className="section-header">
          <h3 className="section-header-title">Current Blocks ({dataBlocks.length})</h3>
          <button
            onClick={() => {
              setShowCreateBlock(true);
              resetBlockForm();
            }}
            className="btn-create"
          >
            ➕ New Block
          </button>
        </div>
        
        {/* Create Block Form */}
        {showCreateBlock && (
          <div className="success-box">
            <h4 className="success-box-title">➕ Create New Data Block</h4>
            
            <div className="form-section">
              <div className="form-row">
                <div>
                  <label className="form-label">Block Name</label>
                  <input
                    type="text"
                    value={blockForm.name}
                    onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
                    placeholder="e.g., Main Dashboard, Performance Metrics"
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label className="form-label">Order</label>
                  <input
                    type="number"
                    value={blockForm.order}
                    onChange={(e) => setBlockForm({ ...blockForm, order: parseInt(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="flex-row">
                <button
                  onClick={handleCreateBlock}
                  className="btn-form-primary"
                >
                  Create Block
                </button>
                <button
                  onClick={() => {
                    setShowCreateBlock(false);
                    resetBlockForm();
                  }}
                  className="btn-form-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Existing Blocks with Full Management */}
        {dataBlocks.length === 0 ? (
          <div className="empty-state">
            <h4 className="empty-state-title">📊 No Data Blocks Yet</h4>
            <p className="empty-state-text">
              Create your first data visualization block to organize and display your charts.
            </p>
          </div>
        ) : (
          <div className="content-grid">
            {dataBlocks.map((block) => (
              <div key={block._id} className="block-item">
                {/* Block Header */}
                <div className="block-header">
                  <div>
                    <h4 className="block-title">{block.name}</h4>
                    <div className="block-meta">
                      <span><strong>Charts:</strong> {block.charts?.length || 0}</span>
                      <span><strong>Order:</strong> {block.order}</span>
                    </div>
                  </div>
                  
                  <div className="block-actions">
                    <div className={`status-badge ${block.isActive ? 'status-badge-active' : 'status-badge-inactive'}`}>
                      {block.isActive ? 'Active' : 'Inactive'}
                    </div>
                    
                    <div className="flex-row">
                      <button
                        onClick={() => setEditingBlock(block)}
                        className="btn-edit"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block._id!)}
                        className="btn-delete"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Charts in this Block */}
                <div>
                  <h5 className="section-subtitle">Charts in this Block:</h5>
                  
                  {!block.charts || block.charts.length === 0 ? (
                    <div className="empty-charts">
                      <p>No charts assigned to this block yet</p>
                      <p>Use "Add Chart" to assign charts from available options</p>
                    </div>
                  ) : (
                    <div className="content-grid" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                      {block.charts.map((chart, index) => {
                        const chartConfig = availableCharts.find(c => c.chartId === chart.chartId);
                        return (
                          <div key={`${chart.chartId}-${index}`} className="chart-item">
                            <div className="chart-info">
                              <span className="chart-emoji">{chartConfig?.emoji || '📊'}</span>
                              <div>
                                <div className="chart-details">
                                  {chartConfig?.title || chart.chartId}
                                </div>
                                <div className="chart-meta">
                                  Width: {chart.width} unit{chart.width > 1 ? 's' : ''} • Order: {chart.order}
                                  <br />
                                  <span className="chart-sub-meta">
                                    📱 Mobile: max 2 units • 📱 Tablet: max 3 units • 💻 PC: max 4 units
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="chart-controls">
                              <select
                                value={chart.width}
                                onChange={(e) => updateChartWidth(block, index, parseInt(e.target.value))}
                                className="chart-select"
                              >
                                <option value={1}>1 unit (Portrait)</option>
                                <option value={2}>2 units (Landscape)</option>
                              </select>
                              
                              <button
                                onClick={() => removeChartFromBlock(block, index)}
                                className="btn-small-danger"
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
                  <div className="flex-row flex-wrap">
                    {availableCharts
                      .filter(chart => !block.charts.some(blockChart => blockChart.chartId === chart.chartId))
                      .map(chart => (
                        <button
                          key={chart.chartId}
                          onClick={() => addChartToBlock(block, chart.chartId)}
                          className="btn-add-chart"
                        >
                          {chart.emoji || '📊'} {chart.title}
                        </button>
                      ))
                    }
                  </div>
                  
                  {availableCharts.filter(chart => !block.charts.some(blockChart => blockChart.chartId === chart.chartId)).length === 0 && (
                    <p className="info-note">
                      All available charts have been assigned to this block.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Block Modal */}
      {editingBlock && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <h2 className="modal-title">
              Edit Data Block: {editingBlock.name}
            </h2>
            
            <div className="form-section">
              <div className="form-row">
                <div>
                  <label className="form-label">Block Name</label>
                  <input
                    type="text"
                    value={editingBlock.name}
                    onChange={(e) => setEditingBlock({ ...editingBlock, name: e.target.value })}
                    placeholder="e.g., Main Dashboard, Performance Metrics"
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label className="form-label">Order</label>
                  <input
                    type="number"
                    value={editingBlock.order}
                    onChange={(e) => setEditingBlock({ ...editingBlock, order: parseInt(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex-row" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingBlock.isActive}
                    onChange={(e) => setEditingBlock({ ...editingBlock, isActive: e.target.checked })}
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      cursor: 'pointer'
                    }}
                  />
                  <span className="form-label">Active</span>
                </label>
                <p className="info-note">
                  Inactive blocks will not be displayed on the frontend
                </p>
              </div>
            </div>
            
            <div className="form-actions">
              <button
                onClick={() => setEditingBlock(null)}
                className="btn-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateBlock(editingBlock)}
                className="btn-modal-primary"
              >
                Update Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
