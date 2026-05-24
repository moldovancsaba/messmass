import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';

interface FormSectionProps {
    title: string;
    description?: string;
    children: ReactNode;
    withDivider?: boolean;
}
declare function FormSection({ title, description, children, withDivider }: FormSectionProps): react_jsx_runtime.JSX.Element;

interface StatItem {
    label: string;
    value: string | number;
    diff?: number;
}
interface StatsStripProps {
    stats: StatItem[];
}
declare function StatsStrip({ stats }: StatsStripProps): react_jsx_runtime.JSX.Element;

interface InfoCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: React.ReactNode;
    color?: string;
}
declare function InfoCard({ title, value, description, icon, color }: InfoCardProps): react_jsx_runtime.JSX.Element;

interface PageHeaderProps {
    title: string;
    description?: string;
    eyebrow?: string;
    breadcrumbs?: ReactNode[];
    primaryAction?: ReactNode;
    secondaryActions?: ReactNode;
}
declare function PageHeader({ title, description, eyebrow, breadcrumbs, primaryAction, secondaryActions }: PageHeaderProps): react_jsx_runtime.JSX.Element;

interface WorkspaceHeaderProps {
    breadcrumbs?: ReactNode[];
    eyebrow?: string;
    title: string;
    description?: string;
    primaryAction?: ReactNode;
    secondaryActions?: ReactNode;
}
declare function WorkspaceHeader({ breadcrumbs, eyebrow, title, description, primaryAction, secondaryActions, }: WorkspaceHeaderProps): react_jsx_runtime.JSX.Element;

export { FormSection, type FormSectionProps, InfoCard, type InfoCardProps, PageHeader, type PageHeaderProps, type StatItem, StatsStrip, type StatsStripProps, WorkspaceHeader, type WorkspaceHeaderProps };
