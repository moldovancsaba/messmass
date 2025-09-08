'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageHero from '@/components/AdminPageHero';
import { DataVisualizationBlock, BlockChart } from '@/lib/pageStyleTypes';
import { DynamicChart, ChartContainer } from '@/components/DynamicChart';
import { ChartConfiguration, ChartCalculationResult } from '@/lib/chartConfigTypes';
import { calculateActiveCharts } from '@/lib/chartCalculator';

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
              <div key={block._id} className="block-item" onMouseEnter={() => calculatePreviewForBlock(block)}>
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
                      <p>Use &quot;Add Chart&quot; to assign charts from available options</p>
                    </div>
                  ) : (
                    <>
                      {/* Live Preview Grid - matches UnifiedDataVisualization */}
                      <div className={`charts-grid charts-grid-${block._id || 'preview'}`} style={{ display: 'grid', gap: '1.5rem', width: '100%' }}>
                        {block.charts
                          .sort((a, b) => a.order - b.order)
                          .map((chart) => {
                            const result = previewResults[chart.chartId];
                            if (!result) return null;
                            return (
                              <div key={`${block._id}-${chart.chartId}`} className={`chart-item chart-width-${chart.width}`} style={{ minHeight: '300px' }}>
                                <ChartContainer
                                  title={result.title}
                                  subtitle={result.subtitle}
                                  emoji={result.emoji}
                                  className="unified-chart-item"
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

                      {/* Inject the same responsive CSS rules as stats pages so preview alignment and widths are identical.
                          Strategic: We inject per-block CSS to honor each block's gridColumns, capping at 2 on tablet and up to 6 on desktop, exactly like UnifiedDataVisualization. */}
                      <style jsx>{`
                        /* Force left alignment and full-width fill within grid cells */
                        .charts-grid-${block._id || 'preview'} { grid-template-columns: 1fr; justify-items: stretch; align-items: start; grid-auto-flow: row; }
                        /* Ensure width=2 truly spans two columns */
                        .chart-width-1 { grid-column: span 1; }
                        .chart-width-2 { grid-column: span 2; }
                        /* Tablet columns cap at 2, desktop up to 6, honoring block.gridColumns */
                        @media (min-width: 768px) and (max-width: 1023px) {
.charts-grid-${block._id || 'preview'} { grid-template-columns: repeat(${Math.max(1, gridUnits.tablet)}, minmax(0, 1fr)) !important; }
                        }
                        @media (min-width: 1024px) {
.charts-grid-${block._id || 'preview'} { grid-template-columns: repeat(${Math.max(1, gridUnits.desktop)}, minmax(0, 1fr)) !important; }
                        }
                        .unified-chart-item { background: rgba(248, 250, 252, 0.8); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(226, 232, 240, 0.8); transition: all 0.2s ease; height: 100%; box-sizing: border-box; }
                        .unified-chart-item:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1); border-color: rgba(99, 102, 241, 0.3); }
                        /* Remove global 500px max-width constraint for preview items */
                        .chart-item { display: flex; flex-direction: column; width: 100%; max-width: none; height: 100%; min-height: 350px; justify-self: stretch; min-width: 0; }
                        .chart-item > * { width: 100%; height: 100%; flex: 1; }
                        /* Override global chart container min/max-width so units control size, not pixels */
                        .charts-grid-${block._id || 'preview'} :global(.chart-container) { min-width: 0 !important; max-width: none !important; width: 100% !important; }
                        /* Override global legend constraints so 1-unit items can wrap correctly */
                        .chart-legend { min-width: 0; width: 100%; max-width: 100%; overflow: hidden; }
                      `}</style>
                    </>
                  )}
                  
                  {/* Controls */}
                  <div className="content-grid" style={{ gap: '0.75rem', margin: '1rem 0' }}>
                    {block.charts.map((chart, index) => {
                      const chartConfig = availableCharts.find(c => c.chartId === chart.chartId);
                      return (
                        <div key={`${chart.chartId}-${index}`} className="chart-item" style={{ padding: '0.75rem', border: '1px dashed rgba(99,102,241,0.25)', borderRadius: '8px' }}>
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
                              className="btn-small-danger"
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
