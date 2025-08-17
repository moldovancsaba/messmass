'use client';

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
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
      {/* Overview Statistics - Properly Styled */}
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

        {/* Success Manager Overview - Properly Styled */}
        <h3 className="section-subtitle">Success Manager Overview</h3>
        <div className="stats-grid-admin">
          <div className="stat-card-admin success-manager">
            <div className="stat-value-admin">{totalApprovedImages}</div>
            <div className="stat-label-admin">Approved Images</div>
          </div>
          <div className="stat-card-admin success-manager">
            <div className="stat-value-admin">{totalEventAttendees}</div>
            <div className="stat-label-admin">Event Attendees</div>
          </div>
          <div className="stat-card-admin success-manager">
            <div className="stat-value-admin">{totalTicketPurchases}</div>
            <div className="stat-label-admin">Ticket Purchases</div>
          </div>
          <div className="stat-card-admin success-manager">
            <div className="stat-value-admin">{totalWebVisits}</div>
            <div className="stat-label-admin">Web Visits</div>
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
              {projects.map((project) => {
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
              })}
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

          <div className="project-stats-grid">
            {/* Event Statistics */}
            <div className="stats-section">
              <h3>Event Statistics</h3>
              <div className="stats-display">
                <div>Images: {selectedProject.stats.remoteImages + selectedProject.stats.hostessImages + selectedProject.stats.selfies}</div>
                <div>Fans: {selectedProject.stats.indoor + selectedProject.stats.outdoor + selectedProject.stats.stadium}</div>
                <div>Gender: {selectedProject.stats.female + selectedProject.stats.male}</div>
                <div>Merch: {selectedProject.stats.merched + selectedProject.stats.jersey + selectedProject.stats.scarf + selectedProject.stats.flags + selectedProject.stats.baseballCap + selectedProject.stats.other}</div>
              </div>
            </div>

            {/* Success Manager Fields */}
            <div className="stats-section success-manager-section">
              <h3>Success Manager</h3>
              <div className="success-manager-grid">
                <SuccessManagerInput 
                  project={selectedProject}
                  field="approvedImages"
                  label="Approved Images"
                  value={selectedProject.stats.approvedImages || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="rejectedImages"
                  label="Rejected Images"
                  value={selectedProject.stats.rejectedImages || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="eventAttendees"
                  label="Event Attendees"
                  value={selectedProject.stats.eventAttendees || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="eventTicketPurchases"
                  label="Ticket Purchases"
                  value={selectedProject.stats.eventTicketPurchases || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="visitQrCode"
                  label="QR Code Visits"
                  value={selectedProject.stats.visitQrCode || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="visitShortUrl"
                  label="Short URL Visits"
                  value={selectedProject.stats.visitShortUrl || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="visitWeb"
                  label="Web Visits"
                  value={selectedProject.stats.visitWeb || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="visitFacebook"
                  label="Facebook Visits"
                  value={selectedProject.stats.visitFacebook || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="visitInstagram"
                  label="Instagram Visits"
                  value={selectedProject.stats.visitInstagram || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="visitYoutube"
                  label="YouTube Visits"
                  value={selectedProject.stats.visitYoutube || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="visitTiktok"
                  label="TikTok Visits"
                  value={selectedProject.stats.visitTiktok || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="visitX"
                  label="X Visits"
                  value={selectedProject.stats.visitX || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="visitTrustpilot"
                  label="Trustpilot Visits"
                  value={selectedProject.stats.visitTrustpilot || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="eventResultHome"
                  label="Event Result Home"
                  value={selectedProject.stats.eventResultHome || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="eventResultVisitor"
                  label="Event Result Visitor"
                  value={selectedProject.stats.eventResultVisitor || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="eventValuePropositionVisited"
                  label="Value Prop Visited"
                  value={selectedProject.stats.eventValuePropositionVisited || 0}
                />
                <SuccessManagerInput 
                  project={selectedProject}
                  field="eventValuePropositionPurchases"
                  label="Value Prop Purchases"
                  value={selectedProject.stats.eventValuePropositionPurchases || 0}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}