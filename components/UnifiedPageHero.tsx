import React from 'react';
import ColoredCard from './ColoredCard';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import { getAllHashtagsWithCategories, ProjectHashtagData } from '@/lib/hashtagCategoryDisplay';
import { PageStyleEnhanced, generateGradientCSS } from '@/lib/pageStyleTypesEnhanced';
import styles from './UnifiedPageHero.module.css';

interface UnifiedPageHeroProps {
  title: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  statusBadge?: {
    role: string;
    level: string;
    status: string;
  };
  onExportCSV?: () => void;
  onExportPDF?: () => void; // PDF export callback
  pageStyle?: PageStyleEnhanced;
  children?: React.ReactNode; // For additional content like dates
}

export default function UnifiedPageHero({
  title,
  hashtags = [],
  categorizedHashtags = {},
  statusBadge,
  onExportCSV,
  onExportPDF,
  pageStyle,
  children
}: UnifiedPageHeroProps) {
  const styleCss = pageStyle ? `
    .admin-container { 
      background: ${generateGradientCSS(pageStyle.pageBackground)}; 
      color: ${pageStyle.typography.primaryTextColor};
    }
    .admin-header { 
      background: ${generateGradientCSS(pageStyle.heroBackground)}; 
    }
    .admin-title {
      color: ${pageStyle.typography.headingColor};
    }
  ` : '';

  return (
    <div className={styles.container}>
      {styleCss && <style dangerouslySetInnerHTML={{ __html: styleCss }} />}
      <ColoredCard className={`admin-header ${styles.headerCard}`}>
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">{title}</h1>
            {/* WHAT: Style name badge removed - not relevant for viewers
                WHY: Internal configuration detail not needed in public view */}
            
            {/* Beautiful Bubble Hashtags Display with Category Prefixes */}
            {(() => {
              // Debug: Log the data we're receiving
              console.log('UnifiedPageHero - hashtags:', hashtags);
              console.log('UnifiedPageHero - categorizedHashtags:', categorizedHashtags);
              
              const displayHashtags: React.ReactElement[] = [];
              
              // Add traditional hashtags (ColoredHashtagBubble will add the # prefix)
              if (hashtags && hashtags.length > 0) {
                hashtags.forEach(hashtag => {
                  // Clean hashtag (remove # if present, ColoredHashtagBubble will add it)
                  const cleanHashtag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
                  displayHashtags.push(
                    <ColoredHashtagBubble 
                      key={`general-${hashtag}`}
                      hashtag={cleanHashtag}
                      customStyle={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        padding: '0.5rem 1rem'
                      }}
                    />
                  );
                });
              }
              
              // Add categorized hashtags with category prefix and intelligent color resolution
              if (categorizedHashtags && Object.keys(categorizedHashtags).length > 0) {
                Object.entries(categorizedHashtags).forEach(([category, categoryHashtagList]) => {
                  if (Array.isArray(categoryHashtagList)) {
                    categoryHashtagList.forEach(hashtag => {
                      // Clean hashtag (remove # if present)
                      const cleanHashtag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
                      // Display as category:hashtag (ColoredHashtagBubble will add the # prefix)
                      const displayText = `${category}:${cleanHashtag}`;
                      displayHashtags.push(
                        <ColoredHashtagBubble 
                          key={`${category}-${hashtag}`}
                          hashtag={cleanHashtag}
                          projectCategorizedHashtags={categorizedHashtags}
                          autoResolveColor={true}
                          customStyle={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            padding: '0.5rem 1rem'
                          }}
                          showCategoryPrefix={true}
                        />
                      );
                    });
                  }
                });
              }
              
              console.log('Total displayHashtags created:', displayHashtags.length);
              
              return displayHashtags.length > 0 ? (
                <div className={styles.hashtagsWrapper}>
                  {displayHashtags}
                </div>
              ) : null;
            })()}
          </div>
          
          <div className="admin-user-info">
            <div className="admin-badge">
              {statusBadge && (
                <>
                  <div className="admin-role">{statusBadge.role}</div>
                  <div className="admin-level">{statusBadge.level}</div>
                  <div className="admin-status">{statusBadge.status}</div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Additional Content (like dates) */}
        {children && (
          <div className={styles.additionalContent}>
            {children}
          </div>
        )}
        
        {/* Export Buttons */}
        {(onExportCSV || onExportPDF) && (
          <div className={styles.exportButtons}>
            {onExportCSV && (
              <button 
                onClick={onExportCSV}
                className={`btn btn-primary btn-small ${styles.exportButton}`}
              >
                📊 Export CSV
              </button>
            )}
            {onExportPDF && (
              <button 
                onClick={onExportPDF}
                className={`btn btn-secondary btn-small ${styles.exportButton}`}
              >
                📄 Export PDF
              </button>
            )}
          </div>
        )}
      </ColoredCard>
    </div>
  );
}
