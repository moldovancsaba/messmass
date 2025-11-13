// lib/adapters/projectsAdapter.tsx
// WHAT: Adapter configuration for Projects admin page
// WHY: Defines list/card view structure for event projects data with partner support
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import Image from 'next/image';
import { AdminPageAdapter } from '../adminDataAdapters';
import { ProjectDTO } from '../types/api';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';

/**
 * WHAT: Complete adapter configuration for Projects page
 * WHY: Single source of truth for how projects/events are displayed
 * 
 * @example
 * <UnifiedAdminPage
 *   adapter={projectsAdapter}
 *   items={projects}
 *   title="Projects"
 * />
 */
export const projectsAdapter: AdminPageAdapter<ProjectDTO> = {
  pageName: 'projects',
  defaultView: 'list',
  
  listConfig: {
    columns: [
      {
        key: 'eventName',
        label: 'Event Name',
        sortable: true,
        minWidth: '250px',
        render: (project) => {
          const partnerRowStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          };
          const partnerEmojiStyle: React.CSSProperties = {
            fontSize: '2rem',
            flexShrink: 0
          };
          const partnerLogoStyle: React.CSSProperties = {
            width: '40px',
            height: '40px',
            objectFit: 'contain',
            borderRadius: '4px',
            flexShrink: 0
          };
          const partnerLogoPlaceholderStyle: React.CSSProperties = {
            width: '40px',
            height: '40px',
            flexShrink: 0
          };
          const eventNameStyle: React.CSSProperties = {
            fontWeight: 600
          };
          
          return (
            <div>
              <div style={partnerRowStyle}>
                {project.partner1 && (
                  <span style={partnerEmojiStyle}>
                    {project.partner1.emoji}
                  </span>
                )}
                
                {project.partner1?.logoUrl ? (
                  <Image
                    src={project.partner1.logoUrl}
                    alt={`${project.partner1.name} logo`}
                    width={40}
                    height={40}
                    style={{ objectFit: 'contain', borderRadius: '4px', flexShrink: 0 }}
                    title={project.partner1.name}
                    unoptimized
                  />
                ) : project.partner1 ? (
                  <div style={partnerLogoPlaceholderStyle} />
                ) : null}
                
                <span style={eventNameStyle}>{project.eventName}</span>
                
                {project.partner2?.logoUrl ? (
                  <Image
                    src={project.partner2.logoUrl}
                    alt={`${project.partner2.name} logo`}
                    width={40}
                    height={40}
                    style={{ objectFit: 'contain', borderRadius: '4px', flexShrink: 0 }}
                    title={project.partner2.name}
                    unoptimized
                  />
                ) : project.partner2 ? (
                  <div style={partnerLogoPlaceholderStyle} />
                ) : null}
              </div>
              
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {project.hashtags?.map((hashtag) => (
                  <ColoredHashtagBubble
                    key={`general-${hashtag}`}
                    hashtag={hashtag}
                    small
                    interactive={false}
                    projectCategorizedHashtags={project.categorizedHashtags}
                    autoResolveColor
                  />
                ))}
                {project.categorizedHashtags &&
                  Object.entries(project.categorizedHashtags).map(([category, hashtags]) =>
                    hashtags.map((hashtag) => (
                      <ColoredHashtagBubble
                        key={`${category}-${hashtag}`}
                        hashtag={`${category}:${hashtag}`}
                        showCategoryPrefix
                        small
                        interactive={false}
                      />
                    ))
                  )}
              </div>
            </div>
          );
        },
      },
      {
        key: 'eventDate',
        label: 'Date',
        sortable: true,
        width: '120px',
        render: (project) => (
          <span style={{ fontSize: '0.875rem' }}>
            {new Date(project.eventDate).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'images',
        label: 'Images',
        width: '100px',
        sortable: true,
        render: (project) => {
          const total = (project.stats.remoteImages || 0) + 
                       (project.stats.hostessImages || 0) + 
                       (project.stats.selfies || 0);
          return <span>{total.toLocaleString()}</span>;
        },
      },
      {
        key: 'fans',
        label: 'Total Fans',
        width: '100px',
        sortable: true,
        render: (project) => {
          const total = (project.stats.stadium || 0) + (project.stats.remoteFans || 0);
          return <span>{total.toLocaleString()}</span>;
        },
      },
      {
        key: 'attendees',
        label: 'Attendees',
        width: '100px',
        sortable: true,
        render: (project) => (
          <span>{(project.stats.eventAttendees || 0).toLocaleString()}</span>
        ),
      },
    ],
    rowActions: [
      {
        label: 'CSV',
        icon: 'download',
        variant: 'secondary',
        handler: async (project) => {
          try {
            const timestamp = new Date().getTime();
            const id = project.viewSlug || project._id;
            const res = await fetch(`/api/projects/stats/${id}?refresh=${timestamp}`);
            const data = await res.json();
            if (!data.success || !data.project) {
              alert('Failed to fetch project stats for CSV export');
              return;
            }
            const p = data.project;
            const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
            const rows: Array<[string, string | number]> = [];
            rows.push(['Event Name', p.eventName]);
            rows.push(['Event Date', p.eventDate]);
            rows.push(['Created At', p.createdAt]);
            rows.push(['Updated At', p.updatedAt]);
            Object.entries(p.stats || {}).forEach(([k, v]) => {
              rows.push([k, typeof v === 'number' || typeof v === 'string' ? v : '']);
            });
            const header = ['Variable', 'Value'];
            const csv = [header, ...rows].map(([k, v]) => `${esc(k)},${esc(v)}`).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const base = p.eventName.replace(/[^a-zA-Z0-9]/g, '_') || 'event';
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${base}_variables.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (e) {
            alert('Export failed');
          }
        },
        title: 'Download CSV export',
      },
      {
        label: 'Report',
        icon: 'visibility',
        variant: 'secondary',
        handler: (project) => {
          // WHAT: Open share modal for report page (handler overridden by page component)
          // WHY: Allow sharing report link AND visiting report page
          console.log('Report:', project._id);
        },
        title: 'Share and view report page',
      },
      {
        label: 'Edit Stats',
        icon: 'bar_chart',
        variant: 'primary',
        handler: (project) => {
          // WHAT: Open share modal for edit page (handler overridden by page component)
          // WHY: Allow sharing edit link AND visiting clicker/editor
          console.log('Edit Stats:', project._id);
        },
        title: 'Share and edit event statistics',
      },
      {
        label: 'Edit',
        icon: 'edit',
        variant: 'secondary',
        handler: (project) => {
          // This will be overridden by the page component
          console.log('Edit project:', project._id);
        },
        title: 'Edit project details (name, date, hashtags)',
      },
      {
        label: 'Delete',
        icon: 'delete',
        variant: 'danger',
        handler: async (project) => {
          if (confirm(`Delete event "${project.eventName}"?`)) {
            try {
              const response = await fetch(`/api/projects?projectId=${project._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
              });
              const result = await response.json();
              if (result.success) {
                window.location.reload();
              } else {
                alert('Failed to delete project');
              }
            } catch (e) {
              alert('Delete failed');
            }
          }
        },
        title: 'Delete project',
      },
    ],
  },

  cardConfig: {
    primaryField: 'eventName',
    secondaryField: (project) => new Date(project.eventDate).toLocaleDateString(),
    metaFields: [
      {
        key: 'stats',
        label: 'Total Images',
        icon: '📷',
        render: (project) => {
          const total = (project.stats.remoteImages || 0) + 
                       (project.stats.hostessImages || 0) + 
                       (project.stats.selfies || 0);
          return total.toLocaleString();
        },
      },
      {
        key: 'stats.stadium',
        label: 'Total Fans',
        icon: '👥',
        render: (project) => {
          const total = (project.stats.stadium || 0) + (project.stats.remoteFans || 0);
          return total.toLocaleString();
        },
      },
      {
        key: 'stats.merched',
        label: 'Merchandise',
        icon: '🛍️',
        render: (project) => (project.stats.merched || 0).toLocaleString(),
      },
      {
        key: 'stats.eventAttendees',
        label: 'Attendees',
        icon: '🏟️',
        render: (project) => (project.stats.eventAttendees || 0).toLocaleString(),
      },
    ],
    cardActions: [
      {
        label: 'Report',
        icon: 'visibility',
        variant: 'secondary',
        handler: (project) => {
          // WHAT: Open share modal for report page (handler overridden by page component)
          // WHY: Allow sharing report link AND visiting report page
          console.log('Report:', project._id);
        },
        title: 'Share and view report page',
      },
      {
        label: 'Edit Stats',
        icon: 'bar_chart',
        variant: 'primary',
        handler: (project) => {
          // WHAT: Open share modal for edit page (handler overridden by page component)
          // WHY: Allow sharing edit link AND visiting clicker/editor
          console.log('Edit Stats:', project._id);
        },
        title: 'Share and edit event statistics',
      },
    ],
  },

  searchFields: ['eventName', 'hashtags', 'categorizedHashtags'],
  emptyStateMessage: 'No projects found. Click "Add New Project" to create your first event.',
  emptyStateIcon: '🍿',
};
