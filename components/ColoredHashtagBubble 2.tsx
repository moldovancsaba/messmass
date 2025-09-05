'use client';

import { useState, useEffect, useMemo } from 'react';

interface HashtagColor {
  _id: string;
  uuid: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface ColoredHashtagBubbleProps {
  hashtag: string;
  className?: string;
  small?: boolean;
  customStyle?: React.CSSProperties;
}

// Cache to avoid repeated API calls across multiple hashtag components
let hashtagColorsCache: HashtagColor[] | null = null;
let cachePromise: Promise<void> | null = null;

// Function to invalidate cache when hashtag colors are updated
export function invalidateHashtagColorsCache() {
  hashtagColorsCache = null;
  cachePromise = null;
  // Force all components to refresh by triggering a custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hashtag-colors-updated'));
  }
}

export default function ColoredHashtagBubble({ hashtag, className = '', small = false, customStyle = {} }: ColoredHashtagBubbleProps) {
  const [hashtagColors, setHashtagColors] = useState<HashtagColor[]>(hashtagColorsCache || []);
  const [loading, setLoading] = useState(!hashtagColorsCache);

  useEffect(() => {
    // If we already have data cached, use it
    if (hashtagColorsCache) {
      setHashtagColors(hashtagColorsCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (cachePromise) {
      cachePromise.then(() => {
        if (hashtagColorsCache) {
          setHashtagColors(hashtagColorsCache);
          setLoading(false);
        }
      });
      return;
    }

    // Start a new request
    loadHashtagColors();
  }, []);

  // Listen for cache invalidation events
  useEffect(() => {
    const handleCacheInvalidation = () => {
      // Force reload data when cache is invalidated
      setLoading(true);
      loadHashtagColors();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hashtag-colors-updated', handleCacheInvalidation);
      return () => {
        window.removeEventListener('hashtag-colors-updated', handleCacheInvalidation);
      };
    }
  }, []);

  const loadHashtagColors = async () => {
    cachePromise = (async () => {
      try {
        // Add cache busting to ensure fresh data
        const response = await fetch(`/api/hashtag-colors?t=${Date.now()}`);
        const data = await response.json();
        
        if (data.success) {
          hashtagColorsCache = data.hashtagColors;
          setHashtagColors(data.hashtagColors);
        }
      } catch (error) {
        console.error('Failed to load hashtag colors:', error);
      } finally {
        setLoading(false);
        cachePromise = null;
      }
    })();
    
    await cachePromise;
  };

  // Find the color for this hashtag (memoized for performance)
  const hashtagColor = useMemo(() => {
    return hashtagColors.find(hc => 
      hc.name.toLowerCase() === hashtag.toLowerCase()
    );
  }, [hashtagColors, hashtag]);

  // Use the managed color or fall back to the default color
  const backgroundColor = hashtagColor?.color || '#667eea';
  const bubbleClasses = `hashtag ${small ? 'hashtag-small' : ''} ${className}`.trim();

  // Handle empty hashtag gracefully
  if (!hashtag || !hashtag.trim()) {
    return null;
  }

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Hashtag: ${hashtag}, Color: ${backgroundColor}, HasCustomColor: ${!!hashtagColor}`);
  }

  return (
    <span 
      className={bubbleClasses}
      style={{ 
        backgroundColor: backgroundColor,
        background: backgroundColor, // Ensure both properties are set
        color: 'white', // Force text color to always be white
        ...customStyle 
      }}
      title={hashtagColor ? `Custom color: ${hashtagColor.color}` : 'Default color (#667eea)'}
    >
      #{hashtag}
    </span>
  );
}
