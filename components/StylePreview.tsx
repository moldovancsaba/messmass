/* WHAT: Live preview component showing how a page style looks
 * WHY: Allow admins to see changes in real-time before saving
 * HOW: Mini page mockup with applied styles */

'use client';

import React from 'react';
import styles from './StylePreview.module.css';
import { PageStyleEnhanced, generateGradientCSS } from '@/lib/pageStyleTypesEnhanced';
import MaterialIcon from './MaterialIcon';

interface StylePreviewProps {
  /* WHAT: Style configuration to preview
   * WHY: Display the current form state visually */
  style: Omit<PageStyleEnhanced, '_id' | 'createdAt' | 'updatedAt' | 'projectIds'>;
  /* WHAT: Active section from PageStyleEditor
   * WHY: Show charts only when Chart Colors tab is active */
  activeSection?: 'general' | 'backgrounds' | 'typography' | 'colors' | 'chartColors';
}

export default function StylePreview({ style, activeSection }: StylePreviewProps) {
  /* WHAT: Generate background CSS from style config
   * WHY: Apply solid or gradient backgrounds dynamically */
  const getBackgroundStyle = (bg: typeof style.pageBackground) => {
    if (bg.type === 'solid') {
      return { background: bg.solidColor || '#ffffff' };
    } else if (bg.type === 'gradient' && bg.gradientStops) {
      return { background: generateGradientCSS(bg) };
    }
    return {};
  };

  const pageBackgroundStyle = getBackgroundStyle(style.pageBackground);
  const heroBackgroundStyle = getBackgroundStyle(style.heroBackground);
  const contentBoxStyle = {
    background: style.contentBoxBackground.solidColor || '#ffffff',
    opacity: style.contentBoxBackground.opacity || 1
  };

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewLabel}>
        <span className={styles.previewIcon}>👁️</span>
        <span className={styles.previewText}>Live Preview</span>
      </div>
      
      <div className={styles.previewFrame}>
        {/* WHAT: Live theme preview - All inline styles are legitimate dynamic values
            WHY: This component renders user-configured theme settings in real-time
            HOW: Colors, fonts, backgrounds, and borders are all computed from style prop */}
        {/* eslint-disable react/forbid-dom-props */}
        {/* Mini Page Mockup */}
        <div 
          className={styles.mockPage}
          style={pageBackgroundStyle}
        >
          {/* Hero Section */}
          <div 
            className={styles.mockHero}
            style={heroBackgroundStyle}
          >
            <h1 
              className={styles.mockTitle}
              style={{ 
                color: style.typography.headingColor,
                fontFamily: getFontFamily(style.typography.fontFamily)
              }}
            >
              Event Name
            </h1>
            <p 
              className={styles.mockSubtitle}
              style={{ 
                color: style.typography.secondaryTextColor,
                fontFamily: getFontFamily(style.typography.fontFamily)
              }}
            >
              Event Date • Location
            </p>
          </div>

          {/* Content Boxes */}
          <div className={styles.mockContent}>
            <div 
              className={styles.mockBox}
              style={{
                ...contentBoxStyle,
                borderLeft: `4px solid ${style.colorScheme.primary}`
              }}
            >
              <h3 
                className={styles.mockBoxTitle}
                style={{ 
                  color: style.typography.primaryTextColor,
                  fontFamily: getFontFamily(style.typography.fontFamily)
                }}
              >
                Statistics
              </h3>
              <p 
                className={styles.mockBoxText}
                style={{ 
                  color: style.typography.secondaryTextColor,
                  fontFamily: getFontFamily(style.typography.fontFamily)
                }}
              >
                Sample content text
              </p>
            </div>

            <div 
              className={styles.mockBox}
              style={{
                ...contentBoxStyle,
                borderLeft: `4px solid ${style.colorScheme.secondary}`
              }}
            >
              <h3 
                className={styles.mockBoxTitle}
                style={{ 
                  color: style.typography.primaryTextColor,
                  fontFamily: getFontFamily(style.typography.fontFamily)
                }}
              >
                Analytics
              </h3>
              <p 
                className={styles.mockBoxText}
                style={{ 
                  color: style.typography.secondaryTextColor,
                  fontFamily: getFontFamily(style.typography.fontFamily)
                }}
              >
                Sample content text
              </p>
            </div>
          </div>

          {/* Sample Charts Preview - ONLY show in Chart Colors tab */}
          {activeSection === 'chartColors' && (
          <div className={styles.mockCharts}>
            {/* KPI Chart Sample */}
            <div 
              className={styles.mockKpi}
              style={{
                ...contentBoxStyle,
                border: `1px solid ${style.chartColors?.chartBorder || '#f3f4f6'}`
              }}
            >
              <div 
                className={styles.mockKpiIcon}
                style={{ color: style.chartColors?.kpiIconColor || style.colorScheme.primary }}
              >
                <MaterialIcon name="monitoring" variant="outlined" />
              </div>
              <div 
                className={styles.mockKpiValue}
                style={{ color: style.chartColors?.chartValueColor || '#111827' }}
              >
                2,531
              </div>
              <div 
                className={styles.mockKpiLabel}
                style={{ color: style.chartColors?.chartLabelColor || '#6b7280' }}
              >
                Total Fans
              </div>
            </div>

            {/* Pie Chart Sample */}
            <div 
              className={styles.mockPie}
              style={{
                ...contentBoxStyle,
                border: `1px solid ${style.chartColors?.chartBorder || '#f3f4f6'}`
              }}
            >
              <div 
                className={styles.mockPieTitle}
                style={{ color: style.chartColors?.chartTitleColor || style.colorScheme.primary }}
              >
                Demographics
              </div>
              <div className={styles.mockPieCircle}>
                {/* Pie slices using chart colors */}
                <div 
                  className={styles.mockPieSlice}
                  style={{ background: style.colorScheme.primary }}
                />
                <div 
                  className={styles.mockPieSlice}
                  style={{ background: style.colorScheme.secondary }}
                />
              </div>
              <div className={styles.mockPieLegend}>
                <div className={styles.mockLegendItem}>
                  <div 
                    className={styles.mockLegendDot}
                    style={{ background: style.colorScheme.primary }}
                  />
                  <span style={{ color: style.chartColors?.chartLabelColor || '#6b7280' }}>Male 60%</span>
                </div>
                <div className={styles.mockLegendItem}>
                  <div 
                    className={styles.mockLegendDot}
                    style={{ background: style.colorScheme.secondary }}
                  />
                  <span style={{ color: style.chartColors?.chartLabelColor || '#6b7280' }}>Female 40%</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Sample */}
            <div 
              className={styles.mockBar}
              style={{
                ...contentBoxStyle,
                border: `1px solid ${style.chartColors?.chartBorder || '#f3f4f6'}`
              }}
            >
              <div 
                className={styles.mockBarTitle}
                style={{ color: style.chartColors?.chartTitleColor || style.colorScheme.primary }}
              >
                Merchandise
              </div>
              <div className={styles.mockBarRows}>
                <div className={styles.mockBarRow}>
                  <span style={{ color: style.chartColors?.chartLabelColor || '#6b7280' }}>Jersey</span>
                  <div className={styles.mockBarTrack}>
                    <div 
                      className={styles.mockBarFill}
                      style={{ 
                        width: '80%',
                        background: style.colorScheme.primary 
                      }}
                    />
                  </div>
                  <span style={{ color: style.chartColors?.chartValueColor || '#111827' }}>450</span>
                </div>
                <div className={styles.mockBarRow}>
                  <span style={{ color: style.chartColors?.chartLabelColor || '#6b7280' }}>Scarf</span>
                  <div className={styles.mockBarTrack}>
                    <div 
                      className={styles.mockBarFill}
                      style={{ 
                        width: '60%',
                        background: style.colorScheme.primary 
                      }}
                    />
                  </div>
                  <span style={{ color: style.chartColors?.chartValueColor || '#111827' }}>320</span>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Color Scheme Swatches */}
          <div className={styles.mockColorScheme}>
            <div 
              className={styles.mockSwatch}
              style={{ background: style.colorScheme.primary }}
              title="Primary"
            />
            <div 
              className={styles.mockSwatch}
              style={{ background: style.colorScheme.secondary }}
              title="Secondary"
            />
            <div 
              className={styles.mockSwatch}
              style={{ background: style.colorScheme.success }}
              title="Success"
            />
            <div 
              className={styles.mockSwatch}
              style={{ background: style.colorScheme.warning }}
              title="Warning"
            />
            <div 
              className={styles.mockSwatch}
              style={{ background: style.colorScheme.error }}
              title="Error"
            />
          </div>
        </div>
        {/* eslint-enable react/forbid-dom-props */}
      </div>
      
      {/* Preview Info */}
      <div className={styles.previewInfo}>
        <p className={styles.infoText}>
          {/* WHAT: Display font name with proper capitalization
               WHY: Show readable font name in preview, supporting multi-word fonts */}
          <strong>Font:</strong> {style.typography.fontFamily}
        </p>
        <p className={styles.infoText}>
          <strong>Page BG:</strong> {style.pageBackground.type}
        </p>
        <p className={styles.infoText}>
          <strong>Hero BG:</strong> {style.heroBackground.type}
        </p>
      </div>
    </div>
  );
}

/* WHAT: Map font family to CSS font-family value
 * WHY: Apply correct Google Font or custom font in preview
 * HOW: Support both built-in fonts and custom fonts like "AS Roma" */
function getFontFamily(font: string): string {
  const fontMap: Record<string, string> = {
    inter: '"Inter", sans-serif',
    roboto: '"Roboto", sans-serif',
    poppins: '"Poppins", sans-serif',
    montserrat: '"Montserrat", sans-serif',
    'AS Roma': '"AS Roma", sans-serif',  // WHAT: Custom AS Roma font
    'Aquatic': '"Aquatic", sans-serif'   // WHAT: Custom Aquatic font
  };
  return fontMap[font] || fontMap[font.toLowerCase()] || `"${font}", sans-serif`;
}
