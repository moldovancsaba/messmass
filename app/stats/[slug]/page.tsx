'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './stats.module.css';
import {
  GenderCircleChart,
  FansLocationPieChart,
  AgeGroupsPieChart,
  MerchandiseHorizontalBars,
  VisitorSourcesPieChart,
  ChartContainer
} from '@/components/StatsCharts';

interface Project {
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

export default function StatsPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log('🔍 Fetching project stats for slug:', slug);
        const response = await fetch(`/api/projects/stats/${slug}`);
        const data = await response.json();

        if (data.success) {
          setProject(data.project);
        } else {
          setError(data.error || 'Failed to load project');
        }
      } catch (err) {
        console.error('Failed to fetch project:', err);
        setError('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProject();
    }
  }, [slug]);

  // Calculate totals
  const totalImages = project ? project.stats.remoteImages + project.stats.hostessImages + project.stats.selfies : 0;
  const totalFans = project ? project.stats.indoor + project.stats.outdoor + project.stats.stadium : 0;
  const totalGender = project ? project.stats.female + project.stats.male : 0;
  const totalUnder40 = project ? project.stats.genAlpha + project.stats.genYZ : 0;
  const totalOver40 = project ? project.stats.genX + project.stats.boomer : 0;
  const totalAge = totalUnder40 + totalOver40;
  const totalMerch = project ? project.stats.merched + project.stats.jersey + project.stats.scarf + project.stats.flags + project.stats.baseballCap + project.stats.other : 0;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading event statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>❌ Error</h1>
          <p>{error}</p>
          <p>The statistics page you're looking for might not exist or may have been removed.</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>📊 Project Not Found</h1>
          <p>The statistics page you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header with same styling as admin page */}
      <div className="glass-card admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">{project.eventName}</h1>
            <p className="admin-subtitle">Event Statistics - {new Date(project.eventDate).toLocaleDateString()}</p>
          </div>
          <div className="admin-user-info">
            <div className="admin-badge" style={{ padding: '0.75rem 1rem' }}>
              <p className="admin-role">📅 {new Date(project.eventDate).toLocaleDateString()}</p>
              <p className="admin-level">📊 Last Updated</p>
              <p className="admin-status">{new Date(project.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid Section */}
      <div className="glass-card charts-section">
        <h2 className="section-title">📊 Data Visualization</h2>
        <div className="charts-grid">
          <ChartContainer title="Gender Distribution" className="chart-item">
            <GenderCircleChart stats={project.stats} eventName={project.eventName} />
          </ChartContainer>
          
          <ChartContainer title="Fans Location" className="chart-item">
            <FansLocationPieChart stats={project.stats} eventName={project.eventName} />
          </ChartContainer>
          
          <ChartContainer title="Age Groups" className="chart-item">
            <AgeGroupsPieChart stats={project.stats} eventName={project.eventName} />
          </ChartContainer>
          
          <ChartContainer title="Merchandise Categories" className="chart-item">
            <MerchandiseHorizontalBars stats={project.stats} eventName={project.eventName} />
          </ChartContainer>
          
          {/* Conditional rendering for Visitor Sources - only if data exists */}
          {((project.stats.visitQrCode || 0) + (project.stats.visitWeb || 0) + (project.stats.visitFacebook || 0) + (project.stats.visitInstagram || 0) + (project.stats.visitYoutube || 0) + (project.stats.visitTiktok || 0) + (project.stats.visitX || 0) + (project.stats.visitTrustpilot || 0) + (project.stats.visitShortUrl || 0)) > 0 && (
            <ChartContainer title="Visitor Sources" className="chart-item">
              <VisitorSourcesPieChart stats={project.stats} eventName={project.eventName} />
            </ChartContainer>
          )}
        </div>
      </div>

      <div className={styles.statsGrid}>
        {/* Images Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📸 Images ({totalImages})</h2>
          <div className={styles.statsRow}>
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

        {/* Fans Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>👥 Fans ({totalFans})</h2>
          <div className={styles.statsRow}>
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

        {/* Gender Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>⚧️ Gender ({totalGender})</h2>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Female</div>
              <div className={styles.statValue}>{project.stats.female}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Male</div>
              <div className={styles.statValue}>{project.stats.male}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Gender</div>
              <div className={styles.statValue}>{totalGender}</div>
            </div>
          </div>
        </div>

        {/* Age Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🎂 Age Groups ({totalAge})</h2>
          {/* First row: Gen Alpha, Gen Y+Z, Total Under 40 */}
          <div className={styles.statsRow}>
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
          {/* Second row: Gen X, Boomer, Total Over 40 */}
          <div className={styles.statsRow}>
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

        {/* Fans with Merchandise */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🛑️ Fans with Merchandise</h2>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Merched Fans</div>
              <div className={styles.statValue}>{project.stats.merched}</div>
            </div>
          </div>
        </div>

        {/* Merchandise Types */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>👕 Merchandise Types ({project.stats.jersey + project.stats.scarf + project.stats.flags + project.stats.baseballCap + project.stats.other})</h2>
          <div className={styles.statsRow}>
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
          </div>
          <div className={styles.statsRow}>
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

        {/* Success Manager Section - if data exists */}
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

      {/* Footer */}
      <div className={styles.footer}>
        <p>Generated on {new Date().toLocaleDateString()} • MessMass Event Statistics</p>
      </div>
    </div>
  );
}
