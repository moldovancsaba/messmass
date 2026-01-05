'use client';

import React, { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { apiPost } from '@/lib/apiClient';

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
  const [isActive, setIsActive] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const lastSearchRef = useRef<string>('');
  const valueRef = useRef<string[]>(value);
  
  // Keep valueRef in sync with value prop
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  
  // Fetch hashtag suggestions - only when active and 3+ characters
  const fetchSuggestions = useCallback(async (search: string) => {
    // Only proceed if this input is active and has 3+ characters
    if (!isActive || search.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Don't re-fetch if same search as last time
    if (search === lastSearchRef.current) {
      return;
    }
    
    lastSearchRef.current = search;
    setLoading(true);
    
    try {
      const response = await fetch(`/api/hashtags?search=${encodeURIComponent(search)}`);
      const data = await response.json();
      
      if (data.success) {
        const currentValue = valueRef.current;
        // Normalize API to string[] (API may return {hashtag,count} items)
        const items: any[] = Array.isArray(data.hashtags) ? data.hashtags : [];
        const hashtagStrings: string[] = items
          .map((h: any) => (typeof h === 'string' ? h : h?.hashtag))
          .filter((s: any): s is string => typeof s === 'string' && s.length > 0);

        const existingSuggestions: HashtagSuggestion[] = hashtagStrings
          .filter((hashtag: string) => !currentValue.includes(hashtag))
          .map((hashtag: string) => ({ hashtag, isExisting: true }));
        
        // Add the current input as a new suggestion if it's not in existing hashtags
        const cleanedInput = search.replace(/^#/, '').toLowerCase().trim();
        const isValidInput = /^[a-z0-9_]+$/.test(cleanedInput);
        const inputNotInExisting = !hashtagStrings.includes(cleanedInput);
        const inputNotInSelected = !currentValue.includes(cleanedInput);
        
        let allSuggestions = existingSuggestions;
        
        if (isValidInput && inputNotInExisting && inputNotInSelected && cleanedInput) {
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
    } finally {
      setLoading(false);
    }
  }, [isActive]);
  
  // Only trigger search when input changes and meets criteria
  useEffect(() => {
    if (!isActive) {
      return;
    }
    
    const search = inputValue.trim();
    
    // Clear suggestions if less than 3 characters
    if (search.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      lastSearchRef.current = '';
      return;
    }
    
    // Debounce API calls
    const timeoutId = setTimeout(() => {
      fetchSuggestions(search);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [inputValue, isActive, fetchSuggestions]);
  
  const addHashtag = async (hashtag: string) => {
    // Remove the hashtag limit check
    
    try {
      // WHAT: Use apiPost() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header for POST requests
      const data = await apiPost('/api/hashtags', { hashtag });
      
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
    setIsActive(true);
    
    // Only show suggestions if we have 3+ characters
    if (inputValue.trim().length >= 3) {
      setShowSuggestions(suggestions.length > 0);
    }
  };
  
  const handleInputBlur = () => {
    // Delay to allow suggestion clicks
    setTimeout(() => {
      setIsActive(false);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      lastSearchRef.current = '';
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
