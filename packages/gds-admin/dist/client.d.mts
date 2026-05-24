export { FormSection, FormSectionProps, InfoCard, InfoCardProps, PageHeader, PageHeaderProps, StatItem, StatsStrip, StatsStripProps, WorkspaceHeader, WorkspaceHeaderProps } from './server.mjs';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React$1 from 'react';
import React__default, { ReactNode, Key } from 'react';
import * as _mantine_core from '@mantine/core';
import { NavLinkProps } from '@mantine/core';
import { SemanticAction } from '@gds/core';

interface AppShellProps {
    logoText?: string;
    navLinks: ReactNode;
    headerActions?: ReactNode;
    mobileNavigation?: ReactNode;
    children: ReactNode;
}
/**
 * AppShell provides the standard GDS application layout.
 * It strictly controls the header, sidebar, and main content area.
 */
declare function AppShell({ logoText, navLinks, headerActions, mobileNavigation, children }: AppShellProps): react_jsx_runtime.JSX.Element;

interface DataTableColumn<T> {
    key: string;
    label: string;
    render?: (item: T) => ReactNode;
}
interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    loading?: boolean;
    getRowKey?: (item: T, index: number) => Key;
}
/**
 * Standardized Data Table
 */
declare function DataTable<T extends Record<string, unknown>>({ data, columns, loading, getRowKey }: DataTableProps<T>): react_jsx_runtime.JSX.Element;

interface SemanticNavLinkProps extends Omit<NavLinkProps, 'leftSection' | 'label'> {
    action: SemanticAction;
}
declare const SemanticNavLink: (<C = "a">(props: _mantine_core.PolymorphicComponentProps<C, SemanticNavLinkProps>) => React.ReactElement) & Omit<React$1.FunctionComponent<(SemanticNavLinkProps & {
    component?: any;
} & Omit<Omit<any, "ref">, "component" | keyof SemanticNavLinkProps> & {
    ref?: any;
    renderRoot?: (props: any) => any;
}) | (SemanticNavLinkProps & {
    component: React.ElementType;
    renderRoot?: (props: Record<string, any>) => any;
})>, never> & Record<string, never>;

interface ResponsiveDataViewProps<T extends Record<string, unknown>> {
    data: T[];
    columns: DataTableColumn<T>[];
    renderCard: (item: T, index: number) => React__default.ReactNode;
    loading?: boolean;
    error?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    toolbar?: React__default.ReactNode;
    getRowKey?: (item: T, index: number) => React__default.Key;
}
declare function ResponsiveDataView<T extends Record<string, unknown>>({ data, columns, renderCard, loading, error, emptyTitle, emptyDescription, toolbar, getRowKey, }: ResponsiveDataViewProps<T>): react_jsx_runtime.JSX.Element;

interface EditorScaffoldProps {
    header?: ReactNode;
    form: ReactNode;
    preview?: ReactNode;
    settings?: ReactNode;
}
declare function EditorScaffold({ header, form, preview, settings }: EditorScaffoldProps): react_jsx_runtime.JSX.Element;

export { AppShell, type AppShellProps, DataTable, type DataTableColumn, type DataTableProps, EditorScaffold, type EditorScaffoldProps, ResponsiveDataView, type ResponsiveDataViewProps, SemanticNavLink, type SemanticNavLinkProps };
