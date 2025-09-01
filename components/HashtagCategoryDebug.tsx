'use client';

import React from 'react';
import { getAllHashtagsWithCategories, formatHashtagWithCategory, ProjectHashtagData } from '@/lib/hashtagCategoryDisplay';

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
      <div style={{
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        color: '#374151',
        background: 'rgba(243, 244, 246, 0.5)',
        padding: '0.5rem',
        borderRadius: '6px',
        border: '1px solid rgba(209, 213, 219, 0.5)'
      }}>
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
    <div style={{
      background: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid rgba(229, 231, 235, 0.8)',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem'
    }}>
      <h4 style={{
        margin: '0 0 0.75rem 0',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {title}
      </h4>
      
      <div style={{
        display: 'grid',
        gap: '0.5rem',
        fontSize: '0.875rem'
      }}>
        {hashtagsWithCategories.map((hashtagData, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem',
              background: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '6px',
              fontFamily: 'monospace'
            }}
          >
            {/* Hashtag */}
            <div style={{
              fontWeight: '600',
              color: '#1f2937',
              minWidth: '100px'
            }}>
              #{hashtagData.hashtag}
            </div>
            
            {/* Categories */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.375rem'
            }}>
              {hashtagData.categories.map((category, catIndex) => (
                <span
                  key={catIndex}
                  style={{
                    padding: '0.125rem 0.375rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: category === 'general' 
                      ? 'rgba(107, 114, 128, 0.1)' 
                      : 'rgba(59, 130, 246, 0.1)',
                    color: category === 'general' 
                      ? '#6b7280' 
                      : '#2563eb',
                    border: `1px solid ${category === 'general' 
                      ? 'rgba(107, 114, 128, 0.2)' 
                      : 'rgba(59, 130, 246, 0.2)'}`,
                    textTransform: 'capitalize'
                  }}
                >
                  {category}
                </span>
              ))}
            </div>
            
            {/* Formatted Display */}
            <div style={{
              marginLeft: 'auto',
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              {formatHashtagWithCategory(hashtagData.hashtag, hashtagData.categories)}
            </div>
          </div>
        ))}
      </div>
      
      {hashtagsWithCategories.length === 0 && (
        <div style={{
          color: '#9ca3af',
          fontStyle: 'italic',
          textAlign: 'center',
          padding: '1rem'
        }}>
          No hashtags found
        </div>
      )}
    </div>
  );
}
