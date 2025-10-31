'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './PredictiveFormattingInput.module.css';

/**
 * Predictive Formatting Input Component
 * 
 * WHAT: Dropdown with predictive search for prefix/suffix selection
 * WHY: Professional UX with database-backed options + ability to add new
 * HOW: Filter options on type, show dropdown, allow custom values
 * 
 * FEATURES:
 * - Predictive search (filters as you type)
 * - Add new values (type anything)
 * - Database-backed options list
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Click outside to close
 */

interface PredictiveFormattingInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  label: string;
  className?: string;
}

export default function PredictiveFormattingInput({
  value,
  onChange,
  options,
  placeholder,
  label,
  className = ''
}: PredictiveFormattingInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Update search term when value changes externally
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setSearchTerm(option);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[selectedIndex]);
        } else {
          // Allow custom value (add new)
          onChange(searchTerm);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Apply the current search term as the value (allow custom values)
    setTimeout(() => {
      if (searchTerm !== value) {
        onChange(searchTerm);
      }
    }, 200);
  };

  return (
    <div className={`${styles.predictiveInputContainer} ${className}`}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={styles.input}
          autoComplete="off"
        />
        {isOpen && filteredOptions.length > 0 && (
          <div ref={dropdownRef} className={styles.dropdown}>
            {filteredOptions.map((option, index) => (
              <div
                key={option}
                className={`${styles.dropdownItem} ${
                  index === selectedIndex ? styles.dropdownItemSelected : ''
                }`}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {option || '(empty)'}
              </div>
            ))}
          </div>
        )}
        {isOpen && filteredOptions.length === 0 && searchTerm && (
          <div ref={dropdownRef} className={styles.dropdown}>
            <div
              className={styles.dropdownItemAdd}
              onClick={() => handleOptionClick(searchTerm)}
            >
              ✚ Add "{searchTerm}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
