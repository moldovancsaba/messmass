'use client';

import React, { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';

interface HashtagInputProps {
  value: string[];
  onChange: (hashtags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  maxTags?: number;
}

interface HashtagSuggestion {
  hashtag: string;
  isExisting: boolean;
}

export default function HashtagInput({ 
  value = [], 
  onChange, 
  disabled = false, 
  placeholder = "Add hashtags...",
  maxTags = 999 // Effectively unlimited
}: HashtagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<HashtagSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Fetch hashtag suggestions
  const fetchSuggestions = useCallback(async (search: string) => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/hashtags?search=${encodeURIComponent(search)}`);
      const data = await response.json();
      
      if (data.success) {
        const existingSuggestions: HashtagSuggestion[] = data.hashtags
          .filter((hashtag: string) => !value.includes(hashtag))
          .map((hashtag: string) => ({ hashtag, isExisting: true }));
        
        // Add the current input as a new suggestion if it's not in existing hashtags
        const cleanedInput = search.replace(/^#/, '').toLowerCase().trim();
        const isValidInput = /^[a-z0-9_]+$/.test(cleanedInput);
        const inputNotInExisting = !data.hashtags.includes(cleanedInput);
        const inputNotInSelected = !value.includes(cleanedInput);
        
        let allSuggestions = existingSuggestions;
        
        if (isValidInput && inputNotInExisting && inputNotInSelected && cleanedInput) {
          allSuggestions = [
            { hashtag: cleanedInput, isExisting: false },
            ...existingSuggestions
          ];
        }
        
        setSuggestions(allSuggestions.slice(0, 8)); // Limit to 8 suggestions
      }
    } catch (error) {
      console.error('Failed to fetch hashtag suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [value]);
  
  // Debounced suggestion fetching
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue.trim()) {
        fetchSuggestions(inputValue);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [inputValue, value, fetchSuggestions]);
  
  const addHashtag = async (hashtag: string) => {
    // Remove the hashtag limit check
    
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
        if (!value.includes(cleanedHashtag)) {
          onChange([...value, cleanedHashtag]);
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
  
  const removeHashtag = (index: number) => {
    const newHashtags = value.filter((_, i) => i !== index);
    onChange(newHashtags);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedSuggestionIndex(-1);
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
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last hashtag if input is empty
      removeHashtag(value.length - 1);
    }
  };
  
  const handleSuggestionClick = (hashtag: string) => {
    addHashtag(hashtag);
  };
  
  const handleInputFocus = () => {
    if (inputValue.trim()) {
      setShowSuggestions(true);
    }
  };
  
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };
  
  return (
    <div className="hashtag-input-container">
      <div className="hashtag-input-wrapper">
        <div className="hashtag-tags">
          {value.map((hashtag, index) => (
            <span key={index} className="hashtag-tag">
              #{hashtag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeHashtag(index)}
                  className="hashtag-remove"
                  aria-label={`Remove ${hashtag}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          placeholder={value.length === 0 ? placeholder : ''}
          className="hashtag-input"
          autoComplete="off"
        />
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="hashtag-suggestions">
          {loading && (
            <div className="hashtag-suggestion loading">
              Searching...
            </div>
          )}
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.hashtag}
              className={`hashtag-suggestion ${
                index === selectedSuggestionIndex ? 'selected' : ''
              } ${suggestion.isExisting ? 'existing' : 'new'}`}
              onClick={() => handleSuggestionClick(suggestion.hashtag)}
            >
              <span className="hashtag-suggestion-text">
                #{suggestion.hashtag}
              </span>
              <span className="hashtag-suggestion-label">
                {suggestion.isExisting ? 'existing' : 'new'}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Removed hashtag limit warning */}
    </div>
  );
}
