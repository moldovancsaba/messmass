import React from 'react';
import ColoredCard from './ColoredCard';
import CategorizedHashtagBubble from './CategorizedHashtagBubble';
import { getAllHashtagsWithCategories, ProjectHashtagData } from '@/lib/hashtagCategoryDisplay';
import styles from './UnifiedProjectsSection.module.css';

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
    <ColoredCard className={styles.sectionCard}>
      {/* Section Title - Same style as Data Visualization */}
      <h2 className={styles.sectionTitle}>
        📊 {title}
      </h2>

      {/* Projects Grid */}
      <div className={styles.projectsGrid}>
        {projects.map((project) => (
          <div
            key={project._id}
            className={styles.projectCard}
          >
            {/* Project Name */}
            <h3 className={styles.projectName}>
              {project.viewSlug ? (
                <a
                  href={`/stats/${project.viewSlug}`}
                  className={styles.projectLink}
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
                <div className={styles.hashtagsWrapper}>
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
                    <span className={styles.moreHashtags}>
                      +{hashtagsWithCategories.length - 6} more
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Footer with Date and Link */}
            <div className={styles.projectFooter}>
              <span className={styles.dateDisplay}>
                📅 {new Date(project.eventDate).toLocaleDateString()}
              </span>
              
              {project.viewSlug && (
                <span className={styles.viewStatsBadge}>
                  📊 View Stats
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ColoredCard>
  );
}
