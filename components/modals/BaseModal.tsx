'use client';

import React from 'react';
import { ActionIcon, Modal } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import styles from './BaseModal.module.css';

/**
 * BaseModal Component
 * 
 * Foundation for all modal dialogs in the {messmass} application.
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
}: BaseModalProps) {
  const isFullScreen = size === 'full';
  const resolvedSize = size === 'full' ? '100%' : size;
  
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size={resolvedSize}
      fullScreen={isFullScreen}
      zIndex={1050}
      withCloseButton={false}
      closeOnClickOutside={closeOnClickOutside}
      closeOnEscape={closeOnEscape}
      centered={!isFullScreen}
      padding={0}
      classNames={{
        content: `${styles.content}${className ? ` ${className}` : ''}`,
        body: styles.body,
      }}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 0,
        className: styles.overlay,
      }}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <div className={styles.shell}>
        {showCloseButton && (
          <ActionIcon
            aria-label="Close modal"
            className={styles.closeButton}
            color="gray"
            onClick={onClose}
            radius="xl"
            size="lg"
            variant="subtle"
          >
            <IconX size={18} />
          </ActionIcon>
        )}
        {children}
      </div>
    </Modal>
  );
}
