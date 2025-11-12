/* WHAT: Display images from reportImage* variables as full-width responsive images
 * WHY: Partner reports need visual content display with no text overlay
 * HOW: Renders img tags with object-fit cover for consistent presentation + lightbox on click
 * CRITICAL: NO inline styles - all styling via CSS module per coding standards */

'use client';

import React, { useState } from 'react';
import ImageLightbox from '@/components/ImageLightbox';
import styles from './ImageChart.module.css';

export interface ImageChartProps {
  title: string;
  imageUrl: string;
  subtitle?: string;
  className?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1'; // WHAT: Image aspect ratio for proper height calculation
}

export default function ImageChart({ title, imageUrl, subtitle, className = '', aspectRatio = '1:1' }: ImageChartProps) {
  /* WHAT: Lightbox state for full-page image preview
     WHY: Allow users to view images in full detail */
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  /* WHAT: Open lightbox on image click
     WHY: Provide better viewing experience for image content */
  const handleImageClick = () => {
    if (imageUrl) {
      setIsLightboxOpen(true);
    }
  };
  
  /* WHAT: Full-bleed cover image filling entire block with click-to-expand
     WHY: User wants image to fill grid block completely, clickable for full view
     HOW: background-image with CSS variable for PDF export compatibility (v9.3.0)
     NOTE: Uses both module class and global class for UnifiedDataVisualization compatibility */
  /* WHAT: Calculate CSS aspect-ratio value from aspectRatio prop
     WHY: CSS aspect-ratio property requires "width / height" format
     HOW: Convert 16:9 → "16 / 9", 9:16 → "9 / 16", 1:1 → "1 / 1"
     CRITICAL: Coerce to string to prevent crashes on null/undefined/non-string */
  const safeAspectRatio = String(aspectRatio || '1:1');
  const cssAspectRatio = safeAspectRatio.replace(':', ' / ');
  
  return (
    <>
      <div className={`${styles.container} image-chart-container ${className}`}>
        {imageUrl ? (
          <div
            className={styles.image}
            onClick={handleImageClick}
            title="Click to view full size"
            role="img"
            aria-label={title}
            style={{
              ['--image-url' as string]: `url("${imageUrl}")`,
              ['--aspect-ratio' as string]: cssAspectRatio
            } as React.CSSProperties}
          />
        ) : (
          <div className={styles.placeholder}>
            <p>No image available</p>
          </div>
        )}
      </div>
      
      {/* WHAT: Lightbox for full-page image preview using React Portal
          WHY: Portal renders at document.body to escape parent container interference
          HOW: CSS-only flexbox centering prevents flickering */}
      {imageUrl && (
        <ImageLightbox
          imageUrl={imageUrl}
          alt={title}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </>
  );
}
