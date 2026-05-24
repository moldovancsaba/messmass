import { SemanticAction } from './server.mjs';
export { AccessSummary, AccessSummaryProps, ArticleShell, ArticleShellProps, AuthShell, AuthShellProps, DataToolbar, DataToolbarFilterChip, DataToolbarProps, EmptyState, EmptyStateProps, GdsIcons, GdsVocabulary, MediaCard, MediaCardAction, MediaCardProps, MetricCard, MetricCardProps, ProductCard, ProductCardAction, ProductCardMetaItem, ProductCardProps, ProgressCard, ProgressCardProps, PublicShell, PublicShellProps, StateBlock, StateBlockProps, StateBlockVariant, StatusBadge, StatusBadgeProps, StatusVariant, ar, de, en, fr, he, hu, it, ru } from './server.mjs';
import * as react_jsx_runtime from 'react/jsx-runtime';
import react__default, { ReactNode } from 'react';
import { ButtonProps } from '@mantine/core';
import '@tabler/icons-react';

interface ConfirmDialogProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: ReactNode;
    confirmAction?: SemanticAction;
    cancelAction?: SemanticAction;
    isDanger?: boolean;
    loading?: boolean;
}
/**
 * Standardized destructive/confirmation dialog.
 */
declare function ConfirmDialog({ opened, onClose, onConfirm, title, children, confirmAction, cancelAction, isDanger, loading, }: ConfirmDialogProps): react_jsx_runtime.JSX.Element;

interface ThemeToggleProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
}
/**
 * Standardized ThemeToggle component for switching between Light and Dark mode.
 * Should be placed in the main application header/shell.
 */
declare function ThemeToggle({ size }: ThemeToggleProps): react_jsx_runtime.JSX.Element;

interface SemanticButtonProps extends ButtonProps, Omit<react__default.ComponentPropsWithoutRef<'button'>, keyof ButtonProps | 'leftSection' | 'children'> {
    action: SemanticAction;
    loading?: boolean;
    feedbackState?: 'success' | 'error' | null;
    feedbackText?: string;
}
/**
 * SemanticButton strictly enforces ubiquitous language and standardized iconography.
 * Developers cannot pass arbitrary text or icons; they must use a semantic action key.
 */
declare function SemanticButton({ action, loading, feedbackState, feedbackText, ...props }: SemanticButtonProps): react_jsx_runtime.JSX.Element;

interface UploadDropzoneProps {
    title: string;
    description?: string;
    onFilesSelected?: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    actionLabel?: string;
}
declare function UploadDropzone({ title, description, onFilesSelected, accept, multiple, actionLabel, }: UploadDropzoneProps): react_jsx_runtime.JSX.Element;

export { ConfirmDialog, type ConfirmDialogProps, SemanticAction, SemanticButton, type SemanticButtonProps, ThemeToggle, type ThemeToggleProps, UploadDropzone, type UploadDropzoneProps };
