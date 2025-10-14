// components/BitlyLinksSelector.tsx
// WHAT: Reusable Bitly links selector with search input and chip display
// WHY: Provides consistent UX for Bitly link selection with multi-select support
// PATTERN: Similar to UnifiedHashtagInput - search input with multiple chips
// USAGE: Partner management, project forms, or any context requiring Bitly link association

'use client';

import { useState, useRef, useEffect } from 'react';
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
  // WHAT: List of all available Bitly links for selection
  availableLinks: BitlyLink[];
  // WHAT: Callback when selection changes
  // WHY: Parent component needs to handle the selection updates
  onChange: (linkIds: string[]) => void;
  // WHAT: Optional placeholder text for input
  placeholder?: string;
  // WHAT: Optional flag to disable the selector
  disabled?: boolean;
}

// WHAT: Main BitlyLinksSelector component
// WHY: Centralized, reusable component for multi-select Bitly link selection
// HOW: Input field with autocomplete → adds chips when selected → remove chips with X
export default function BitlyLinksSelector({
  selectedLinkIds,
  availableLinks,
  onChange,
  placeholder = 'Search Bitly links...',
  disabled = false
}: BitlyLinksSelectorProps) {
  // WHAT: Component state for search and dropdown
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  // WHAT: Refs for click-outside detection and keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // WHAT: Get selected link objects from IDs
  // WHY: Need link details (bitlink, title) to display in chips
  const selectedLinks = selectedLinkIds
    .map(id => availableLinks.find(link => link._id === id))
    .filter(Boolean) as BitlyLink[];

  // WHAT: Filter links based on search query (exclude already selected)
  // WHY: Show only matching, unselected links in dropdown
  const filteredLinks = availableLinks.filter(link => {
    const isNotSelected = !selectedLinkIds.includes(link._id);
    const matchesSearch = 
      link.bitlink.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.title.toLowerCase().includes(searchQuery.toLowerCase());
    return isNotSelected && matchesSearch;
  });

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
  // WHY: Add to selection array and clear search
  const handleSelectLink = (e: React.MouseEvent, linkId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onChange([...selectedLinkIds, linkId]);
    setSearchQuery('');
    setFocusedIndex(-1);
    // WHAT: Keep dropdown open after selection
    // WHY: Allow adding multiple links in succession
    inputRef.current?.focus();
  };

  // WHAT: Handle removing a selected link (click X on chip)
  // WHY: Remove from selection array
  const handleRemoveLink = (e: React.MouseEvent, linkId: string) => {
    e.stopPropagation();
    onChange(selectedLinkIds.filter(id => id !== linkId));
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
          prev < filteredLinks.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredLinks[focusedIndex]) {
          handleSelectLink(e as unknown as React.MouseEvent, filteredLinks[focusedIndex]._id);
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
      {selectedLinks.length > 0 && (
        <div className={styles.chipsContainer}>
          {selectedLinks.map(link => (
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
          placeholder={selectedLinks.length > 0 ? 'Add more links...' : placeholder}
          disabled={disabled}
          autoComplete="off"
        />

        {/* WHAT: Dropdown with filtered link results
         * WHY: Show matching, unselected links for selection */}
        {isDropdownOpen && filteredLinks.length > 0 && (
          <div className={styles.dropdown}>
            {filteredLinks.map((link, index) => (
              <div
                key={link._id}
                className={`${styles.dropdownItem} ${index === focusedIndex ? styles.focused : ''}`}
                onClick={(e) => handleSelectLink(e, link._id)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <div className={styles.linkBitlink}>{link.bitlink}</div>
                <div className={styles.linkTitle}>{link.title}</div>
              </div>
            ))}
          </div>
        )}

        {/* WHAT: Show "no results" message when search returns empty
         * WHY: User feedback - clarify why dropdown is empty */}
        {isDropdownOpen && searchQuery && filteredLinks.length === 0 && (
          <div className={styles.dropdown}>
            <div className={styles.noResults}>
              No matching links found
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
