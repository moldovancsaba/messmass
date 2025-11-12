/* WHAT: Resource loader with branded loading screen
 * WHY: Prevent visual flashing by waiting for all critical resources before rendering
 * HOW: Wait for fonts, logos, styles to load before showing children */

'use client';

import React, { useState, useEffect } from 'react';
import styles from './ResourceLoader.module.css';

interface Partner {
  name: string;
  emoji: string;
  logoUrl?: string;
}

interface ResourceLoaderProps {
  /** WHAT: Partner info for branded loading screen */
  partner?: Partner | null;
  
  /** WHAT: Whether data is still loading */
  isLoading: boolean;
  
  /** WHAT: Logo URLs to preload */
  logoUrls?: string[];
  
  /** WHAT: Font family to wait for */
  fontFamily?: string;
  
  /** WHAT: Whether page style has loaded */
  hasPageStyle: boolean;
  
  /** WHAT: Content to show after resources load */
  children: React.ReactNode;
  
  /** WHAT: Minimum loading time in ms (prevents flash) */
  minLoadingTime?: number;
}

export default function ResourceLoader({
  partner,
  isLoading,
  logoUrls = [],
  fontFamily,
  hasPageStyle,
  children,
  minLoadingTime = 500
}: ResourceLoaderProps) {
  const [fontsReady, setFontsReady] = useState(false);
  const [logosReady, setLogosReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  
  // WHAT: Wait for fonts to load using Font Loading API
  // WHY: Prevent font flashing (FOUT - Flash of Unstyled Text)
  useEffect(() => {
    const waitForFonts = async () => {
      try {
        if (fontFamily && 'fonts' in document) {
          console.log('⏳ Waiting for font:', fontFamily);
          
          // WHAT: Check if specific font is loaded
          // WHY: document.fonts.ready waits for ALL fonts, we only need our custom font
          const fontFaceSet = document.fonts;
          await fontFaceSet.ready;
          
          // WHAT: Double-check our specific font loaded
          const fontLoaded = fontFaceSet.check(`12px "${fontFamily}"`);
          console.log(fontLoaded ? '✅ Font loaded:' : '⚠️  Font not found:', fontFamily);
        }
        setFontsReady(true);
      } catch (err) {
        console.warn('⚠️  Font loading check failed, continuing:', err);
        setFontsReady(true); // Continue anyway
      }
    };
    
    waitForFonts();
  }, [fontFamily]);
  
  // WHAT: Preload logo images
  // WHY: Prevent logo pop-in after page renders
  useEffect(() => {
    if (logoUrls.length === 0) {
      setLogosReady(true);
      return;
    }
    
    const preloadLogos = async () => {
      try {
        console.log('⏳ Preloading', logoUrls.length, 'logos:', logoUrls);
        
        const imagePromises = logoUrls
          .filter(url => url) // Remove empty URLs
          .map(url => {
            return new Promise<void>((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                console.log('✅ Logo loaded:', url);
                resolve();
              };
              img.onerror = () => {
                console.warn('⚠️  Logo failed to load:', url);
                resolve(); // Continue even if logo fails
              };
              img.src = url;
            });
          });
        
        await Promise.all(imagePromises);
        setLogosReady(true);
      } catch (err) {
        console.warn('⚠️  Logo preloading failed, continuing:', err);
        setLogosReady(true); // Continue anyway
      }
    };
    
    preloadLogos();
  }, [logoUrls]);
  
  // WHAT: Enforce minimum loading time
  // WHY: Prevent quick flash if resources load very fast (<500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minLoadingTime);
    
    return () => clearTimeout(timer);
  }, [minLoadingTime]);
  
  // WHAT: Determine if all resources are ready
  const allResourcesReady = !isLoading && fontsReady && logosReady && hasPageStyle && minTimeElapsed;
  
  // WHAT: Show branded loading screen while waiting
  if (!allResourcesReady) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingCard}>
          {/* WHAT: Partner logo if available */}
          {partner?.logoUrl && (
            <div className={styles.logoWrapper}>
              <img 
                src={partner.logoUrl} 
                alt={partner.name}
                className={styles.logo}
              />
            </div>
          )}
          
          {/* WHAT: Partner emoji fallback */}
          {!partner?.logoUrl && partner?.emoji && (
            <div className={styles.emojiWrapper}>
              <span className={styles.emoji}>{partner.emoji}</span>
            </div>
          )}
          
          {/* WHAT: Loading spinner */}
          <div className={styles.spinner} />
          
          {/* WHAT: Loading text */}
          <p className={styles.loadingText}>
            {partner?.name ? `Loading ${partner.name}...` : 'Loading...'}
          </p>
          
          {/* WHAT: Debug info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className={styles.debugInfo}>
              <small>
                Data: {isLoading ? '⏳' : '✅'} | 
                Fonts: {fontsReady ? '✅' : '⏳'} | 
                Logos: {logosReady ? '✅' : '⏳'} | 
                Style: {hasPageStyle ? '✅' : '⏳'}
              </small>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // WHAT: All resources ready - show content
  return <>{children}</>;
}
