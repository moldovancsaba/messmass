'use client';

import React, { useState, useEffect } from 'react';
import HashtagCategoryDebug from '@/components/HashtagCategoryDebug';

interface ProjectData {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags: string[];
  categorizedHashtags: { [categoryName: string]: string[] };
  viewSlug?: string;
  createdAt: string;
}

interface DebugResponse {
  success: boolean;
  data: {
    projectsWithCategories: ProjectData[];
    projectsWithTraditional: ProjectData[];
    counts: {
      totalWithCategorized: number;
      totalWithTraditional: number;
      totalProjects: number;
    };
  };
}

export default function HashtagCategoriesDebugPage() {
  const [data, setData] = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/debug/categorized-hashtags');
        const result = await response.json();
        
        if (result.success) {
          setData(result);
        } else {
          setError(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError('Failed to fetch debug data');
        console.error('Debug fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="admin-container">
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
          color: 'white'
        }}>
          <h1 style={{ marginBottom: '1rem' }}>Loading...</h1>
          <div>Fetching hashtag category mappings</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-container">
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
          color: 'white'
        }}>
          <h1 style={{ marginBottom: '1rem', color: '#ef4444' }}>Error</h1>
          <div>{error || 'Failed to load data'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 1rem 0'
          }}>
            🏷️ Hashtag Categories Debug
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '1.125rem'
          }}>
            View hashtag-to-category mappings for projects
          </p>
        </div>

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: '#10b981'
            }}>
              {data.data.counts.totalWithCategorized}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Projects with Categories
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: '#f59e0b'
            }}>
              {data.data.counts.totalWithTraditional}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Traditional Hashtags Only
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: '#6366f1'
            }}>
              {data.data.counts.totalProjects}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Total Projects
            </div>
          </div>
        </div>

        {/* Projects with Categories */}
        {data.data.projectsWithCategories.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 1.5rem 0'
            }}>
              🎯 Projects with Categorized Hashtags ({data.data.projectsWithCategories.length})
            </h2>
            
            {data.data.projectsWithCategories.map((project) => (
              <div key={project._id} style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {project.eventName}
                  </h3>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    {new Date(project.eventDate).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Category Debug Display */}
                <HashtagCategoryDebug
                  projectData={{
                    hashtags: project.hashtags,
                    categorizedHashtags: project.categorizedHashtags
                  }}
                  title={`Hashtag Mapping for ${project.eventName}`}
                />
                
                {/* Compact display */}
                <div style={{ marginTop: '0.5rem' }}>
                  <strong style={{ fontSize: '0.875rem', color: '#374151' }}>
                    Formatted Output:
                  </strong>
                  <HashtagCategoryDebug
                    projectData={{
                      hashtags: project.hashtags,
                      categorizedHashtags: project.categorizedHashtags
                    }}
                    compact={true}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Projects with Traditional Hashtags */}
        {data.data.projectsWithTraditional.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 1.5rem 0'
            }}>
              📝 Projects with Traditional Hashtags Only ({data.data.projectsWithTraditional.length})
            </h2>
            
            {data.data.projectsWithTraditional.map((project) => (
              <div key={project._id} style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {project.eventName}
                  </h3>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    {new Date(project.eventDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {project.hashtags.map((hashtag, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(107, 114, 128, 0.1)',
                        color: '#374151',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      #{hashtag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
