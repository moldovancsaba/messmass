/* WHAT: Live preview component showing how a page style looks
 * WHY: Allow admins to see changes in real-time before saving
 * HOW: Mini page mockup with applied styles */

'use client';

import React from 'react';
import styles from './StylePreview.module.css';
import { PageStyleEnhanced, generateGradientCSS } from '@/lib/pageStyleTypesEnhanced';

interface StylePreviewProps {
  /* WHAT: Style configuration to preview
   * WHY: Display the current form state visually */
  style: Omit<PageStyleEnhanced, '_id' | 'createdAt' | 'updatedAt' | 'projectIds'>;
}

export default function StylePreview({ style }: StylePreviewProps) {
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
      </div>

      {/* Preview Info */}
      <div className={styles.previewInfo}>
        <p className={styles.infoText}>
          <strong>Font:</strong> {style.typography.fontFamily.charAt(0).toUpperCase() + style.typography.fontFamily.slice(1)}
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
 * WHY: Apply correct Google Font in preview */
function getFontFamily(font: 'inter' | 'roboto' | 'poppins'): string {
  const fontMap = {
    inter: '"Inter", sans-serif',
    roboto: '"Roboto", sans-serif',
    poppins: '"Poppins", sans-serif'
  };
  return fontMap[font];
}
