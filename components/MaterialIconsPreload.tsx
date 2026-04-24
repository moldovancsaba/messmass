'use client';

import { useEffect } from 'react';

/**
 * MaterialIconsPreload
 * WHAT: Client component to preload Material Icons fonts
 * WHY: Prevents FOIT (Flash of Invisible Text) on admin sidebar icons
 * HOW: Dynamically injects preload link tags only on admin pages
 */
export default function MaterialIconsPreload() {
  useEffect(() => {
    // Ensure the font-faces are actually registered (preload alone doesn't define @font-face).
    // We load the official Google Fonts CSS for the two families we use.
    const existingCssOutlined = document.querySelector(
      'link[href*="fonts.googleapis.com"][href*="Material+Icons+Outlined"]'
    );
    const existingCssRound = document.querySelector(
      'link[href*="fonts.googleapis.com"][href*="Material+Icons+Round"]'
    );

    if (!existingCssOutlined) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://fonts.googleapis.com/css2?family=Material+Icons+Outlined';
      document.head.appendChild(css);
    }

    if (!existingCssRound) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://fonts.googleapis.com/css2?family=Material+Icons+Round';
      document.head.appendChild(css);
    }

    // Check if preload links already exist
    const existingOutlined = document.querySelector(
      'link[href*="materialiconsoutlined"]'
    );
    const existingRound = document.querySelector(
      'link[href*="materialiconsround"]'
    );

    // Only add if not already present
    if (!existingOutlined) {
      const linkOutlined = document.createElement('link');
      linkOutlined.rel = 'preload';
      linkOutlined.href = 'https://fonts.gstatic.com/s/materialiconsoutlined/v110/gok-H7zzDkdnRel8-DQ6KAXJ69wP1tGnf4ZGhUce.woff2';
      linkOutlined.as = 'font';
      linkOutlined.type = 'font/woff2';
      linkOutlined.crossOrigin = 'anonymous';
      document.head.appendChild(linkOutlined);
    }

    if (!existingRound) {
      const linkRound = document.createElement('link');
      linkRound.rel = 'preload';
      linkRound.href = 'https://fonts.gstatic.com/s/materialiconsround/v108/LDItaoyNOAY6Uewc665JcIzCKsKc_M9flwmP.woff2';
      linkRound.as = 'font';
      linkRound.type = 'font/woff2';
      linkRound.crossOrigin = 'anonymous';
      document.head.appendChild(linkRound);
    }
  }, []);

  return null; // This component doesn't render anything
}
