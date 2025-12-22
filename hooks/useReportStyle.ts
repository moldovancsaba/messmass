/* WHAT: Hook to fetch and apply report styles (v12.0.0)
 * WHY: Reports can have custom styling themes via styleId
 * HOW: Fetch style from API, apply CSS to page dynamically */

'use client';

import { useEffect, useState } from 'react';
import { PageStyleEnhanced, generateGradientCSS } from '@/lib/pageStyleTypesEnhanced';

interface UseReportStyleOptions {
  styleId?: string | null;
  enabled?: boolean;
}

interface UseReportStyleReturn {
  style: PageStyleEnhanced | null;
  loading: boolean;
  error: string | null;
}

/**
 * WHAT: Custom hook to fetch and apply report styles
 * WHY: Reports need custom theming based on report.styleId
 * HOW: Fetch from API, generate CSS, inject into document head
 * 
 * @param styleId - MongoDB ObjectId of PageStyleEnhanced
 * @param enabled - Whether to fetch and apply style (default: true)
 * @returns Style object, loading state, and error
 * 
 * @example
 * ```tsx
 * const { style, loading, error } = useReportStyle({ styleId: report.styleId });
 * ```
 */
export function useReportStyle({ 
  styleId, 
  enabled = true 
}: UseReportStyleOptions = {}): UseReportStyleReturn {
  const [style, setStyle] = useState<PageStyleEnhanced | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if disabled or no styleId
    if (!enabled || !styleId) {
      console.log('🎨 [useReportStyle] Skipping:', { enabled, styleId });
      return;
    }

    console.log('🎨 [useReportStyle] Fetching style:', styleId);

    /**
     * WHAT: Fetch style from API
     * WHY: Load custom theme configuration
     */
    const fetchStyle = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/page-styles-enhanced?styleId=${encodeURIComponent(styleId)}`,
          { cache: 'no-store' }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch style');
        }

        if (data.style) {
          setStyle(data.style);
          applyStyleToPage(data.style);
          console.log('✅ Applied report style:', data.style.name);
        } else {
          throw new Error('No style returned from API');
        }
      } catch (err) {
        console.error('❌ Failed to fetch report style:', err);
        setError(err instanceof Error ? err.message : 'Failed to load style');
      } finally {
        setLoading(false);
      }
    };

    fetchStyle();
  }, [styleId, enabled]);

  return { style, loading, error };
}

/**
 * WHAT: Apply PageStyleEnhanced to document
 * WHY: Dynamically inject CSS for custom theming
 * HOW: Generate CSS rules, inject into <style> tag in <head>
 * 
 * Targets:
 * - body: pageBackground, font, text color
 * - .report-hero: heroBackground, heading color
 * - .report-content: contentBoxBackground
 * - Headings: heading color
 * - Semantic colors: primary, secondary, success, warning, error
 */
function applyStyleToPage(style: PageStyleEnhanced) {
  if (!style) return;

  // Generate background CSS strings
  const pageBackgroundCSS = style.pageBackground.type === 'solid'
    ? style.pageBackground.solidColor || '#ffffff'
    : generateGradientCSS(style.pageBackground);

  const heroBackgroundCSS = style.heroBackground.type === 'solid'
    ? style.heroBackground.solidColor || '#ffffff'
    : generateGradientCSS(style.heroBackground);

  const contentBoxBackgroundCSS = `rgba(${hexToRgb(
    style.contentBoxBackground.solidColor || '#ffffff'
  )}, ${style.contentBoxBackground.opacity || 1})`;

  // Create or update style tag in head
  const styleId = 'report-style-enhanced';
  let styleTag = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }

  // WHAT: Generate chart color palette from theme
  // WHY: Charts (pie, bar) need consistent colors from custom styles
  // HOW: Use colorScheme colors and generate variations
  const chartColors = [
    style.colorScheme.primary,
    style.colorScheme.secondary,
    style.colorScheme.success,
    style.colorScheme.warning,
    style.colorScheme.error
  ];

  // Generate CSS rules
  styleTag.textContent = `
    /* Report Styles Enhanced - Auto-generated from theme: ${style.name} */
    
    :root {
      /* WHAT: Chart color palette CSS variables */
      /* WHY: Allow Chart.js to read theme colors dynamically */
      --chart-color-1: ${chartColors[0]};
      --chart-color-2: ${chartColors[1]};
      --chart-color-3: ${chartColors[2]};
      --chart-color-4: ${chartColors[3]};
      --chart-color-5: ${chartColors[4]};
      
      /* WHAT: Hero background CSS variable for ReportHero.module.css */
      /* WHY: Allow CSS modules to read custom hero background */
      --report-hero-bg: ${heroBackgroundCSS};
      
      /* WHAT: Hero text color CSS variable for ReportHero.module.css */
      /* WHY: Allow CSS modules to read custom hero text color */
      --report-hero-color: ${style.typography.headingColor};
      
      /* WHAT: Override design token --mm-primary with custom style primary color */
      /* WHY: KPI icons use --mm-primary, must respect custom style */
      --mm-primary: ${style.colorScheme.primary};
    }
    
    body {
      background: ${pageBackgroundCSS};
      font-family: ${getFontFamily(style.typography.fontFamily)};
      color: ${style.typography.primaryTextColor};
    }
    
    /* Hero Section Styling */
    .report-hero,
    [data-report-section="hero"] {
      background: ${heroBackgroundCSS};
      color: ${style.typography.headingColor};
    }
    
    /* Content Boxes */
    .report-content,
    .report-chart,
    [data-report-section="content"] {
      background: ${contentBoxBackgroundCSS};
      color: ${style.typography.primaryTextColor};
    }
    
    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      color: ${style.typography.headingColor};
    }
    
    /* Secondary Text */
    .report-secondary-text {
      color: ${style.typography.secondaryTextColor};
    }
    
    /* Semantic Colors */
    .report-primary {
      color: ${style.colorScheme.primary};
    }
    
    .report-secondary {
      color: ${style.colorScheme.secondary};
    }
    
    .report-success {
      color: ${style.colorScheme.success};
    }
    
    .report-warning {
      color: ${style.colorScheme.warning};
    }
    
    .report-error {
      color: ${style.colorScheme.error};
    }
  `;
}

/**
 * Convert hex to RGB values for rgba()
 */
function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Map font family to CSS font-family value
 */
function getFontFamily(font: string): string {
  const fontMap: Record<string, string> = {
    inter: '"Inter", sans-serif',
    roboto: '"Roboto", sans-serif',
    poppins: '"Poppins", sans-serif',
    montserrat: '"Montserrat", sans-serif',
    asroma: '"AS Roma", sans-serif',
    'AS Roma': '"AS Roma", sans-serif'
  };
  return fontMap[font] || fontMap[font.toLowerCase()] || `"${font}", sans-serif`;
}
