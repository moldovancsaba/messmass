/**
 * Modal System - Unified Modal Components (v8.24.0+)
 * 
 * Centralized export for all modal components.
 * Replaces 640+ lines of duplicated modal code across admin pages.
 * 
 * Usage:
 * import { FormModal, ConfirmDialog, BaseModal } from '@/components/modals';
 */

export { default as BaseModal } from './BaseModal';
export type { BaseModalProps } from './BaseModal';

export { default as FormModal } from './FormModal';
export type { FormModalProps } from './FormModal';

export { default as ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';
