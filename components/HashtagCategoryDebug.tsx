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
                  style={{
                    '--badge-bg': category === 'general' 
                      ? 'rgba(107, 114, 128, 0.1)' 
                      : 'rgba(59, 130, 246, 0.1)',
                    '--badge-color': category === 'general' 
                      ? '#6b7280' 
                      : '#2563eb',
                    '--badge-border': category === 'general' 
                      ? 'rgba(107, 114, 128, 0.2)' 
                      : 'rgba(59, 130, 246, 0.2)'
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
