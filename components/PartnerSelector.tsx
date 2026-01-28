// components/PartnerSelector.tsx
// WHAT: Reusable partner selector with search input and chip display
// WHY: Provides consistent UX for partner selection across the application
// PATTERN: Similar to ProjectSelector - search input transforms to chip when selected
// USAGE: Can be used in forms, especially for Sports Match Builder

'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './PartnerSelector.module.css';

// WHAT: Type definitions for partner data
// WHY: Type safety for partner selection and display
interface Partner {
  _id: string;
  name: string;
  emoji: string;
}

interface PartnerSelectorProps {
  // WHAT: Currently selected partner (if any)
  selectedPartnerId: string | null;
  // WHAT: List of all available partners for selection
  partners: Partner[];
  // WHAT: Callback when partner is selected or cleared
  // WHY: Parent component needs to handle the selection change
  onChange: (partnerId: string | null) => void;
  // WHAT: Optional placeholder text for input
  placeholder?: string;
  // WHAT: Optional flag to disable the selector
  disabled?: boolean;
  // WHAT: Label for the selector (e.g., "Home Team", "Away Team")
  label?: string;
}

// WHAT: Main PartnerSelector component
// WHY: Centralized, reusable component for partner selection with search
// HOW: Input field with autocomplete → transforms to chip when selected
export default function PartnerSelector({
  selectedPartnerId,
  partners,
  onChange,
  placeholder = 'Search partners...',
  disabled = false,
  label
}: PartnerSelectorProps) {
  // WHAT: Component state for search and dropdown
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  // WHAT: Refs for click-outside detection and keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // WHAT: Find the currently selected partner object
  // WHY: Need partner details (name, emoji) to display in chip
  const selectedPartner = selectedPartnerId 
    ? partners.find(p => p._id === selectedPartnerId) 
    : null;

  // WHAT: Filter partners based on search query
  // WHY: Show only matching partners in dropdown for easier selection
  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // WHAT: Handle partner selection from dropdown
  // WHY: Update parent component and close dropdown
  const handleSelectPartner = (e: React.MouseEvent, partnerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(partnerId);
    setIsDropdownOpen(false);
    setSearchQuery('');
    setFocusedIndex(-1);
  };

  // WHAT: Handle removing selected partner (click X on chip)
  // WHY: Clear selection and return to input state
  const handleRemovePartner = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchQuery('');
    // WHAT: Focus input after removing chip
    // WHY: Better UX - user can immediately start typing
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // WHAT: Handle input focus to show dropdown
  // WHY: Show available partners when user clicks input
  const handleInputFocus = () => {
    if (!disabled) {
      setIsDropdownOpen(true);
    }
  };

  // WHAT: Handle keyboard navigation in dropdown
  // WHY: Accessibility - allow keyboard-only partner selection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredPartners.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredPartners[focusedIndex]) {
          // WHAT: Cast keyboard event to mouse event for type compatibility
          // WHY: handleSelectPartner expects MouseEvent for preventDefault
          handleSelectPartner(e as unknown as React.MouseEvent, filteredPartners[focusedIndex]._id);
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

  // WHAT: Render chip when partner is selected
  // WHY: Visual feedback showing selected partner with remove option
  if (selectedPartner) {
    return (
      <div className={styles.chipContainer}>
        <div className={`${styles.partnerChip} ${disabled ? styles.disabled : ''}`}>
          <span className={styles.chipEmoji}>{selectedPartner.showEmoji !== false ? selectedPartner.emoji : ''}</span>
          <span className={styles.chipLabel}>
            {selectedPartner.name}
          </span>
          {!disabled && (
            <button
              type="button"
              className={styles.chipRemove}
              onClick={handleRemovePartner}
              title="Remove partner"
              aria-label={`Remove ${selectedPartner.name}`}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  // WHAT: Render search input when no partner selected
  // WHY: Allow user to search and select a partner
  return (
    <div className={styles.container} ref={containerRef}>
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
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />

      {/* WHAT: Dropdown with filtered partner results
       * WHY: Show matching partners for selection */}
      {isDropdownOpen && filteredPartners.length > 0 && (
        <div className={styles.dropdown}>
          {filteredPartners.map((partner, index) => (
            <div
              key={partner._id}
              className={`${styles.dropdownItem} ${index === focusedIndex ? styles.focused : ''}`}
              onClick={(e) => handleSelectPartner(e, partner._id)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              <span className={styles.partnerEmoji}>{partner.showEmoji !== false ? partner.emoji : ''}</span>
              <span className={styles.partnerName}>{partner.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* WHAT: Show "no results" message when search has no matches
       * WHY: User feedback when filter returns empty */}
      {isDropdownOpen && searchQuery && filteredPartners.length === 0 && (
        <div className={styles.dropdown}>
          <div className={styles.noResults}>
            No partners found matching &quot;{searchQuery}&quot;
          </div>
        </div>
      )}
    </div>
  );
}
