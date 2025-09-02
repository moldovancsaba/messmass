import React from 'react';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import { getAllHashtagsWithCategories, ProjectHashtagData } from '@/lib/hashtagCategoryDisplay';

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
  children?: React.ReactNode; // For additional content like dates
}

export default function UnifiedPageHero({
  title,
  hashtags = [],
  categorizedHashtags = {},
  statusBadge,
  onExportCSV,
  children
}: UnifiedPageHeroProps) {
  return (
    <div className="admin-container" style={{ padding: '2rem', minHeight: 'auto' }}>
      <div className="admin-header glass-card" style={{ margin: 0 }}>
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">{title}</h1>
            
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
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginTop: '1rem'
                }}>
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
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(68, 68, 68, 0.2)'
          }}>
            {children}
          </div>
        )}
        
        {/* Export Button */}
        {onExportCSV && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(68, 68, 68, 0.2)'
          }}>
            <button 
              onClick={onExportCSV}
              className="btn btn-primary btn-sm"
            >
              📊 Export CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
