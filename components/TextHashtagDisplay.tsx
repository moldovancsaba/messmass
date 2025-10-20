'use client';

import React from 'react';
import { getAllHashtagsWithCategories, ProjectHashtagData } from '@/lib/hashtagCategoryDisplay';
import styles from './TextHashtagDisplay.module.css';

interface TextHashtagDisplayProps {
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  separator?: string;
}

export default function TextHashtagDisplay({
  hashtags = [],
  categorizedHashtags = {},
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
  
  return (
    <div className={styles.container}>
      {displayLines.join(separator)}
    </div>
  );
}
