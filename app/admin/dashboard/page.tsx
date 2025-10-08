'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { AdminUser } from '@/lib/auth';
import HashtagInput from '@/components/HashtagInput';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';

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
      <div className="page-container">
        <div className="admin-card">
          <div className="loading-spinner">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const aggregatedStats = calculateAggregatedStats();

  return (
    <div className="page-container">
      {/* Header */}
      <AdminHero
        title="📊 Dashboard"
        subtitle="Comprehensive dashboard with overview, success metrics, statistics, and filtering"
        backLink="/admin"
      />

      {/* Tab Navigation */}
      <div className="admin-card mb-8">
        <div className="tab-container">
          {[
            { key: 'overview', label: '📊 Dashboard Overview', icon: '📊' },
            { key: 'success', label: '🎯 Success Manager Overview', icon: '🎯' },
            { key: 'stats', label: '📈 Aggregated Statistics', icon: '📈' },
            { key: 'filter', label: '🔍 Multi-Hashtag Filter', icon: '🔍' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`tab-button ${activeTab === tab.key ? 'tab-button-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Overview Tab */}
      {activeTab === 'overview' && (
        <div className="admin-card">
          <h2 className="mb-8 text-gray-800">📊 Dashboard Overview</h2>
          
          {/* WHAT: Key metrics using centralized ColoredCard component
           * WHY: Replaced hardcoded .metric-card classes with dynamic ColoredCard components
           *      Single source of truth for all colored card styling */}
          <div className="metrics-grid">
            <ColoredCard accentColor="#8b5cf6" hoverable={false}>
              <div className="metric-value">
                {aggregatedStats.totalProjects}
              </div>
              <div className="metric-label">Total Projects</div>
            </ColoredCard>

            <ColoredCard accentColor="#f5576c" hoverable={false}>
              <div className="metric-value">
                {aggregatedStats.totalImages.toLocaleString()}
              </div>
              <div className="metric-label">Total Images</div>
            </ColoredCard>

            <ColoredCard accentColor="#3b82f6" hoverable={false}>
              <div className="metric-value">
                {aggregatedStats.totalFans.toLocaleString()}
              </div>
              <div className="metric-label">Total Fans</div>
            </ColoredCard>

            <ColoredCard accentColor="#10b981" hoverable={false}>
              <div className="metric-value">
                {aggregatedStats.totalAttendees.toLocaleString()}
              </div>
              <div className="metric-label">Total Attendees</div>
            </ColoredCard>
          </div>

          {/* Recent Projects */}
          <div>
            <h3 className="mb-4 text-gray-400">Recent Projects</h3>
            <div className="grid grid-gap-1">
              {projects.slice(0, 5).map((project) => (
                <div key={project._id} className="project-list-item">
                  <div>
                    <div className="project-name">
                      {project.eventName}
                    </div>
                    <div className="project-meta">
                      {new Date(project.eventDate).toLocaleDateString()} • 
                      {project.hashtags && project.hashtags.length > 0 && (
                        <span> {project.hashtags.length} hashtags</span>
                      )}
                    </div>
                  </div>
                  <div className="project-stats">
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
        <div className="admin-card">
          <h2 className="mb-8 text-gray-800">🎯 Success Manager Overview</h2>
          
          {/* WHAT: Success metrics using centralized ColoredCard component
           * WHY: Replaced hardcoded .success-metric-box classes with dynamic ColoredCard
           *      All three pages now use identical card implementation */}
          <div className="success-metrics-grid">
            <ColoredCard accentColor="#10b981" hoverable={false}>
              <h4 className="success-metric-title success-metric-title-green">📊 Engagement Metrics</h4>
              <div className="metric-grid-small">
                <div className="metric-row">
                  <span>QR Code Visits:</span>
                  <strong>{aggregatedStats.engagement.visitQrCode.toLocaleString()}</strong>
                </div>
                <div className="metric-row">
                  <span>Web Visits:</span>
                  <strong>{aggregatedStats.engagement.visitWeb.toLocaleString()}</strong>
                </div>
                <div className="metric-row">
                  <span>Social Media Total:</span>
                  <strong>{(aggregatedStats.engagement.visitFacebook + aggregatedStats.engagement.visitInstagram + aggregatedStats.engagement.visitYoutube + aggregatedStats.engagement.visitTiktok + aggregatedStats.engagement.visitX).toLocaleString()}</strong>
                </div>
              </div>
            </ColoredCard>

            <ColoredCard accentColor="#3b82f6" hoverable={false}>
              <h4 className="success-metric-title success-metric-title-blue">👕 Merchandise Distribution</h4>
              <div className="metric-grid-small">
                <div className="metric-row">
                  <span>Jersey:</span>
                  <strong>{aggregatedStats.merchandise.jersey.toLocaleString()}</strong>
                </div>
                <div className="metric-row">
                  <span>Scarf:</span>
                  <strong>{aggregatedStats.merchandise.scarf.toLocaleString()}</strong>
                </div>
                <div className="metric-row">
                  <span>Flags:</span>
                  <strong>{aggregatedStats.merchandise.flags.toLocaleString()}</strong>
                </div>
                <div className="metric-row">
                  <span>Caps:</span>
                  <strong>{aggregatedStats.merchandise.baseballCap.toLocaleString()}</strong>
                </div>
              </div>
            </ColoredCard>

            <ColoredCard accentColor="#8b5cf6" hoverable={false}>
              <h4 className="success-metric-title success-metric-title-purple">🎯 Success Indicators</h4>
              <div className="metric-grid-small">
                <div className="metric-row">
                  <span>Avg. Images/Project:</span>
                  <strong>{aggregatedStats.totalProjects > 0 ? Math.round(aggregatedStats.totalImages / aggregatedStats.totalProjects) : 0}</strong>
                </div>
                <div className="metric-row">
                  <span>Avg. Fans/Project:</span>
                  <strong>{aggregatedStats.totalProjects > 0 ? Math.round(aggregatedStats.totalFans / aggregatedStats.totalProjects) : 0}</strong>
                </div>
                <div className="metric-row">
                  <span>Engagement Rate:</span>
                  <strong>{aggregatedStats.totalFans > 0 ? ((Object.values(aggregatedStats.engagement).reduce((a, b) => a + b, 0) / aggregatedStats.totalFans) * 100).toFixed(1) : 0}%</strong>
                </div>
              </div>
            </ColoredCard>
          </div>
        </div>
      )}

      {/* Aggregated Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="admin-card">
          <h2 className="mb-8 text-gray-800">📈 Aggregated Statistics</h2>
          
          {/* Demographics */}
          <div className="grid-2col-300">
            <div>
              <h3 className="mb-4 text-gray-400">👥 Gender Distribution</h3>
              <div className="stats-white-box">
                <div className="flex justify-between mb-4">
                  <span>Male: {aggregatedStats.genderDistribution.male.toLocaleString()}</span>
                  <span>Female: {aggregatedStats.genderDistribution.female.toLocaleString()}</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-male"
                    style={{
                      width: `${(aggregatedStats.genderDistribution.male / (aggregatedStats.genderDistribution.male + aggregatedStats.genderDistribution.female)) * 100}%`
                    }}
                  ></div>
                  <div 
                    className="progress-bar-female"
                    style={{
                      width: `${(aggregatedStats.genderDistribution.female / (aggregatedStats.genderDistribution.male + aggregatedStats.genderDistribution.female)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-gray-400">🎂 Age Distribution</h3>
              <div className="stats-white-box">
                <div className="metric-grid-small">
                  <div className="metric-row">
                    <span>Gen Alpha:</span>
                    <strong>{aggregatedStats.ageDistribution.genAlpha.toLocaleString()}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Gen Y/Z:</span>
                    <strong>{aggregatedStats.ageDistribution.genYZ.toLocaleString()}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Gen X:</span>
                    <strong>{aggregatedStats.ageDistribution.genX.toLocaleString()}</strong>
                  </div>
                  <div className="metric-row">
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
        <div className="admin-card">
          <h2 className="mb-8 text-gray-800">🔍 Multi-Hashtag Filter</h2>
          
          {/* Filter Input */}
          <div className="mb-8">
            <h3 className="mb-4 text-gray-400">Filter by Hashtags</h3>
            <HashtagInput
              value={filterHashtags}
              onChange={setFilterHashtags}
              placeholder="Add hashtags to filter projects..."
            />
            <div className="mt-4 text-sm text-gray-500">
              {filterHashtags.length > 0 
                ? `Filtering by ${filterHashtags.length} hashtag${filterHashtags.length > 1 ? 's' : ''} • Found ${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`
                : 'Add hashtags above to filter projects'
              }
            </div>
          </div>

          {/* Filtered Results */}
          {filterHashtags.length > 0 && (
            <div>
              <h3 className="mb-4 text-gray-400">
                Filtered Results ({filteredProjects.length})
              </h3>
              
              {/* Filtered Statistics */}
              <div className="mini-metric-grid">
                <div className="mini-metric-card mini-metric-card-primary">
                  <div className="mini-metric-value mini-metric-value-primary">
                    {aggregatedStats.totalImages.toLocaleString()}
                  </div>
                  <div className="mini-metric-label">Images</div>
                </div>
                <div className="mini-metric-card mini-metric-card-success">
                  <div className="mini-metric-value mini-metric-value-success">
                    {aggregatedStats.totalFans.toLocaleString()}
                  </div>
                  <div className="mini-metric-label">Fans</div>
                </div>
                <div className="mini-metric-card mini-metric-card-pink">
                  <div className="mini-metric-value mini-metric-value-pink">
                    {aggregatedStats.totalAttendees.toLocaleString()}
                  </div>
                  <div className="mini-metric-label">Attendees</div>
                </div>
              </div>

              {/* Filtered Projects List */}
              <div className="grid grid-gap-1">
                {filteredProjects.map((project) => (
                  <div key={project._id} className="stats-white-box">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="project-detail-name">
                          {project.eventName}
                        </div>
                        <div className="project-detail-date">
                          {new Date(project.eventDate).toLocaleDateString()}
                        </div>
                        {project.hashtags && project.hashtags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
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
                      <div className="project-stats">
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
            <div className="mt-8">
              <h3 className="mb-4 text-gray-400">Available Hashtags (Quick Add)</h3>
              <div className="flex gap-2 flex-wrap">
                {hashtags.slice(0, 20).map(({hashtag}) => (
                  <button
                    key={hashtag}
                    onClick={() => {
                      if (!filterHashtags.includes(hashtag)) {
                        setFilterHashtags([...filterHashtags, hashtag]);
                      }
                    }}
                    disabled={filterHashtags.includes(hashtag)}
                    className="hashtag-quick-btn"
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
