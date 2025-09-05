'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../../stats/[slug]/stats.module.css';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
import HashtagMultiSelect from '@/components/HashtagMultiSelect';
import SharePopup from '@/components/SharePopup';

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

interface Project {
  eventName: string;
  eventDate: string;
  dateRange: {
    oldest: string;
    newest: string;
    formatted: string;
  };
  hashtags?: string[];
  stats: ProjectStats;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectListItem {
  _id: string;
  eventName: string;
  eventDate: string;
  viewSlug?: string;
  hashtags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface HashtagItem {
  hashtag: string;
  slug: string;
  count: number;
}

function HashtagFilterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [availableHashtags, setAvailableHashtags] = useState<HashtagItem[]>([]);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);
  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  // Fetch filtered statistics
  const fetchFilteredStats = useCallback(async (hashtags = selectedHashtags) => {
    if (hashtags.length === 0) return;

    setStatsLoading(true);
    setError(null);
    
    try {
      const tagsParam = hashtags.join(',');
      const response = await fetch(`/api/hashtags/filter?tags=${encodeURIComponent(tagsParam)}&refresh=${new Date().getTime()}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.project);
        setProjects(data.projects || []);
        setHasAppliedFilter(true);
      } else {
        setError(data.error || 'Failed to load filtered statistics');
        setProject(null);
        setProjects([]);
        setHasAppliedFilter(false);
      }
    } catch (error) {
      console.error('Failed to load filtered statistics:', error);
      setError('Failed to load filtered statistics');
      setProject(null);
      setProjects([]);
      setHasAppliedFilter(false);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load available hashtags on mount
  useEffect(() => {
    loadAvailableHashtags();
  }, []);

  // Parse URL parameters on mount
  useEffect(() => {
    const tagsParam = searchParams?.get('tags');
    if (tagsParam) {
      const tags = tagsParam.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      if (tags.length > 0) {
        setSelectedHashtags(tags);
        // Auto-apply filter if tags are provided in URL
        setTimeout(() => {
          fetchFilteredStats(tags);
        }, 100);
      }
    }
    setLoading(false);
  }, [searchParams]);

  // Load available hashtags
  const loadAvailableHashtags = async () => {
    try {
      const response = await fetch('/api/hashtags/slugs');
      const data = await response.json();
      
      if (data.success) {
        setAvailableHashtags(data.hashtags);
      } else {
        console.error('Failed to load hashtags:', data.error);
      }
    } catch (error) {
      console.error('Failed to load hashtags:', error);
    }
  };

  // Update URL when selection changes
  const updateURL = (hashtags: string[]) => {
    if (hashtags.length > 0) {
      const tagsParam = hashtags.join(',');
      const newUrl = `/admin/filter?tags=${encodeURIComponent(tagsParam)}`;
      router.push(newUrl, { scroll: false });
    } else {
      router.push('/admin/filter', { scroll: false });
    }
  };

  // Handle hashtag selection changes
  const handleSelectionChange = (selected: string[]) => {
    setSelectedHashtags(selected);
    updateURL(selected);
    
    // Clear previous results if selection changes
    if (hasAppliedFilter && selected.join(',') !== project?.hashtags?.join(',')) {
      setProject(null);
      setProjects([]);
      setHasAppliedFilter(false);
    }
  };

  // Handle apply filter
  const handleApplyFilter = () => {
    fetchFilteredStats();
  };

  // Export filtered results as CSV
  const exportFilteredCSV = () => {
    if (!project) return;

    const stats = project.stats;
    const csvData = [
      ['Multi-Hashtag Filter Export'],
      ['Filter Tags', selectedHashtags.map(tag => `#${tag}`).join(' AND ')],
      ['Projects Matched', project.projectCount.toString()],
      ['Date Range', project.dateRange.formatted],
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
      link.setAttribute('download', `hashtag_filter_${selectedHashtags.join('_')}_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Calculate totals for display
  const totalImages = project ? project.stats.remoteImages + project.stats.hostessImages + project.stats.selfies : 0;
  const totalFans = project ? project.stats.indoor + project.stats.outdoor + project.stats.stadium : 0;
  const totalGender = project ? project.stats.female + project.stats.male : 0;
  const totalUnder40 = project ? project.stats.genAlpha + project.stats.genYZ : 0;
  const totalOver40 = project ? project.stats.genX + project.stats.boomer : 0;
  const totalAge = totalUnder40 + totalOver40;
  const totalMerch = project ? project.stats.merched + project.stats.jersey + project.stats.scarf + project.stats.flags + project.stats.baseballCap + project.stats.other : 0;

  if (loading) {
    return (
      <div className="loading-centered-container">
        <div className="loading-card">
          <div className="curve-spinner"></div>
          <p style={{ 
            color: '#6b7280', 
            margin: 0, 
            fontSize: '1.1rem',
            fontWeight: '500'
          }}>Loading hashtag filter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header - Cleaned up HERO block */}
      <div className="glass-card admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">🔍 Multi-Hashtag Filter</h1>
            
            {hasAppliedFilter && project && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  Filter Results - {project.dateRange.formatted}
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {selectedHashtags.map((hashtag) => (
                    <ColoredHashtagBubble 
                      key={hashtag}
                      hashtag={hashtag}
                      customStyle={{
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    />
                  ))}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  📊 {project.projectCount} project{project.projectCount !== 1 ? 's' : ''} match this filter
                </div>
              </div>
            )}
          </div>
          
          <div className="admin-user-info">
            <div className="admin-badge" style={{ padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => router.push('/admin')}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4b5563';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#6b7280';
                  }}
                >
                  ← Back to Admin
                </button>
                {hasAppliedFilter && project && (
                  <>
                    <button 
                      onClick={async () => {
                        try {
                          // Generate filter slug for hashtag combination
                          const response = await fetch('/api/filter-slug', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ hashtags: selectedHashtags })
                          });
                          
                          const data = await response.json();
                          
                          if (data.success) {
                            setShareSlug(data.slug);
                            setSharePopupOpen(true);
                          } else {
                            alert('Failed to generate shareable link: ' + data.error);
                          }
                        } catch (error) {
                          console.error('Error generating filter slug:', error);
                          alert('Failed to generate shareable link');
                        }
                      }}
                      style={{
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        marginRight: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#4f46e5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#6366f1';
                      }}
                      title="Share filter with password protection"
                    >
                      🔗 Share Filter
                    </button>
                    <button 
                      onClick={exportFilteredCSV}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#10b981';
                      }}
                      title="Export filtered results to CSV"
                    >
                      📄 Export CSV
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hashtag Selection Section - No duplicate title */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <HashtagMultiSelect
          hashtags={availableHashtags}
          selectedHashtags={selectedHashtags}
          onSelectionChange={handleSelectionChange}
          onApplyFilter={handleApplyFilter}
          disabled={statsLoading}
          showPreview={true}
        />
      </div>

      {/* Loading State */}
      {statsLoading && (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="curve-spinner" style={{ margin: '1rem auto' }}></div>
          <p style={{ 
            color: '#6b7280', 
            margin: 0, 
            fontSize: '1.1rem',
            fontWeight: '500'
          }}>Loading filtered statistics...</p>
        </div>
      )}

      {/* Error State */}
      {error && !statsLoading && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div className={styles.error}>
            <h2>❌ Error</h2>
            <p>{error}</p>
            <button 
              onClick={() => fetchFilteredStats()}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {hasAppliedFilter && project && !error && (
        <>
          {/* Stats Layout */}
          <div className="stats-layout-container">
            {/* Row 1: Images, Fans, Gender */}
            <div className="stats-row-3">
              <div className="stats-section-new">
                <h2 className="stats-section-title">📸 Images ({totalImages})</h2>
                <div className="stats-cards-row">
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Remote Images</div>
                    <div className={styles.statValue}>{project.stats.remoteImages}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Hostess Images</div>
                    <div className={styles.statValue}>{project.stats.hostessImages}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Selfies</div>
                    <div className={styles.statValue}>{project.stats.selfies}</div>
                  </div>
                </div>
              </div>

              <div className="stats-section-new">
                <h2 className="stats-section-title">👥 Fans ({totalFans})</h2>
                <div className="stats-cards-row">
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Indoor</div>
                    <div className={styles.statValue}>{project.stats.indoor}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Outdoor</div>
                    <div className={styles.statValue}>{project.stats.outdoor}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Stadium</div>
                    <div className={styles.statValue}>{project.stats.stadium}</div>
                  </div>
                </div>
              </div>

              <div className="stats-section-new">
                <h2 className="stats-section-title">⚧️ Gender ({totalGender})</h2>
                <div className="stats-cards-row">
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Female</div>
                    <div className={styles.statValue}>{project.stats.female}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Male</div>
                    <div className={styles.statValue}>{project.stats.male}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Age Groups and Merchandise */}
            <div className="stats-row-2-3-1">
              <div className="stats-section-new">
                <h2 className="stats-section-title">🎂 Age Groups ({totalAge})</h2>
                <div className="stats-cards-row-age">
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Gen Alpha</div>
                    <div className={styles.statValue}>{project.stats.genAlpha}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Gen Y+Z</div>
                    <div className={styles.statValue}>{project.stats.genYZ}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Under 40</div>
                    <div className={styles.statValue}>{totalUnder40}</div>
                  </div>
                </div>
                <div className="stats-cards-row-age">
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Gen X</div>
                    <div className={styles.statValue}>{project.stats.genX}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Boomer</div>
                    <div className={styles.statValue}>{project.stats.boomer}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Over 40</div>
                    <div className={styles.statValue}>{totalOver40}</div>
                  </div>
                </div>
              </div>

              <div className="stats-section-new">
                <h2 className="stats-section-title">🛑️ Fans with Merchandise</h2>
                <div className="stats-cards-row">
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Merched Fans</div>
                    <div className={styles.statValue}>{project.stats.merched}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Merchandise Types */}
            <div className="stats-row-full">
              <div className="stats-section-new">
                <h2 className="stats-section-title">👕 Merchandise Types ({totalMerch})</h2>
                <div className="merch-cards-grid">
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Jersey</div>
                    <div className={styles.statValue}>{project.stats.jersey}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Scarf</div>
                    <div className={styles.statValue}>{project.stats.scarf}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Flags</div>
                    <div className={styles.statValue}>{project.stats.flags}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Baseball Cap</div>
                    <div className={styles.statValue}>{project.stats.baseballCap}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Other</div>
                    <div className={styles.statValue}>{project.stats.other}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Manager Section */}
            {(project.stats.approvedImages || project.stats.eventAttendees || project.stats.visitWeb) && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>📈 Performance Metrics</h2>
                <div className={styles.statsRow}>
                  {project.stats.approvedImages !== undefined && (
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Approved Images</div>
                      <div className={styles.statValue}>{project.stats.approvedImages}</div>
                    </div>
                  )}
                  {project.stats.eventAttendees !== undefined && (
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Event Attendees</div>
                      <div className={styles.statValue}>{project.stats.eventAttendees}</div>
                    </div>
                  )}
                  {project.stats.visitWeb !== undefined && (
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Web Visits</div>
                      <div className={styles.statValue}>{project.stats.visitWeb}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Projects List Section */}
          {projects.length > 0 && (
            <div className="glass-card" style={{ marginTop: '3rem' }}>
              <h2 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#1f2937 !important',
                fontWeight: '600',
                fontSize: '1.875rem',
                marginBottom: '1.5rem'
              }}>
                <span style={{ color: '#1f2937' }}>📊 Matching Projects </span>
                <span style={{
                  fontSize: '1rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontWeight: 'bold'
                }}>
                  ({projects.length})
                </span>
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                {projects.map((projectItem) => (
                  <div key={projectItem._id} style={{
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid rgba(99, 102, 241, 0.1)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease'
                  }}>
                    <h3 style={{
                      margin: '0 0 0.75rem 0',
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {projectItem.viewSlug ? (
                        <a 
                          href={`/stats/${projectItem.viewSlug}`}
                          style={{
                            color: '#6366f1',
                            textDecoration: 'none',
                            borderBottom: '1px solid transparent',
                            transition: 'border-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderBottomColor = '#6366f1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderBottomColor = 'transparent';
                          }}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`View statistics for ${projectItem.eventName}`}
                        >
                          {projectItem.eventName}
                        </a>
                      ) : (
                        <span>{projectItem.eventName}</span>
                      )}
                    </h3>
                    
                    {/* Hashtags */}
                    {projectItem.hashtags && projectItem.hashtags.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '0.75rem'
                      }}>
                        {projectItem.hashtags.map((hashtag, index) => (
                          <ColoredHashtagBubble 
                            key={index}
                            hashtag={hashtag}
                            small={true}
                          />
                        ))}
                      </div>
                    )}
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <span>📅 {new Date(projectItem.eventDate).toLocaleDateString()}</span>
                      {projectItem.viewSlug && (
                        <span style={{
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: '#6366f1',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          📊 View Stats
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <p>Generated on {new Date().toLocaleDateString()} • MessMass Multi-Hashtag Filter</p>
      </div>

      {/* Share Popup */}
      <SharePopup
        isOpen={sharePopupOpen}
        onClose={() => setSharePopupOpen(false)}
        pageId={shareSlug || ''}
        pageType="filter"
        customTitle="Share Hashtag Filter"
      />
    </div>
  );
}

// Loading fallback component
function HashtagFilterLoading() {
  return (
    <div className="loading-centered-container">
      <div className="loading-card">
        <div className="curve-spinner"></div>
        <p style={{ 
          color: '#6b7280', 
          margin: 0, 
          fontSize: '1.1rem',
          fontWeight: '500'
        }}>Loading hashtag filter...</p>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function HashtagFilterPage() {
  return (
    <Suspense fallback={<HashtagFilterLoading />}>
      <HashtagFilterPageContent />
    </Suspense>
  );
}
