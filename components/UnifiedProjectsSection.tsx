import React from 'react';
import CategorizedHashtagBubble from './CategorizedHashtagBubble';
import { getAllHashtagsWithCategories, ProjectHashtagData } from '@/lib/hashtagCategoryDisplay';

interface ProjectItem {
  _id: string;
  eventName: string;
  eventDate: string;
  viewSlug?: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  createdAt: string;
  updatedAt: string;
}

interface UnifiedProjectsSectionProps {
  projects: ProjectItem[];
  title: string; // e.g., "Projects with #summer + #hungary (15)"
}

export default function UnifiedProjectsSection({
  projects,
  title
}: UnifiedProjectsSectionProps) {
  
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="admin-card" style={{
      padding: '2rem',
      marginBottom: '2rem'
    }}>
      {/* Section Title - Same style as Data Visualization */}
      <h2 style={{
        fontSize: '1.875rem',
        fontWeight: '700',
        color: '#1f2937',
        margin: '0 0 2rem 0',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        📊 {title}
      </h2>

      {/* Projects Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem',
        width: '100%'
      }}>
        {projects.map((project) => (
          <div
            key={project._id}
            style={{
              background: 'rgba(248, 250, 252, 0.8)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              transition: 'all 0.2s ease',
              minHeight: '160px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
            }}
          >
            {/* Project Name */}
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              lineHeight: '1.4'
            }}>
              {project.viewSlug ? (
                <a
                  href={`/stats/${project.viewSlug}`}
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
                  title={`View statistics for ${project.eventName}`}
                >
                  {project.eventName}
                </a>
              ) : (
                <span>{project.eventName}</span>
              )}
            </h3>

            {/* Hashtags with Categories */}
            {(() => {
              // Get all hashtags with their categories from the project data
              const projectData: ProjectHashtagData = {
                hashtags: project.hashtags,
                categorizedHashtags: project.categorizedHashtags
              };
              const hashtagsWithCategories = getAllHashtagsWithCategories(projectData);
              
              if (hashtagsWithCategories.length === 0) return null;
              
              return (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  minHeight: '40px'
                }}>
                  {hashtagsWithCategories.slice(0, 6).map((hashtagData, index) => (
                    <CategorizedHashtagBubble
                      key={index}
                      hashtag={hashtagData.hashtag}
                      category={hashtagData.primaryCategory}
                      small={true}
                      showCategoryLabel={hashtagData.primaryCategory !== 'general'}
                    />
                  ))}
                  {hashtagsWithCategories.length > 6 && (
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(107, 114, 128, 0.1)',
                      borderRadius: '6px',
                      fontWeight: '500',
                      alignSelf: 'flex-end',
                      marginBottom: '0.25rem'
                    }}>
                      +{hashtagsWithCategories.length - 6} more
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Footer with Date and Link */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: '#6b7280',
              marginTop: 'auto'
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                📅 {new Date(project.eventDate).toLocaleDateString()}
              </span>
              
              {project.viewSlug && (
                <span style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  📊 View Stats
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
