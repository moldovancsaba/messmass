'use client';

import React, { useState, useEffect } from 'react';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import UnifiedHashtagInput from './UnifiedHashtagInput';
import { 
  mergeHashtagSystems, 
  getAllHashtagRepresentations,
  expandHashtagsWithCategories 
} from '@/lib/hashtagCategoryUtils';

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
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
    // Derived/extended fields (new)
    remoteFans?: number; // New aggregated fans count (indoor + outdoor)
    socialVisit?: number; // New aggregated social visits (sum of individual socials)
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
  const [hashtags, setHashtags] = useState<string[]>(initialProject.hashtags || []);
  const [categorizedHashtags, setCategorizedHashtags] = useState<{ [categoryName: string]: string[] }>(initialProject.categorizedHashtags || {});
  const [editMode, setEditMode] = useState<'clicker' | 'manual'>('clicker'); // New state for edit mode

  // Update project when initialProject changes
  useEffect(() => {
    setProject(initialProject);
    setHashtags(initialProject.hashtags || []);
    setCategorizedHashtags(initialProject.categorizedHashtags || {});
  }, [initialProject]);

  // Auto-save function
  const saveProject = async (
    updatedStats?: typeof project.stats, 
    updatedHashtags?: string[], 
    updatedCategorizedHashtags?: { [categoryName: string]: string[] }
  ) => {
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project._id,
          eventName: project.eventName,
          eventDate: project.eventDate,
          hashtags: updatedHashtags !== undefined ? updatedHashtags : hashtags,
          categorizedHashtags: updatedCategorizedHashtags !== undefined ? updatedCategorizedHashtags : categorizedHashtags,
          stats: updatedStats || project.stats
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

  // Hashtag management functions
  const handleGeneralHashtagsChange = (newHashtags: string[]) => {
    setHashtags(newHashtags);
    setProject(prev => ({ ...prev, hashtags: newHashtags }));
    saveProject(undefined, newHashtags, undefined);
  };

  const handleCategorizedHashtagsChange = (newCategorizedHashtags: { [categoryName: string]: string[] }) => {
    setCategorizedHashtags(newCategorizedHashtags);
    setProject(prev => ({ ...prev, categorizedHashtags: newCategorizedHashtags }));
    saveProject(undefined, undefined, newCategorizedHashtags);
  };

  // Calculate totals
  const totalImages = project.stats.remoteImages + project.stats.hostessImages + project.stats.selfies;
  const remoteFansCalc = (project.stats.remoteFans ?? (project.stats.indoor + project.stats.outdoor));
  const totalFans = remoteFansCalc + project.stats.stadium;
  const totalGender = project.stats.female + project.stats.male;
  const totalUnder40 = project.stats.genAlpha + project.stats.genYZ;
  const totalOver40 = project.stats.genX + project.stats.boomer;
  const totalAge = totalUnder40 + totalOver40;
  const totalMerch = project.stats.merched + project.stats.jersey + project.stats.scarf + project.stats.flags + project.stats.baseballCap + project.stats.other;

  // Manual input field update (on blur/leave)
  const updateManualField = (field: keyof typeof project.stats, value: number) => {
    const newStats = {
      ...project.stats,
      [field]: Math.max(0, value)
    };
    setProject(prev => ({ ...prev, stats: newStats }));
    saveProject(newStats);
  };

  // Clickable stat card component (for clicker mode)
  // What: Supports optional custom increment/decrement handlers.
  // Why: Remote Fans needs to increment from a derived value (indoor+outdoor) when undefined.
  const StatCard = ({ label, value, statKey, isCalculated = false, onIncrement, onDecrement }: { 
    label: string; 
    value: number; 
    statKey?: keyof typeof project.stats;
    isCalculated?: boolean;
    onIncrement?: () => void;
    onDecrement?: () => void;
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
    onClick={!isCalculated ? (onIncrement ? onIncrement : (statKey ? () => incrementStat(statKey) : undefined)) : undefined}
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
      {!isCalculated && (statKey || onDecrement) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onDecrement) onDecrement();
            else if (statKey) decrementStat(statKey);
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

  // Manual input card component (for manual mode)
  const ManualInputCard = ({ label, value, statKey }: { 
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
        updateManualField(statKey, newValue);
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
            width: '120px',
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
            width: '120px',
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

  // Get all hashtag representations for display
  const allHashtagRepresentations = getAllHashtagRepresentations({ hashtags, categorizedHashtags });
  const totalHashtagCount = allHashtagRepresentations.length;

  return (
    <div className="admin-container">
      {/* Local responsive CSS for editor layout */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Age section: force 3 columns on desktop, 2 lines of 3 */
            .age-grid {
              display: grid;
              gap: 1rem;
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            }
            @media (min-width: 1024px) {
              .age-grid { grid-template-columns: repeat(3, 1fr); }
            }
          `
        }}
      />
      {/* Header with same styling as stats page */}
      <div className="glass-card admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">{project.eventName}</h1>
            <p className="admin-subtitle">Record Stats - {new Date(project.eventDate).toLocaleDateString()}</p>
            
            {/* Beautiful hashtag display - showing all hashtags including categorized ones */}
            {allHashtagRepresentations.length > 0 && (
              <div style={{ 
                marginTop: '1rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {allHashtagRepresentations.map((hashtagDisplay, index) => (
                  <ColoredHashtagBubble 
                    key={index}
                    hashtag={hashtagDisplay}
                    customStyle={{
                      fontSize: '1.125rem',
                      fontWeight: '600'
                    }}
                    showCategoryPrefix={true}
                  />
                ))}
              </div>
            )}
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
              {/* Mode Toggle Button */}
              <button
                onClick={() => setEditMode(editMode === 'clicker' ? 'manual' : 'clicker')}
                style={{
                  background: editMode === 'clicker' ? '#667eea' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
              >
                {editMode === 'clicker' ? '🖱️ Clicker' : '✏️ Manual'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="content-surface" style={{ display: 'grid', gap: '2rem' }}>
        {/* Hashtag Management Section - Only show in manual mode */}
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
            {editMode === 'clicker' ? (
              <>
                <StatCard label="Remote Images" value={project.stats.remoteImages} statKey="remoteImages" />
                <StatCard label="Hostess Images" value={project.stats.hostessImages} statKey="hostessImages" />
                <StatCard label="Selfies" value={project.stats.selfies} statKey="selfies" />
              </>
            ) : (
              <>
                <ManualInputCard label="Remote Images" value={project.stats.remoteImages} statKey="remoteImages" />
                <ManualInputCard label="Hostess Images" value={project.stats.hostessImages} statKey="hostessImages" />
                <ManualInputCard label="Selfies" value={project.stats.selfies} statKey="selfies" />
              </>
            )}
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
            {editMode === 'clicker' ? (
              <>
                {/* Remote: now clickable in clicker mode. We persist to stats.remoteFans.
                    If remoteFans is undefined, we base increments/decrements on the derived value (indoor + outdoor). */}
                <StatCard 
                  label="Remote" 
                  value={remoteFansCalc} 
                  onIncrement={() => {
                    const current = (project.stats.remoteFans ?? (project.stats.indoor + project.stats.outdoor));
                    const newStats = { ...project.stats, remoteFans: current + 1 };
                    setProject(prev => ({ ...prev, stats: newStats }));
                    saveProject(newStats);
                  }}
                  onDecrement={() => {
                    const current = (project.stats.remoteFans ?? (project.stats.indoor + project.stats.outdoor));
                    const next = Math.max(0, current - 1);
                    const newStats = { ...project.stats, remoteFans: next };
                    setProject(prev => ({ ...prev, stats: newStats }));
                    saveProject(newStats);
                  }}
                />
                <StatCard label="Location" value={project.stats.stadium} statKey="stadium" />
                <StatCard label="Total Fans" value={totalFans} isCalculated={true} />
              </>
            ) : (
              <>
                {/* Remote is editable in manual mode (stores to stats.remoteFans) */}
                <ManualInputCard label="Remote" value={(project.stats as any).remoteFans ?? remoteFansCalc} statKey={"remoteFans" as keyof typeof project.stats} />
                <ManualInputCard label="Location" value={project.stats.stadium} statKey="stadium" />
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '12px', 
                  padding: '1rem', 
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  opacity: 0.7
                }}>
                  <div style={{
                    width: '120px',
                    padding: '0.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    color: '#6b7280',
                    backgroundColor: '#f9fafb'
                  }}>{totalFans}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', flex: 1 }}>Total Fans (calculated)</div>
                </div>
              </>
            )}
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
            {editMode === 'clicker' ? (
              <>
                <StatCard label="Female" value={project.stats.female} statKey="female" />
                <StatCard label="Male" value={project.stats.male} statKey="male" />
                <StatCard label="Total Gender" value={totalGender} isCalculated={true} />
              </>
            ) : (
              <>
                <ManualInputCard label="Female" value={project.stats.female} statKey="female" />
                <ManualInputCard label="Male" value={project.stats.male} statKey="male" />
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '12px', 
                  padding: '1rem', 
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  opacity: 0.7
                }}>
                  <div style={{
                    width: '120px',
                    padding: '0.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    color: '#6b7280',
                    backgroundColor: '#f9fafb'
                  }}>{totalGender}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', flex: 1 }}>Total Gender (calculated)</div>
                </div>
              </>
            )}
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
          <div className="age-grid">
            {editMode === 'clicker' ? (
              <>
                {/* Row 1 */}
                <StatCard label="Gen Alpha" value={project.stats.genAlpha} statKey="genAlpha" />
                <StatCard label="Gen Y+Z" value={project.stats.genYZ} statKey="genYZ" />
                <StatCard label="Total Under 40" value={totalUnder40} isCalculated={true} />
                {/* Row 2 */}
                <StatCard label="Gen X" value={project.stats.genX} statKey="genX" />
                <StatCard label="Boomer" value={project.stats.boomer} statKey="boomer" />
                <StatCard label="Total Over 40" value={totalOver40} isCalculated={true} />
              </>
            ) : (
              <>
                {/* Row 1 */}
                <ManualInputCard label="Gen Alpha" value={project.stats.genAlpha} statKey="genAlpha" />
                <ManualInputCard label="Gen Y+Z" value={project.stats.genYZ} statKey="genYZ" />
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '12px', 
                  padding: '1rem', 
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  opacity: 0.7
                }}>
                  <div style={{
                    width: '120px',
                    padding: '0.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    color: '#6b7280',
                    backgroundColor: '#f9fafb'
                  }}>{totalUnder40}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', flex: 1 }}>Total Under 40 (calculated)</div>
                </div>
                {/* Row 2 */}
                <ManualInputCard label="Gen X" value={project.stats.genX} statKey="genX" />
                <ManualInputCard label="Boomer" value={project.stats.boomer} statKey="boomer" />
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '12px', 
                  padding: '1rem', 
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  opacity: 0.7
                }}>
                  <div style={{
                    width: '120px',
                    padding: '0.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    color: '#6b7280',
                    backgroundColor: '#f9fafb'
                  }}>{totalOver40}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', flex: 1 }}>Total Over 40 (calculated)</div>
                </div>
              </>
            )}
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
            {editMode === 'clicker' ? (
              <>
                <StatCard label="People with Merch" value={project.stats.merched} statKey="merched" />
                <StatCard label="Jersey" value={project.stats.jersey} statKey="jersey" />
                <StatCard label="Scarf" value={project.stats.scarf} statKey="scarf" />
              </>
            ) : (
              <>
                <ManualInputCard label="People with Merch" value={project.stats.merched} statKey="merched" />
                <ManualInputCard label="Jersey" value={project.stats.jersey} statKey="jersey" />
                <ManualInputCard label="Scarf" value={project.stats.scarf} statKey="scarf" />
              </>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {editMode === 'clicker' ? (
              <>
                <StatCard label="Flags" value={project.stats.flags} statKey="flags" />
                <StatCard label="Baseball Cap" value={project.stats.baseballCap} statKey="baseballCap" />
                <StatCard label="Other" value={project.stats.other} statKey="other" />
              </>
            ) : (
              <>
                <ManualInputCard label="Flags" value={project.stats.flags} statKey="flags" />
                <ManualInputCard label="Baseball Cap" value={project.stats.baseballCap} statKey="baseballCap" />
                <ManualInputCard label="Other" value={project.stats.other} statKey="other" />
              </>
            )}
          </div>
        </div>

        {/* Success Manager Section - Only show in manual mode */}
        {editMode === 'manual' && (
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

          {/* eDM (Value Proposition) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '1.125rem' }}>eDM</h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <SuccessManagerCard label="Value Prop Visited" value={project.stats.eventValuePropositionVisited || 0} statKey="eventValuePropositionVisited" />
              <SuccessManagerCard label="Value Prop Purchases" value={project.stats.eventValuePropositionPurchases || 0} statKey="eventValuePropositionPurchases" />
            </div>
          </div>

          {/* Social Visit (aggregated) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '1.125rem' }}>Social Visit</h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {(() => {
                const sumSocial = (project.stats.visitFacebook || 0) + (project.stats.visitInstagram || 0) + (project.stats.visitYoutube || 0) + (project.stats.visitTiktok || 0) + (project.stats.visitX || 0) + (project.stats.visitTrustpilot || 0);
                const socialVal = project.stats.socialVisit ?? sumSocial;
                return (
                  <SuccessManagerCard label="Total Social Visit" value={socialVal} statKey={"socialVisit" as keyof typeof project.stats} />
                );
              })()}
            </div>
          </div>

          {/* Event Performance */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '1.125rem' }}>Event Performance</h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <SuccessManagerCard label="Event Attendees" value={project.stats.eventAttendees || 0} statKey="eventAttendees" />
              <SuccessManagerCard label="Event Result Home" value={project.stats.eventResultHome || 0} statKey="eventResultHome" />
              <SuccessManagerCard label="Event Result Visitor" value={project.stats.eventResultVisitor || 0} statKey="eventResultVisitor" />
            </div>
          </div>
          </div>
        )}
        
        {/* Hashtag Management Section - Move to bottom and only show in manual mode */}
        {editMode === 'manual' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              margin: '0 0 1.5rem 0',
              color: '#2d3748',
              borderBottom: '2px solid #e2e8f0',
              paddingBottom: '0.5rem'
            }}>🏷️ Hashtags ({totalHashtagCount}/∞)</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <UnifiedHashtagInput
                generalHashtags={hashtags}
                onGeneralChange={handleGeneralHashtagsChange}
                categorizedHashtags={categorizedHashtags}
                onCategorizedChange={handleCategorizedHashtagsChange}
                placeholder="Add hashtags to categorize this project..."
              />
            </div>
            
            {totalHashtagCount === 0 && (
              <p style={{
                color: '#6b7280',
                fontStyle: 'italic',
                textAlign: 'center',
                margin: '1rem 0',
                padding: '1rem',
                background: 'rgba(107, 114, 128, 0.1)',
                borderRadius: '8px'
              }}>
                💡 Add hashtags to categorize your project and enable aggregated statistics!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
