'use client';

/**
 * CategorizedHashtagInput.tsx
 * 
 * Enhanced hashtag input component that supports both traditional hashtags and category-based organization.
 * Strategic implementation for comprehensive hashtag categorization system.
 * 
 * Key Features:
 * - Backward compatible with traditional hashtag input
 * - Category-specific hashtag sections with individual inputs
 * - Allows same hashtag in multiple categories (intended behavior)
 * - Category-specific color coding for hashtags
 * - Responsive design for mobile and desktop
 * - Uses shared hashtag pool for predictive search
 * 
 * Version: 2.2.0
 * Last Updated: 2024-12-19
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HashtagCategory, CategoryWithHashtags } from '@/lib/hashtagCategoryTypes';
import HashtagInput from './HashtagInput';
import ColoredHashtagBubble from './ColoredHashtagBubble';

interface CategorizedHashtagInputProps {
  // Traditional hashtags (backward compatibility)
  value: string[];
  onChange: (hashtags: string[]) => void;
  
  // Category-based hashtags (new functionality)  
  categorizedHashtags?: { [categoryName: string]: string[] };
  onCategorizedChange?: (categorized: { [categoryName: string]: string[] }) => void;
  
  // Configuration
  categories?: HashtagCategory[];
  disabled?: boolean;
  placeholder?: string;
  showCategoryInputs?: boolean; // Controls whether to show category sections
}

export default function CategorizedHashtagInput({
  value = [],
  onChange,
  categorizedHashtags = {},
  onCategorizedChange,
  categories = [],
  disabled = false,
  placeholder = "Add hashtags...",
  showCategoryInputs = false
}: CategorizedHashtagInputProps) {
  // Local state for category hashtags
  const [localCategorizedHashtags, setLocalCategorizedHashtags] = useState<{ [categoryName: string]: string[] }>(categorizedHashtags);
  
  // Load categories from API if not provided
  const [loadedCategories, setLoadedCategories] = useState<HashtagCategory[]>(categories);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  // Sync props with local state
  useEffect(() => {
    setLocalCategorizedHashtags(categorizedHashtags);
  }, [categorizedHashtags]);
  
  /**
   * Loads available hashtag categories from API
   */
  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const response = await fetch('/api/hashtag-categories');
      const data = await response.json();
      
      if (data.success) {
        const sortedCategories = (data.categories || []).sort((a: HashtagCategory, b: HashtagCategory) => a.order - b.order);
        setLoadedCategories(sortedCategories);
      } else {
        console.error('Failed to load categories:', data.error);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Load categories if showing category inputs but no categories provided
  useEffect(() => {
    if (showCategoryInputs && categories.length === 0) {
      loadCategories();
    }
  }, [showCategoryInputs, categories.length, loadCategories]);
  
  /**
   * Gets all hashtags across all categories and traditional input
   * Used for validation to prevent duplicates
   */
  const getAllHashtags = useCallback(() => {
    const allHashtags = new Set([...value]);
    
    Object.values(localCategorizedHashtags).forEach(categoryHashtags => {
      categoryHashtags.forEach(hashtag => allHashtags.add(hashtag));
    });
    
    return Array.from(allHashtags);
  }, [value, localCategorizedHashtags]);
  
  /**
   * Handles changes to traditional hashtag input
   * No validation needed - hashtags can appear in multiple categories
   */
  const handleTraditionalChange = (newHashtags: string[]) => {
    onChange(newHashtags);
  };
  
  /**
   * Handles changes to category-specific hashtags
   * No validation needed - hashtags can appear in multiple categories
   */
  const handleCategoryChange = (categoryName: string, newHashtags: string[]) => {
    // Create updated categorized hashtags
    const updatedCategorized = {
      ...localCategorizedHashtags,
      [categoryName]: newHashtags
    };
    
    // Update local state
    setLocalCategorizedHashtags(updatedCategorized);
    
    // Notify parent component
    if (onCategorizedChange) {
      onCategorizedChange(updatedCategorized);
    }
  };
  
  /**
   * Renders individual category hashtag section
   */
  const renderCategorySection = (category: HashtagCategory) => {
    const categoryHashtags = localCategorizedHashtags[category.name] || [];
    
    return (
      <div key={category.name} className="category-hashtag-section">
        <div className="category-header">
          <div className="category-info">
            <div 
              className="category-indicator"
              style={{ backgroundColor: (typeof category.color === 'string' && category.color.trim()) ? category.color.trim() : '#667eea' }}
              title={`${category.name} category`}
            />
            <label className="category-label">
              {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
            </label>
            <span className="category-count">({categoryHashtags.length})</span>
          </div>
        </div>
        
        {/* Existing hashtags in this category */}
        {categoryHashtags.length > 0 && (
          <div className="existing-hashtags" style={{ marginBottom: '1rem' }}>
            <div className="hashtag-bubbles">
              {categoryHashtags.map((hashtag, index) => (
                <ColoredHashtagBubble 
                  key={index}
                  hashtag={hashtag}
                  categoryColor={category.color}
                  customStyle={{
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                  removable={!disabled}
                  onRemove={() => {
                    const newHashtags = categoryHashtags.filter((_, i) => i !== index);
                    handleCategoryChange(category.name, newHashtags);
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Category-specific hashtag input */}
        <div className="category-input">
          <HashtagInput
            value={categoryHashtags}
            onChange={(newHashtags) => handleCategoryChange(category.name, newHashtags)}
            disabled={disabled}
            placeholder={`Add hashtags for ${category.name}...`}
          />
        </div>
      </div>
    );
  };
  
  return (
    <div className="categorized-hashtag-input">
      {/* Traditional hashtag input (always shown for backward compatibility) */}
      <div className="traditional-hashtag-section">
        <div className="section-header">
          <label className="section-label">
            {showCategoryInputs ? 'General Hashtags' : 'Hashtags'}
          </label>
          <span className="section-count">({value.length})</span>
        </div>
        
        {/* Existing hashtags in general section */}
        {value.length > 0 && (
          <div className="existing-hashtags" style={{ marginBottom: '1rem' }}>
            <div className="hashtag-bubbles">
              {value.map((hashtag, index) => (
                <ColoredHashtagBubble 
                  key={index}
                  hashtag={hashtag}
                  customStyle={{
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                  removable={!disabled}
                  onRemove={() => {
                    const newHashtags = value.filter((_, i) => i !== index);
                    handleTraditionalChange(newHashtags);
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* General hashtag input - create custom simple input */}
        <div className="general-hashtag-input">
          <input
            type="text"
            placeholder={placeholder}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.target as HTMLInputElement;
                const hashtag = input.value.trim().toLowerCase().replace(/^#/, '');
                
                if (!hashtag) return;
                
                // Simple validation
                if (!/^[a-z0-9_]+$/.test(hashtag)) {
                  alert('Hashtag can only contain lowercase letters, numbers, and underscores');
                  return;
                }
                
                // Check duplicates within general hashtags only
                if (value.includes(hashtag)) {
                  alert('Hashtag already exists in general hashtags');
                  return;
                }
                
                handleTraditionalChange([...value, hashtag]);
                input.value = '';
              }
            }}
            className="general-input-field"
          />
        </div>
        
        {showCategoryInputs && (
          <div className="section-note">
            <small>💡 These hashtags will use their individual colors or default styling</small>
          </div>
        )}
      </div>
      
      {/* Category-specific hashtag sections */}
      {showCategoryInputs && (
        <div className="category-sections">
          <div className="category-sections-header">
            <h3 className="section-title">Category-Specific Hashtags</h3>
            <small className="section-description">
              Hashtags can be added to multiple categories. Each category assignment will show the hashtag with that category&apos;s color.
            </small>
          </div>
          
          {categoriesLoading ? (
            <div className="loading-categories">
              <div className="loading-spinner">Loading categories...</div>
            </div>
          ) : loadedCategories.length === 0 ? (
            <div className="no-categories">
              <div className="empty-state">
                <div className="empty-icon">🏷️</div>
                <div className="empty-title">No Categories Available</div>
                <div className="empty-subtitle">
                  <a href="/admin/hashtags" target="_blank" rel="noopener noreferrer">
                    Create hashtag categories
                  </a> to organize your hashtags
                </div>
              </div>
            </div>
          ) : (
            <div className="category-sections-list">
              {loadedCategories.map(renderCategorySection)}
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .categorized-hashtag-input {
          display: grid;
          gap: 2rem;
        }
        
        .traditional-hashtag-section,
        .category-sections {
          display: grid;
          gap: 1rem;
        }
        
        .section-header,
        .category-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .section-label,
        .category-label {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
        }
        
        .section-count,
        .category-count {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }
        
        .section-note {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: 8px;
        }
        
        .section-note small {
          color: #374151;
          font-size: 0.8125rem;
        }
        
        .category-sections-header {
          text-align: center;
          padding: 1.5rem;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 12px;
        }
        
        .section-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }
        
        .section-description {
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .category-hashtag-section {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(229, 231, 235, 0.8);
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .category-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .category-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .existing-hashtags {
          margin: 1rem 0;
        }
        
        .hashtag-bubbles {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        
        .general-hashtag-input {
          width: 100%;
        }
        
        .general-input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          color: #374151;
          background: white;
          transition: all 0.2s ease;
        }
        
        .general-input-field:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .general-input-field:disabled {
          background: #f9fafb;
          border-color: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }
        
        .general-input-field::placeholder {
          color: #9ca3af;
        }
        
        .loading-categories,
        .no-categories {
          text-align: center;
          padding: 2rem;
        }
        
        .loading-spinner {
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .empty-state {
          color: #6b7280;
        }
        
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .empty-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        
        .empty-subtitle {
          font-size: 0.875rem;
        }
        
        .empty-subtitle a {
          color: #6366f1;
          text-decoration: none;
          font-weight: 500;
        }
        
        .empty-subtitle a:hover {
          text-decoration: underline;
        }
        
        .category-sections-list {
          display: grid;
          gap: 1.5rem;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .categorized-hashtag-input {
            gap: 1.5rem;
          }
          
          .category-hashtag-section {
            padding: 1rem;
          }
          
          .category-sections-header {
            padding: 1rem;
          }
          
          .section-title {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
}
