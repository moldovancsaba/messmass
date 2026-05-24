export { AccessSummary, AccessSummaryProps, ArticleShell, ArticleShellProps, AuthShell, AuthShellProps, DataToolbar, DataToolbarFilterChip, DataToolbarProps, EmptyState, EmptyStateProps, GdsIcons, GdsVocabulary, MediaCard, MediaCardAction, MediaCardProps, MetricCard, MetricCardProps, ProductCard, ProductCardAction, ProductCardMetaItem, ProductCardProps, ProgressCard, ProgressCardProps, PublicShell, PublicShellProps, SemanticAction, StateBlock, StateBlockProps, StateBlockVariant, StatusBadge, StatusBadgeProps, StatusVariant, ar, de, en, fr, he, hu, it, ru } from './server.mjs';
export { ConfirmDialog, ConfirmDialogProps, SemanticButton, SemanticButtonProps, ThemeToggle, ThemeToggleProps, UploadDropzone, UploadDropzoneProps } from './client.mjs';
import * as react_jsx_runtime from 'react/jsx-runtime';
import react__default from 'react';
import '@tabler/icons-react';
import '@mantine/core';

interface FormFieldProps {
    label: string;
    description?: string;
    error?: string;
    children: react__default.ReactNode;
}
declare function FormField({ label, description, error, children }: FormFieldProps): react_jsx_runtime.JSX.Element;

export { FormField, type FormFieldProps };
