// WHAT: Single Chart Renderer (v12.0.0)
// WHY: Atomic component for rendering individual chart types in reports
// HOW: Receives ChartResult from ReportCalculator and renders based on type

'use client';

import React, { useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import * as LucideIcons from 'lucide-react';
import type { ChartResult } from '@/lib/report-calculator';
import styles from './ReportChart.module.css';

// Register Chart.js components for pie charts
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Helper function to format values with prefix/suffix and decimals
 */
function formatValue(
  value: number | string | undefined, 
  formatting?: { prefix?: string; suffix?: string; decimals?: number }
): string {
  if (value === undefined || value === 'NA') return 'NA';
  if (typeof value === 'string') return value;
  
  const { prefix = '', suffix = '', decimals = 0 } = formatting || {};
  const formattedNumber = value.toFixed(decimals);
  return `${prefix}${formattedNumber}${suffix}`;
}

/**
 * WHAT: Calculate aspect ratio from chart width (grid units)
 * WHY: Maintain consistent aspect ratios based on chart width
 * HOW: Follow chart height calculation rules
 */
function getKPIAspectRatio(width: number = 1): string {
  if (width === 1) {
    return '2 / 1'; // 1 unit → 2:1 aspect ratio (more portrait)
  }
  if (width === 2 || width === 3) {
    return `${width} / 1`; // 2 units → 2:1, 3 units → 3:1
  }
  // 4+ units → use 3:1 as maximum
  return '3 / 1';
}

/**
 * Props for ReportChart component
 */
interface ReportChartProps {
  /** Chart result from ReportCalculator */
  result: ChartResult;
  
  /** Optional width override (grid units) */
  width?: number;
  
  /** Optional CSS class for container */
  className?: string;
}

/**
 * ReportChart
 * 
 * WHAT: Renders a single chart based on its type and result data
 * WHY: Single atomic component for all chart types - clean and maintainable
 * 
 * Supported Chart Types:
 * - KPI: Large metric display with icon
 * - PIE: Two-element circular chart with percentages
 * - BAR: Five-element horizontal bar chart
 * - TEXT: Formatted text display
 * - IMAGE: Aspect ratio-aware image display
 * - VALUE: Composite (KPI + BAR) - renders both components
 */
export default function ReportChart({ result, width, className }: ReportChartProps) {
  // WHAT: Check if chart has valid displayable data
  // WHY: Don't render placeholders for empty/NA values
  // HOW: Type-specific validation matching ReportCalculator.hasValidData()
  const hasData = !result.error && (() => {
    switch (result.type) {
      case 'text':
        return typeof result.kpiValue === 'string' && result.kpiValue.length > 0 && result.kpiValue !== 'NA';
      
      case 'image':
        return typeof result.kpiValue === 'string' && result.kpiValue.length > 0 && result.kpiValue !== 'NA';
      
      case 'kpi':
        return result.kpiValue !== undefined && result.kpiValue !== 'NA';
      
      case 'pie':
      case 'bar':
      case 'value':
        if (!result.elements || result.elements.length === 0) return false;
        const total = result.elements.reduce((sum, el) => 
          sum + (typeof el.value === 'number' ? el.value : 0), 0
        );
        return total > 0;
      
      default:
        return false;
    }
  })();

  // No data available - show placeholder
  if (!hasData) {
    return (
      <div className={`${styles.chart} ${styles.noData} report-chart ${className || ''}`} data-report-section="content">
        <div className={styles.noDataContent}>
          <span className={styles.noDataIcon}>📊</span>
          <span className={styles.noDataText}>{result.title}</span>
          <span className={styles.noDataLabel}>No Data</span>
        </div>
      </div>
    );
  }

  // Render based on chart type
  switch (result.type) {
    case 'kpi':
      return <KPIChart result={result} className={className} width={width} />;
    
    case 'pie':
      return <PieChart result={result} className={className} />;
    
    case 'bar':
      return <BarChart result={result} className={className} />;
    
    case 'text':
      return <TextChart result={result} className={className} />;
    
    case 'image':
      return <ImageChart result={result} className={className} />;
    
    case 'value':
      // VALUE charts render KPI + BAR together
      return (
        <div className={`${styles.valueComposite} ${className || ''}`}>
          <KPIChart result={result} width={width} />
          <BarChart result={result} />
        </div>
      );
    
    default:
      return (
        <div className={`${styles.chart} ${styles.unknown} ${className || ''}`}>
          <span>Unknown chart type: {result.type}</span>
        </div>
      );
  }
}

/**
 * WHAT: Map common icon names to Lucide SVG icons
 * WHY: Allow chart configs to use simple names that map to Lucide components
 * HOW: Maps Material Icon names and common names to Lucide equivalents
 */
function getLucideIcon(iconName: string | undefined): React.ComponentType<any> {
  const iconMap: Record<string, React.ComponentType<any>> = {
    // Analytics & Stats
    'analytics': LucideIcons.BarChart3,
    'trending_up': LucideIcons.TrendingUp,
    'trending_down': LucideIcons.TrendingDown,
    'bar_chart': LucideIcons.BarChart,
    'pie_chart': LucideIcons.PieChart,
    'show_chart': LucideIcons.TrendingUp,
    
    // People & Users
    'people': LucideIcons.Users,
    'person': LucideIcons.User,
    'groups': LucideIcons.Users,
    'group': LucideIcons.Users,
    'account_circle': LucideIcons.UserCircle,
    
    // Images & Media
    'image': LucideIcons.Image,
    'photo_camera': LucideIcons.Camera,
    'camera': LucideIcons.Camera,
    'collections': LucideIcons.Images,
    'photo': LucideIcons.Image,
    
    // Location & Places
    'location_on': LucideIcons.MapPin,
    'place': LucideIcons.MapPin,
    'stadium': LucideIcons.Building2,
    
    // Commerce & Shopping
    'shopping_cart': LucideIcons.ShoppingCart,
    'store': LucideIcons.Store,
    'attach_money': LucideIcons.DollarSign,
    'euro': LucideIcons.Euro,
    
    // Communication
    'email': LucideIcons.Mail,
    'phone': LucideIcons.Phone,
    'chat': LucideIcons.MessageCircle,
    
    // Actions
    'visibility': LucideIcons.Eye,
    'download': LucideIcons.Download,
    'share': LucideIcons.Share2,
    'favorite': LucideIcons.Heart,
    'star': LucideIcons.Star,
    
    // Default fallback
  };
  
  return iconMap[iconName || ''] || LucideIcons.BarChart3;
}

/**
 * KPI Chart - Large metric display with SVG Icon
 * STRUCTURE: Always contains 3 rows (3fr:4fr:3fr)
 * 1. SVG Icon (3fr - 30% height) - dynamically scaled
 * 2. Value/Number (4fr - 40% height - DOMINANT)
 * 3. Label/Description (3fr - 30% height)
 */
function KPIChart({ result, className, width }: { result: ChartResult; className?: string; width?: number }) {
  // Format the KPI value
  const formattedValue = formatValue(result.kpiValue, result.formatting);
  
  // Get Lucide icon component
  const IconComponent = getLucideIcon(result.icon);
  
  // Calculate aspect ratio based on chart width
  const aspectRatio = getKPIAspectRatio(width || 1);
  
  return (
    <div className={`${styles.chart} ${styles.kpi} report-chart ${className || ''}`} 
      data-report-section="content"
      style={{ ['--kpi-aspect-ratio' as string]: aspectRatio } as React.CSSProperties}
    >
      <div className={styles.chartBody}>
        <div className={styles.kpiContent}>
          {/* Row 1: SVG Icon (3fr - 30% height) - scales dynamically */}
          <div className={styles.kpiIconRow}>
            <IconComponent className={styles.kpiIcon} aria-label={result.title} />
          </div>
          
          {/* Row 2: Value/Number (5fr - 50% height - DOMINANT) */}
          <div className={styles.kpiValue}>{formattedValue}</div>
          
          {/* Row 3: Label/Description (2fr - 20% height) */}
          <div className={styles.kpiTitle}>{result.title || ''}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pie Chart - Circular visualization using Chart.js
 */
function PieChart({ result, className }: { result: ChartResult; className?: string }) {
  const chartRef = useRef<ChartJS<'doughnut'>>(null);
  
  if (!result.elements || result.elements.length === 0) {
    return <div className={styles.chart}>No pie data</div>;
  }

  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  const total = result.elements.reduce((sum, el) => sum + (typeof el.value === 'number' ? el.value : 0), 0);
  
  // WHAT: Read theme colors from CSS variables
  // WHY: Use custom style colors instead of hardcoded values
  // HOW: getComputedStyle reads --chart-color-N variables injected by useReportStyle
  const getThemeColors = () => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    return [
      computedStyle.getPropertyValue('--chart-color-1').trim() || '#3b82f6',
      computedStyle.getPropertyValue('--chart-color-2').trim() || '#10b981',
      computedStyle.getPropertyValue('--chart-color-3').trim() || '#8b5cf6',
      computedStyle.getPropertyValue('--chart-color-4').trim() || '#f59e0b',
      computedStyle.getPropertyValue('--chart-color-5').trim() || '#ef4444'
    ];
  };
  
  const themeColors = getThemeColors();
  
  // Prepare Chart.js data
  // WHAT: Force theme colors to override any element.color
  // WHY: Style must overwrite each and every color (user requirement)
  const chartData = {
    labels: result.elements.map(el => el.label),
    datasets: [{
      label: result.title,
      data: result.elements.map(el => typeof el.value === 'number' ? el.value : 0),
      backgroundColor: result.elements.map((el, idx) => 
        themeColors[idx % themeColors.length]
      ),
      // WHAT: Use primary color (red/maroon) as border for all slices
      // WHY: Creates visual separation with consistent branding
      borderColor: themeColors[0],
      borderWidth: 2,
      hoverOffset: 8
    }]
  };
  
  // Chart.js options
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: 'rgb(75, 85, 99)',
          font: { size: 13, family: 'inherit', weight: 500 },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            const labels = chart.data.labels || [];
            if (!datasets.length || !datasets[0].data.length) return [];
            
            return labels.map((label, index) => {
              const value = datasets[0].data[index] as number;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              const backgroundColor = datasets[0].backgroundColor as string[];
              
              return {
                text: `${label}: ${percentage}%`,
                fillStyle: backgroundColor[index],
                strokeStyle: backgroundColor[index],
                lineWidth: 0,
                hidden: false,
                index,
                pointStyle: 'circle' as const
              };
            });
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed as number;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className={`${styles.chart} ${styles.pie} report-chart ${className || ''}`} data-report-section="content">
      {showTitle && (
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>{result.title}</div>
        </div>
      )}
      <div className={styles.chartBody}>
        <div className={styles.pieChartContainer}>
          <Doughnut ref={chartRef} data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}

/**
 * Bar Chart - Five-element horizontal bars
 */
function BarChart({ result, className }: { result: ChartResult; className?: string }) {
  if (!result.elements || result.elements.length === 0) {
    return <div className={styles.chart}>No bar data</div>;
  }

  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  // WHAT: Read theme colors from CSS variables
  // WHY: Use custom style colors for bar fills
  const getThemeColors = () => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    return [
      computedStyle.getPropertyValue('--chart-color-1').trim() || '#3b82f6',
      computedStyle.getPropertyValue('--chart-color-2').trim() || '#10b981',
      computedStyle.getPropertyValue('--chart-color-3').trim() || '#8b5cf6',
      computedStyle.getPropertyValue('--chart-color-4').trim() || '#f59e0b',
      computedStyle.getPropertyValue('--chart-color-5').trim() || '#ef4444'
    ];
  };
  
  const themeColors = getThemeColors();
  const maxValue = Math.max(...result.elements.map(el => typeof el.value === 'number' ? el.value : 0));

  return (
    <div className={`${styles.chart} ${styles.bar} report-chart ${className || ''}`} data-report-section="content">
      {showTitle && (
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>{result.title}</div>
        </div>
      )}
      <div className={styles.chartBody}>
        <div className={styles.barElements}>
        {result.elements.map((element, idx) => {
          const numValue = typeof element.value === 'number' ? element.value : 0;
          const widthPercent = maxValue > 0 ? (numValue / maxValue) * 100 : 0;
          
          return (
            <div key={idx} className={styles.barRow}>
              <div className={styles.barLabel}>{element.label}</div>
              <div className={styles.barTrack}>
                <div 
                  className={styles.barFill}
                  style={{ 
                    width: `${widthPercent}%`,
                    // WHAT: Use only primary color (first theme color) for all bars
                    // WHY: Bar charts show single metric across categories - uniform color is clearer
                    backgroundColor: themeColors[0]
                  }}
                />
              </div>
              <div className={styles.barValue}>{formatValue(element.value, result.formatting)}</div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

/**
 * Text Chart - Formatted text display
 */
function TextChart({ result, className }: { result: ChartResult; className?: string }) {
  const formattedValue = formatValue(result.kpiValue, result.formatting);
  
  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  return (
    <div className={`${styles.chart} ${styles.text} report-chart ${className || ''}`} data-report-section="content">
      {showTitle && (
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>{result.title}</div>
        </div>
      )}
      <div className={styles.chartBody}>
        <div className={styles.textContent}>{formattedValue}</div>
      </div>
    </div>
  );
}

/**
 * Image Chart - Aspect ratio-aware image display
 */
function ImageChart({ result, className }: { result: ChartResult; className?: string }) {
  const formattedValue = formatValue(result.kpiValue, result.formatting);
  const aspectRatio = result.aspectRatio || '16:9';
  
  // DEBUG: Log image rendering
  console.log('[ImageChart] Rendering:', {
    title: result.title,
    kpiValue: result.kpiValue,
    formattedValue,
    aspectRatio,
    hasValue: !!formattedValue
  });
  
  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  // Map aspect ratio to CSS class
  const aspectClass = {
    '16:9': styles.aspect169,
    '9:16': styles.aspect916,
    '1:1': styles.aspect11
  }[aspectRatio] || styles.aspect169;

  return (
    <div className={`${styles.chart} ${styles.image} ${aspectClass} report-chart ${className || ''}`} data-report-section="content">
      {showTitle && (
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>{result.title}</div>
        </div>
      )}
      {/* WHAT: Use actual <img> tag for reliable aspect ratio */}
      {/* WHY: Browser automatically maintains aspect ratio, no CSS tricks needed */}
      <img 
        className={styles.imageContent}
        src={formattedValue}
        alt={result.title}
        onLoad={() => console.log('[ImageChart] Image loaded:', result.title)}
        onError={(e) => console.error('[ImageChart] Image failed to load:', result.title, e)}
      />
    </div>
  );
}
