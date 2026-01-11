'use client';

import React, { useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import styles from './BaseModal.module.css';

/**
 * BaseModal Component
 * 
 * Foundation for all modal dialogs in the MessMass application.
 * Provides consistent behavior, accessibility, and styling across all modals.
 * 
 * Features:
 * - Focus trapping (accessibility)
 * - Escape key handling
 * - Click-outside-to-close
 * - Smooth animations (fade-in/scale)
 * - Size variants (sm, md, lg, xl, full)
 * - ARIA attributes for screen readers
 * - Restore focus on close
 * 
 * Why BaseModal exists:
 * - Eliminates 640+ lines of duplicated modal code across 8+ admin pages
 * - Ensures consistent UX and accessibility standards
 * - Single source of truth for modal behavior
 * - Easy to maintain and extend
 */

export interface BaseModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Modal content */
  children: React.ReactNode;
  
  /** Modal size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /** Show close button (×) in top-right */
  showCloseButton?: boolean;
  
  /** Allow closing by clicking overlay */
  closeOnClickOutside?: boolean;
  
  /** Allow closing with Escape key */
  closeOnEscape?: boolean;
  
  /** Additional CSS class for modal content */
  className?: string;
  
  /** ARIA label for accessibility */
  ariaLabel?: string;
  
  /** ID of element describing the modal */
  ariaDescribedBy?: string;
  
  /** Z-index for modal (defaults to CSS variable) */
  zIndex?: number;
}

export default function BaseModal({
  isOpen,
  onClose,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
  className = '',
  ariaLabel,
  ariaDescribedBy,
  zIndex,
}: BaseModalProps) {
  // Store element that triggered modal for focus restoration
  const triggerElementRef = useRef<HTMLElement | null>(null);
  
  // Track if modal was just opened to save trigger element
  useEffect(() => {
    if (isOpen) {
      // Save the currently focused element to restore later
      triggerElementRef.current = document.activeElement as HTMLElement;
    } else {
      // Restore focus when modal closes
      if (triggerElementRef.current) {
        triggerElementRef.current.focus();
      }
    }
  }, [isOpen]);
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the overlay itself (not bubbled from content)
    if (closeOnClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Don't render anything if not open
  if (!isOpen) return null;
  
  // Determine size class
  const sizeClass = styles[`modal-${size}`] || styles['modal-md'];
  
  // Combine classes
  const modalClasses = `${styles.modal} ${sizeClass} ${className}`;
  
  // Apply custom z-index if provided
  const overlayStyle = zIndex ? { zIndex } : undefined;
  
  return (
    <div 
      className={styles.overlay}
      onClick={handleOverlayClick}
      // eslint-disable-next-line react/forbid-dom-props
      style={overlayStyle}
      aria-modal="true"
      role="dialog"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <FocusTrap
        focusTrapOptions={{
          // Allow clicking outside to not throw error
          clickOutsideDeactivates: closeOnClickOutside,
          // Escape key is handled by our custom handler
          escapeDeactivates: false,
          // Return focus on unmount
          returnFocusOnDeactivate: true,
        }}
      >
        <div 
          className={modalClasses}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          {showCloseButton && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          )}
          
          {/* Modal content */}
          {children}
        </div>
      </FocusTrap>
    </div>
  );
}
