'use client';

import React from 'react';
import { getAllHashtagsWithCategories, ProjectHashtagData } from '@/lib/hashtagCategoryDisplay';

interface TextHashtagDisplayProps {
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  style?: React.CSSProperties;
  separator?: string;
}

export default function TextHashtagDisplay({
  hashtags = [],
  categorizedHashtags = {},
  style = {},
  separator = '\n'
}: TextHashtagDisplayProps) {
  
  // Get all hashtags with their categories from the project data
  const projectData: ProjectHashtagData = {
    hashtags: hashtags,
    categorizedHashtags: categorizedHashtags
  };
  const hashtagsWithCategories = getAllHashtagsWithCategories(projectData);
  
  if (hashtagsWithCategories.length === 0) {
    return null;
  }
  
  // Create the text format similar to the admin page
  const displayLines: string[] = [];
  
  hashtagsWithCategories.forEach((hashtagData) => {
    if (hashtagData.primaryCategory === 'general') {
      // General hashtags show as #hashtag
      displayLines.push(`#${hashtagData.hashtag}`);
    } else {
      // Categorized hashtags show as category:hashtag
      displayLines.push(`${hashtagData.primaryCategory}:${hashtagData.hashtag}`);
    }
  });
  
  const defaultStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '1rem',
    color: '#374151',
    background: 'rgba(249, 250, 251, 0.8)',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid rgba(209, 213, 219, 0.5)',
    whiteSpace: 'pre-line',
    lineHeight: '1.6',
    margin: '1rem 0',
    ...style
  };
  
  return (
    <div style={defaultStyle}>
      {displayLines.join(separator)}
    </div>
  );
}
