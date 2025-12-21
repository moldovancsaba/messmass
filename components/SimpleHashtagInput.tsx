'use client';

/**
 * SimpleHashtagInput.tsx
 * 
 * Ultra-simple hashtag input with zero complex dependencies.
 * No useEffect, no useCallback, no complex state management.
 * 
 * Version: 3.0.0 - Ultra Stable
 */

import React, { useState } from 'react';
import ColoredHashtagBubble from './ColoredHashtagBubble';

interface SimpleHashtagInputProps {
  generalHashtags: string[];
  onGeneralChange: (hashtags: string[]) => void;
  categorizedHashtags: { [categoryName: string]: string[] };
  onCategorizedChange: (categorized: { [categoryName: string]: string[] }) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function SimpleHashtagInput({
  generalHashtags = [],
  onGeneralChange,
  categorizedHashtags = {},
  onCategorizedChange,
  disabled = false,
  placeholder = "Type hashtag and press Enter..."
}: SimpleHashtagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');

  // Fixed categories - no API calls to avoid complexity
  const categories = [
    { name: 'city', color: '#667eea' },
    { name: 'event', color: '#764ba2' },
    { name: 'year', color: '#f093fb' },
    { name: 'status', color: '#43e97b' }
  ];

  const addHashtag = () => {
    const hashtag = inputValue.trim().toLowerCase().replace(/^#/, '');
    
    if (!hashtag) return;
    
    // Simple validation
    if (!/^[a-z0-9_]+$/.test(hashtag)) {
      alert('Hashtag can only contain lowercase letters, numbers, and underscores');
      return;
    }

    // Check duplicates
    const allExisting = [
      ...generalHashtags,
      ...Object.values(categorizedHashtags).flat()
    ];
    
    if (allExisting.includes(hashtag)) {
      alert('Hashtag already exists');
      return;
    }

    // Add to selected category
    if (selectedCategory === 'general') {
      onGeneralChange([...generalHashtags, hashtag]);
    } else {
      const updated = { ...categorizedHashtags };
      updated[selectedCategory] = [...(updated[selectedCategory] || []), hashtag];
      onCategorizedChange(updated);
    }

    setInputValue('');
  };

  const removeHashtag = (hashtag: string, category: string) => {
    if (category === 'general') {
      onGeneralChange(generalHashtags.filter(h => h !== hashtag));
    } else {
      const updated = { ...categorizedHashtags };
      updated[category] = updated[category].filter(h => h !== hashtag);
      if (updated[category].length === 0) {
        delete updated[category];
      }
      onCategorizedChange(updated);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHashtag();
    }
  };

  const getCurrentCategoryColor = () => {
    if (selectedCategory === 'general') return '#667eea';
    return categories.find(c => c.name === selectedCategory)?.color || '#667eea';
  };

  return (
    <div className="simple-hashtag-input">
      {/* Control Panel */}
      <div className="control-panel">
        <div className="category-selector">
          <label>Add hashtag to:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={disabled}
            // WHAT: Dynamic border/background based on selected category
            // WHY: Visual feedback showing active category for new hashtag
            // eslint-disable-next-line react/forbid-dom-props
            style={{ 
              borderColor: getCurrentCategoryColor(),
              background: `${getCurrentCategoryColor()}10`
            }}
          >
            <option value="general">📝 General Hashtags</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                🏷️ {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="input-section">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            // WHAT: Dynamic border/shadow to match selected category color
            // WHY: Consistent visual feedback - input color matches category
            // eslint-disable-next-line react/forbid-dom-props
            style={{ 
              borderColor: getCurrentCategoryColor(),
              boxShadow: `0 0 0 1px ${getCurrentCategoryColor()}20`
            }}
          />
          <button 
            onClick={addHashtag}
            disabled={disabled || !inputValue.trim()}
            // WHAT: Dynamic button color + opacity based on category + disabled state
            // WHY: Button matches category color; opacity shows disabled state
            // eslint-disable-next-line react/forbid-dom-props
            style={{ 
              backgroundColor: getCurrentCategoryColor(),
              opacity: (!inputValue.trim() || disabled) ? 0.5 : 1
            }}
          >
            Add to {selectedCategory === 'general' ? 'General' : selectedCategory}
          </button>
        </div>
      </div>

      {/* Display Groups */}
      <div className="hashtag-groups">
        {/* General Hashtags */}
        {generalHashtags.length > 0 && (
          <div className="hashtag-group">
            <div className="group-header">
              <h4>📝 General Hashtags ({generalHashtags.length})</h4>
            </div>
            <div className="hashtag-bubbles">
              {generalHashtags.map((hashtag, index) => (
                <ColoredHashtagBubble 
                  key={index}
                  hashtag={hashtag}
                  removable={!disabled}
                  onRemove={() => removeHashtag(hashtag, 'general')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category Hashtags */}
        {Object.entries(categorizedHashtags).map(([categoryName, hashtags]) => {
          if (hashtags.length === 0) return null;
          
          const category = categories.find(c => c.name === categoryName);
          const displayName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
          
          return (
            <div key={categoryName} className="hashtag-group">
              <div className="group-header">
                <div className="category-header-flex">
                  <div 
                    // WHAT: Dynamic category color indicator dot
                    // WHY: Shows category color from MongoDB configuration
                    // eslint-disable-next-line react/forbid-dom-props
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: category?.color || '#667eea',
                      borderRadius: '50%'
                    }}
                  />
                  <h4>🏷️ {displayName} Hashtags ({hashtags.length})</h4>
                </div>
              </div>
              <div className="hashtag-bubbles">
                {hashtags.map((hashtag, index) => (
                  <ColoredHashtagBubble 
                    key={index}
                    hashtag={hashtag}
                    categoryColor={category?.color}
                    removable={!disabled}
                    onRemove={() => removeHashtag(hashtag, categoryName)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .simple-hashtag-input {
          display: grid;
          gap: 1.5rem;
        }
        
        .control-panel {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          display: grid;
          gap: 1rem;
        }
        
        .category-selector {
          display: grid;
          gap: 0.5rem;
        }
        
        .category-selector label {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }
        
        .category-selector select {
          padding: 0.75rem;
          border: 2px solid;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .input-section {
          display: flex;
          gap: 0.75rem;
        }
        
        .input-section input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s ease;
        }
        
        .input-section input:focus {
          outline: none;
          transform: translateY(-1px);
        }
        
        .input-section button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .input-section button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
        
        .group-header h4 {
          margin: 0;
          font-size: 0.875rem;
          color: #374151;
        }
        
        .hashtag-bubbles {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        
        @media (max-width: 768px) {
          .input-section {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
