'use client';

import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { AdminUser } from '@/lib/auth';
import HashtagInput from './HashtagInput';
import HashtagEditor from './HashtagEditor';
import ColoredHashtagBubble from './ColoredHashtagBubble';

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
  hashtags?: string[]; // Array of hashtag strings
  viewSlug?: string; // UUID for client read-only access
  editSlug?: string; // UUID for editor access
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
  const [hashtags, setHashtags] = useState<Array<{hashtag: string, slug: string, count: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectStats, setShowProjectStats] = useState(false);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    eventName: '',
    eventDate: '',
    hashtags: [] as string[]
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showEditProjectForm, setShowEditProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectData, setEditProjectData] = useState({
    eventName: '',
    eventDate: '',
    hashtags: [] as string[]
  });
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [showAllHashtags, setShowAllHashtags] = useState(false);
  const [showHashtagManager, setShowHashtagManager] = useState(false);
  
  // Chart export references
  const genderChartRef = useRef<HTMLDivElement>(null);
  const fansLocationChartRef = useRef<HTMLDivElement>(null);
  const ageGroupsChartRef = useRef<HTMLDivElement>(null);
  const merchandiseChartRef = useRef<HTMLDivElement>(null);
  const engagementChartRef = useRef<HTMLDivElement>(null);
  const valueChartRef = useRef<HTMLDivElement>(null);
  const visitorSourcesChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  // Load hashtags whenever projects change
  useEffect(() => {
    if (projects.length > 0) {
      loadHashtags();
    } else {
      setHashtags([]); // Clear hashtags when no projects
    }
  }, [projects]);

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

  const loadHashtags = async () => {
    try {
      console.log('🏷️ Loading hashtags with UUIDs...');
      
      const response = await fetch('/api/hashtags/slugs');
      const data = await response.json();
      
      if (data.success) {
        setHashtags(data.hashtags);
        console.log('✅ Hashtags with UUIDs loaded successfully:', data.hashtags.length, 'unique hashtags');
      } else {
        console.error('❌ Failed to load hashtag UUIDs:', data.error);
        // Fallback to old method
        const hashtagCounts: { [key: string]: number } = {};
        projects.forEach(project => {
          if (project.hashtags && Array.isArray(project.hashtags)) {
            project.hashtags.forEach((hashtag: string) => {
              hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
            });
          }
        });
        
        const hashtagsWithCounts = Object.keys(hashtagCounts).map(hashtag => ({
          hashtag,
          slug: hashtag, // Fallback to hashtag name
          count: hashtagCounts[hashtag]
        })).sort((a, b) => b.count - a.count);
        
        setHashtags(hashtagsWithCounts);
      }
    } catch (error) {
      console.error('❌ Failed to load hashtags:', error);
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
        // Hashtags will be automatically recalculated when projects state updates
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const editProject = (project: Project) => {
    setEditingProject(project);
    setEditProjectData({
      eventName: project.eventName,
      eventDate: project.eventDate,
      hashtags: project.hashtags || []
    });
    setShowEditProjectForm(true);
  };

  const updateProject = async () => {
    if (!editingProject || !editProjectData.eventName.trim() || !editProjectData.eventDate) {
      alert('Please fill in both Event Name and Event Date.');
      return;
    }

    setIsUpdatingProject(true);
    
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: editingProject._id,
          eventName: editProjectData.eventName.trim(),
          eventDate: editProjectData.eventDate,
          hashtags: editProjectData.hashtags,
          stats: editingProject.stats // Keep existing stats
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update project in the list
        setProjects(prev => prev.map(p => 
          p._id === editingProject._id 
            ? { ...p, eventName: editProjectData.eventName.trim(), eventDate: editProjectData.eventDate, hashtags: editProjectData.hashtags }
            : p
        ));
        
        // Update selected project if it's the one being edited
        if (selectedProject && selectedProject._id === editingProject._id) {
          setSelectedProject(prev => prev ? {
            ...prev,
            eventName: editProjectData.eventName.trim(),
            eventDate: editProjectData.eventDate,
            hashtags: editProjectData.hashtags
          } : null);
        }
        
        // Hashtags will be automatically recalculated when projects state updates
        
        // Reset form and close modal
        setEditProjectData({ eventName: '', eventDate: '', hashtags: [] });
        setEditingProject(null);
        setShowEditProjectForm(false);
        
        alert(`Project "${editProjectData.eventName}" updated successfully!`);
      } else {
        alert(`Failed to update project: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Failed to update project. Please try again.');
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const createNewProject = async () => {
    if (!newProjectData.eventName.trim() || !newProjectData.eventDate) {
      alert('Please fill in both Event Name and Event Date.');
      return;
    }

    setIsCreatingProject(true);
    
    try {
      // Create project with all default stats set to 0
      const defaultStats = {
        remoteImages: 0,
        hostessImages: 0,
        selfies: 0,
        indoor: 0,
        outdoor: 0,
        stadium: 0,
        female: 0,
        male: 0,
        genAlpha: 0,
        genYZ: 0,
        genX: 0,
        boomer: 0,
        merched: 0,
        jersey: 0,
        scarf: 0,
        flags: 0,
        baseballCap: 0,
        other: 0,
        // Success Manager fields
        approvedImages: 0,
        rejectedImages: 0,
        visitQrCode: 0,
        visitShortUrl: 0,
        visitWeb: 0,
        visitFacebook: 0,
        visitInstagram: 0,
        visitYoutube: 0,
        visitTiktok: 0,
        visitX: 0,
        visitTrustpilot: 0,
        eventAttendees: 0,
        eventTicketPurchases: 0,
        eventResultHome: 0,
        eventResultVisitor: 0,
        eventValuePropositionVisited: 0,
        eventValuePropositionPurchases: 0
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: newProjectData.eventName.trim(),
          eventDate: newProjectData.eventDate,
          hashtags: newProjectData.hashtags,
          stats: defaultStats
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Add new project to the list
        setProjects(prev => [result.project, ...prev]);
        
        // Hashtags will be automatically recalculated when projects state updates
        
        // Reset form and close modal
        setNewProjectData({ eventName: '', eventDate: '', hashtags: [] });
        setShowNewProjectForm(false);
        
        alert(`Project "${result.project.eventName}" created successfully!\n\nEdit Link: /edit/${result.project.editSlug}\nStats Link: /stats/${result.project.viewSlug}`);
      } else {
        alert(`Failed to create project: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsCreatingProject(false);
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
        logging: false
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
              y="98"
              textAnchor="middle"
              className="chart-emoji"
              fontSize="28"
              fill="#1a202c"
            >
              👥
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
              y="98"
              textAnchor="middle"
              className="chart-emoji"
              fontSize="28"
              fill="#1a202c"
            >
              📍
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
              y="98"
              textAnchor="middle"
              className="chart-emoji"
              fontSize="28"
              fill="#1a202c"
            >
              👥
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
              y="98"
              textAnchor="middle"
              className="chart-emoji"
              fontSize="28"
              fill="#1a202c"
            >
              🌐
            </text>
          </svg>
        </div>
        <div className="chart-legend">
          {legend}
        </div>
      </>
    );
  };

  const renderEngagementHorizontalBars = () => {
    if (!selectedProject) return null;
    
    const totalFans = selectedProject.stats.indoor + selectedProject.stats.outdoor + selectedProject.stats.stadium;
    const eventAttendees = selectedProject.stats.eventAttendees || 0;
    const totalImages = selectedProject.stats.remoteImages + selectedProject.stats.hostessImages + selectedProject.stats.selfies;
    
    // Calculate social media visits total
    const socialMediaVisits = (
      (selectedProject.stats.visitFacebook || 0) + 
      (selectedProject.stats.visitInstagram || 0) + 
      (selectedProject.stats.visitYoutube || 0) + 
      (selectedProject.stats.visitTiktok || 0) + 
      (selectedProject.stats.visitX || 0) + 
      (selectedProject.stats.visitTrustpilot || 0)
    );
    
    const valueProp = (selectedProject.stats.eventValuePropositionVisited || 0) + (selectedProject.stats.eventValuePropositionPurchases || 0);
    
    // Calculate percentages
    const fanEngagement = eventAttendees > 0 ? (totalFans / eventAttendees) * 100 : 0;
    const fanInteraction = totalImages > 0 ? ((socialMediaVisits + valueProp) / totalImages) * 100 : 0;
    
    const engagementData = [
      { 
        label: `Fan Engagement (${fanEngagement.toFixed(1)}%)`, 
        value: fanEngagement,
        color: '#8b5cf6' 
      },
      { 
        label: `Fan Interaction (${fanInteraction.toFixed(1)}%)`, 
        value: fanInteraction,
        color: '#f59e0b' 
      }
    ];
    
    if (eventAttendees === 0 && totalImages === 0) {
      return <div className="no-data-message">No engagement data available</div>;
    }
    
    const maxValue = Math.max(...engagementData.map(d => d.value), 100); // Use 100% as minimum scale
    
    return (
      <div className="horizontal-bars-container">
        {engagementData.map((item, index) => (
          <div key={item.label} className="horizontal-bar-item" data-testid={`engagement-bar-${index}`}>
            <div className="horizontal-bar-label">{item.label}</div>
            <div className="horizontal-bar-container">
              <div 
                className="horizontal-bar-fill"
                style={{ 
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color
                }}
              >
                <span className="horizontal-bar-value">{item.value.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderValueHorizontalBars = () => {
    if (!selectedProject) return null;
    
    const totalImages = selectedProject.stats.remoteImages + selectedProject.stats.hostessImages + selectedProject.stats.selfies;
    const totalFans = selectedProject.stats.indoor + selectedProject.stats.outdoor + selectedProject.stats.stadium;
    const under40Fans = selectedProject.stats.genAlpha + selectedProject.stats.genYZ;
    const totalVisitors = (
      (selectedProject.stats.visitQrCode || 0) + 
      (selectedProject.stats.visitShortUrl || 0) + 
      (selectedProject.stats.visitWeb || 0) + 
      (selectedProject.stats.visitFacebook || 0) + 
      (selectedProject.stats.visitInstagram || 0) + 
      (selectedProject.stats.visitYoutube || 0) + 
      (selectedProject.stats.visitTiktok || 0) + 
      (selectedProject.stats.visitX || 0) + 
      (selectedProject.stats.visitTrustpilot || 0)
    );
    const valuePropVisited = selectedProject.stats.eventValuePropositionVisited || 0;
    
    // Calculate values in EUR according to specified rates
    const valuePropValue = valuePropVisited * 15; // CPM: Clicks × €15
    const directValue = totalImages * 5; // eDM: Images × €5
    const directAdsValue = totalFans * 3; // Ads: Fans × €3
    const under40EngagedValue = under40Fans * 4; // U40 Engagement: under40fans × €4
    const brandAwarenessValue = totalVisitors * 1; // Branding: Visitors × €1
    
    const valueData = [
      { 
        label: 'CPM', 
        value: valuePropValue,
        color: '#3b82f6' 
      },
      { 
        label: 'eDM', 
        value: directValue,
        color: '#10b981' 
      },
      { 
        label: 'Ads', 
        value: directAdsValue,
        color: '#f59e0b' 
      },
      { 
        label: 'U40 Eng.', 
        value: under40EngagedValue,
        color: '#8b5cf6' 
      },
      { 
        label: 'Branding', 
        value: brandAwarenessValue,
        color: '#ef4444' 
      }
    ];
    
    const totalValue = valuePropValue + directValue + directAdsValue + under40EngagedValue + brandAwarenessValue;
    
    if (totalValue === 0) {
      return <div className="no-data-message">No value data available</div>;
    }
    
    const maxValue = Math.max(...valueData.map(d => d.value), 1);
    
    return (
      <>
        {/* Large EUR Total and Description */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.25rem'
          }}>
            €{totalValue.toLocaleString()}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            Advertisement Value
          </div>
        </div>
        
        <div className="horizontal-bars-container">
          {valueData.map((item, index) => (
            <div key={item.label} className="horizontal-bar-item" data-testid={`value-bar-${index}`}>
              <div className="horizontal-bar-label">{item.label}</div>
              <div className="horizontal-bar-container">
                <div 
                  className="horizontal-bar-fill"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color
                  }}
                >
                  <span className="horizontal-bar-value">€{item.value.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
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

      {/* Aggregated Statistics - between Success Manager and Project Management */}
      <div className="glass-card admin-overview">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 className="section-title" style={{ margin: 0 }}>📊 Aggregated Statistics</h2>
        </div>
        {hashtags.length > 0 ? (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center',
            marginTop: '1rem'
          }}>
            {hashtags
              .filter(item => item.count > 1)
              .map((item, index) => (
                <a
                  key={item.hashtag}
                  href={`/hashtag/${item.slug}?refresh=${new Date().getTime()}`}
                  style={{
                    textDecoration: 'none',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="View aggregated hashtag statistics (fresh data)"
                >
                  <ColoredHashtagBubble 
                    hashtag={item.hashtag}
                    customStyle={{
                      fontSize: '1.125rem',
                      fontWeight: '600'
                    }}
                  />
                </a>
              ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>No Statistics Yet</div>
            <div style={{ fontSize: '0.875rem' }}>Create projects with hashtags to see aggregated statistics here</div>
          </div>
        )}
      </div>


      {/* Projects Management */}
      <div className="glass-card admin-projects">
        <div className="projects-header">
          <h2 className="section-title">Project Management</h2>
          <div className="projects-header-buttons">
            <a 
              href="/admin/charts"
              className="btn btn-info"
              title="Manage chart algorithms and formulas"
            >
              📊 Chart Algorithm Manager
            </a>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowNewProjectForm(true)}
            >
              ➕ Add New Project
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowHashtagManager(!showHashtagManager)}
            >
              {showHashtagManager ? 'Hide' : 'Show'} Hashtag Manager
            </button>
          </div>
        </div>

        <div className="projects-table-container">
          <table className="projects-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Images</th>
                <th>Total Fans</th>
                <th>Attendees</th>
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
                  const attendees = project.stats.eventAttendees || 0;
                  
                  return (
                    <tr key={project._id}>
                      <td className="project-name">
                        {/* Title links to read-only stats page using viewSlug */}
                        {project.viewSlug ? (
                          <a 
                            href={`/stats/${project.viewSlug}?refresh=${new Date().getTime()}`}
                            className="project-title-link"
                            title={`View detailed statistics for ${project.eventName} (fresh data)`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {project.eventName}
                          </a>
                        ) : (
                          <span className="project-name-text">{project.eventName}</span>
                        )}
                        
                        {/* Hashtags display */}
                        {project.hashtags && project.hashtags.length > 0 && (
                          <div className="project-hashtags" style={{ marginTop: '0.5rem' }}>
                            {project.hashtags.map((hashtag, index) => (
                              <ColoredHashtagBubble 
                                key={index}
                                hashtag={hashtag}
                                small={true}
                              />
                            ))}
                          </div>
                        )}
                        
                        <br />
                        {/* Event name links to editing dashboard using editSlug */}
                        {project.editSlug ? (
                          <small>
                            <a 
                              href={`/edit/${project.editSlug}`}
                              className="project-edit-link"
                              title={`Edit ${project.eventName} statistics`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              📝 Edit Statistics
                            </a>
                          </small>
                        ) : (
                          <small className="no-edit-link">Legacy Project - No Edit Link</small>
                        )}
                      </td>
                      <td>{new Date(project.eventDate).toLocaleDateString()}</td>
                      <td className="stat-number">{images}</td>
                      <td className="stat-number">{fans}</td>
                      <td className="stat-number">{attendees}</td>
                      <td className="actions-cell">
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => editProject(project)}
                          title="Edit project name and date"
                        >
                          ✏️ Edit
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
              
              {/* First Row: Merchandise, Engagement, Value */}
              <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                {/* 1. Merchandise */}
                <div className="chart-container" ref={merchandiseChartRef}>
                  <div className="chart-header">
                    <h4 className="chart-title">Merchandise</h4>
                    <div className="chart-export-buttons">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => exportChartAsPNG(merchandiseChartRef, `${selectedProject?.eventName || 'event'}_merchandise`)}
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

                {/* 2. Engagement */}
                <div className="chart-container" ref={engagementChartRef}>
                  <div className="chart-header">
                    <h4 className="chart-title">Engagement</h4>
                    <div className="chart-export-buttons">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => exportChartAsPNG(engagementChartRef, `${selectedProject?.eventName || 'event'}_engagement`)}
                        title="Download as PNG"
                      >
                        📥 Download PNG
                      </button>
                    </div>
                  </div>
                  <div className="horizontal-bars-container">
                    {renderEngagementHorizontalBars()}
                  </div>
                </div>

                {/* 3. Value */}
                <div className="chart-container" ref={valueChartRef}>
                  <div className="chart-header">
                    <h4 className="chart-title">Value</h4>
                    <div className="chart-export-buttons">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => exportChartAsPNG(valueChartRef, `${selectedProject?.eventName || 'event'}_value`)}
                        title="Download as PNG"
                      >
                        📥 Download PNG
                      </button>
                    </div>
                  </div>
                  <div className="horizontal-bars-container">
                    {renderValueHorizontalBars()}
                  </div>
                </div>
              </div>

              {/* Second Row: Visitor Sources */}
              <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                {/* 4. Visitor Sources */}
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
        </div>
      )}

      {/* Add New Project Modal */}
      {showNewProjectForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ 
            width: '100%', 
            maxWidth: '500px',
            padding: '2rem'
          }}>
            <div style={{
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h3 className="title" style={{
                fontSize: '2rem',
                marginBottom: '0.5rem'
              }}>Create New Project</h3>
              <p className="subtitle" style={{ 
                marginBottom: '0',
                fontSize: '1rem'
              }}>Add a new event to track statistics</p>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProjectData.eventName}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, eventName: e.target.value }))}
                  placeholder="Enter event name"
                  disabled={isCreatingProject}
                  autoFocus
                  style={{
                    color: '#1a202c',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Event Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newProjectData.eventDate}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, eventDate: e.target.value }))}
                  disabled={isCreatingProject}
                  style={{
                    color: '#1a202c',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Hashtags</label>
                <HashtagInput
                  value={newProjectData.hashtags}
                  onChange={(hashtags) => setNewProjectData(prev => ({ ...prev, hashtags }))}
                  disabled={isCreatingProject}
                  placeholder="Add hashtags to categorize this project..."
                />
              </div>
              
              <div style={{
                padding: '1rem',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                marginBottom: '0'
              }}>
                <p style={{
                  color: '#4a5568',
                  fontSize: '0.9rem',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📝 All statistics will be initialized to 0. You can edit them after creation using the provided edit link.
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowNewProjectForm(false);
                  setNewProjectData({ eventName: '', eventDate: '', hashtags: [] });
                }}
                disabled={isCreatingProject}
                style={{ flex: '1' }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={createNewProject}
                disabled={isCreatingProject || !newProjectData.eventName.trim() || !newProjectData.eventDate}
                style={{ flex: '1' }}
              >
                {isCreatingProject ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectForm && editingProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ 
            width: '100%', 
            maxWidth: '500px',
            padding: '2rem'
          }}>
            <div style={{
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h3 className="title" style={{
                fontSize: '2rem',
                marginBottom: '0.5rem'
              }}>Edit Project</h3>
              <p className="subtitle" style={{ 
                marginBottom: '0',
                fontSize: '1rem'
              }}>Update project name and date</p>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editProjectData.eventName}
                  onChange={(e) => setEditProjectData(prev => ({ ...prev, eventName: e.target.value }))}
                  placeholder="Enter event name"
                  disabled={isUpdatingProject}
                  autoFocus
                  style={{
                    color: '#1a202c',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Event Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editProjectData.eventDate}
                  onChange={(e) => setEditProjectData(prev => ({ ...prev, eventDate: e.target.value }))}
                  disabled={isUpdatingProject}
                  style={{
                    color: '#1a202c',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Hashtags</label>
                <HashtagInput
                  value={editProjectData.hashtags}
                  onChange={(hashtags) => setEditProjectData(prev => ({ ...prev, hashtags }))}
                  disabled={isUpdatingProject}
                  placeholder="Add hashtags to categorize this project..."
                />
              </div>
              
              <div style={{
                padding: '1rem',
                background: 'rgba(251, 191, 36, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                marginBottom: '0'
              }}>
                <p style={{
                  color: '#4a5568',
                  fontSize: '0.9rem',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ⚠️ Project name, date, and hashtags will be updated. All statistics will remain unchanged.
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditProjectForm(false);
                  setEditingProject(null);
                  setEditProjectData({ eventName: '', eventDate: '', hashtags: [] });
                }}
                disabled={isUpdatingProject}
                style={{ flex: '1' }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={updateProject}
                disabled={isUpdatingProject || !editProjectData.eventName.trim() || !editProjectData.eventDate}
                style={{ flex: '1' }}
              >
                {isUpdatingProject ? 'Updating...' : 'Update Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hashtag Color Management - Moved to bottom with toggle */}
      {showHashtagManager && (
        <div className="glass-card" style={{ marginTop: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 className="section-title" style={{ margin: 0 }}>🏷️ Hashtag Color Manager</h2>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowHashtagManager(false)}
            >
              ✕ Close
            </button>
          </div>
          <HashtagEditor />
        </div>
      )}
    </div>
  );
}
