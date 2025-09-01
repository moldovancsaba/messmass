'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { AdminUser } from '@/lib/auth';
import HashtagInput from '@/components/HashtagInput';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags?: string[];
  viewSlug?: string;
  editSlug?: string;
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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [hashtags, setHashtags] = useState<Array<{hashtag: string, slug: string, count: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'success' | 'stats' | 'filter'>('overview');
  
  // Multi-hashtag filter state
  const [filterHashtags, setFilterHashtags] = useState<string[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  useEffect(() => {
    const adminToken = Cookies.get('admin_token');
    const adminUserData = Cookies.get('admin_user');
    
    if (!adminToken || !adminUserData) {
      router.push('/admin/login');
      return;
    }
    
    try {
      const userData = JSON.parse(adminUserData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to parse admin user data:', error);
      router.push('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Filter projects when filterHashtags change
  useEffect(() => {
    if (filterHashtags.length === 0) {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => {
        const projectHashtags = project.hashtags || [];
        return filterHashtags.every(filterTag => 
          projectHashtags.some(projectTag => projectTag.toLowerCase().includes(filterTag.toLowerCase()))
        );
      });
      setFilteredProjects(filtered);
    }
  }, [filterHashtags, projects]);

  const loadData = async () => {
    try {
      // Load projects
      const projectsResponse = await fetch('/api/projects');
      const projectsData = await projectsResponse.json();
      
      if (projectsData.success) {
        setProjects(projectsData.projects);
      }

      // Load hashtags
      const hashtagsResponse = await fetch('/api/hashtags/slugs');
      const hashtagsData = await hashtagsResponse.json();
      
      if (hashtagsData.success) {
        setHashtags(hashtagsData.hashtags);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAggregatedStats = () => {
    const targetProjects = activeTab === 'filter' ? filteredProjects : projects;
    
    return targetProjects.reduce((totals, project) => {
      const stats = project.stats;
      return {
        totalProjects: totals.totalProjects + 1,
        totalImages: totals.totalImages + (stats.remoteImages + stats.hostessImages + stats.selfies),
        totalFans: totals.totalFans + (stats.indoor + stats.outdoor + stats.stadium),
        totalAttendees: totals.totalAttendees + (stats.eventAttendees || 0),
        genderDistribution: {
          male: totals.genderDistribution.male + stats.male,
          female: totals.genderDistribution.female + stats.female
        },
        ageDistribution: {
          genAlpha: totals.ageDistribution.genAlpha + stats.genAlpha,
          genYZ: totals.ageDistribution.genYZ + stats.genYZ,
          genX: totals.ageDistribution.genX + stats.genX,
          boomer: totals.ageDistribution.boomer + stats.boomer
        },
        merchandise: {
          jersey: totals.merchandise.jersey + stats.jersey,
          scarf: totals.merchandise.scarf + stats.scarf,
          flags: totals.merchandise.flags + stats.flags,
          baseballCap: totals.merchandise.baseballCap + stats.baseballCap,
          other: totals.merchandise.other + stats.other
        },
        engagement: {
          visitQrCode: totals.engagement.visitQrCode + (stats.visitQrCode || 0),
          visitWeb: totals.engagement.visitWeb + (stats.visitWeb || 0),
          visitFacebook: totals.engagement.visitFacebook + (stats.visitFacebook || 0),
          visitInstagram: totals.engagement.visitInstagram + (stats.visitInstagram || 0),
          visitYoutube: totals.engagement.visitYoutube + (stats.visitYoutube || 0),
          visitTiktok: totals.engagement.visitTiktok + (stats.visitTiktok || 0),
          visitX: totals.engagement.visitX + (stats.visitX || 0),
          visitTrustpilot: totals.engagement.visitTrustpilot + (stats.visitTrustpilot || 0)
        }
      };
    }, {
      totalProjects: 0,
      totalImages: 0,
      totalFans: 0,
      totalAttendees: 0,
      genderDistribution: { male: 0, female: 0 },
      ageDistribution: { genAlpha: 0, genYZ: 0, genX: 0, boomer: 0 },
      merchandise: { jersey: 0, scarf: 0, flags: 0, baseballCap: 0, other: 0 },
      engagement: { visitQrCode: 0, visitWeb: 0, visitFacebook: 0, visitInstagram: 0, visitYoutube: 0, visitTiktok: 0, visitX: 0, visitTrustpilot: 0 }
    });
  };

  if (loading || !user) {
    return (
      <div className="admin-container">
        <div className="glass-card">
          <div className="loading-spinner">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const aggregatedStats = calculateAggregatedStats();

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="title">📊 Dashboard</h1>
          <a href="/admin" className="btn btn-secondary">← Back to Admin</a>
        </div>
        <p className="subtitle">
          Comprehensive dashboard with overview, success metrics, statistics, and filtering
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
          padding: '0'
        }}>
          {[
            { key: 'overview', label: '📊 Dashboard Overview', icon: '📊' },
            { key: 'success', label: '🎯 Success Manager Overview', icon: '🎯' },
            { key: 'stats', label: '📈 Aggregated Statistics', icon: '📈' },
            { key: 'filter', label: '🔍 Multi-Hashtag Filter', icon: '🔍' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                background: activeTab === tab.key ? '#6366f1' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#6b7280',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                borderRadius: activeTab === tab.key ? '8px 8px 0 0' : '0'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Overview Tab */}
      {activeTab === 'overview' && (
        <div className="glass-card">
          <h2 style={{ marginBottom: '2rem', color: '#1f2937' }}>📊 Dashboard Overview</h2>
          
          {/* Key Metrics Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {aggregatedStats.totalProjects}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Projects</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {aggregatedStats.totalImages.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Images</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {aggregatedStats.totalFans.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Fans</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {aggregatedStats.totalAttendees.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Attendees</div>
            </div>
          </div>

          {/* Recent Projects */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Recent Projects</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {projects.slice(0, 5).map((project) => (
                <div key={project._id} style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                      {project.eventName}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {new Date(project.eventDate).toLocaleDateString()} • 
                      {project.hashtags && project.hashtags.length > 0 && (
                        <span> {project.hashtags.length} hashtags</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#6b7280' }}>
                    <div>📸 {(project.stats.remoteImages + project.stats.hostessImages + project.stats.selfies).toLocaleString()}</div>
                    <div>👥 {(project.stats.indoor + project.stats.outdoor + project.stats.stadium).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Manager Overview Tab */}
      {activeTab === 'success' && (
        <div className="glass-card">
          <h2 style={{ marginBottom: '2rem', color: '#1f2937' }}>🎯 Success Manager Overview</h2>
          
          {/* Success Metrics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              padding: '1.5rem',
              borderRadius: '12px'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#059669' }}>📊 Engagement Metrics</h4>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>QR Code Visits:</span>
                  <strong>{aggregatedStats.engagement.visitQrCode.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Web Visits:</span>
                  <strong>{aggregatedStats.engagement.visitWeb.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Social Media Total:</span>
                  <strong>{(aggregatedStats.engagement.visitFacebook + aggregatedStats.engagement.visitInstagram + aggregatedStats.engagement.visitYoutube + aggregatedStats.engagement.visitTiktok + aggregatedStats.engagement.visitX).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              padding: '1.5rem',
              borderRadius: '12px'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#2563eb' }}>👕 Merchandise Distribution</h4>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Jersey:</span>
                  <strong>{aggregatedStats.merchandise.jersey.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Scarf:</span>
                  <strong>{aggregatedStats.merchandise.scarf.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Flags:</span>
                  <strong>{aggregatedStats.merchandise.flags.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Caps:</span>
                  <strong>{aggregatedStats.merchandise.baseballCap.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              padding: '1.5rem',
              borderRadius: '12px'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#7c3aed' }}>🎯 Success Indicators</h4>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Avg. Images/Project:</span>
                  <strong>{aggregatedStats.totalProjects > 0 ? Math.round(aggregatedStats.totalImages / aggregatedStats.totalProjects) : 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Avg. Fans/Project:</span>
                  <strong>{aggregatedStats.totalProjects > 0 ? Math.round(aggregatedStats.totalFans / aggregatedStats.totalProjects) : 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Engagement Rate:</span>
                  <strong>{aggregatedStats.totalFans > 0 ? ((Object.values(aggregatedStats.engagement).reduce((a, b) => a + b, 0) / aggregatedStats.totalFans) * 100).toFixed(1) : 0}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aggregated Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="glass-card">
          <h2 style={{ marginBottom: '2rem', color: '#1f2937' }}>📈 Aggregated Statistics</h2>
          
          {/* Demographics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>👥 Gender Distribution</h3>
              <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span>Male: {aggregatedStats.genderDistribution.male.toLocaleString()}</span>
                  <span>Female: {aggregatedStats.genderDistribution.female.toLocaleString()}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  height: '20px', 
                  borderRadius: '10px', 
                  overflow: 'hidden',
                  background: '#e5e7eb'
                }}>
                  <div style={{
                    background: '#3b82f6',
                    width: `${(aggregatedStats.genderDistribution.male / (aggregatedStats.genderDistribution.male + aggregatedStats.genderDistribution.female)) * 100}%`
                  }}></div>
                  <div style={{
                    background: '#ec4899',
                    width: `${(aggregatedStats.genderDistribution.female / (aggregatedStats.genderDistribution.male + aggregatedStats.genderDistribution.female)) * 100}%`
                  }}></div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>🎂 Age Distribution</h3>
              <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gen Alpha:</span>
                    <strong>{aggregatedStats.ageDistribution.genAlpha.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gen Y/Z:</span>
                    <strong>{aggregatedStats.ageDistribution.genYZ.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gen X:</span>
                    <strong>{aggregatedStats.ageDistribution.genX.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Boomer:</span>
                    <strong>{aggregatedStats.ageDistribution.boomer.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Hashtag Filter Tab */}
      {activeTab === 'filter' && (
        <div className="glass-card">
          <h2 style={{ marginBottom: '2rem', color: '#1f2937' }}>🔍 Multi-Hashtag Filter</h2>
          
          {/* Filter Input */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Filter by Hashtags</h3>
            <HashtagInput
              value={filterHashtags}
              onChange={setFilterHashtags}
              placeholder="Add hashtags to filter projects..."
            />
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              {filterHashtags.length > 0 
                ? `Filtering by ${filterHashtags.length} hashtag${filterHashtags.length > 1 ? 's' : ''} • Found ${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`
                : 'Add hashtags above to filter projects'
              }
            </div>
          </div>

          {/* Filtered Results */}
          {filterHashtags.length > 0 && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
                Filtered Results ({filteredProjects.length})
              </h3>
              
              {/* Filtered Statistics */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1' }}>
                    {aggregatedStats.totalImages.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Images</div>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                    {aggregatedStats.totalFans.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Fans</div>
                </div>
                <div style={{
                  background: 'rgba(245, 87, 108, 0.1)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f5576c' }}>
                    {aggregatedStats.totalAttendees.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Attendees</div>
                </div>
              </div>

              {/* Filtered Projects List */}
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredProjects.map((project) => (
                  <div key={project._id} style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(229, 231, 235, 0.5)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                          {project.eventName}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                          {new Date(project.eventDate).toLocaleDateString()}
                        </div>
                        {project.hashtags && project.hashtags.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {project.hashtags.map((hashtag, index) => (
                              <ColoredHashtagBubble 
                                key={index}
                                hashtag={hashtag}
                                small={true}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#6b7280' }}>
                        <div>📸 {(project.stats.remoteImages + project.stats.hostessImages + project.stats.selfies).toLocaleString()}</div>
                        <div>👥 {(project.stats.indoor + project.stats.outdoor + project.stats.stadium).toLocaleString()}</div>
                        <div>🎫 {(project.stats.eventAttendees || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Hashtags for Quick Filter */}
          {hashtags.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Available Hashtags (Quick Add)</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {hashtags.slice(0, 20).map(({hashtag}) => (
                  <button
                    key={hashtag}
                    onClick={() => {
                      if (!filterHashtags.includes(hashtag)) {
                        setFilterHashtags([...filterHashtags, hashtag]);
                      }
                    }}
                    disabled={filterHashtags.includes(hashtag)}
                    style={{
                      background: filterHashtags.includes(hashtag) ? '#e5e7eb' : '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                      cursor: filterHashtags.includes(hashtag) ? 'default' : 'pointer',
                      opacity: filterHashtags.includes(hashtag) ? 0.5 : 1
                    }}
                  >
                    #{hashtag} {filterHashtags.includes(hashtag) ? '✓' : '+'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
