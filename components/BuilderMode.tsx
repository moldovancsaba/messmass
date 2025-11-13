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
  chartId: string;
  width: number;
  order: number;
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
  blocks: DataBlock[];
}

export default function BuilderMode({ projectId, stats, onSave }: BuilderModeProps) {
  // WHAT: State for template and chart configurations
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WHAT: Fetch report template and chart configurations
  // WHY: Need to know which blocks to render and their chart definitions
  useEffect(() => {
    async function loadTemplateAndCharts() {
      try {
        setLoading(true);
        
        // Fetch report template for this project
        const templateRes = await fetch(`/api/report-config/${projectId}?type=project`);
        if (!templateRes.ok) throw new Error('Failed to load report template');
        const templateData = await templateRes.json();
        
        // Fetch chart configurations
        const chartsRes = await fetch('/api/chart-config/public');
        if (!chartsRes.ok) throw new Error('Failed to load chart configurations');
        const chartsData = await chartsRes.json();
        
        setTemplate(templateData);
        setCharts(chartsData);
        setError(null);
      } catch (err) {
        console.error('BuilderMode load error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load template');
      } finally {
        setLoading(false);
      }
    }
    
    loadTemplateAndCharts();
  }, [projectId]);

  // WHAT: Loading state
  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
        <p>🔄 Loading report template...</p>
      </div>
    );
  }

  // WHAT: Error state
  if (error) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
        <p>❌ {error}</p>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          Make sure a report template is assigned to this project in Visualization Manager.
        </p>
      </div>
    );
  }

  // WHAT: No template assigned
  if (!template || !template.blocks || template.blocks.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
        <p>📋 No report template assigned to this project</p>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          Go to <a href="/admin/visualization" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Visualization Manager</a> to assign a template.
        </p>
      </div>
    );
  }

  // WHAT: Render template with chart builders
  // WHY: Show the actual report layout with inline inputs
  const gridColumns = template.gridSettings.desktopUnits || 3;
  
  return (
    <div 
      className="builder-mode-grid" 
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
        gap: '1.5rem',
        padding: '1rem'
      }}
    >
      {template.blocks
        .sort((a, b) => a.order - b.order)
        .map((block) => {
          const chart = charts.find((c) => c.chartId === block.chartId);
          
          if (!chart) {
            return (
              <div 
                key={block._id} 
                style={{ 
                  gridColumn: `span ${block.width}`,
                  padding: '2rem',
                  backgroundColor: '#fee',
                  borderRadius: '0.5rem',
                  color: '#b91c1c'
                }}
              >
                ⚠️ Chart not found: {block.chartId}
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
                <div style={{ padding: '1.5rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fbbf24' }}>
                  <p style={{ color: '#92400e', fontSize: '0.875rem' }}>
                    ⚠️ VALUE charts are read-only in Builder mode (composite type)
                  </p>
                </div>
              );
              break;
            default:
              builderComponent = (
                <div style={{ padding: '1.5rem', backgroundColor: '#fee', borderRadius: '0.5rem', border: '1px solid #ef4444' }}>
                  <p style={{ color: '#b91c1c', fontSize: '0.875rem' }}>
                    ⚠️ Unknown chart type: {chart.type}
                  </p>
                </div>
              );
          }
          
          return (
            <div key={block._id} style={{ gridColumn: `span ${block.width}` }}>
              {builderComponent}
            </div>
          );
        })}
    </div>
  );
}
