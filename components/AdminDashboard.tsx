'use client';

import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { AdminUser } from '@/lib/auth';

// Props interface for AdminDashboard component
interface AdminDashboardProps {
  user: AdminUser;
  permissions: {
    canManageUsers: boolean;
    canDelete: boolean;
    canRead: boolean;
    canWrite: boolean;
  };
}

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
  stats: {
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
    // Success Manager fields
    approvedImages?: number;
    rejectedImages?: number;
    visitQrCode?: number;
    visitShortUrl?: number;
    visitQrSearched?: number;
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
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard({ user, permissions }: AdminDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectStats, setShowProjectStats] = useState(false);
  
  // Chart export references
  const genderChartRef = useRef<HTMLDivElement>(null);
  const fansLocationChartRef = useRef<HTMLDivElement>(null);
  const ageGroupsChartRef = useRef<HTMLDivElement>(null);
  const merchandiseChartRef = useRef<HTMLDivElement>(null);
  const visitorSourcesChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      console.log('🔄 Loading projects from /api/projects...');
      const response = await fetch('/api/projects');
      console.log('📡 Response status:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📊 API Response:', data);
      
      if (data.success) {
        console.log('✅ Projects loaded successfully:', data.projects.length, 'projects');
        setProjects(data.projects);
      } else {
        console.error('❌ API returned error:', data.error);
        console.error('Debug info:', data.debug);
      }
    } catch (error) {
      console.error('❌ Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSuccessManagerField = async (project: Project, field: string, value: number) => {
    try {
      const updatedStats = {
        ...project.stats,
        [field]: value
      };

      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project._id,
          eventName: project.eventName,
          eventDate: project.eventDate,
          stats: updatedStats
        })
      });

      if (response.ok) {
        // Update local state
        setProjects(prev => prev.map(p => 
          p._id === project._id 
            ? { ...p, stats: updatedStats }
            : p
        ));
        if (selectedProject && selectedProject._id === project._id) {
          setSelectedProject({ ...project, stats: updatedStats });
        }
      }
    } catch (error) {
      console.error('Failed to update success manager field:', error);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`/api/projects?projectId=${projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p._id !== projectId));
        if (selectedProject && selectedProject._id === projectId) {
          setSelectedProject(null);
          setShowProjectStats(false);
        }
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  // Chart Export Functions
  const exportChartAsPNG = async (elementRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!elementRef.current) return;
    
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      // Wait a moment for any animations to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(elementRef.current, {
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        scale: 3, // Higher quality for better text rendering
        logging: false,
        width: elementRef.current.scrollWidth,
        height: elementRef.current.scrollHeight,
        windowWidth: elementRef.current.scrollWidth,
        windowHeight: elementRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => {
          // Skip button elements that might cause issues
          return element.tagName === 'BUTTON';
        },
        onclone: (clonedDoc, element) => {
          // Ensure all styles are properly applied in the cloned document
          const clonedElement = clonedDoc.querySelector(`[data-testid="${elementRef.current?.getAttribute('data-testid') || ''}"]`) || element;
          if (clonedElement && 'style' in clonedElement) {
            (clonedElement as HTMLElement).style.transform = 'none';
            (clonedElement as HTMLElement).style.boxShadow = 'none';
          }
          
          // Force text rendering
          const textElements = clonedDoc.querySelectorAll('text, span, div');
          textElements.forEach((el) => {
            if (el && 'style' in el) {
              const htmlEl = el as HTMLElement;
              htmlEl.style.fontSize = htmlEl.style.fontSize || 'inherit';
              htmlEl.style.fontFamily = htmlEl.style.fontFamily || 'Arial, sans-serif';
            }
          });
        }
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      alert('Chart downloaded successfully!');
    } catch (error) {
      console.error('Failed to export chart as PNG:', error);
      alert('Failed to export chart. Please try again.');
    }
  };
  

  const exportProjectCSV = (project: Project) => {
    const stats = project.stats;
    const csvData = [
      ['Event Name', project.eventName],
      ['Event Date', project.eventDate],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Category', 'Metric', 'Count'],
      ['Images', 'Remote Images', stats.remoteImages],
      ['Images', 'Hostess Images', stats.hostessImages],
      ['Images', 'Selfies', stats.selfies],
      ['Images', 'Approved Images', stats.approvedImages || 0],
      ['Images', 'Rejected Images', stats.rejectedImages || 0],
      ['Fans', 'Indoor', stats.indoor],
      ['Fans', 'Outdoor', stats.outdoor],
      ['Fans', 'Stadium', stats.stadium],
      ['Gender', 'Female', stats.female],
      ['Gender', 'Male', stats.male],
      ['Age', 'Gen Alpha', stats.genAlpha],
      ['Age', 'Gen Y+Z', stats.genYZ],
      ['Age', 'Gen X', stats.genX],
      ['Age', 'Boomer', stats.boomer],
      ['Merchandise', 'Merched', stats.merched],
      ['Merchandise', 'Jersey', stats.jersey],
      ['Merchandise', 'Scarf', stats.scarf],
      ['Merchandise', 'Flags', stats.flags],
      ['Merchandise', 'Baseball Cap', stats.baseballCap],
      ['Merchandise', 'Other', stats.other],
      ['Success Manager', 'Event Attendees', stats.eventAttendees || 0],
      ['Success Manager', 'Ticket Purchases', stats.eventTicketPurchases || 0],
      ['Success Manager', 'QR Code Visits', stats.visitQrCode || 0],
      ['Success Manager', 'Short URL Visits', stats.visitShortUrl || 0],
      ['Success Manager', 'Web Visits', stats.visitWeb || 0],
      ['Success Manager', 'Facebook Visits', stats.visitFacebook || 0],
      ['Success Manager', 'Instagram Visits', stats.visitInstagram || 0],
      ['Success Manager', 'YouTube Visits', stats.visitYoutube || 0],
      ['Success Manager', 'TikTok Visits', stats.visitTiktok || 0],
      ['Success Manager', 'X Visits', stats.visitX || 0],
      ['Success Manager', 'Trustpilot Visits', stats.visitTrustpilot || 0]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${project.eventName.replace(/[^a-z0-9]/gi, '_')}_admin_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  // Calculate totals
  const totalProjects = projects.length;
  const totalAudience = projects.reduce((sum, project) => 
    sum + (project.stats.indoor + project.stats.outdoor + project.stats.stadium), 0
  );
  const totalWebVisits = projects.reduce((sum, project) => 
    sum + (project.stats.visitWeb || 0), 0
  );
  const totalEventAttendees = projects.reduce((sum, project) => 
    sum + (project.stats.eventAttendees || 0), 0
  );
  const totalApprovedImages = projects.reduce((sum, project) => 
    sum + (project.stats.approvedImages || 0), 0
  );
  const totalTicketPurchases = projects.reduce((sum, project) => 
    sum + (project.stats.eventTicketPurchases || 0), 0
  );
  const totalRejectedImages = projects.reduce((sum, project) => 
    sum + (project.stats.rejectedImages || 0), 0
  );
  const totalImages = totalApprovedImages + totalRejectedImages;
  const approvedImagesPercentage = totalImages > 0 ? Math.round((totalApprovedImages / totalImages) * 100) : 0;
  const fanEngagementPercentage = totalEventAttendees > 0 ? Math.round((totalAudience / totalEventAttendees) * 100) : 0;

  const SuccessManagerInput = ({ project, field, label, value }: {
    project: Project;
    field: string;
    label: string;
    value: number;
  }) => (
    <div className="success-manager-input">
      <label className="sm-label">{label}</label>
      <div className="sm-input-container">
        <button 
          className="sm-btn sm-btn-minus"
          onClick={() => updateSuccessManagerField(project, field, Math.max(0, value - 1))}
          disabled={value === 0}
        >
          -
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const newValue = Math.max(0, parseInt(e.target.value) || 0);
            updateSuccessManagerField(project, field, newValue);
          }}
          className="sm-input"
          min="0"
        />
        <button 
          className="sm-btn sm-btn-plus"
          onClick={() => updateSuccessManagerField(project, field, value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );

  const renderGenderCircleChart = () => {
    if (!selectedProject) return null;
    
    const genderData = [
      { label: 'Female', value: selectedProject.stats.female, color: '#ff6b9d' },
      { label: 'Male', value: selectedProject.stats.male, color: '#4a90e2' }
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

  const renderFansDistributionBar = () => {
    if (!selectedProject) return null;
    const indoor = selectedProject.stats.indoor;
    const outdoor = selectedProject.stats.outdoor;
    const stadium = selectedProject.stats.stadium;
    const total = indoor + outdoor + stadium;
    const indoorPercent = total > 0 ? (indoor / total) * 100 : 33.33;
    const outdoorPercent = total > 0 ? (outdoor / total) * 100 : 33.33;
    const stadiumPercent = total > 0 ? (stadium / total) * 100 : 33.33;
    
    return (
      <>
        <div 
          className="bar-segment indoor-segment"
          style={{ height: `${indoorPercent}%` }}
          title={`Indoor: ${indoor} (${indoorPercent.toFixed(1)}%)`}
        >
          {indoorPercent > 10 && <span className="bar-label">{indoor}</span>}
        </div>
        <div 
          className="bar-segment outdoor-segment"
          style={{ height: `${outdoorPercent}%` }}
          title={`Outdoor: ${outdoor} (${outdoorPercent.toFixed(1)}%)`}
        >
          {outdoorPercent > 10 && <span className="bar-label">{outdoor}</span>}
        </div>
        <div 
          className="bar-segment stadium-segment"
          style={{ height: `${stadiumPercent}%` }}
          title={`Stadium: ${stadium} (${stadiumPercent.toFixed(1)}%)`}
        >
          {stadiumPercent > 10 && <span className="bar-label">{stadium}</span>}
        </div>
      </>
    );
  };

  const renderAgeDistributionBar = () => {
    if (!selectedProject) return null;
    const genAlpha = selectedProject.stats.genAlpha;
    const genYZ = selectedProject.stats.genYZ;
    const genX = selectedProject.stats.genX;
    const boomer = selectedProject.stats.boomer;
    const total = genAlpha + genYZ + genX + boomer;
    const alphaPercent = total > 0 ? (genAlpha / total) * 100 : 25;
    const yzPercent = total > 0 ? (genYZ / total) * 100 : 25;
    const xPercent = total > 0 ? (genX / total) * 100 : 25;
    const boomerPercent = total > 0 ? (boomer / total) * 100 : 25;
    
    return (
      <>
        <div 
          className="bar-segment gen-alpha-segment"
          style={{ height: `${alphaPercent}%` }}
          title={`Gen Alpha: ${genAlpha} (${alphaPercent.toFixed(1)}%)`}
        >
          {alphaPercent > 10 && <span className="bar-label">{genAlpha}</span>}
        </div>
        <div 
          className="bar-segment gen-yz-segment"
          style={{ height: `${yzPercent}%` }}
          title={`Gen Y+Z: ${genYZ} (${yzPercent.toFixed(1)}%)`}
        >
          {yzPercent > 10 && <span className="bar-label">{genYZ}</span>}
        </div>
        <div 
          className="bar-segment gen-x-segment"
          style={{ height: `${xPercent}%` }}
          title={`Gen X: ${genX} (${xPercent.toFixed(1)}%)`}
        >
          {xPercent > 10 && <span className="bar-label">{genX}</span>}
        </div>
        <div 
          className="bar-segment boomer-segment"
          style={{ height: `${boomerPercent}%` }}
          title={`Boomer: ${boomer} (${boomerPercent.toFixed(1)}%)`}
        >
          {boomerPercent > 10 && <span className="bar-label">{boomer}</span>}
        </div>
      </>
    );
  };

  const renderMerchandiseHorizontalBars = () => {
    if (!selectedProject) return null;
    const merchData = [
      { label: 'Merched', value: selectedProject.stats.merched, color: '#4a90e2' },
      { label: 'Jersey', value: selectedProject.stats.jersey, color: '#7b68ee' },
      { label: 'Scarf', value: selectedProject.stats.scarf, color: '#ff6b9d' },
      { label: 'Flags', value: selectedProject.stats.flags, color: '#ffa726' },
      { label: 'Baseball Cap', value: selectedProject.stats.baseballCap, color: '#66bb6a' },
      { label: 'Other', value: selectedProject.stats.other, color: '#ef5350' }
    ];
    const maxValue = Math.max(...merchData.map(d => d.value), 1);
    
    return merchData.map((item, index) => (
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
    ));
  };

  const renderFansLocationPieChart = () => {
    if (!selectedProject) return null;
    
    const fansData = [
      { label: 'Indoor', value: selectedProject.stats.indoor, color: '#3b82f6' },
      { label: 'Outdoor', value: selectedProject.stats.outdoor, color: '#10b981' },
      { label: 'Stadium', value: selectedProject.stats.stadium, color: '#f59e0b' }
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

  const renderAgeGroupsPieChart = () => {
    if (!selectedProject) return null;
    
    const ageData = [
      { label: 'Alpha', value: selectedProject.stats.genAlpha, color: '#8b5cf6' },
      { label: 'Y+Z', value: selectedProject.stats.genYZ, color: '#06b6d4' },
      { label: 'X', value: selectedProject.stats.genX, color: '#f97316' },
      { label: 'Boomer', value: selectedProject.stats.boomer, color: '#ef4444' }
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

  const renderVisitorSourcesPieChart = () => {
    if (!selectedProject) return null;
    
    const visitorData = [
      { label: 'QR Code', value: selectedProject.stats.visitQrCode || 0, color: '#3b82f6' },
      { label: 'Short URL', value: selectedProject.stats.visitShortUrl || 0, color: '#10b981' },
      { label: 'Web', value: selectedProject.stats.visitWeb || 0, color: '#f59e0b' },
      { label: 'Facebook', value: selectedProject.stats.visitFacebook || 0, color: '#1877f2' },
      { label: 'Instagram', value: selectedProject.stats.visitInstagram || 0, color: '#e4405f' },
      { label: 'YouTube', value: selectedProject.stats.visitYoutube || 0, color: '#ff0000' },
      { label: 'TikTok', value: selectedProject.stats.visitTiktok || 0, color: '#000000' },
      { label: 'X (Twitter)', value: selectedProject.stats.visitX || 0, color: '#1da1f2' },
      { label: 'Trustpilot', value: selectedProject.stats.visitTrustpilot || 0, color: '#00b67a' }
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

  if (loading) {
    return (
      <div className="admin-container">
        <div className="glass-card">
          <div className="loading-spinner">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Dashboard Overview - Standardized Layout */}
      <div className="glass-card admin-overview">
        <h2 className="section-title">Dashboard Overview</h2>
        <div className="stats-grid-admin">
          <div className="stat-card-admin">
            <div className="stat-value-admin">{totalProjects}</div>
            <div className="stat-label-admin">Total Projects</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-value-admin">{totalAudience}</div>
            <div className="stat-label-admin">Total Audience</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-value-admin">{totalWebVisits}</div>
            <div className="stat-label-admin">Total Web Visits</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-value-admin">{totalEventAttendees}</div>
            <div className="stat-label-admin">Event Attendees</div>
          </div>
        </div>
      </div>

      {/* Success Manager Overview - Matching Dashboard Style */}
      <div className="glass-card admin-overview">
        <h2 className="section-title">Success Manager Overview</h2>
        <div className="stats-grid-admin">
          <div className="stat-card-admin">
            <div className="stat-value-admin">{totalApprovedImages}</div>
            <div className="stat-label-admin">Approved Images</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-value-admin">{totalEventAttendees}</div>
            <div className="stat-label-admin">Event Attendees</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-value-admin">{fanEngagementPercentage}%</div>
            <div className="stat-label-admin">Fan Engagement</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-value-admin">{approvedImagesPercentage}%</div>
            <div className="stat-label-admin">Approved Images</div>
          </div>
        </div>
      </div>

      {/* Projects Management */}
      <div className="glass-card admin-projects">
        <div className="projects-header">
          <h2 className="section-title">Project Management</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowProjectStats(!showProjectStats)}
          >
            {showProjectStats ? 'Hide' : 'Show'} Project Details
          </button>
        </div>

        <div className="projects-table-container">
          <table className="projects-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Total Fans</th>
                <th>Images</th>
                <th>Merch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-state">
                    <div className="admin-empty-icon">📊</div>
                    <div className="admin-empty-title">No Projects Found</div>
                    <div className="admin-empty-subtitle">
                      {totalProjects === 0 
                        ? "No projects have been created yet. Create your first project to get started."
                        : "Loading projects..."}
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((project) => {
                  const fans = project.stats.indoor + project.stats.outdoor + project.stats.stadium;
                  const images = project.stats.remoteImages + project.stats.hostessImages + project.stats.selfies;
                  const merch = project.stats.merched + project.stats.jersey + project.stats.scarf + 
                              project.stats.flags + project.stats.baseballCap + project.stats.other;
                  
                  return (
                    <tr key={project._id}>
                      <td className="project-name">{project.eventName}</td>
                      <td>{new Date(project.eventDate).toLocaleDateString()}</td>
                      <td className="stat-number">{fans}</td>
                      <td className="stat-number">{images}</td>
                      <td className="stat-number">{merch}</td>
                      <td className="actions-cell">
                        <button 
                          className="btn btn-sm btn-info"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowProjectStats(true);
                          }}
                        >
                          📊 Stats
                        </button>
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => exportProjectCSV(project)}
                        >
                          📄 Export
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteProject(project._id)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Details with Success Manager */}
      {showProjectStats && selectedProject && (
        <div className="glass-card project-details">
          <div className="project-details-header">
            <h2 className="section-title">{selectedProject.eventName} - Detailed Statistics</h2>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowProjectStats(false)}
            >
              ✕ Close
            </button>
          </div>

          <div className="project-stats-layout">
            {/* Left Column - Event Statistics + Success Manager */}
            <div className="stats-left-column">
              <h3 className="column-title">Event Statistics</h3>
              
              {/* Images Breakdown */}
              <div className="stats-subsection">
                <h4>Images ({selectedProject.stats.remoteImages + selectedProject.stats.hostessImages + selectedProject.stats.selfies})</h4>
                <div className="stats-breakdown">
                  <div className="stat-item">
                    <span>Remote Images</span>
                    <span>{selectedProject.stats.remoteImages}</span>
                  </div>
                  <div className="stat-item">
                    <span>Hostess Images</span>
                    <span>{selectedProject.stats.hostessImages}</span>
                  </div>
                  <div className="stat-item">
                    <span>Selfies</span>
                    <span>{selectedProject.stats.selfies}</span>
                  </div>
                </div>
              </div>
              
              {/* Fans Breakdown */}
              <div className="stats-subsection">
                <h4>Fans ({selectedProject.stats.indoor + selectedProject.stats.outdoor + selectedProject.stats.stadium})</h4>
                <div className="stats-breakdown">
                  <div className="stat-item">
                    <span>Indoor</span>
                    <span>{selectedProject.stats.indoor}</span>
                  </div>
                  <div className="stat-item">
                    <span>Outdoor</span>
                    <span>{selectedProject.stats.outdoor}</span>
                  </div>
                  <div className="stat-item">
                    <span>Stadium</span>
                    <span>{selectedProject.stats.stadium}</span>
                  </div>
                </div>
              </div>
              
              {/* Gender Breakdown */}
              <div className="stats-subsection">
                <h4>Gender ({selectedProject.stats.female + selectedProject.stats.male})</h4>
                <div className="stats-breakdown">
                  <div className="stat-item">
                    <span>Female</span>
                    <span>{selectedProject.stats.female}</span>
                  </div>
                  <div className="stat-item">
                    <span>Male</span>
                    <span>{selectedProject.stats.male}</span>
                  </div>
                </div>
              </div>
              
              {/* Age Breakdown */}
              <div className="stats-subsection">
                <h4>Age ({selectedProject.stats.genAlpha + selectedProject.stats.genYZ + selectedProject.stats.genX + selectedProject.stats.boomer})</h4>
                <div className="stats-breakdown">
                  <div className="stat-item">
                    <span>Gen Alpha</span>
                    <span>{selectedProject.stats.genAlpha}</span>
                  </div>
                  <div className="stat-item">
                    <span>Gen Y+Z</span>
                    <span>{selectedProject.stats.genYZ}</span>
                  </div>
                  <div className="stat-item">
                    <span>Gen X</span>
                    <span>{selectedProject.stats.genX}</span>
                  </div>
                  <div className="stat-item">
                    <span>Boomer</span>
                    <span>{selectedProject.stats.boomer}</span>
                  </div>
                </div>
              </div>
              
              {/* Merchandise Breakdown */}
              <div className="stats-subsection">
                <h4>Merchandise ({selectedProject.stats.merched + selectedProject.stats.jersey + selectedProject.stats.scarf + selectedProject.stats.flags + selectedProject.stats.baseballCap + selectedProject.stats.other})</h4>
                <div className="stats-breakdown">
                  <div className="stat-item">
                    <span>Merched</span>
                    <span>{selectedProject.stats.merched}</span>
                  </div>
                  <div className="stat-item">
                    <span>Jersey</span>
                    <span>{selectedProject.stats.jersey}</span>
                  </div>
                  <div className="stat-item">
                    <span>Scarf</span>
                    <span>{selectedProject.stats.scarf}</span>
                  </div>
                  <div className="stat-item">
                    <span>Flags</span>
                    <span>{selectedProject.stats.flags}</span>
                  </div>
                  <div className="stat-item">
                    <span>Baseball Cap</span>
                    <span>{selectedProject.stats.baseballCap}</span>
                  </div>
                  <div className="stat-item">
                    <span>Other</span>
                    <span>{selectedProject.stats.other}</span>
                  </div>
                </div>
              </div>

              {/* Success Manager Section - Non-editable, part of Event Statistics */}
              <div className="stats-subsection">
                <h4>Success Manager Statistics</h4>
                <div className="stats-breakdown">
                  <div className="stat-item">
                    <span>Approved Images</span>
                    <span>{selectedProject.stats.approvedImages || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>Rejected Images</span>
                    <span>{selectedProject.stats.rejectedImages || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>Event Attendees</span>
                    <span>{selectedProject.stats.eventAttendees || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>Ticket Purchases</span>
                    <span>{selectedProject.stats.eventTicketPurchases || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>QR Code Visits</span>
                    <span>{selectedProject.stats.visitQrCode || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>Short URL Visits</span>
                    <span>{selectedProject.stats.visitShortUrl || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>Web Visits</span>
                    <span>{selectedProject.stats.visitWeb || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>Facebook Visits</span>
                    <span>{selectedProject.stats.visitFacebook || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>Instagram Visits</span>
                    <span>{selectedProject.stats.visitInstagram || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>YouTube Visits</span>
                    <span>{selectedProject.stats.visitYoutube || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>TikTok Visits</span>
                    <span>{selectedProject.stats.visitTiktok || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>X Visits</span>
                    <span>{selectedProject.stats.visitX || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>Trustpilot Visits</span>
                    <span>{selectedProject.stats.visitTrustpilot || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>Event Result Home</span>
                    <span>{selectedProject.stats.eventResultHome || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>Event Result Visitor</span>
                    <span>{selectedProject.stats.eventResultVisitor || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>Value Proposition Visited</span>
                    <span>{selectedProject.stats.eventValuePropositionVisited || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span>Value Proposition Purchases</span>
                    <span>{selectedProject.stats.eventValuePropositionPurchases || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Data Visualization Charts */}
            <div className="charts-right-column">
              <h3 className="column-title">Data Visualization</h3>
              
              {/* Gender Ratio Circle Chart */}
              <div className="chart-container" ref={genderChartRef}>
                <div className="chart-header">
                  <h4 className="chart-title">Gender Distribution</h4>
                  <div className="chart-export-buttons">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => exportChartAsPNG(genderChartRef, `${selectedProject?.eventName || 'event'}_gender_distribution`)}
                      title="Download as PNG"
                    >
                      📥 Download PNG
                    </button>
                  </div>
                </div>
                <div className="pie-chart-container">
                  <div className="pie-chart" data-testid="gender-circle-chart">
                    {renderGenderCircleChart()}
                  </div>
                </div>
              </div>

              {/* Fans Location Pie Chart */}
              <div className="chart-container" ref={fansLocationChartRef}>
                <div className="chart-header">
                  <h4 className="chart-title">Fans Location</h4>
                  <div className="chart-export-buttons">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => exportChartAsPNG(fansLocationChartRef, `${selectedProject?.eventName || 'event'}_fans_location`)}
                      title="Download as PNG"
                    >
                      📥 Download PNG
                    </button>
                  </div>
                </div>
                <div className="pie-chart-container">
                  <div className="pie-chart" data-testid="fans-location-pie-chart">
                    {renderFansLocationPieChart()}
                  </div>
                </div>
              </div>

              {/* Age Groups Pie Chart */}
              <div className="chart-container" ref={ageGroupsChartRef}>
                <div className="chart-header">
                  <h4 className="chart-title">Age Groups</h4>
                  <div className="chart-export-buttons">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => exportChartAsPNG(ageGroupsChartRef, `${selectedProject?.eventName || 'event'}_age_groups`)}
                      title="Download as PNG"
                    >
                      📥 Download PNG
                    </button>
                  </div>
                </div>
                <div className="pie-chart-container">
                  <div className="pie-chart" data-testid="age-groups-pie-chart">
                    {renderAgeGroupsPieChart()}
                  </div>
                </div>
              </div>

              {/* Horizontal Bar Chart for Merchandise */}
              <div className="chart-container" ref={merchandiseChartRef}>
                <div className="chart-header">
                  <h4 className="chart-title">Merchandise Categories</h4>
                  <div className="chart-export-buttons">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => exportChartAsPNG(merchandiseChartRef, `${selectedProject?.eventName || 'event'}_merchandise_categories`)}
                      title="Download as PNG"
                    >
                      📥 Download PNG
                    </button>
                  </div>
                </div>
                <div className="horizontal-bars-container">
                  {renderMerchandiseHorizontalBars()}
                </div>
              </div>

              {/* Visitor Sources Pie Chart */}
              <div className="chart-container" ref={visitorSourcesChartRef}>
                <div className="chart-header">
                  <h4 className="chart-title">Visitor Sources</h4>
                  <div className="chart-export-buttons">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => exportChartAsPNG(visitorSourcesChartRef, `${selectedProject?.eventName || 'event'}_visitor_sources`)}
                      title="Download as PNG"
                    >
                      📥 Download PNG
                    </button>
                  </div>
                </div>
                <div className="pie-chart-container">
                  <div className="pie-chart" data-testid="visitor-sources-pie-chart">
                    {renderVisitorSourcesPieChart()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
