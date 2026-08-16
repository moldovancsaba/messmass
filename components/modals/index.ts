/**
 * Modal System - Unified Modal Components (v8.24.0+)
 *
 * Centralized export for all modal components.
 * Replaces 640+ lines of duplicated modal code across admin pages.
 *
 * Usage:
 * import { FormModal, BaseModal } from '@/components/modals';
 *
 * Confirmation dialogs use useGdsConfirm() from '@sovereignsquad/gds-core/client'
 * instead of a local component — see app/providers.tsx's GdsConfirmProvider.
 */

export { default as BaseModal } from './BaseModal';
export type { BaseModalProps } from './BaseModal';

export { default as FormModal } from './FormModal';
export type { FormModalProps } from './FormModal';
