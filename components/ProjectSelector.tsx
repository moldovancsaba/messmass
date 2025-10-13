// components/ProjectSelector.tsx
// WHAT: Reusable project selector with search input and chip display
// WHY: Provides consistent UX for project selection across the application
// PATTERN: Similar to UnifiedHashtagInput - search input transforms to chip when selected
// USAGE: Can be used in tables, forms, or any context requiring project selection

'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ProjectSelector.module.css';

// WHAT: Type definitions for project data
// WHY: Type safety for project selection and display
interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
}

interface ProjectSelectorProps {
  // WHAT: Currently selected project (if any)
  selectedProjectId: string | null;
  // WHAT: List of all available projects for selection
  projects: Project[];
  // WHAT: Callback when project is selected or cleared
  // WHY: Parent component needs to handle the selection change
  onChange: (projectId: string | null) => void;
  // WHAT: Optional placeholder text for input
  placeholder?: string;
  // WHAT: Optional flag to disable the selector
  disabled?: boolean;
}

// WHAT: Main ProjectSelector component
// WHY: Centralized, reusable component for project selection with search
// HOW: Input field with autocomplete → transforms to chip when selected
export default function ProjectSelector({
  selectedProjectId,
  projects,
  onChange,
  placeholder = 'Search projects...',
  disabled = false
}: ProjectSelectorProps) {
  // WHAT: Component state for search and dropdown
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  // WHAT: Refs for click-outside detection and keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // WHAT: Find the currently selected project object
  // WHY: Need project details (name, date) to display in chip
  const selectedProject = selectedProjectId 
    ? projects.find(p => p._id === selectedProjectId) 
    : null;

  // WHAT: Filter projects based on search query
  // WHY: Show only matching projects in dropdown for easier selection
  const filteredProjects = projects.filter(project =>
    project.eventName.toLowerCase().includes(searchQuery.toLowerCase())
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

  // WHAT: Handle project selection from dropdown
  // WHY: Update parent component and close dropdown
  const handleSelectProject = (projectId: string) => {
    onChange(projectId);
    setIsDropdownOpen(false);
    setSearchQuery('');
    setFocusedIndex(-1);
  };

  // WHAT: Handle removing selected project (click X on chip)
  // WHY: Clear selection and return to input state
  const handleRemoveProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchQuery('');
    // WHAT: Focus input after removing chip
    // WHY: Better UX - user can immediately start typing
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // WHAT: Handle input focus to show dropdown
  // WHY: Show available projects when user clicks input
  const handleInputFocus = () => {
    if (!disabled) {
      setIsDropdownOpen(true);
    }
  };

  // WHAT: Handle keyboard navigation in dropdown
  // WHY: Accessibility - allow keyboard-only project selection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredProjects.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredProjects[focusedIndex]) {
          handleSelectProject(filteredProjects[focusedIndex]._id);
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

  // WHAT: Render chip when project is selected
  // WHY: Visual feedback showing selected project with remove option
  if (selectedProject) {
    return (
      <div className={styles.chipContainer}>
        <div className={`${styles.projectChip} ${disabled ? styles.disabled : ''}`}>
          <span className={styles.chipLabel}>
            {selectedProject.eventName}
          </span>
          {!disabled && (
            <button
              type="button"
              className={styles.chipRemove}
              onClick={handleRemoveProject}
              title="Remove project"
              aria-label={`Remove ${selectedProject.eventName}`}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  // WHAT: Render search input when no project selected
  // WHY: Allow user to search and select a project
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

      {/* WHAT: Dropdown with filtered project results
       * WHY: Show matching projects for selection */}
      {isDropdownOpen && filteredProjects.length > 0 && (
        <div className={styles.dropdown}>
          {filteredProjects.map((project, index) => (
            <div
              key={project._id}
              className={`${styles.dropdownItem} ${index === focusedIndex ? styles.focused : ''}`}
              onClick={() => handleSelectProject(project._id)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              <div className={styles.projectName}>{project.eventName}</div>
              <div className={styles.projectDate}>
                {new Date(project.eventDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WHAT: Show "no results" message when search has no matches
       * WHY: User feedback when filter returns empty */}
      {isDropdownOpen && searchQuery && filteredProjects.length === 0 && (
        <div className={styles.dropdown}>
          <div className={styles.noResults}>
            No projects found matching &quot;{searchQuery}&quot;
          </div>
        </div>
      )}
    </div>
  );
}
