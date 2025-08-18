'use client';

import React, { useState, useEffect } from 'react';

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

interface EditorDashboardProps {
  project: Project;
}

export default function EditorDashboard({ project: initialProject }: EditorDashboardProps) {
  const [project, setProject] = useState<Project>(initialProject);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Update project when initialProject changes
  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  // Auto-save function
  const saveProject = async (updatedStats: typeof project.stats) => {
    setSaveStatus('saving');
    try {
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
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Increment/Decrement functions for click-to-increment cards
  const incrementStat = (key: keyof typeof project.stats) => {
    const currentValue = project.stats[key] ?? 0;
    const newStats = {
      ...project.stats,
      [key]: currentValue + 1
    };
    setProject(prev => ({ ...prev, stats: newStats }));
    saveProject(newStats);
  };

  const decrementStat = (key: keyof typeof project.stats) => {
    const currentValue = project.stats[key] ?? 0;
    if (currentValue > 0) {
      const newStats = {
        ...project.stats,
        [key]: currentValue - 1
      };
      setProject(prev => ({ ...prev, stats: newStats }));
      saveProject(newStats);
    }
  };

  // Success Manager input field update (on blur/leave)
  const updateSuccessManagerField = (field: keyof typeof project.stats, value: number) => {
    const newStats = {
      ...project.stats,
      [field]: Math.max(0, value)
    };
    setProject(prev => ({ ...prev, stats: newStats }));
    saveProject(newStats);
  };

  // Calculate totals
  const totalImages = project.stats.remoteImages + project.stats.hostessImages + project.stats.selfies;
  const totalFans = project.stats.indoor + project.stats.outdoor + project.stats.stadium;
  const totalGender = project.stats.female + project.stats.male;
  const totalUnder40 = project.stats.genAlpha + project.stats.genYZ;
  const totalOver40 = project.stats.genX + project.stats.boomer;
  const totalAge = totalUnder40 + totalOver40;
  const totalMerch = project.stats.merched + project.stats.jersey + project.stats.scarf + project.stats.flags + project.stats.baseballCap + project.stats.other;

  // Clickable stat card component
  const StatCard = ({ label, value, statKey, isCalculated = false }: { 
    label: string; 
    value: number; 
    statKey?: keyof typeof project.stats;
    isCalculated?: boolean;
  }) => (
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '1.25rem',
      textAlign: 'center',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      position: 'relative',
      cursor: isCalculated ? 'default' : 'pointer',
      opacity: isCalculated ? 0.8 : 1
    }}
    onClick={statKey && !isCalculated ? () => incrementStat(statKey) : undefined}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px 12px 0 0'
      }}></div>
      
      <div style={{
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#4a5568',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '0.5rem'
      }}>{label}</div>
      
      <div style={{
        fontSize: '2.5rem',
        fontWeight: 800,
        color: '#1a202c',
        lineHeight: 1
      }}>{value}</div>
      
      {/* Decrement button for clickable stats */}
      {statKey && !isCalculated && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            decrementStat(statKey);
          }}
          disabled={value === 0}
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            background: value === 0 ? '#e2e8f0' : '#ef4444',
            color: value === 0 ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: value === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          -1
        </button>
      )}
    </div>
  );

  // Success Manager input card component
  const SuccessManagerCard = ({ label, value, statKey }: { 
    label: string; 
    value: number; 
    statKey: keyof typeof project.stats;
  }) => {
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => {
      setTempValue(value);
    }, [value]);

    const handleBlur = () => {
      const newValue = Math.max(0, parseInt(tempValue.toString()) || 0);
      if (newValue !== value) {
        updateSuccessManagerField(statKey, newValue);
      }
    };

    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <input
          type="number"
          value={tempValue}
          onChange={(e) => {
            const newValue = Math.max(0, parseInt(e.target.value) || 0);
            setTempValue(newValue);
          }}
          onBlur={handleBlur}
          style={{
            width: '80px',
            padding: '0.5rem',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '1.25rem',
            fontWeight: 700,
            textAlign: 'center',
            color: '#1a202c',
            backgroundColor: '#ffffff',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          min="0"
        />
        <div style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#4a5568',
          flex: 1
        }}>{label}</div>
      </div>
    );
  };

  return (
    <div className="admin-container">
      {/* Header with same styling as stats page */}
      <div className="glass-card admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">{project.eventName}</h1>
            <p className="admin-subtitle">Record Stats - {new Date(project.eventDate).toLocaleDateString()}</p>
          </div>
          <div className="admin-user-info">
            <div className="admin-badge" style={{ padding: '0.75rem 1rem' }}>
              <p className="admin-role">📅 {new Date(project.eventDate).toLocaleDateString()}</p>
              <p className="admin-level">🎯 Editor Mode</p>
              <p className="admin-status">
                {saveStatus === 'saving' && '💾 Saving...'}
                {saveStatus === 'saved' && '✅ Saved'}
                {saveStatus === 'error' && '❌ Save Error'}
                {saveStatus === 'idle' && '📝 Ready'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Images Section */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            margin: '0 0 1.5rem 0',
            color: '#2d3748',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '0.5rem'
          }}>📸 Images ({totalImages})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <StatCard label="Remote Images" value={project.stats.remoteImages} statKey="remoteImages" />
            <StatCard label="Hostess Images" value={project.stats.hostessImages} statKey="hostessImages" />
            <StatCard label="Selfies" value={project.stats.selfies} statKey="selfies" />
          </div>
        </div>

        {/* Fans Section */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            margin: '0 0 1.5rem 0',
            color: '#2d3748',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '0.5rem'
          }}>👥 Fans ({totalFans})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <StatCard label="Indoor" value={project.stats.indoor} statKey="indoor" />
            <StatCard label="Outdoor" value={project.stats.outdoor} statKey="outdoor" />
            <StatCard label="Stadium" value={project.stats.stadium} statKey="stadium" />
          </div>
        </div>

        {/* Gender Section */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            margin: '0 0 1.5rem 0',
            color: '#2d3748',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '0.5rem'
          }}>⚧️ Gender ({totalGender})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <StatCard label="Female" value={project.stats.female} statKey="female" />
            <StatCard label="Male" value={project.stats.male} statKey="male" />
            <StatCard label="Total Gender" value={totalGender} isCalculated={true} />
          </div>
        </div>

        {/* Age Section */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            margin: '0 0 1.5rem 0',
            color: '#2d3748',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '0.5rem'
          }}>🎂 Age ({totalAge})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <StatCard label="Gen Alpha" value={project.stats.genAlpha} statKey="genAlpha" />
            <StatCard label="Gen Y+Z" value={project.stats.genYZ} statKey="genYZ" />
            <StatCard label="Total Under 40" value={totalUnder40} isCalculated={true} />
            <StatCard label="Gen X" value={project.stats.genX} statKey="genX" />
            <StatCard label="Boomer" value={project.stats.boomer} statKey="boomer" />
            <StatCard label="Total Over 40" value={totalOver40} isCalculated={true} />
          </div>
        </div>

        {/* Merch Section */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            margin: '0 0 1.5rem 0',
            color: '#2d3748',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '0.5rem'
          }}>🛍️ Merch ({totalMerch})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <StatCard label="Merched" value={project.stats.merched} statKey="merched" />
            <StatCard label="Jersey" value={project.stats.jersey} statKey="jersey" />
            <StatCard label="Scarf" value={project.stats.scarf} statKey="scarf" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <StatCard label="Flags" value={project.stats.flags} statKey="flags" />
            <StatCard label="Baseball Cap" value={project.stats.baseballCap} statKey="baseballCap" />
            <StatCard label="Other" value={project.stats.other} statKey="other" />
          </div>
        </div>

        {/* Success Manager Section */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            margin: '0 0 1.5rem 0',
            color: '#2d3748',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '0.5rem'
          }}>📈 Success Manager</h2>
          
          {/* Image Management */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '1.125rem' }}>Image Management</h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <SuccessManagerCard label="Approved Images" value={project.stats.approvedImages || 0} statKey="approvedImages" />
              <SuccessManagerCard label="Rejected Images" value={project.stats.rejectedImages || 0} statKey="rejectedImages" />
            </div>
          </div>

          {/* Visit Tracking */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '1.125rem' }}>Visit Tracking</h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <SuccessManagerCard label="QR Code Visits" value={project.stats.visitQrCode || 0} statKey="visitQrCode" />
              <SuccessManagerCard label="Short URL Visits" value={project.stats.visitShortUrl || 0} statKey="visitShortUrl" />
              <SuccessManagerCard label="Web Visits" value={project.stats.visitWeb || 0} statKey="visitWeb" />
            </div>
          </div>

          {/* Social Media Visits */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '1.125rem' }}>Social Media Visits</h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <SuccessManagerCard label="Facebook Visits" value={project.stats.visitFacebook || 0} statKey="visitFacebook" />
              <SuccessManagerCard label="Instagram Visits" value={project.stats.visitInstagram || 0} statKey="visitInstagram" />
              <SuccessManagerCard label="YouTube Visits" value={project.stats.visitYoutube || 0} statKey="visitYoutube" />
              <SuccessManagerCard label="TikTok Visits" value={project.stats.visitTiktok || 0} statKey="visitTiktok" />
              <SuccessManagerCard label="X Visits" value={project.stats.visitX || 0} statKey="visitX" />
              <SuccessManagerCard label="Trustpilot Visits" value={project.stats.visitTrustpilot || 0} statKey="visitTrustpilot" />
            </div>
          </div>

          {/* Event Performance */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '1.125rem' }}>Event Performance</h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <SuccessManagerCard label="Event Attendees" value={project.stats.eventAttendees || 0} statKey="eventAttendees" />
              <SuccessManagerCard label="Ticket Purchases" value={project.stats.eventTicketPurchases || 0} statKey="eventTicketPurchases" />
              <SuccessManagerCard label="Event Result Home" value={project.stats.eventResultHome || 0} statKey="eventResultHome" />
              <SuccessManagerCard label="Event Result Visitor" value={project.stats.eventResultVisitor || 0} statKey="eventResultVisitor" />
            </div>
          </div>

          {/* Value Proposition */}
          <div>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '1.125rem' }}>Value Proposition</h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <SuccessManagerCard label="Value Prop Visited" value={project.stats.eventValuePropositionVisited || 0} statKey="eventValuePropositionVisited" />
              <SuccessManagerCard label="Value Prop Purchases" value={project.stats.eventValuePropositionPurchases || 0} statKey="eventValuePropositionPurchases" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
