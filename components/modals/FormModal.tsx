'use client';

import React from 'react';
import BaseModal from './BaseModal';
import styles from './FormModal.module.css';

/**
 * FormModal Component
 * 
 * Specialized modal for create/edit forms throughout the admin interface.
 * Built on top of BaseModal with consistent header, scrollable body, and action footer.
 * 
 * Use Cases:
 * - Create/Edit Project
 * - Create/Edit Category
 * - Create/Edit Partner
 * - Create/Edit Variable (KYC)
 * - Any form-based modal dialog
 * 
 * Why FormModal exists:
 * - Eliminates duplicated form modal structure across 8+ admin pages
 * - Consistent loading states and submit handling
 * - Disabled form controls during submission
 * - Standard Cancel/Submit button layout
 */

export interface FormModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Async submit handler (supports promises) */
  onSubmit: () => Promise<void> | void;
  
  /** Modal title (displayed in header) */
  title: string;
  
  /** Submit button text */
  submitText?: string;
  
  /** Cancel button text */
  cancelText?: string;
  
  /** Whether form is currently submitting */
  isSubmitting?: boolean;
  
  /** Modal size variant */
  size?: 'md' | 'lg' | 'xl';
  
  /** Form content */
  children: React.ReactNode;
  
  /** Optional subtitle/description below title */
  subtitle?: string;
  
  /** Whether to disable submit button (validation errors) */
  disableSubmit?: boolean;
  
  /** Optional custom footer (overrides default Cancel/Submit buttons) */
  customFooter?: React.ReactNode;
}

export default function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitText = 'Save',
  cancelText = 'Cancel',
  isSubmitting = false,
  size = 'lg',
  children,
  subtitle,
  disableSubmit = false,
  customFooter,
}: FormModalProps) {
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Call the provided submit handler
    await onSubmit();
  };
  
  // Disable submit if already submitting or explicitly disabled
  const submitDisabled = isSubmitting || disableSubmit;
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      showCloseButton={true}
      closeOnClickOutside={!isSubmitting} // Prevent accidental close during submit
      closeOnEscape={!isSubmitting}
      ariaLabel={title}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        
        {/* Body (scrollable) */}
        <div className={styles.body}>
          {children}
        </div>
        
        {/* Footer */}
        <div className={styles.footer}>
          {customFooter ? (
            customFooter
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={styles.cancelButton}
              >
                {cancelText}
              </button>
              
              <button
                type="submit"
                disabled={submitDisabled}
                className={styles.submitButton}
              >
                {isSubmitting ? (
                  <>
                    <span className={styles.spinner}></span>
                    Saving...
                  </>
                ) : (
                  submitText
                )}
              </button>
            </>
          )}
        </div>
      </form>
    </BaseModal>
  );
}
