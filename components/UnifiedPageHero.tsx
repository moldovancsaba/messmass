import React from 'react';
import ColoredCard from './ColoredCard';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import { getAllHashtagsWithCategories, ProjectHashtagData } from '@/lib/hashtagCategoryDisplay';
import { PageStyleEnhanced, generateGradientCSS } from '@/lib/pageStyleTypesEnhanced';
import styles from './UnifiedPageHero.module.css';

interface Partner {
  _id: string;
  name: string;
  emoji: string;
  logoUrl?: string;
}

interface UnifiedPageHeroProps {
  title: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  partner1?: Partner | null;
  partner2?: Partner | null;
  statusBadge?: {
    role: string;
    level: string;
    status: string;
  };
  createdDate?: string; // ISO date string
  lastUpdatedDate?: string; // ISO date string
  onExportCSV?: () => void;
  onExportPDF?: () => void; // PDF export callback
  pageStyle?: PageStyleEnhanced;
  children?: React.ReactNode; // For additional content
  layoutMode?: 'dual-partners' | 'single-partner-spotlight'; // WHAT: Layout variation control
  hidePartnerEmoji?: boolean; // WHAT: Optional flag to hide partner emoji in spotlight mode
}

export default function UnifiedPageHero({
  title,
  hashtags = [],
  categorizedHashtags = {},
  partner1,
  partner2,
  statusBadge,
  createdDate,
  lastUpdatedDate,
  onExportCSV,
  onExportPDF,
  pageStyle,
  children,
  layoutMode = 'dual-partners', // WHAT: Default to existing dual-partners layout
  hidePartnerEmoji = false // WHAT: Default to showing emoji
}: UnifiedPageHeroProps) {
  // WHAT: Validate color values before injecting into CSS
  // WHY: Prevent undefined/null from appearing in CSS which causes React .trim() errors
  // HOW: Check each color value is string and non-empty before using
  const safePrimaryTextColor = (typeof pageStyle?.typography?.primaryTextColor === 'string' && pageStyle.typography.primaryTextColor.trim()) ? pageStyle.typography.primaryTextColor.trim() : '#1f2937';
  const safeHeadingColor = (typeof pageStyle?.typography?.headingColor === 'string' && pageStyle.typography.headingColor.trim()) ? pageStyle.typography.headingColor.trim() : '#1f2937';
  
  const styleCss = pageStyle ? `
    .admin-container { 
      background: ${generateGradientCSS(pageStyle.pageBackground)}; 
      color: ${safePrimaryTextColor};
    }
    .admin-header { 
      background: ${generateGradientCSS(pageStyle.heroBackground)}; 
    }
    .admin-title {
      color: ${safeHeadingColor};
    }
  ` : '';

  return (
    <div className={styles.container}>
      {styleCss && <style dangerouslySetInnerHTML={{ __html: styleCss }} />}
      <ColoredCard className={`admin-header ${styles.headerCard}`}>
        {/* WHAT: Partner logos layout - adaptive based on layoutMode */}
        <div className={layoutMode === 'single-partner-spotlight' ? styles.heroLayoutSpotlight : styles.heroLayout}>
          {/* WHAT: Partner 1 - Layout varies by mode
               WHY: single-partner-spotlight shows icon left, logo right; dual-partners shows full partner left */}
          {layoutMode === 'single-partner-spotlight' ? (
            /* WHAT: Single partner spotlight mode - icon on left (optional) */
            !hidePartnerEmoji && partner1?.emoji ? (
              <div className={styles.partnerIconOnly}>
                <div className={styles.partnerEmojiLarge} title={partner1.name}>
                  {partner1.emoji}
                </div>
              </div>
            ) : null
          ) : (
            /* WHAT: Dual partners mode - full partner display on left */
            partner1 && (
              <div className={styles.partnerContainer}>
                {partner1.logoUrl ? (
                  <img 
                    src={partner1.logoUrl} 
                    alt={partner1.name}
                    className={styles.partnerLogo}
                    title={partner1.name}
                  />
                ) : (
                  <div className={styles.partnerEmoji} title={partner1.name}>
                    {partner1.emoji}
                  </div>
                )}
                <div className={styles.partnerName}>{partner1.name}</div>
              </div>
            )
          )}

          {/* WHAT: Center content - Title and hashtags */}
          <div className={styles.centerContent}>
            <h1 
              className="admin-title"
              style={(typeof pageStyle?.colorScheme?.primary === 'string' && pageStyle.colorScheme.primary.trim()) ? {
                color: pageStyle.colorScheme.primary.trim()
              } : undefined}
            >
              {title}
            </h1>
            {/* WHAT: Style name badge removed - not relevant for viewers
                WHY: Internal configuration detail not needed in public view */}
            
            {/* Beautiful Bubble Hashtags Display with Category Prefixes */}
            {(() => {
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
                        padding: '0.5rem 1rem',
                        ...((typeof pageStyle?.colorScheme?.primary === 'string' && pageStyle.colorScheme.primary.trim()) ? {
                          backgroundColor: pageStyle.colorScheme.primary.trim(),
                          color: '#ffffff'
                        } : {})
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
                            padding: '0.5rem 1rem',
                            ...((typeof pageStyle?.colorScheme?.primary === 'string' && pageStyle.colorScheme.primary.trim()) ? {
                              backgroundColor: pageStyle.colorScheme.primary.trim(),
                              color: '#ffffff'
                            } : {})
                          }}
                          showCategoryPrefix={true}
                        />
                      );
                    });
                  }
                });
              }
              
              return displayHashtags.length > 0 ? (
                <div className={styles.hashtagsWrapper}>
                  {displayHashtags}
                </div>
              ) : null;
            })()}
          </div>

          {/* WHAT: Right side - varies by mode
               WHY: single-partner-spotlight shows partner1 logo; dual-partners shows partner2 */}
          {layoutMode === 'single-partner-spotlight' ? (
            /* WHAT: Single partner spotlight mode - logo on right */
            partner1?.logoUrl ? (
              <div className={styles.partnerLogoOnly}>
                <img 
                  src={partner1.logoUrl} 
                  alt={partner1.name}
                  className={styles.partnerLogoLarge}
                  title={partner1.name}
                />
              </div>
            ) : null
          ) : (
            /* WHAT: Dual partners mode - partner2 on right */
            partner2 && (
              <div className={styles.partnerContainer}>
                {partner2.logoUrl ? (
                  <img 
                    src={partner2.logoUrl} 
                    alt={partner2.name}
                    className={styles.partnerLogo}
                    title={partner2.name}
                  />
                ) : (
                  <div className={styles.partnerEmoji} title={partner2.name}>
                    {partner2.emoji}
                  </div>
                )}
                <div className={styles.partnerName}>{partner2.name}</div>
              </div>
            )
          )}
        </div>

        <div className="admin-header-content">
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
        
        {/* WHAT: Date metadata with unified styling */}
        {(createdDate || lastUpdatedDate) && (
          <div className={styles.dateMetadata}>
            {createdDate && (
              <span className={styles.dateItem}>
                Created: {new Date(createdDate).toLocaleDateString()}
              </span>
            )}
            {createdDate && lastUpdatedDate && <span className={styles.dateDivider}>•</span>}
            {lastUpdatedDate && (
              <span className={styles.dateItem}>
                Last Updated: {new Date(lastUpdatedDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
        
        {/* Additional Content */}
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
                style={(typeof pageStyle?.colorScheme?.primary === 'string' && pageStyle.colorScheme.primary.trim()) ? {
                  backgroundColor: pageStyle.colorScheme.primary.trim(),
                  borderColor: pageStyle.colorScheme.primary.trim()
                } : undefined}
              >
                📊 Export CSV
              </button>
            )}
            {onExportPDF && (
              <button 
                onClick={onExportPDF}
                className={`btn btn-secondary btn-small ${styles.exportButton}`}
                style={(typeof pageStyle?.colorScheme?.primary === 'string' && pageStyle.colorScheme.primary.trim()) ? {
                  backgroundColor: pageStyle.colorScheme.primary.trim(),
                  borderColor: pageStyle.colorScheme.primary.trim()
                } : undefined}
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
