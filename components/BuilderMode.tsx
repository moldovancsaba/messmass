// WHAT: Builder Mode - Visual report template editor with inline inputs
// WHY: Allow users to edit reports in the same layout as the final output
// HOW: Fetch report template for project, render charts with inline input fields

'use client';

import { useState, useEffect } from 'react';
import ChartBuilderKPI from './ChartBuilderKPI';
import ChartBuilderBar from './ChartBuilderBar';
import ChartBuilderPie from './ChartBuilderPie';
import ChartBuilderImage from './ChartBuilderImage';
import ChartBuilderText from './ChartBuilderText';

interface BuilderModeProps {
  projectId: string;
  stats: Record<string, any>;
  onSave: (newStats: Record<string, any>) => void;
}

interface DataBlock {
  _id: string;
  name: string;
  showTitle?: boolean;
  order: number;
  isActive: boolean;
  charts: Array<{
    chartId: string;
    width?: number;
    order: number;
  }>;
}

interface ChartConfig {
  chartId: string;
  title: string;
  type: 'kpi' | 'bar' | 'pie' | 'image' | 'text' | 'value';
  icon: string;
  elements: Array<{
    formula: string;
    label?: string;
    color?: string;
    imageUrl?: string;
  }>;
}

interface ReportTemplate {
  _id: string;
  name: string;
  gridSettings: {
    desktopUnits: number;
    tabletUnits: number;
    mobileUnits: number;
  };
  dataBlocks: DataBlock[];
}

export default function BuilderMode({ projectId, stats, onSave }: BuilderModeProps) {
  // WHAT: State for template and chart configurations
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // WHAT: Track where the template was resolved from (project/partner/default)
  // WHY: Show clear fallback info to users when event-level template is missing
  const [resolvedFrom, setResolvedFrom] = useState<string | null>(null);
  const [resolvedSource, setResolvedSource] = useState<string | null>(null);

  // WHAT: Fetch report template and chart configurations
  // WHY: Need to know which blocks to render and their chart definitions
  useEffect(() => {
    async function loadTemplateAndCharts() {
      try {
        setLoading(true);
        console.log('🏗️ [BuilderMode] Starting load for projectId:', projectId);
        
        // Fetch report template for this project
        console.log('🏗️ [BuilderMode] Fetching template from:', `/api/report-config/${projectId}?type=project`);
        const templateRes = await fetch(`/api/report-config/${projectId}?type=project`);
        console.log('🏗️ [BuilderMode] Template response status:', templateRes.status);
        
        if (!templateRes.ok) throw new Error('Failed to load report template');
        const templateResponse = await templateRes.json();
        console.log('🏗️ [BuilderMode] Template response:', JSON.stringify(templateResponse, null, 2));
        
        // WHAT: API returns { success, template, resolvedFrom, source }
        // WHY: Template resolution has hierarchy (project → partner → default → hardcoded)
        if (!templateResponse.success || !templateResponse.template) {
          console.error('🏗️ [BuilderMode] Template validation failed:', { success: templateResponse.success, hasTemplate: !!templateResponse.template });
          throw new Error('No template found in API response');
        }
        
        console.log(`🏗️ [BuilderMode] ✅ Using template from ${templateResponse.resolvedFrom} (${templateResponse.source})`);
        console.log('🏗️ [BuilderMode] Template has', templateResponse.template.dataBlocks?.length || 0, 'blocks');
        // Save resolution meta for UI banner
        setResolvedFrom(templateResponse.resolvedFrom || null);
        setResolvedSource(templateResponse.source || null);
        
        // Fetch chart configurations
        console.log('🏗️ [BuilderMode] Fetching charts from: /api/chart-config/public');
        const chartsRes = await fetch('/api/chart-config/public');
        console.log('🏗️ [BuilderMode] Charts response status:', chartsRes.status);
        
        if (!chartsRes.ok) throw new Error('Failed to load chart configurations');
        const chartsResponse = await chartsRes.json();
        console.log('🏗️ [BuilderMode] Charts response keys:', Object.keys(chartsResponse));
        console.log('🏗️ [BuilderMode] Charts response:', JSON.stringify(chartsResponse, null, 2));
        
        // WHAT: API returns { success, configurations, meta }
        // WHY: Public chart config endpoint returns structured response
        if (!chartsResponse.success || !chartsResponse.configurations) {
          console.error('🏗️ [BuilderMode] Charts validation failed:', { success: chartsResponse.success, hasConfigurations: !!chartsResponse.configurations });
          throw new Error('No chart configurations found in API response');
        }
        
        console.log(`🏗️ [BuilderMode] ✅ Loaded ${chartsResponse.configurations.length} chart configurations`);
        
        setTemplate(templateResponse.template);
        setCharts(chartsResponse.configurations);
        setError(null);
        console.log('🏗️ [BuilderMode] ✅ State updated successfully');
      } catch (err) {
        console.error('🏗️ [BuilderMode] ❌ Load error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load template');
      } finally {
        setLoading(false);
        console.log('🏗️ [BuilderMode] Load complete');
      }
    }
    
    loadTemplateAndCharts();
  }, [projectId]);

  // WHAT: Loading state
  if (loading) {
    console.log('🏗️ [BuilderMode] Rendering: LOADING');
    return (
      <div className="builder-loading">
        <p>🔄 Loading report template...</p>
      </div>
    );
  }

  // WHAT: Error state
  if (error) {
    console.log('🏗️ [BuilderMode] Rendering: ERROR -', error);
    return (
      <div className="builder-error">
        <p>❌ {error}</p>
        <p className="builder-error-message">
          Make sure a report template is assigned to this project in Visualization Manager.
        </p>
      </div>
    );
  }

  // WHAT: No template assigned
  console.log('🏗️ [BuilderMode] Checking template state:', { 
    hasTemplate: !!template, 
    hasDataBlocks: !!template?.dataBlocks,
    dataBlocksLength: template?.dataBlocks?.length || 0,
    chartsLength: charts.length
  });
  
  if (!template || !template.dataBlocks || template.dataBlocks.length === 0) {
    console.log('🏗️ [BuilderMode] Rendering: NO TEMPLATE');
    return (
      <div className="builder-empty-state">
        <p>📋 No report template assigned to this project</p>
        <p className="builder-empty-message">
          Go to <a href="/admin/visualization" className="builder-empty-link">Visualization Manager</a> to assign a template.
        </p>
      </div>
    );
  }
  
  console.log('🏗️ [BuilderMode] Rendering: BUILDER GRID with', template.dataBlocks.length, 'blocks');

  // WHAT: Compute fallback width for a chart using chart info
  // WHY: Blocks now have charts array; each chart has optional width
  const getChartWidth = (chartItem: { width?: number }, chart?: ChartConfig): number => {
    if (chartItem.width && chartItem.width > 0) return chartItem.width;
    if (!chart) return 3; // safe default
    switch (chart.type) {
      case 'kpi':
        return 1;
      case 'text':
        return 2;
      case 'pie':
        return 2;
      case 'bar':
        return 3;
      case 'image':
        // infer from aspect ratio embedded in elements (Image charts have 1 element)
        // Note: chart.elements[0].label/color may not include aspectRatio; default to 3
        return 3;
      default:
        return 3;
    }
  };

  // WHAT: Render template with chart builders
  // WHY: Show the actual report layout with inline inputs
  
  return (
    <div>
      {/* Info banner when using fallback template from partner/default */}
      {resolvedFrom && resolvedFrom !== 'project' && (
        <div className="builder-info-banner">
          Using fallback template from <strong>{resolvedFrom}</strong>
          {resolvedSource ? `: ${resolvedSource}` : ''}
        </div>
      )}

      {/* WHAT: Render blocks as separate containers with titles */}
      {/* WHY: Show proper block structure like the final report */}
      <div className="builder-container">
      {template.dataBlocks
        .sort((a, b) => a.order - b.order)
        .filter(block => block.charts && block.charts.length > 0) // Skip empty blocks
        .map((block) => {
          // WHAT: Block columns = number of charts (each chart gets equal width)
          // WHY: 1 chart = full width, 2 charts = 50% each, 3 charts = 33% each
          const blockGridColumns = block.charts.length;
          
          // WHAT: Render block container with title and grid of charts
          // WHY: Visual grouping matches report structure
          return (
            <div 
              key={block._id}
              className="builder-block-container"
            >
              {/* Block Title */}
              {block.showTitle !== false && (
                <div className="builder-block-title">
                  {block.name}
                </div>
              )}
              
              {/* Charts Grid - Adapts to chart widths */}
              <div 
                // WHAT: Dynamic grid layout based on chart count in block
                // WHY: Equal-width columns (1 chart=full, 2 charts=50% each, etc.)
                // eslint-disable-next-line react/forbid-dom-props
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${blockGridColumns}, 1fr)`,
                  gap: 'var(--mm-space-6)',
                  padding: 'var(--mm-space-6)'
                }}
              >
                {block.charts
                  .sort((a, b) => a.order - b.order)
                  .map((chartItem) => {
          
                    const chart = charts.find((c) => c.chartId === chartItem.chartId);
                    
                    if (!chart) {
                      return (
                        <div 
                          key={chartItem.chartId} 
                          className="builder-chart-not-found"
                        >
                          ⚠️ Chart not found: {chartItem.chartId}
                        </div>
                      );
                    }
                    
                    // WHAT: Render appropriate chart builder based on chart type
                    // WHY: Each chart type has different input requirements
                    const handleSave = (key: string, value: number | string) => {
                      const newStats = { ...stats, [key]: value };
                      onSave(newStats);
                    };
                    
                    let builderComponent;
                    
                    switch (chart.type) {
                      case 'kpi':
                        builderComponent = (
                          <ChartBuilderKPI chart={chart} stats={stats} onSave={handleSave} />
                        );
                        break;
                      case 'bar':
                        builderComponent = (
                          <ChartBuilderBar chart={chart} stats={stats} onSave={handleSave} />
                        );
                        break;
                      case 'pie':
                        builderComponent = (
                          <ChartBuilderPie chart={chart} stats={stats} onSave={handleSave} />
                        );
                        break;
                      case 'image':
                        builderComponent = (
                          <ChartBuilderImage chart={chart} stats={stats} onSave={handleSave} />
                        );
                        break;
                      case 'text':
                        builderComponent = (
                          <ChartBuilderText chart={chart} stats={stats} onSave={handleSave} />
                        );
                        break;
                      case 'value':
                        // WHAT: VALUE type renders both KPI and BAR (2 separate grid items)
                        // WHY: Skip in Builder mode to avoid duplication
                        builderComponent = (
                          <div className="builder-chart-warning">
                            <p>
                              ⚠️ VALUE charts are read-only in Builder mode (composite type)
                            </p>
                          </div>
                        );
                        break;
                      default:
                        builderComponent = (
                          <div className="builder-chart-error">
                            <p>
                              ⚠️ Unknown chart type: {chart.type}
                            </p>
                          </div>
                        );
                    }
                    
                    // WHAT: All charts span 1 column for equal widths
                    // WHY: Block grid has columns = chart count
                    const width = 1;
                    return (
                      <div 
                        key={chartItem.chartId} 
                        className="builder-chart-wrapper" 
                        // WHAT: Dynamic gridColumn span (currently always 1)
                        // WHY: Future-proof for variable-width charts in Builder mode
                        // eslint-disable-next-line react/forbid-dom-props
                        style={{ gridColumn: `span ${width}` }}
                      >
                        {builderComponent}
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
