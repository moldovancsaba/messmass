'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import EditorDashboard from '../../../components/EditorDashboard';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';
import { PageStyle } from '@/lib/pageStyleTypes';

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

export default function EditPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  // Authentication state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [pageStyle, setPageStyle] = useState<PageStyle | null>(null);

  const loadProjectForEditing = useCallback(async () => {
    try {
      console.log('🔍 Fetching project for editing with slug:', slug);
      const response = await fetch(`/api/projects/edit/${slug}`, { cache: 'no-store' });
      const data = await response.json();

      if (data.success) {
        console.log('✅ Found project for editing:', data.project.eventName);
        setProject(data.project);
        setLoading(false);
      } else {
        setError(data.error || 'Project not found');
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch project:', err);
      setError('Failed to load project for editing');
      setLoading(false);
    }
  }, [slug]);

  // Fetch page configuration (style variables) for this editor page
  const fetchPageConfig = useCallback(async (projectIdentifier?: string) => {
    try {
      const qs = projectIdentifier ? `?projectId=${encodeURIComponent(projectIdentifier)}` : '';
      const response = await fetch(`/api/page-config${qs}`, { cache: 'no-store' });
      const data = await response.json();
      if (data.success) {
        setPageStyle(data.config.pageStyle);
      }
    } catch (err) {
      console.error('Failed to fetch page config for edit page:', err);
    }
  }, []);

  // Check authentication on component mount
  useEffect(() => {
    if (slug) {
      const authenticated = isAuthenticated(slug, 'edit');
      setIsAuthorized(authenticated);
      setCheckingAuth(false);
      
      // Only load data if authenticated
      if (authenticated) {
        loadProjectForEditing();
        fetchPageConfig(slug);
      }
    }
  }, [slug, fetchPageConfig, loadProjectForEditing]);

  // Handle successful login
  const handleLoginSuccess = (isAdmin: boolean) => {
    setIsAuthorized(true);
    setCheckingAuth(false);
    // Load data after successful authentication
    loadProjectForEditing();
    fetchPageConfig(slug);
  };

  /* What: Loading state while checking authentication
     Why: Show user-friendly loading indicator during auth check */
  if (checkingAuth) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--mm-gray-50)'
      }}>
        <div style={{
          background: 'var(--mm-white)',
          borderRadius: 'var(--mm-radius-lg)',
          boxShadow: 'var(--mm-shadow-lg)',
          padding: 'var(--mm-space-8)',
          textAlign: 'center'
        }}>
          <div className="curve-spinner"></div>
          <p style={{ 
            marginTop: 'var(--mm-space-4)',
            color: 'var(--mm-gray-600)',
            fontSize: 'var(--mm-font-size-sm)'
          }}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authorized
  if (!isAuthorized) {
    return (
      <PagePasswordLogin
        pageId={slug}
        pageType="edit"
        onSuccess={handleLoginSuccess}
      />
    );
  }

  /* What: Loading state while fetching project data
     Why: Show user-friendly loading indicator with context */
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--mm-gray-50)'
      }}>
        <div style={{
          background: 'var(--mm-white)',
          borderRadius: 'var(--mm-radius-lg)',
          boxShadow: 'var(--mm-shadow-lg)',
          padding: 'var(--mm-space-8)',
          textAlign: 'center'
        }}>
          <div className="curve-spinner"></div>
          <p style={{ 
            marginTop: 'var(--mm-space-4)',
            color: 'var(--mm-gray-600)',
            fontSize: 'var(--mm-font-size-sm)'
          }}>Loading project editor...</p>
        </div>
      </div>
    );
  }

  /* What: Error state with flat TailAdmin V2 design
     Why: Modern, clean error card without glass-morphism effects */
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--mm-space-6)',
        backgroundColor: 'var(--mm-gray-50)'
      }}>
        <div style={{ 
          background: 'var(--mm-white)',
          borderRadius: 'var(--mm-radius-lg)',
          boxShadow: 'var(--mm-shadow-lg)',
          padding: 'var(--mm-space-8)',
          textAlign: 'center',
          maxWidth: '40rem',
          width: '100%',
          borderTop: '4px solid var(--mm-error)'
        }}>
          <h1 style={{ 
            margin: '0 0 var(--mm-space-4) 0', 
            fontSize: 'var(--mm-font-size-2xl)',
            fontWeight: 'var(--mm-font-weight-bold)',
            color: 'var(--mm-error)'
          }}>❌ Access Error</h1>
          <p style={{ 
            margin: 'var(--mm-space-2) 0', 
            fontSize: 'var(--mm-font-size-lg)',
            color: 'var(--mm-gray-700)',
            lineHeight: 'var(--mm-line-height-md)'
          }}>{error}</p>
          <p style={{ 
            margin: 'var(--mm-space-2) 0',
            fontSize: 'var(--mm-font-size-base)',
            color: 'var(--mm-gray-600)',
            lineHeight: 'var(--mm-line-height-md)'
          }}>
            The editing link you&apos;re trying to access might not exist or may have been removed.
          </p>
          <button 
            onClick={() => window.close()}
            style={{
              background: 'var(--mm-error)',
              border: 'none',
              color: 'var(--mm-white)',
              padding: 'var(--mm-space-3) var(--mm-space-6)',
              borderRadius: 'var(--mm-radius-md)',
              cursor: 'pointer',
              fontSize: 'var(--mm-font-size-base)',
              fontWeight: 'var(--mm-font-weight-medium)',
              marginTop: 'var(--mm-space-6)',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--mm-shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--mm-shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--mm-shadow-sm)';
            }}
          >
            ✕ Close Editor
          </button>
        </div>
      </div>
    );
  }

  /* What: Main editor container with flat TailAdmin V2 design
     Why: Modern, clean layout with optional custom page style support
     
     Features:
     - Flat gray background for better contrast
     - Optional project-specific gradient support
     - Full viewport height for immersive editing experience
     - Proper integration with EditorDashboard component */
  /* WHAT: Main editor container with flat design */
  if (project) {
    return (
      <div className="page-bg-gray">
        {/* What: Optional custom page style injection
            Why: Allow project-specific branding while maintaining base design */}
        {pageStyle && (
          <style
            dangerouslySetInnerHTML={{
              __html: `
                .edit-page-custom-bg { background: linear-gradient(${pageStyle.backgroundGradient}); }
                .edit-header-custom-bg { background: linear-gradient(${pageStyle.headerBackgroundGradient}); }
              `
            }}
          />
        )}
        <EditorDashboard project={project} />
      </div>
    );
  }

  return null;
}
