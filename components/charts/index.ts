/* What: Barrel export for all chart components
   Why: Simplify imports across the application
   
   Usage:
   import { VerticalBarChart, PieChart, KPICard } from '@/components/charts';
   
   Instead of:
   import VerticalBarChart from '@/components/charts/VerticalBarChart';
   import PieChart from '@/components/charts/PieChart';
   import KPICard from '@/components/charts/KPICard';
*/

export { default as ChartBase } from './ChartBase';
export { default as VerticalBarChart } from './VerticalBarChart';
export { default as PieChart } from './PieChart';
export { default as KPICard } from './KPICard';

// Export types for TypeScript consumers
export type { VerticalBarChartData } from './VerticalBarChart';
export type { PieChartData } from './PieChart';
export type { KPICardProps } from './KPICard';
