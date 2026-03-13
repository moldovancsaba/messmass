import React from 'react';

interface StatsCardProps {
  name: string;
  value: number;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
  };
}

/**
 * V3 Dashboard: StatsCard
 * Displays a summary KPI with its current value, unit, and optional trend.
 */
export const StatsCard: React.FC<StatsCardProps> = ({ name, value, unit, trend }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{name}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">
          {value.toLocaleString()}
        </span>
        {unit && <span className="text-sm font-medium text-gray-500">{unit}</span>}
      </div>
      {trend && (
        <div className={`mt-4 text-sm font-medium flex items-center gap-1 ${
          trend.direction === 'up' ? 'text-green-600' : 
          trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'
        }`}>
          {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '-'}
          <span>{trend.percentage}% vs last period</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
