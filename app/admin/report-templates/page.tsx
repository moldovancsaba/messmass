// app/admin/report-templates/page.tsx
// WHAT: Admin interface for managing report template configurations and associations
// WHY: Provides visual UI for template CRUD and connecting templates to projects/partners
// DESIGN SYSTEM: Uses UnifiedAdminHeroWithSearch, FormModal, ColoredCard - matches Bitly page pattern
// USER WORKFLOW: AdminHero → Template cards → Inline associations → Modal forms

'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import ProjectSelector from '@/components/ProjectSelector';
import PartnerSelector from '@/components/PartnerSelector';
import FormModal from '@/components/modals/FormModal';
import ColoredCard from '@/components/ColoredCard';
import styles from './page.module.css';

// WHAT: Type definitions for templates, projects, and partners
// WHY: Maintains type safety for template management system
interface DataBlockReference {
  blockId: string;
  order: number;
}

interface GridSettings {
  desktopUnits: number;
  tabletUnits: number;
  mobileUnits: number;
}

interface ReportTemplate {
  _id: string;
  name: string;
  description?: string;
  type: 'event' | 'partner' | 'global';
  isDefault: boolean;
  styleId?: string;
  dataBlocks: DataBlockReference[];
  gridSettings: GridSettings;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Associated entities
  associatedProjects?: Array<{
    _id: string;
    eventName: string;
    eventDate: string;
  }>;
  associatedPartners?: Array<{
    _id: string;
    name: string;
    emoji: string;
  }>;
}

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
}

interface Partner {
  _id: string;
  name: string;
  emoji: string;
}

export default function ReportTemplatesAdminPage() {
  // WHAT: Authentication check - admin only
  // WHY: Protect template configuration from unauthorized access
  useAdminAuth();

  // WHAT: Component state management
  // WHY: Tracks templates, projects, partners, UI state, and form inputs
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // WHAT: Form state for create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'event' as 'event' | 'partner' | 'global',
    isDefault: false
  });

  // WHAT: Load templates on mount
  // WHY: Display all available templates with associations
  useEffect(() => {
    loadTemplates();
    loadProjects();
    loadPartners();
  }, []);

  // WHAT: Clear success message after 5 seconds
  // WHY: Auto-dismiss notifications for better UX
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // WHAT: Load all templates with associations
  // WHY: Fetch template list and their associated projects/partners
  async function loadTemplates() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/report-templates?includeAssociations=true');
      const data = await res.json();

      if (data.success) {
        setTemplates(data.templates);
      } else {
        setError(data.error || 'Failed to load templates');
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // WHAT: Load all projects for ProjectSelector
  // WHY: User needs to search through entire project database for associations
  async function loadProjects() {
    try {
      const res = await fetch('/api/projects?limit=1000&sortField=eventDate&sortOrder=desc');
      const data = await res.json();

      if (data.success && data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  }

  // WHAT: Load all partners for PartnerSelector
  // WHY: User needs to search through entire partner database for associations
  async function loadPartners() {
    try {
      const res = await fetch('/api/partners?limit=1000&sortField=name&sortOrder=asc');
      const data = await res.json();

      if (data.success && data.partners) {
        setPartners(data.partners);
      }
    } catch (err) {
      console.error('Error loading partners:', err);
    }
  }

  // WHAT: Open create modal
  // WHY: Allow admin to create new template
  function handleCreateTemplate() {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      type: 'event',
      isDefault: false
    });
    setShowModal(true);
  }

  // WHAT: Open edit modal for existing template
  // WHY: Allow admin to modify template configuration
  function handleEditTemplate(template: ReportTemplate) {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      type: template.type,
      isDefault: template.isDefault
    });
    setShowModal(true);
  }

  // WHAT: Save template (create or update)
  // WHY: Persist template configuration to database
  async function handleSaveTemplate() {
    try {
      setError('');
      setSuccessMessage('');

      // Validation
      if (!formData.name.trim()) {
        setError('Template name is required');
        return;
      }

      const url = editingTemplate
        ? `/api/report-templates?templateId=${editingTemplate._id}`
        : '/api/report-templates';

      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type,
          isDefault: formData.isDefault,
          // Use existing values for fields not in form
          ...(editingTemplate ? {
            dataBlocks: editingTemplate.dataBlocks,
            gridSettings: editingTemplate.gridSettings,
            styleId: editingTemplate.styleId
          } : {
            dataBlocks: [],
            gridSettings: { desktopUnits: 12, tabletUnits: 8, mobileUnits: 4 }
          })
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(editingTemplate ? '✓ Template updated' : '✓ Template created');
        setShowModal(false);
        loadTemplates(); // Reload to show updated list
      } else {
        setError(data.error || 'Failed to save template');
      }
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Network error. Please try again.');
    }
  }

  // WHAT: Delete template with safety checks
  // WHY: Remove unused templates from system
  async function handleDeleteTemplate(templateId: string, templateName: string) {
    if (!confirm(`Delete template "${templateName}"?\n\nThis will fail if the template is in use or is the default template.`)) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');

      const res = await fetch(`/api/report-templates?templateId=${templateId}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('✓ Template deleted');
        loadTemplates();
      } else {
        setError(data.error || 'Failed to delete template');
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Network error. Please try again.');
    }
  }

  // WHAT: Assign template to a project
  // WHY: Connect project to template for custom report layout
  async function handleAssignProjectToTemplate(templateId: string, projectId: string) {
    try {
      setError('');
      setSuccessMessage('');

      const res = await fetch('/api/report-templates/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          projectIds: [projectId]
        })
      });

      const data = await res.json();

      if (data.success) {
        const project = projects.find(p => p._id === projectId);
        setSuccessMessage(`✓ Assigned template to ${project?.eventName || 'project'}`);

        // WHAT: Update local state without reloading
        // WHY: Instant UI update, better UX
        setTemplates(prevTemplates =>
          prevTemplates.map(template => {
            if (template._id === templateId) {
              const projectData = projects.find(p => p._id === projectId);
              if (projectData) {
                return {
                  ...template,
                  associatedProjects: [
                    ...(template.associatedProjects || []),
                    {
                      _id: projectData._id,
                      eventName: projectData.eventName,
                      eventDate: projectData.eventDate
                    }
                  ]
                };
              }
            }
            return template;
          })
        );
      } else {
        setError(data.error || 'Failed to assign template');
      }
    } catch (err) {
      console.error('Error assigning template:', err);
      setError('Network error. Please try again.');
    }
  }

  // WHAT: Remove project association from template
  // WHY: Disconnect project from template (will use partner or default template)
  async function handleRemoveProjectFromTemplate(templateId: string, projectId: string, projectName: string) {
    if (!confirm(`Remove ${projectName} from this template?`)) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');

      const res = await fetch(`/api/report-templates/assign?projectIds=${projectId}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`✓ Removed ${projectName} from template`);

        // WHAT: Update local state without reloading
        // WHY: Instant UI update
        setTemplates(prevTemplates =>
          prevTemplates.map(template => {
            if (template._id === templateId) {
              return {
                ...template,
                associatedProjects: (template.associatedProjects || []).filter(
                  p => p._id !== projectId
                )
              };
            }
            return template;
          })
        );
      } else {
        setError(data.error || 'Failed to remove association');
      }
    } catch (err) {
      console.error('Error removing association:', err);
      setError('Network error. Please try again.');
    }
  }

  // WHAT: Assign template to a partner
  // WHY: Connect partner to template - all partner events inherit this template
  async function handleAssignPartnerToTemplate(templateId: string, partnerId: string) {
    try {
      setError('');
      setSuccessMessage('');

      const res = await fetch('/api/report-templates/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          partnerIds: [partnerId]
        })
      });

      const data = await res.json();

      if (data.success) {
        const partner = partners.find(p => p._id === partnerId);
        setSuccessMessage(`✓ Assigned template to ${partner?.name || 'partner'}`);

        // WHAT: Update local state without reloading
        // WHY: Instant UI update
        setTemplates(prevTemplates =>
          prevTemplates.map(template => {
            if (template._id === templateId) {
              const partnerData = partners.find(p => p._id === partnerId);
              if (partnerData) {
                return {
                  ...template,
                  associatedPartners: [
                    ...(template.associatedPartners || []),
                    {
                      _id: partnerData._id,
                      name: partnerData.name,
                      emoji: partnerData.emoji || '🎯'
                    }
                  ]
                };
              }
            }
            return template;
          })
        );
      } else {
        setError(data.error || 'Failed to assign template');
      }
    } catch (err) {
      console.error('Error assigning template:', err);
      setError('Network error. Please try again.');
    }
  }

  // WHAT: Remove partner association from template
  // WHY: Disconnect partner from template (will use default template)
  async function handleRemovePartnerFromTemplate(templateId: string, partnerId: string, partnerName: string) {
    if (!confirm(`Remove ${partnerName} from this template?`)) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');

      const res = await fetch(`/api/report-templates/assign?partnerIds=${partnerId}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`✓ Removed ${partnerName} from template`);

        // WHAT: Update local state without reloading
        // WHY: Instant UI update
        setTemplates(prevTemplates =>
          prevTemplates.map(template => {
            if (template._id === templateId) {
              return {
                ...template,
                associatedPartners: (template.associatedPartners || []).filter(
                  p => p._id !== partnerId
                )
              };
            }
            return template;
          })
        );
      } else {
        setError(data.error || 'Failed to remove association');
      }
    } catch (err) {
      console.error('Error removing association:', err);
      setError('Network error. Please try again.');
    }
  }

  // WHAT: Render loading state
  // WHY: Show feedback while data loads
  if (loading) {
    return (
      <div className="page-container">
        <UnifiedAdminHeroWithSearch
          title="📊 Report Templates"
          subtitle="Manage report layouts for partners and events"
          backLink="/admin"
          showSearch={false}
        />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* WHAT: Hero section with title and actions
       * WHY: Consistent header pattern across admin pages */}
      <UnifiedAdminHeroWithSearch
        title="📊 Report Templates"
        subtitle="Manage report layouts for partners and events"
        backLink="/admin"
        showSearch={false}
      />

      {/* WHAT: Error and success messages
       * WHY: User feedback for actions */}
      {error && (
        <ColoredCard accentColor="#ef4444">
          <div className={styles.message}>
            <span className={styles.messageIcon}>⚠️</span>
            <span>{error}</span>
            <button 
              className={styles.closeMessage}
              onClick={() => setError('')}
            >
              ✕
            </button>
          </div>
        </ColoredCard>
      )}

      {successMessage && (
        <ColoredCard accentColor="#10b981">
          <div className={styles.message}>
            <span className={styles.messageIcon}>✓</span>
            <span>{successMessage}</span>
            <button 
              className={styles.closeMessage}
              onClick={() => setSuccessMessage('')}
            >
              ✕
            </button>
          </div>
        </ColoredCard>
      )}

      {/* WHAT: Action bar with create button and count
       * WHY: Primary action placement - matches Bitly pattern */}
      <ColoredCard accentColor="#3b82f6">
        <div className={styles.actionBar}>
          <button 
            className={styles.createButton}
            onClick={handleCreateTemplate}
          >
            ➕ New Template
          </button>
          <span className={styles.count}>
            Total: {templates.length}
          </span>
        </div>
      </ColoredCard>

      {/* WHAT: Templates list with cards
       * WHY: Display all templates with inline associations */}
      {templates.length === 0 ? (
        <ColoredCard>
          <div className={styles.emptyState}>
            <p>No templates found. Create your first template to get started.</p>
          </div>
        </ColoredCard>
      ) : (
        <div className={styles.templatesList}>
          {templates.map(template => (
            <ColoredCard 
              key={template._id}
              accentColor={template.isDefault ? '#10b981' : '#6b7280'}
              hoverable={true}
            >
              <div className={styles.templateCard}>
                {/* WHAT: Template header with name, type, and default badge
                 * WHY: Key identification info */}
                <div className={styles.templateHeader}>
                  <div className={styles.templateTitle}>
                    <h3>{template.name}</h3>
                    <span className={`${styles.badge} ${styles[`badge-${template.type}`]}`}>
                      {template.type}
                    </span>
                    {template.isDefault && (
                      <span className={styles.badgeDefault}>
                        ⭐ DEFAULT
                      </span>
                    )}
                  </div>
                </div>

                {/* WHAT: Template description
                 * WHY: Additional context */}
                {template.description && (
                  <p className={styles.templateDescription}>
                    {template.description}
                  </p>
                )}

                {/* WHAT: Template info - blocks and grid
                 * WHY: Quick metrics */}
                <div className={styles.templateInfo}>
                  <span className={styles.infoItem}>
                    📊 Blocks: {template.dataBlocks.length}
                  </span>
                  <span className={styles.infoItem}>
                    🔲 Grid: {template.gridSettings.desktopUnits}x
                  </span>
                </div>

                {/* WHAT: Associated projects section
                 * WHY: Show and manage project associations */}
                <div className={styles.associations}>
                  <label className={styles.associationLabel}>
                    Associated Projects:
                  </label>
                  <div className={styles.associationChips}>
                    {(template.associatedProjects || []).map(project => (
                      <div key={project._id} className={styles.chip}>
                        <span className={styles.chipText}>{project.eventName}</span>
                        <button
                          className={styles.chipRemove}
                          onClick={() => handleRemoveProjectFromTemplate(
                            template._id,
                            project._id,
                            project.eventName
                          )}
                          title="Remove project"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div className={styles.selectorWrapper}>
                      <ProjectSelector
                        selectedProjectId={null}
                        projects={projects}
                        onChange={(projectId) => {
                          if (projectId) {
                            handleAssignProjectToTemplate(template._id, projectId);
                          }
                        }}
                        placeholder="+ Add Project"
                      />
                    </div>
                  </div>
                </div>

                {/* WHAT: Associated partners section
                 * WHY: Show and manage partner associations */}
                <div className={styles.associations}>
                  <label className={styles.associationLabel}>
                    Associated Partners:
                  </label>
                  <div className={styles.associationChips}>
                    {(template.associatedPartners || []).map(partner => (
                      <div key={partner._id} className={styles.chip}>
                        <span className={styles.chipText}>
                          {partner.emoji} {partner.name}
                        </span>
                        <button
                          className={styles.chipRemove}
                          onClick={() => handleRemovePartnerFromTemplate(
                            template._id,
                            partner._id,
                            partner.name
                          )}
                          title="Remove partner"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div className={styles.selectorWrapper}>
                      <PartnerSelector
                        selectedPartnerId={null}
                        partners={partners}
                        onChange={(partnerId) => {
                          if (partnerId) {
                            handleAssignPartnerToTemplate(template._id, partnerId);
                          }
                        }}
                        placeholder="+ Add Partner"
                      />
                    </div>
                  </div>
                </div>

                {/* WHAT: Template actions
                 * WHY: Edit and delete operations */}
                <div className={styles.templateActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleEditTemplate(template)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteTemplate(template._id, template.name)}
                  >
                    🗑️ Delete
                  </button>
                </div>

                {/* WHAT: Template metadata
                 * WHY: Audit info */}
                <div className={styles.templateMeta}>
                  <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(template.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </ColoredCard>
          ))}
        </div>
      )}

      {/* WHAT: Create/Edit modal
       * WHY: Form for template CRUD operations */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSaveTemplate}
        title={editingTemplate ? 'Edit Template' : 'Create Template'}
        size="md"
      >
        <div className="form-group">
          <label className="form-label-block">Template Name *</label>
          <input
            type="text"
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Premium Partner Template"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label-block">Description</label>
          <textarea
            className="form-input"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label-block">Type *</label>
          <select
            className="form-input"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'event' | 'partner' | 'global' })}
          >
            <option value="event">Event Template</option>
            <option value="partner">Partner Template</option>
            <option value="global">Global Template</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label-inline">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            />
            <span>Set as Default Template</span>
          </label>
          <p className={styles.helpText}>
            💡 Only one template can be default. Setting this will unmark the current default.
          </p>
        </div>

        {editingTemplate && (
          <div className={styles.editNote}>
            <p>
              📝 To configure visualization blocks and grid settings, use the <strong>Reporting</strong> page after saving.
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
