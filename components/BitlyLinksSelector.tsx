// components/BitlyLinksSelector.tsx
// WHAT: Reusable Bitly links selector with search input and chip display
// WHY: Provides consistent UX for Bitly link selection with multi-select support
// PATTERN: Similar to UnifiedHashtagInput - search input with multiple chips
// USAGE: Partner management, project forms, or any context requiring Bitly link association

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import styles from './BitlyLinksSelector.module.css';

// WHAT: Type definitions for Bitly link data
// WHY: Type safety for link selection and display
interface BitlyLink {
  _id: string;
  bitlink: string;
  title: string;
  long_url: string;
}

interface BitlyLinksSelectorProps {
  // WHAT: Array of currently selected link IDs
  selectedLinkIds: string[];
  // WHAT: Callback when selection changes
  // WHY: Parent component needs to handle the selection updates
  onChange: (linkIds: string[]) => void;
  // WHAT: Optional placeholder text for input
  placeholder?: string;
  // WHAT: Optional flag to disable the selector
  disabled?: boolean;
  // WHAT: DEPRECATED - no longer used (server-side search instead)
  availableLinks?: BitlyLink[];
}

// WHAT: Main BitlyLinksSelector component with SERVER-SIDE search
// WHY: Loading 3000+ links client-side causes slow initial load and empty results
// HOW: Input field searches via API → displays results → add chips when selected
export default function BitlyLinksSelector({
  selectedLinkIds,
  onChange,
  placeholder = 'Search Bitly links...',
  disabled = false
}: BitlyLinksSelectorProps) {
  // WHAT: Component state for search and dropdown
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<BitlyLink[]>([]);
  const [selectedLinksData, setSelectedLinksData] = useState<BitlyLink[]>([]);
  
  // WHAT: Refs for click-outside detection and keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // WHAT: Fetch selected links data on mount
  // WHY: Need bitlink and title to display chips for already-selected IDs
  useEffect(() => {
    if (selectedLinkIds.length === 0) {
      setSelectedLinksData([]);
      return;
    }
    
    // WHAT: Fetch only selected links to display as chips
    // WHY: Efficient - only load what we need for display
    const fetchSelectedLinks = async () => {
      try {
        const response = await fetch(`/api/bitly/links?includeUnassigned=true&limit=1000`);
        const data = await response.json();
        if (data.success && data.links) {
          const selected = data.links
            .filter((link: any) => selectedLinkIds.includes(link._id))
            .map((link: any) => ({
              _id: link._id,
              bitlink: link.bitlink,
              title: link.title || 'Untitled',
              long_url: link.long_url
            }));
          setSelectedLinksData(selected);
        }
      } catch (err) {
        console.error('Failed to load selected Bitly links:', err);
      }
    };
    
    fetchSelectedLinks();
  }, [selectedLinkIds]);

  // WHAT: Server-side search when user types
  // WHY: Handles 3000+ links without loading all client-side
  const searchBitlyLinks = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await fetch(
        `/api/bitly/links?search=${encodeURIComponent(query)}&includeUnassigned=true&limit=20`
      );
      const data = await response.json();
      
      if (data.success && data.links) {
        // WHAT: Filter out already-selected links
        const unselected = data.links
          .filter((link: any) => !selectedLinkIds.includes(link._id))
          .map((link: any) => ({
            _id: link._id,
            bitlink: link.bitlink,
            title: link.title || 'Untitled',
            long_url: link.long_url
          }));
        setSearchResults(unselected);
      }
    } catch (err) {
      console.error('Bitly search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [selectedLinkIds]);

  // WHAT: Trigger search when debounced query changes
  useEffect(() => {
    if (isDropdownOpen && debouncedSearch) {
      searchBitlyLinks(debouncedSearch);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch, isDropdownOpen, searchBitlyLinks]);

  // WHAT: Handle click outside to close dropdown
  // WHY: Standard UX pattern - close dropdown when clicking elsewhere
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // WHAT: Handle link selection from dropdown
  // WHY: Add to selection array, add to local chip data, and clear search
  const handleSelectLink = (e: React.MouseEvent, link: BitlyLink) => {
    e.preventDefault();
    e.stopPropagation();
    onChange([...selectedLinkIds, link._id]);
    setSelectedLinksData(prev => [...prev, link]);
    setSearchQuery('');
    setSearchResults([]);
    setFocusedIndex(-1);
    // WHAT: Keep dropdown open after selection
    // WHY: Allow adding multiple links in succession
    inputRef.current?.focus();
  };

  // WHAT: Handle removing a selected link (click X on chip)
  // WHY: Remove from selection array and local chip data
  const handleRemoveLink = (e: React.MouseEvent, linkId: string) => {
    e.stopPropagation();
    onChange(selectedLinkIds.filter(id => id !== linkId));
    setSelectedLinksData(prev => prev.filter(link => link._id !== linkId));
  };

  // WHAT: Handle input focus to show dropdown
  // WHY: Show available links when user clicks input
  const handleInputFocus = () => {
    if (!disabled) {
      setIsDropdownOpen(true);
    }
  };

  // WHAT: Handle keyboard navigation in dropdown
  // WHY: Accessibility - allow keyboard-only link selection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      // WHAT: Open dropdown on any key when closed
      if (e.key.length === 1 || e.key === 'ArrowDown') {
        setIsDropdownOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && searchResults[focusedIndex]) {
          handleSelectLink(e as unknown as React.MouseEvent, searchResults[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {/* WHAT: Display selected links as removable chips
       * WHY: Visual feedback showing selected links with remove option */}
      {selectedLinksData.length > 0 && (
        <div className={styles.chipsContainer}>
          {selectedLinksData.map(link => (
            <div key={link._id} className={`${styles.linkChip} ${disabled ? styles.disabled : ''}`}>
              <span className={styles.chipLabel} title={link.title}>
                {link.bitlink}
              </span>
              {!disabled && (
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={(e) => handleRemoveLink(e, link._id)}
                  title={`Remove ${link.bitlink}`}
                  aria-label={`Remove ${link.bitlink}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* WHAT: Search input for adding more links
       * WHY: Allow user to search and select Bitly links */}
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsDropdownOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedLinksData.length > 0 ? 'Add more links...' : placeholder}
          disabled={disabled}
          autoComplete="off"
        />

        {/* WHAT: Dropdown with server-side search results
         * WHY: Show matching, unselected links from API search */}
        {isDropdownOpen && !isSearching && searchResults.length > 0 && (
          <div className={styles.dropdown}>
            {searchResults.map((link, index) => (
              <div
                key={link._id}
                className={`${styles.dropdownItem} ${index === focusedIndex ? styles.focused : ''}`}
                onClick={(e) => handleSelectLink(e, link)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <div className={styles.linkBitlink}>{link.bitlink}</div>
                <div className={styles.linkTitle}>{link.title}</div>
              </div>
            ))}
          </div>
        )}

        {/* WHAT: Show loading indicator while searching
         * WHY: User feedback during async search */}
        {isDropdownOpen && isSearching && (
          <div className={styles.dropdown}>
            <div className={styles.noResults}>
              🔍 Searching...
            </div>
          </div>
        )}

        {/* WHAT: Show "type to search" hint when dropdown opens
         * WHY: Inform user that they need to type at least 2 characters */}
        {isDropdownOpen && !searchQuery && !isSearching && (
          <div className={styles.dropdown}>
            <div className={styles.noResults}>
              💡 Type at least 2 characters to search (e.g., "fanselfie")
            </div>
          </div>
        )}

        {/* WHAT: Show "no results" message when search returns empty
         * WHY: User feedback - clarify why dropdown is empty */}
        {isDropdownOpen && searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
          <div className={styles.dropdown}>
            <div className={styles.noResults}>
              No matching links found for "{searchQuery}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
