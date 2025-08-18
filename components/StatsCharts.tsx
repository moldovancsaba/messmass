'use client';

import React from 'react';

// Interface for project statistics - matches the structure used across the app
interface ProjectStats {
  remoteImages: number;
  hostessImages: number;
  selfies: number;
  indoor: number;
  outdoor: number;
  stadium: number;
  female: number;
  male: number;
  genAlpha: number;
  genYZ: number;
  genX: number;
  boomer: number;
  merched: number;
  jersey: number;
  scarf: number;
  flags: number;
  baseballCap: number;
  other: number;
  // Success Manager fields - optional
  approvedImages?: number;
  rejectedImages?: number;
  visitQrCode?: number;
  visitShortUrl?: number;
  visitWeb?: number;
  visitFacebook?: number;
  visitInstagram?: number;
  visitYoutube?: number;
  visitTiktok?: number;
  visitX?: number;
  visitTrustpilot?: number;
  eventAttendees?: number;
  eventTicketPurchases?: number;
  eventResultHome?: number;
  eventResultVisitor?: number;
  eventValuePropositionVisited?: number;
  eventValuePropositionPurchases?: number;
}

// Props interface for chart components
interface ChartProps {
  stats: ProjectStats;
  eventName?: string; // Optional event name for export functionality
}

/**
 * Gender Distribution Circle/Pie Chart
 * Renders a pie chart showing the distribution between female and male attendees
 * Uses SVG for precise control and MessMass color scheme
 */
export const GenderCircleChart: React.FC<ChartProps> = ({ stats, eventName }) => {
  const genderData = [
    { label: 'Female', value: stats.female, color: '#ff6b9d' },
    { label: 'Male', value: stats.male, color: '#4a90e2' }
  ];
  
  const total = genderData.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="no-data-message">No gender data available</div>;
  
  let currentAngle = 0;
  const segments = genderData.filter(item => item.value > 0).map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;
    
    const radius = 80;
    const centerX = 90;
    const centerY = 90;
    
    // Calculate arc coordinates using trigonometry
    const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    // SVG path for the pie segment
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return (
      <g key={item.label}>
        <path
          d={pathData}
          fill={item.color}
          stroke="white"
          strokeWidth="2"
        >
          <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
        </path>
      </g>
    );
  });
  
  const legend = genderData.filter(item => item.value > 0).map((item, index) => {
    const percentage = ((item.value / total) * 100).toFixed(1);
    return (
      <div key={item.label} className="legend-item">
        <div className="legend-color" style={{ backgroundColor: item.color }}></div>
        <span>{item.label}: {item.value} ({percentage}%)</span>
      </div>
    );
  });
  
  return (
    <>
      <div className="pie-chart-container">
        <svg width="180" height="180" className="pie-chart">
          {segments}
          <circle
            cx="90"
            cy="90"
            r="35"
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <text
            x="90"
            y="86"
            textAnchor="middle"
            className="chart-total"
            fontSize="20"
            fontWeight="700"
            fill="#1a202c"
          >
            {total}
          </text>
          <text
            x="90"
            y="102"
            textAnchor="middle"
            className="chart-label"
            fontSize="12"
            fill="#6b7280"
          >
            TOTAL
          </text>
        </svg>
      </div>
      <div className="chart-legend">
        {legend}
      </div>
    </>
  );
};

/**
 * Fans Location Distribution Pie Chart
 * Shows where fans are located: Indoor, Outdoor, Stadium
 * Uses MessMass location-based color scheme
 */
export const FansLocationPieChart: React.FC<ChartProps> = ({ stats, eventName }) => {
  const fansData = [
    { label: 'Indoor', value: stats.indoor, color: '#3b82f6' },
    { label: 'Outdoor', value: stats.outdoor, color: '#10b981' },
    { label: 'Stadium', value: stats.stadium, color: '#f59e0b' }
  ];
  
  const total = fansData.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="no-data-message">No fans location data available</div>;
  
  let currentAngle = 0;
  const segments = fansData.filter(item => item.value > 0).map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;
    
    const radius = 80;
    const centerX = 90;
    const centerY = 90;
    
    const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return (
      <g key={item.label}>
        <path
          d={pathData}
          fill={item.color}
          stroke="white"
          strokeWidth="2"
        >
          <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
        </path>
      </g>
    );
  });
  
  const legend = fansData.filter(item => item.value > 0).map((item, index) => {
    const percentage = ((item.value / total) * 100).toFixed(1);
    return (
      <div key={item.label} className="legend-item">
        <div className="legend-color" style={{ backgroundColor: item.color }}></div>
        <span>{item.label}: {item.value} ({percentage}%)</span>
      </div>
    );
  });
  
  return (
    <>
      <div className="pie-chart-container">
        <svg width="180" height="180" className="pie-chart">
          {segments}
          <circle
            cx="90"
            cy="90"
            r="35"
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <text
            x="90"
            y="86"
            textAnchor="middle"
            className="chart-total"
            fontSize="20"
            fontWeight="700"
            fill="#1a202c"
          >
            {total}
          </text>
          <text
            x="90"
            y="102"
            textAnchor="middle"
            className="chart-label"
            fontSize="12"
            fill="#6b7280"
          >
            FANS
          </text>
        </svg>
      </div>
      <div className="chart-legend">
        {legend}
      </div>
    </>
  );
};

/**
 * Age Groups Distribution Pie Chart
 * Displays generational breakdown: Alpha, Y+Z, X, Boomer
 * Uses color-coded generational scheme
 */
export const AgeGroupsPieChart: React.FC<ChartProps> = ({ stats, eventName }) => {
  const ageData = [
    { label: 'Alpha', value: stats.genAlpha, color: '#8b5cf6' },
    { label: 'Y+Z', value: stats.genYZ, color: '#06b6d4' },
    { label: 'X', value: stats.genX, color: '#f97316' },
    { label: 'Boomer', value: stats.boomer, color: '#ef4444' }
  ];
  
  const total = ageData.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="no-data-message">No age groups data available</div>;
  
  let currentAngle = 0;
  const segments = ageData.filter(item => item.value > 0).map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;
    
    const radius = 80;
    const centerX = 90;
    const centerY = 90;
    
    const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return (
      <g key={item.label}>
        <path
          d={pathData}
          fill={item.color}
          stroke="white"
          strokeWidth="2"
        >
          <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
        </path>
      </g>
    );
  });
  
  const legend = ageData.filter(item => item.value > 0).map((item, index) => {
    const percentage = ((item.value / total) * 100).toFixed(1);
    return (
      <div key={item.label} className="legend-item">
        <div className="legend-color" style={{ backgroundColor: item.color }}></div>
        <span>{item.label}: {item.value} ({percentage}%)</span>
      </div>
    );
  });
  
  return (
    <>
      <div className="pie-chart-container">
        <svg width="180" height="180" className="pie-chart">
          {segments}
          <circle
            cx="90"
            cy="90"
            r="35"
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <text
            x="90"
            y="86"
            textAnchor="middle"
            className="chart-total"
            fontSize="20"
            fontWeight="700"
            fill="#1a202c"
          >
            {total}
          </text>
          <text
            x="90"
            y="102"
            textAnchor="middle"
            className="chart-label"
            fontSize="12"
            fill="#6b7280"
          >
            TOTAL
          </text>
        </svg>
      </div>
      <div className="chart-legend">
        {legend}
      </div>
    </>
  );
};

/**
 * Merchandise Categories Horizontal Bar Chart
 * Shows merchandise distribution across different categories
 * Uses horizontal bars with MessMass color scheme and interactive effects
 */
export const MerchandiseHorizontalBars: React.FC<ChartProps> = ({ stats, eventName }) => {
  const merchData = [
    { label: 'Merched', value: stats.merched, color: '#4a90e2' },
    { label: 'Jersey', value: stats.jersey, color: '#7b68ee' },
    { label: 'Scarf', value: stats.scarf, color: '#ff6b9d' },
    { label: 'Flags', value: stats.flags, color: '#ffa726' },
    { label: 'Baseball Cap', value: stats.baseballCap, color: '#66bb6a' },
    { label: 'Other', value: stats.other, color: '#ef5350' }
  ];
  
  const maxValue = Math.max(...merchData.map(d => d.value), 1);
  
  return (
    <div className="horizontal-bars-container">
      {merchData.map((item, index) => (
        <div key={item.label} className="horizontal-bar-item" data-testid={`merch-bar-${index}`}>
          <div className="horizontal-bar-label">{item.label}</div>
          <div className="horizontal-bar-container">
            <div 
              className="horizontal-bar-fill"
              style={{ 
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color
              }}
            >
              <span className="horizontal-bar-value">{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Visitor Sources Distribution Pie Chart
 * Shows where visitors come from: QR Code, Web, Social Media platforms
 * Only renders if visitor data exists, otherwise shows no data message
 */
export const VisitorSourcesPieChart: React.FC<ChartProps> = ({ stats, eventName }) => {
  const visitorData = [
    { label: 'QR Code', value: stats.visitQrCode || 0, color: '#3b82f6' },
    { label: 'Short URL', value: stats.visitShortUrl || 0, color: '#10b981' },
    { label: 'Web', value: stats.visitWeb || 0, color: '#f59e0b' },
    { label: 'Facebook', value: stats.visitFacebook || 0, color: '#1877f2' },
    { label: 'Instagram', value: stats.visitInstagram || 0, color: '#e4405f' },
    { label: 'YouTube', value: stats.visitYoutube || 0, color: '#ff0000' },
    { label: 'TikTok', value: stats.visitTiktok || 0, color: '#000000' },
    { label: 'X (Twitter)', value: stats.visitX || 0, color: '#1da1f2' },
    { label: 'Trustpilot', value: stats.visitTrustpilot || 0, color: '#00b67a' }
  ];
  
  const total = visitorData.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="no-data-message">No visitor data available</div>;
  
  let currentAngle = 0;
  const segments = visitorData.filter(item => item.value > 0).map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;
    
    const radius = 80;
    const centerX = 90;
    const centerY = 90;
    
    const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return (
      <g key={item.label}>
        <path
          d={pathData}
          fill={item.color}
          stroke="white"
          strokeWidth="2"
        >
          <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
        </path>
      </g>
    );
  });
  
  const legend = visitorData.filter(item => item.value > 0).map((item, index) => {
    const percentage = ((item.value / total) * 100).toFixed(1);
    return (
      <div key={item.label} className="legend-item">
        <div className="legend-color" style={{ backgroundColor: item.color }}></div>
        <span>{item.label}: {item.value} ({percentage}%)</span>
      </div>
    );
  });
  
  return (
    <>
      <div className="pie-chart-container">
        <svg width="180" height="180" className="pie-chart">
          {segments}
          <circle
            cx="90"
            cy="90"
            r="35"
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <text
            x="90"
            y="86"
            textAnchor="middle"
            className="chart-total"
            fontSize="20"
            fontWeight="700"
            fill="#1a202c"
          >
            {total}
          </text>
          <text
            x="90"
            y="102"
            textAnchor="middle"
            className="chart-label"
            fontSize="12"
            fill="#6b7280"
          >
            VISITS
          </text>
        </svg>
      </div>
      <div className="chart-legend">
        {legend}
      </div>
    </>
  );
};

/**
 * Chart Container Wrapper
 * Provides consistent styling and structure for all chart components
 * Includes title, optional export functionality, and glass card effect
 */
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ 
  title, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`chart-container ${className}`}>
      <div className="chart-header">
        <h4 className="chart-title">{title}</h4>
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
};
