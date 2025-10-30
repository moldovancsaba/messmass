/* WHAT: Hook to fetch and apply page styles to current page
 * WHY: Apply custom themes to public stats pages based on project configuration
 * HOW: Fetch style from API, generate CSS, apply to document */

'use client';

import { useEffect, useState } from 'react';
import { PageStyleEnhanced, generateGradientCSS } from '@/lib/pageStyleTypesEnhanced';

interface UsePageStyleOptions {
  projectId?: string;
  enabled?: boolean;
}

interface UsePageStyleReturn {
  style: PageStyleEnhanced | null;
  loading: boolean;
  error: string | null;
}

/* WHAT: Custom hook to fetch and apply page styles
 * WHY: Encapsulate style fetching and application logic
 * USAGE: Call in stats page component with projectId */
export function usePageStyle({ projectId, enabled = true }: UsePageStyleOptions = {}): UsePageStyleReturn {
  const [style, setStyle] = useState<PageStyleEnhanced | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    /* WHAT: Fetch style for project or global default
     * WHY: Determine which theme to apply */
    const fetchStyle = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query string
        const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
        const response = await fetch(`/api/page-style${query}`);
        const data = await response.json();

        if (data.success && data.style) {
          setStyle(data.style);
          applyStyleToPage(data.style);
        } else {
          setError(data.error || 'Failed to load page style');
        }
      } catch (err) {
        console.error('Failed to fetch page style:', err);
        setError('Network error loading page style');
      } finally {
        setLoading(false);
      }
    };

    fetchStyle();
  }, [projectId, enabled]);

  return { style, loading, error };
}

/* WHAT: Apply page style to document
 * WHY: Dynamically set CSS variables and inline styles based on theme
 * HOW: Inject CSS into head or set CSS custom properties */
function applyStyleToPage(style: PageStyleEnhanced) {
  if (!style) return;

  /* WHAT: Generate background styles
   * WHY: Apply solid or gradient backgrounds to page elements */
  const pageBackgroundCSS = style.pageBackground.type === 'solid'
    ? style.pageBackground.solidColor || '#ffffff'
    : generateGradientCSS(style.pageBackground);

  const heroBackgroundCSS = style.heroBackground.type === 'solid'
    ? style.heroBackground.solidColor || '#ffffff'
    : generateGradientCSS(style.heroBackground);

  const contentBoxBackgroundCSS = `rgba(${hexToRgb(style.contentBoxBackground.solidColor || '#ffffff')}, ${style.contentBoxBackground.opacity || 1})`;

  /* WHAT: Create or update style tag in head
   * WHY: Apply theme styles globally without affecting existing CSS */
  const styleId = 'page-style-enhanced';
  let styleTag = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }

  /* WHAT: Generate CSS rules for themed elements
   * WHY: Target specific classes to apply style configuration */
  styleTag.textContent = `
    /* Page Styles Enhanced - Auto-generated from theme: ${style.name} */
    
    body {
      background: ${pageBackgroundCSS};
      font-family: ${getFontFamily(style.typography.fontFamily)};
      color: ${style.typography.primaryTextColor};
    }
    
    .page-style-hero,
    .stats-hero,
    [data-page-style-section="hero"] {
      background: ${heroBackgroundCSS};
      color: ${style.typography.headingColor};
    }
    
    .page-style-content-box,
    .stats-content-box,
    [data-page-style-section="content"] {
      background: ${contentBoxBackgroundCSS};
      color: ${style.typography.primaryTextColor};
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: ${style.typography.headingColor};
    }
    
    .page-style-secondary-text,
    .stats-secondary-text {
      color: ${style.typography.secondaryTextColor};
    }
    
    .page-style-primary {
      color: ${style.colorScheme.primary};
    }
    
    .page-style-secondary {
      color: ${style.colorScheme.secondary};
    }
    
    .page-style-success {
      color: ${style.colorScheme.success};
    }
    
    .page-style-warning {
      color: ${style.colorScheme.warning};
    }
    
    .page-style-error {
      color: ${style.colorScheme.error};
    }
  `;

  console.log(`✅ Applied page style: ${style.name}`);
}

/* WHAT: Convert hex to RGB values
 * WHY: Support rgba() with opacity */
function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/* WHAT: Map font family to CSS font-family value
 * WHY: Apply correct Google Font or custom font */
function getFontFamily(font: 'inter' | 'roboto' | 'poppins' | 'montserrat' | 'asroma'): string {
  const fontMap: Record<string, string> = {
    inter: '"Inter", sans-serif',
    roboto: '"Roboto", sans-serif',
    poppins: '"Poppins", sans-serif',
    montserrat: '"Montserrat", sans-serif',
    asroma: '"AS Roma", sans-serif'
  };
  return fontMap[font] || fontMap.inter;
}
