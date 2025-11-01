'use client';

import React from 'react';
import BaseModal from './BaseModal';
import styles from './ConfirmDialog.module.css';

/**
 * ConfirmDialog Component
 * 
 * Confirmation dialog for dangerous or important actions.
 * Replaces window.confirm() with accessible, branded confirmation modals.
 * 
 * Use Cases:
 * - Delete confirmations (users, projects, categories)
 * - Regenerate password confirmations
 * - Destructive actions requiring user confirmation
 * - Warning messages before proceeding
 * 
 * Why ConfirmDialog exists:
 * - Professional alternative to browser's confirm()
 * - Accessible with proper ARIA attributes
 * - Consistent styling across all confirmation scenarios
 * - Support for danger/warning/info variants
 */

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  
  /** Callback when dialog should close */
  onClose: () => void;
  
  /** Callback when user confirms action */
  onConfirm: () => void;
  
  /** Dialog title */
  title: string;
  
  /** Dialog message/description */
  message: string;
  
  /** Confirm button text */
  confirmText?: string;
  
  /** Cancel button text */
  cancelText?: string;
  
  /** Dialog variant (affects icon and button color) */
  variant?: 'danger' | 'warning' | 'info';
  
  /** Custom icon (overrides default variant icon) */
  icon?: React.ReactNode;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  icon,
}: ConfirmDialogProps) {
  
  // Handle confirm button click
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };
  
  // Default icons by variant
  const defaultIcons = {
    danger: '⚠️',
    warning: '⚠️',
    info: '❓',
  };
  
  const displayIcon = icon ?? defaultIcons[variant];
  
  // Button variant class
  const confirmButtonClass = variant === 'danger' 
    ? styles.confirmButtonDanger 
    : styles.confirmButton;
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={true}
      closeOnClickOutside={true}
      closeOnEscape={true}
      ariaLabel={title}
    >
      <div className={styles.container}>
        {/* Icon */}
        {displayIcon && (
          <div className={styles.iconContainer}>
            <span className={styles.icon}>{displayIcon}</span>
          </div>
        )}
        
        {/* Content */}
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.message}>{message}</p>
        </div>
        
        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            className={confirmButtonClass}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
