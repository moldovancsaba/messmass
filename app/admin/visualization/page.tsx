'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataVisualizationBlock, BlockChart } from '@/lib/pageStyleTypes';
import { DynamicChart, ChartContainer } from '@/components/DynamicChart';
import { ChartConfiguration, ChartCalculationResult } from '@/lib/chartConfigTypes';
import { calculateActiveCharts } from '@/lib/chartCalculator';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
import vizStyles from './Visualization.module.css';

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

  // Live chart preview state (calculated using the same pipeline as stats pages)
  const [chartConfigs, setChartConfigs] = useState<ChartConfiguration[]>([]);
  const [previewResults, setPreviewResults] = useState<Record<string, ChartCalculationResult>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Grid settings for per-block preview alignment
  const [gridUnits, setGridUnits] = useState<{ desktop: number; tablet: number; mobile: number }>({ desktop: 4, tablet: 2, mobile: 1 });
  const [gridForm, setGridForm] = useState<{ desktop: number; tablet: number; mobile: number }>({ desktop: 4, tablet: 2, mobile: 1 });

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
    loadChartConfigs();
    loadGridSettings();
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

  // Load chart configurations used by stats pages (public subset)
  const loadChartConfigs = async () => {
    try {
      const response = await fetch('/api/chart-config/public');
      const data = await response.json();
      if (data.success) {
        setChartConfigs(data.configurations);
      }
    } catch (error) {
      console.error('Failed to load chart configurations:', error);
    }
  };

// Load grid settings for responsive previews
  const loadGridSettings = async () => {
    try {
      const response = await fetch('/api/grid-settings');
      const data = await response.json();
      if (data.success && data.settings) {
        const gs = data.settings;
        setGridUnits({ desktop: gs.desktopUnits, tablet: gs.tabletUnits, mobile: gs.mobileUnits });
        setGridForm({ desktop: gs.desktopUnits, tablet: gs.tabletUnits, mobile: gs.mobileUnits });
      }
    } catch (error) {
      console.error('Failed to load grid settings:', error);
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
  
  // Calculate preview results for a given block's charts using the same pipeline as stats pages
  const calculatePreviewForBlock = useCallback((block: DataVisualizationBlock) => {
    if (!chartConfigs || chartConfigs.length === 0) return;

    try {
      setIsCalculating(true);
      // Build a fake baseline stats object that covers all fields with non-zero values
      // Why: Admin preview must render charts even without a specific project loaded
      const baselineStats: any = {
        remoteImages: 120, hostessImages: 80, selfies: 40,
        indoor: 200, outdoor: 150, stadium: 50,
        female: 180, male: 220,
        genAlpha: 60, genYZ: 180, genX: 100, boomer: 60,
        merched: 90, jersey: 70, scarf: 40, flags: 30, baseballCap: 25, other: 15,
        approvedImages: 180, rejectedImages: 20,
        visitQrCode: 120, visitShortUrl: 40, visitWeb: 300, visitFacebook: 80, visitInstagram: 120,
        visitYoutube: 40, visitTiktok: 50, visitX: 35, visitTrustpilot: 10,
        eventAttendees: 12000, eventTicketPurchases: 9500,
        eventResultHome: 2, eventResultVisitor: 1,
        eventValuePropositionVisited: 600, eventValuePropositionPurchases: 75,
        jerseyPrice: 70, scarfPrice: 15, flagsPrice: 20, capPrice: 25, otherPrice: 10
      };

      // Calculate using the shared calculator
      const results = calculateActiveCharts(chartConfigs, baselineStats);
      // Normalize into a map for quick lookup by chartId
      const map: Record<string, ChartCalculationResult> = {};
      results.forEach(r => { map[r.chartId] = r; });
      setPreviewResults(prev => ({ ...prev, ...map }));
    } catch (err) {
      console.error('Failed to calculate preview charts:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [chartConfigs]);

  // Auto-calculate previews when both chart configurations and blocks are available
  // Why: The admin needs to see an immediate WYSIWYG preview without any interactions
  useEffect(() => {
    if (chartConfigs.length > 0 && dataBlocks.length > 0) {
      dataBlocks.forEach(b => calculatePreviewForBlock(b));
    }
  }, [chartConfigs, dataBlocks, calculatePreviewForBlock]);

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
    // Recalculate preview for this block so the new chart immediately appears
    calculatePreviewForBlock(updatedBlock);
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
    // No need to recalc data; width change affects only layout span, preview already computed
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
      <div className="page-container">
        <ColoredCard accentColor="#6366f1" hoverable={false} className="p-8 text-center">
          <div className="loading-spinner-viz"></div>
          <p>Loading data visualization blocks...</p>
        </ColoredCard>
      </div>
    );
  }

  return (
    <div className="page-container">
      <AdminHero
        title="📊 Data Visualization Manager"
        subtitle="Manage data visualization blocks and chart layouts"
        backLink="/admin"
        badges={[
          { text: `${dataBlocks.length} Data Blocks`, variant: 'primary' }
        ]}
      />
      {/* Grid Settings Editor */}
      <ColoredCard accentColor="#10b981" hoverable={false} className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 m-0">Grid Settings</h2>
        <p className="info-note mt-2">
          Configure the number of units per breakpoint used by stats/filter/hashtag pages.
        </p>
        <div className="flex gap-4 flex-wrap mt-3">
          <label className="grid-input-label">
            <span>Desktop Units</span>
            <input
              type="number"
              min={1}
              max={6}
              value={gridForm.desktop}
              onChange={(e) => setGridForm({ ...gridForm, desktop: Math.min(Math.max(parseInt(e.target.value) || 1, 1), 6) })}
              className="form-input grid-input-field"
            />
          </label>
          <label className="grid-input-label">
            <span>Tablet Units</span>
            <input
              type="number"
              min={1}
              max={4}
              value={gridForm.tablet}
              onChange={(e) => setGridForm({ ...gridForm, tablet: Math.min(Math.max(parseInt(e.target.value) || 1, 1), 4) })}
              className="form-input grid-input-field"
            />
          </label>
          <label className="grid-input-label">
            <span>Mobile Units</span>
            <input
              type="number"
              min={1}
              max={2}
              value={gridForm.mobile}
              onChange={(e) => setGridForm({ ...gridForm, mobile: Math.min(Math.max(parseInt(e.target.value) || 1, 1), 2) })}
              className="form-input grid-input-field"
            />
          </label>
          <div className="flex items-end">
            <button
              className="btn-create"
              onClick={async () => {
                try {
                  const res = await fetch('/api/grid-settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      desktopUnits: gridForm.desktop,
                      tabletUnits: gridForm.tablet,
                      mobileUnits: gridForm.mobile,
                    })
                  });
                  const data = await res.json();
                  if (data.success) {
                    const gs = data.settings;
                    setGridUnits({ desktop: gs.desktopUnits, tablet: gs.tabletUnits, mobile: gs.mobileUnits });
                    alert('Grid settings saved.');
                  } else {
                    alert('Failed to save grid settings');
                  }
                } catch (e) {
                  alert('Failed to save grid settings');
                }
              }}
            >
              💾 Save
            </button>
          </div>
        </div>
      </ColoredCard>

      {/* WHAT: Last major card section on page (blocks within this may exist but this is the last main section)
          WHY: No mb-8 on last section */}
      <ColoredCard accentColor="#6366f1" hoverable={false}>
        <h2 className="section-title mb-6">Data Visualization Blocks</h2>
        
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
                <strong>Desktop (Stats Page):</strong><br />
                Up to 6 units per row (block-configurable)
              </div>
            </div>
          </div>
          <p className="info-note">
            Preview below uses the same responsive grid as stats pages. A width=2 chart spans two columns within the block; columns per block are capped at 2 on tablet and up to 6 on desktop.
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
            className="btn btn-small btn-primary"
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
                  className="btn btn-small btn-primary"
                >
                  Create Block
                </button>
                <button
                  onClick={() => {
                    setShowCreateBlock(false);
                    resetBlockForm();
                  }}
                  className="btn btn-small btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Existing Blocks with Full Management (Drag-and-Drop Reordering) */}
        {dataBlocks.length === 0 ? (
          <div className="empty-state">
            <h4 className="empty-state-title">📊 No Data Blocks Yet</h4>
            <p className="empty-state-text">
              Create your first data visualization block to organize and display your charts.
            </p>
          </div>
        ) : (
          <div className="content-grid"
            onDragOver={(e) => e.preventDefault()}
          >
            {dataBlocks
              .sort((a, b) => a.order - b.order)
              .map((block, idx) => (
              <div 
                key={block._id}
                className="block-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(idx));
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  const fromIdx = parseInt(e.dataTransfer.getData('text/plain') || '-1', 10);
                  if (isNaN(fromIdx) || fromIdx === idx) return;
                  const ordered = [...dataBlocks].sort((a,b)=>a.order-b.order);
                  const [moved] = ordered.splice(fromIdx, 1);
                  ordered.splice(idx, 0, moved);
                  // Reassign sequential order
                  const reindexed = ordered.map((b, i) => ({ ...b, order: i }));
                  setDataBlocks(reindexed);
                  // Persist sequentially
                  for (const b of reindexed) {
                    await handleUpdateBlock(b);
                  }
                }}
                onMouseEnter={() => calculatePreviewForBlock(block)}
              >
                {/* Block Header */}
                <div className="block-header">
                  <div>
                    <h4 className="block-title">{block.name}</h4>
                    <div className="block-meta">
                      <span><strong>Charts:</strong> {block.charts?.length || 0}</span>
                      <span><strong>Order:</strong> {block.order}</span>
                      <span><strong>Columns:</strong> {block.gridColumns}</span>
                    </div>
                  </div>
                  
                  {/* WHAT: Action buttons stacked vertically on right
                   * WHY: Consistent with hashtags, categories, variables, design pages */}
                  <div className="block-actions">
                    <div className={`status-badge ${block.isActive ? 'status-badge-active' : 'status-badge-inactive'}`}>
                      {block.isActive ? 'Active' : 'Inactive'}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mm-space-2)', alignItems: 'flex-end' }}>
                      <button
                        onClick={() => setEditingBlock(block)}
                        className="btn btn-small btn-primary"
                        style={{ minWidth: '80px' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block._id!)}
                        className="btn btn-small btn-danger"
                        style={{ minWidth: '80px' }}
                      >
                        🗑️ Delete
                      </button>
                      <span className="drag-handle" title="Drag to reorder" style={{ cursor: 'grab', fontSize: '1.2rem' }}>⇕️</span>
                    </div>
                  </div>
                </div>
                
                {/* Charts in this Block */}
                <div>
                  <h5 className="section-subtitle">Charts in this Block:</h5>
                  
                  {!block.charts || block.charts.length === 0 ? (
                    <div className="empty-charts">
                      <p>No charts assigned to this block yet</p>
                      <p>Use &quot;Add Chart&quot; to assign charts from available options</p>
                    </div>
                  ) : (
                    <>
                      {/* Live Preview Grid - matches UnifiedDataVisualization */}
                      {/* WHAT: Apply CSS module base classes + dynamic grid ID for per-block responsive styling
                           WHY: Static styles use CSS modules; dynamic responsive grid uses inline <style> with block ID */}
                      <div className={`charts-grid charts-grid-${block._id || 'preview'} viz-preview-grid ${vizStyles.chartsGridBase}`}>
                        {block.charts
                          .sort((a, b) => a.order - b.order)
                          .map((chart) => {
                            const result = previewResults[chart.chartId];
                            if (!result) return null;
                            return (
                              <div key={`${block._id}-${chart.chartId}`} className={`${vizStyles.chartItem} chart-width-${chart.width} chart-min-height`}>
                                <ChartContainer
                                  title={result.title}
                                  subtitle={result.subtitle}
                                  emoji={result.emoji}
                                  className={vizStyles.unifiedChartItem}
                                  chartWidth={chart.width}
                                >
                                  <DynamicChart result={result} chartWidth={chart.width} />
                                </ChartContainer>
                              </div>
                            );
                          })
                          .filter(Boolean)
                        }
                      </div>

                      {/* WHAT: Dynamic responsive grid styling per block ID
                           WHY: CSS modules can't handle dynamic class names with runtime IDs,
                                so we keep minimal <style jsx> for dynamic grid column rules only.
                                All static styles moved to Visualization.module.css */}
                      <style jsx>{`
                        .chart-width-1 { grid-column: span 1; }
                        .chart-width-2 { grid-column: span 2; }
                        @media (min-width: 768px) and (max-width: 1023px) {
                          .charts-grid-${block._id || 'preview'} { grid-template-columns: repeat(${Math.max(1, gridUnits.tablet)}, minmax(0, 1fr)) !important; }
                        }
                        @media (min-width: 1024px) {
                          .charts-grid-${block._id || 'preview'} { grid-template-columns: repeat(${Math.max(1, gridUnits.desktop)}, minmax(0, 1fr)) !important; }
                        }
                        .charts-grid-${block._id || 'preview'} :global(.chart-container) { min-width: 0 !important; max-width: none !important; width: 100% !important; }
                      `}</style>
                    </>
                  )}
                  
                  {/* Controls */}
                  <div className="chart-controls-grid">
                    {block.charts.map((chart, index) => {
                      const chartConfig = availableCharts.find(c => c.chartId === chart.chartId);
                      return (
                        <div key={`${chart.chartId}-${index}`} className="chart-control-item">
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
                                  Preview updates instantly to reflect unit width and block columns
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
                              className="btn btn-small btn-danger"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Chart to Block */}
                  <div className="flex-row flex-wrap">
                    {availableCharts
                      .filter(chart => !block.charts.some(blockChart => blockChart.chartId === chart.chartId))
                      .map(chart => (
                        <button
                          key={chart.chartId}
                          onClick={() => addChartToBlock(block, chart.chartId)}
                          className="btn btn-small btn-secondary"
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
      </ColoredCard>

      {/* Edit Block Modal */}
      {editingBlock && (
        <div className="modal-overlay">
          <ColoredCard accentColor="#6366f1" hoverable={false} className="modal-content">
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
                
                <div>
                  <label className="form-label">Grid Columns (Desktop)</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={Math.min(Math.max(editingBlock.gridColumns || 3, 1), 6)}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 1;
                      setEditingBlock({ ...editingBlock, gridColumns: Math.min(Math.max(v, 1), 6) });
                    }}
                    className="form-input"
                  />
                </div>
              </div>
              <p className="info-note">Desktop will render {editingBlock.gridColumns} unit{(editingBlock.gridColumns||0) !== 1 ? 's' : ''} per row for this block. Tablet caps at 2; Mobile uses 1.</p>
              
              <div>
                <label className="flex-row checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingBlock.isActive}
                    onChange={(e) => setEditingBlock({ ...editingBlock, isActive: e.target.checked })}
                    className="checkbox-input"
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
                className="btn btn-small btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateBlock(editingBlock)}
                className="btn btn-small btn-primary"
              >
                Update Block
              </button>
            </div>
          </ColoredCard>
        </div>
      )}
    </div>
  );
}
