'use client';

/**
 * UnifiedHashtagInput.tsx
 * 
 * A simplified unified hashtag input component that completely eliminates
 * infinite re-render issues through minimal dependencies and direct operations.
 * 
 * Version: 2.0.0 - Stable
 * Last Updated: 2025-08-29
 */

import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import type { HashtagCategory } from '@/lib/hashtagCategoryTypes';
import type { HashtagSuggestion, HashtagWithCount } from '@/lib/types/hashtags';
import { normalizeHashtagResponse } from '@/lib/types/hashtags';
import ColoredHashtagBubble from './ColoredHashtagBubble';

interface UnifiedHashtagInputProps {
  // Traditional hashtags (General section)
  generalHashtags: string[];
  onGeneralChange: (hashtags: string[]) => void;
  
  // Category-based hashtags
  categorizedHashtags: { [categoryName: string]: string[] };
  onCategorizedChange: (categorized: { [categoryName: string]: string[] }) => void;
  
  // Configuration
  categories?: HashtagCategory[];
  disabled?: boolean;
  placeholder?: string;
}

export default function UnifiedHashtagInput({
  generalHashtags = [],
  onGeneralChange,
  categorizedHashtags = {},
  onCategorizedChange,
  categories = [],
  disabled = false,
  placeholder = "Search or add hashtags..."
}: UnifiedHashtagInputProps) {
  // Single input state - no complex dependencies
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [suggestions, setSuggestions] = useState<HashtagSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // Categories state - auto-load if not provided
  const [loadedCategories, setLoadedCategories] = useState<HashtagCategory[]>(categories);
  
  // Simple refs - no useEffect dependencies
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>('');
  
  // Auto-load categories if none provided
  useEffect(() => {
    if (categories.length === 0) {
      loadCategories();
    } else {
      setLoadedCategories(categories);
    }
  }, [categories]);
  
  // Load categories from API
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/hashtag-categories');
      const data = await response.json();
      
      if (data.success) {
        const sortedCategories = (data.categories || []).sort((a: HashtagCategory, b: HashtagCategory) => 
          a.order - b.order
        );
        setLoadedCategories(sortedCategories);
      } else {
        console.error('Failed to load categories:', data.error);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };
  
  // Direct function - no useCallback dependencies
  const getAllExistingHashtags = () => {
    const allHashtags = new Set([...generalHashtags]);
    Object.values(categorizedHashtags).forEach(categoryHashtags => {
      categoryHashtags.forEach(hashtag => allHashtags.add(hashtag));
    });
    return Array.from(allHashtags);
  };
  
  // Direct fetch function - no complex dependencies
  const fetchSuggestions = async (search: string) => {
    if (search.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    if (search === lastSearchRef.current) {
      return;
    }
    
    lastSearchRef.current = search;
    
    try {
      const response = await fetch(`/api/hashtags?search=${encodeURIComponent(search)}`);
      const data = await response.json();
      
      if (data.success) {
        // WHAT: Normalize API response to handle both string[] and HashtagWithCount[] formats
        // WHY: Different endpoints return different shapes; normalization ensures consistency
        const hashtagStrings = normalizeHashtagResponse(data.hashtags);
        
        // Get hashtags in current category only
        const currentCategoryHashtags = selectedCategory === 'general' 
          ? generalHashtags 
          : (categorizedHashtags[selectedCategory] || []);
          
        const existingSuggestions: HashtagSuggestion[] = hashtagStrings
          .filter((tag: string) => !currentCategoryHashtags.includes(tag))
          .map((tag: string) => ({ hashtag: tag, isExisting: true }));
        
        const cleanedInput = search.replace(/^#/, '').toLowerCase().trim();
        const isValidInput = /^[a-z0-9_]+$/.test(cleanedInput);
        const inputNotInExisting = !hashtagStrings.includes(cleanedInput);
        const inputNotInCurrentCategory = !currentCategoryHashtags.includes(cleanedInput);
        
        let allSuggestions = existingSuggestions;
        
        if (isValidInput && inputNotInExisting && inputNotInCurrentCategory && cleanedInput) {
          allSuggestions = [
            { hashtag: cleanedInput, isExisting: false },
            ...existingSuggestions
          ];
        }
        
        setSuggestions(allSuggestions.slice(0, 8));
        setShowSuggestions(allSuggestions.length > 0);
      }
    } catch (error) {
      console.error('Failed to fetch hashtag suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  // Input handler with direct debouncing - no useEffect
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedSuggestionIndex(-1);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    const search = newValue.trim();
    
    if (search.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      lastSearchRef.current = '';
      return;
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(search);
    }, 300);
  };
  
  const addHashtag = async (hashtag: string) => {
    try {
      // Validate hashtag with API
      const response = await fetch('/api/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtag })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const cleanedHashtag = data.hashtag;
        
        // Check if hashtag already exists in the current category only
        if (selectedCategory === 'general') {
          if (generalHashtags.includes(cleanedHashtag)) {
            alert(`Hashtag "${cleanedHashtag}" already exists in general hashtags.`);
            return;
          }
          // Add to general hashtags
          onGeneralChange([...generalHashtags, cleanedHashtag]);
        } else {
          // Check if hashtag already exists in this specific category
          const currentCategoryHashtags = categorizedHashtags[selectedCategory] || [];
          if (currentCategoryHashtags.includes(cleanedHashtag)) {
            alert(`Hashtag "${cleanedHashtag}" already exists in ${selectedCategory} category.`);
            return;
          }
          
          // Add to specific category
          const currentCategorized = { ...categorizedHashtags };
          currentCategorized[selectedCategory] = [...currentCategoryHashtags, cleanedHashtag];
          onCategorizedChange(currentCategorized);
        }
        
        setInputValue('');
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      } else {
        alert(data.error || 'Invalid hashtag format');
      }
    } catch (error) {
      console.error('Failed to add hashtag:', error);
      alert('Failed to add hashtag');
    }
  };
  
  const removeHashtag = (hashtag: string, category: string) => {
    if (category === 'general') {
      const newHashtags = generalHashtags.filter(h => h !== hashtag);
      onGeneralChange(newHashtags);
    } else {
      const currentCategorized = { ...categorizedHashtags };
      const currentCategoryHashtags = currentCategorized[category] || [];
      currentCategorized[category] = currentCategoryHashtags.filter(h => h !== hashtag);
      
      // Remove empty categories
      if (currentCategorized[category].length === 0) {
        delete currentCategorized[category];
      }
      
      onCategorizedChange(currentCategorized);
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        addHashtag(suggestions[selectedSuggestionIndex].hashtag);
      } else if (inputValue.trim()) {
        addHashtag(inputValue.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };
  
  const handleSuggestionClick = (hashtag: string) => {
    addHashtag(hashtag);
  };
  
  const handleInputFocus = () => {
    // Only show suggestions if we have 3+ characters
    if (inputValue.trim().length >= 3) {
      setShowSuggestions(suggestions.length > 0);
    }
  };
  
  const handleInputBlur = () => {
    // Delay to allow suggestion clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      lastSearchRef.current = '';
    }, 200);
  };
  
  const getCurrentCategoryColor = () => {
    if (selectedCategory === 'general') return '#667eea'; // Default color
    const category = loadedCategories.find(cat => cat.name === selectedCategory);
    return category?.color || '#667eea';
  };
  
  const renderHashtagGroup = (title: string, hashtags: string[], categoryName: string, categoryColor?: string) => {
    // WHAT: Sanitize incoming hashtags to ensure they are strings only.
    // WHY: Prevent React child errors when any downstream code accidentally injects objects like {hashtag,count}.
    const safeHashtags = normalizeHashtagResponse(hashtags);

    if (safeHashtags.length === 0) return null;
    
    return (
      <div className="hashtag-group hashtag-group-spacing">
        <div className="group-header">
          <div className="group-info">
            {categoryColor && (
              <div 
                className="category-indicator"
                // WHAT: Dynamic category color for visual distinction
                // WHY: Each category has a unique color stored in MongoDB
                // eslint-disable-next-line react/forbid-dom-props
                style={{ backgroundColor: (typeof categoryColor === 'string' && categoryColor.trim()) ? categoryColor.trim() : '#667eea' }}
              />
            )}
            <label className="group-label">{title}</label>
            <span className="group-count">({safeHashtags.length})</span>
          </div>
        </div>
        <div className="hashtag-bubbles">
              {safeHashtags.map((hashtag, index) => (
                <ColoredHashtagBubble 
                  key={index}
                  hashtag={hashtag}
                  categoryColor={categoryColor}
                  small={true}
                  // WHAT: Custom fontSize/fontWeight for compact display
                  // WHY: ColoredHashtagBubble supports customStyle prop for flexible sizing
                  // eslint-disable-next-line react/forbid-dom-props
                  customStyle={{
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                  removable={!disabled}
                  onRemove={() => removeHashtag(hashtag, categoryName)}
                  projectCategorizedHashtags={categorizedHashtags}
                  autoResolveColor={true}
                />
              ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="unified-hashtag-input">
      {/* Control Panel */}
      <div className="control-panel">
        <div className="category-selector">
          <label className="selector-label">Add hashtag to:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={disabled}
            className="category-select"
            // WHAT: Dynamic border/background based on selected category color
            // WHY: Visual feedback showing which category is currently active
            // eslint-disable-next-line react/forbid-dom-props
            style={{ 
              borderColor: getCurrentCategoryColor(),
              background: `linear-gradient(135deg, ${getCurrentCategoryColor()}10, ${getCurrentCategoryColor()}05)`
            }}
          >
            <option value="general">📝 General Hashtags</option>
            {loadedCategories.map((category) => (
              <option key={category.name} value={category.name}>
                🏷️ {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="input-container">
          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              disabled={disabled}
              placeholder={placeholder}
              className="hashtag-input"
              autoComplete="off"
              // WHAT: Dynamic border/shadow to match selected category color
              // WHY: Consistent visual feedback - input color matches category
              // eslint-disable-next-line react/forbid-dom-props
              style={{ 
                borderColor: getCurrentCategoryColor(),
                boxShadow: `0 0 0 1px ${getCurrentCategoryColor()}20`
              }}
            />
          </div>
          
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionsRef} className="hashtag-suggestions">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.hashtag}
                  className={`hashtag-suggestion ${
                    index === selectedSuggestionIndex ? 'selected' : ''
                  } ${suggestion.isExisting ? 'existing' : 'new'}`}
                  onClick={() => handleSuggestionClick(suggestion.hashtag)}
                  // WHAT: Dynamic left border color for suggestion item
                  // WHY: Shows which category the hashtag will be added to
                  // eslint-disable-next-line react/forbid-dom-props
                  style={{ 
                    borderLeftColor: getCurrentCategoryColor()
                  }}
                >
                  <span className="hashtag-suggestion-text">
                    #{suggestion.hashtag}
                  </span>
                  <span className="hashtag-suggestion-label">
                    {suggestion.isExisting ? 'existing' : 'new'}
                  </span>
                  <span className="target-category">
                    → {selectedCategory === 'general' ? 'General' : selectedCategory}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Hashtag Display Groups */}
      <div className="hashtag-groups">
        {/* General Hashtags */}
        {renderHashtagGroup('General Hashtags', generalHashtags, 'general')}
        
        {/* Category-Specific Hashtags */}
        {Object.entries(categorizedHashtags).map(([categoryName, hashtags]) => {
          const category = loadedCategories.find(cat => cat.name === categoryName);
          const categoryColor = category?.color;
          const displayName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
          
          return (
            <div key={categoryName}>
              {renderHashtagGroup(
                `${displayName} Hashtags`,
                hashtags,
                categoryName,
                categoryColor
              )}
            </div>
          );
        })}
      </div>
      
      <style jsx>{`
        .unified-hashtag-input {
          display: grid;
          gap: 1.5rem;
        }
        
        .control-panel {
          display: grid;
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .category-selector {
          display: grid;
          gap: 0.5rem;
        }
        
        .selector-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }
        
        .category-select {
          padding: 0.75rem 1rem;
          font-size: 1rem;
          border: 2px solid;
          border-radius: 8px;
          background: white;
          color: #1a202c;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .category-select:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .category-select:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }
        
        .input-container {
          position: relative;
        }
        
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .hashtag-input {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          border: 2px solid;
          border-radius: 8px;
          background: white;
          color: #1a202c;
          transition: all 0.2s ease;
        }
        
        .hashtag-input:focus {
          outline: none;
          transform: translateY(-1px);
        }
        
        .hashtag-input::placeholder {
          color: #9ca3af;
        }
        
        .input-loading {
          position: absolute;
          right: 1rem;
          font-size: 0.875rem;
        }
        
        .hashtag-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid rgba(229, 231, 235, 0.8);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          max-height: 300px;
          overflow-y: auto;
          margin-top: 4px;
        }
        
        .hashtag-suggestion {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        
        .hashtag-suggestion:hover,
        .hashtag-suggestion.selected {
          background: rgba(102, 126, 234, 0.05);
          border-left-color: currentColor;
        }
        
        .hashtag-suggestion-text {
          font-weight: 500;
          color: #1a202c;
        }
        
        .hashtag-suggestion-label {
          font-size: 0.75rem;
          color: #6b7280;
          background: rgba(107, 114, 128, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        
        .hashtag-suggestion.new .hashtag-suggestion-label {
          background: rgba(34, 197, 94, 0.1);
          color: #059669;
        }
        
        .hashtag-suggestion.existing .hashtag-suggestion-label {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }
        
        .target-category {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }
        
        .hashtag-groups {
          display: grid;
          gap: 1.5rem;
        }
        
        .hashtag-group {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(229, 231, 235, 0.5);
          border-radius: 8px;
        }
        
        .group-header {
          margin-bottom: 0.75rem;
        }
        
        .group-info {
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
        
        .group-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }
        
        .group-count {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }
        
        .hashtag-bubbles {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        
        /* Responsive design */
        @media (max-width: 768px) {
          .control-panel {
            padding: 1rem;
          }
          
          .hashtag-suggestion {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
}
