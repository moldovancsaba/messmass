'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EditorDashboard from '../../../components/EditorDashboard';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';

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

  const loadProjectForEditing = async () => {
    try {
      console.log('🔍 Fetching project for editing with slug:', slug);
      const response = await fetch(`/api/projects/edit/${slug}`);
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
  };

  // Check authentication on component mount
  useEffect(() => {
    if (slug) {
      const authenticated = isAuthenticated(slug, 'edit');
      setIsAuthorized(authenticated);
      setCheckingAuth(false);
      
      // Only load data if authenticated
      if (authenticated) {
        loadProjectForEditing();
      }
    }
  }, [slug]);

  // Handle successful login
  const handleLoginSuccess = (isAdmin: boolean) => {
    setIsAuthorized(true);
    setCheckingAuth(false);
    // Load data after successful authentication
    loadProjectForEditing();
  };

  // Show login screen if not authenticated
  if (checkingAuth) {
    return (
      <div className="loading-centered-container">
        <div className="loading-card">
          <div className="curve-spinner"></div>
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

  if (loading) {
    return (
      <div className="loading-centered-container">
        <div className="loading-card">
          <div className="curve-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ 
          background: 'rgba(220, 38, 38, 0.1)', 
          backdropFilter: 'blur(10px)',
          padding: '2rem',
          borderRadius: '16px',
          textAlign: 'center',
          border: '1px solid rgba(220, 38, 38, 0.2)',
          maxWidth: '600px'
        }}>
          <h1 style={{ margin: '0 0 1rem 0', fontSize: '2rem' }}>❌ Access Error</h1>
          <p style={{ margin: '0.5rem 0', fontSize: '1.125rem', opacity: 0.9 }}>{error}</p>
          <p style={{ margin: '0.5rem 0', opacity: 0.8 }}>
            The editing link you&apos;re trying to access might not exist or may have been removed.
          </p>
          <button 
            onClick={() => window.close()}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              marginTop: '1rem',
              backdropFilter: 'blur(10px)'
            }}
          >
            ✕ Close Editor
          </button>
        </div>
      </div>
    );
  }

  if (project) {
    return <EditorDashboard project={project} />;
  }

  return null;
}
