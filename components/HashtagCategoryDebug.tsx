'use client';

import React from 'react';
import { getAllHashtagsWithCategories, formatHashtagWithCategory, ProjectHashtagData } from '@/lib/hashtagCategoryDisplay';
import styles from './HashtagCategoryDebug.module.css';

interface HashtagCategoryDebugProps {
  projectData: ProjectHashtagData;
  title?: string;
  compact?: boolean;
}

export default function HashtagCategoryDebug({
  projectData,
  title = "Hashtag Categories Debug",
  compact = false
}: HashtagCategoryDebugProps) {
  
  const hashtagsWithCategories = getAllHashtagsWithCategories(projectData);
  
  if (hashtagsWithCategories.length === 0) {
    return null;
  }
  
  if (compact) {
    // Simple text format like: time:2025, sport:soccer
    return (
      <div className={styles.compact}>
        {hashtagsWithCategories.map((hashtagData, index) => {
          const categories = hashtagData.categories.filter(cat => cat !== 'general');
          if (categories.length === 0) {
            return `#${hashtagData.hashtag}`;
          }
          return categories.map(cat => `${cat}:${hashtagData.hashtag}`).join(', ');
        }).filter(text => text.includes(':')).join(' | ')}
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h4 className={styles.title}>
        {title}
      </h4>
      
      <div className={styles.grid}>
        {hashtagsWithCategories.map((hashtagData, index) => (
          <div
            key={index}
            className={styles.hashtagRow}
          >
            {/* Hashtag */}
            <div className={styles.hashtagLabel}>
              #{hashtagData.hashtag}
            </div>
            
            {/* Categories */}
            <div className={styles.categories}>
              {hashtagData.categories.map((category, catIndex) => (
                <span
                  key={catIndex}
                  className={styles.categoryBadge}
                  // WHAT: CSS variables for dynamic badge colors based on category type
                  // WHY: 'general' category uses gray, categorized hashtags use blue
                  // HOW: CSS module uses var(--badge-bg), var(--badge-color), var(--badge-border)
                  // eslint-disable-next-line react/forbid-dom-props
                  style={{
                    '--badge-bg': category === 'general' 
                      ? 'color-mix(in srgb, var(--mm-gray-500) 10%, transparent)' 
                      : 'color-mix(in srgb, var(--mm-color-primary-500) 10%, transparent)',
                    '--badge-color': category === 'general' 
                      ? 'var(--mm-gray-500)' 
                      : 'var(--mm-color-primary-600)',
                    '--badge-border': category === 'general' 
                      ? 'color-mix(in srgb, var(--mm-gray-500) 20%, transparent)' 
                      : 'color-mix(in srgb, var(--mm-color-primary-500) 20%, transparent)'
                  } as React.CSSProperties}
                >
                  {category}
                </span>
              ))}
            </div>
            
            {/* Formatted Display */}
            <div className={styles.formatted}>
              {formatHashtagWithCategory(hashtagData.hashtag, hashtagData.categories)}
            </div>
          </div>
        ))}
      </div>
      
      {hashtagsWithCategories.length === 0 && (
        <div className={styles.empty}>
          No hashtags found
        </div>
      )}
    </div>
  );
}
