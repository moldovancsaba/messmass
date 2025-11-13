// WHAT: Admin UI for managing project-partner relationships
// WHY: Allow manual assignment of partner1/partner2 for template inheritance
// HOW: List projects with partner selection dropdowns + auto-suggest button

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Partner {
  _id: string;
  name: string;
  reportTemplateId?: string;
}

interface Project {
  _id: string;
  eventName: string;
  editSlug: string;
  partner1?: { _id: string; name?: string } | string;
  partner2?: { _id: string; name?: string } | string;
  createdAt: string;
}

export default function ProjectPartnersPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [autoSuggesting, setAutoSuggesting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'missing' | 'assigned'>('missing');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load projects
      const projectsRes = await fetch('/api/admin/project-partners');
      const projectsData = await projectsRes.json();
      
      // Load partners
      const partnersRes = await fetch('/api/admin/partners');
      const partnersData = await partnersRes.json();

      if (projectsData.success) {
        setProjects(projectsData.projects);
      }
      if (partnersData.success) {
        setPartners(partnersData.partners);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProjectPartners(projectId: string, partner1Id: string | null, partner2Id: string | null) {
    setSaving(projectId);
    try {
      const res = await fetch('/api/admin/project-partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, partner1Id, partner2Id })
      });

      const data = await res.json();
      if (data.success) {
        // Update local state
        setProjects(prev => prev.map(p => 
          p._id === projectId 
            ? { ...p, partner1: partner1Id || undefined, partner2: partner2Id || undefined }
            : p
        ));
      } else {
        alert('Failed to update partners: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to update partners:', error);
      alert('Failed to update partners');
    } finally {
      setSaving(null);
    }
  }

  async function autoSuggestAll() {
    if (!confirm('Auto-suggest partners for all projects without partner1?\n\nThis will analyze event names and suggest matches based on partner database.')) {
      return;
    }

    setAutoSuggesting(true);
    try {
      const res = await fetch('/api/admin/project-partners/auto-suggest', {
        method: 'POST'
      });

      const data = await res.json();
      if (data.success) {
        alert(`Auto-suggested partners for ${data.updated} projects`);
        await loadData();
      } else {
        alert('Failed to auto-suggest: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to auto-suggest:', error);
      alert('Failed to auto-suggest');
    } finally {
      setAutoSuggesting(false);
    }
  }

  const getPartnerId = (partner: any): string | null => {
    if (!partner) return null;
    if (typeof partner === 'string') return partner;
    return partner._id || null;
  };

  const filteredProjects = projects.filter(p => {
    if (filter === 'missing') return !p.partner1;
    if (filter === 'assigned') return !!p.partner1;
    return true;
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Project-Partner Relationships</h1>
          <p className={styles.subtitle}>
            Manage partner connections for template inheritance hierarchy
          </p>
        </div>
        <Link href="/admin" className={styles.backButton}>
          ← Back to Admin
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <button
            className={filter === 'all' ? styles.filterActive : styles.filterButton}
            onClick={() => setFilter('all')}
          >
            All ({projects.length})
          </button>
          <button
            className={filter === 'missing' ? styles.filterActive : styles.filterButton}
            onClick={() => setFilter('missing')}
          >
            Missing Partner ({projects.filter(p => !p.partner1).length})
          </button>
          <button
            className={filter === 'assigned' ? styles.filterActive : styles.filterButton}
            onClick={() => setFilter('assigned')}
          >
            Assigned ({projects.filter(p => p.partner1).length})
          </button>
        </div>

        <button
          className={styles.autoSuggestButton}
          onClick={autoSuggestAll}
          disabled={autoSuggesting}
        >
          {autoSuggesting ? '🔄 Auto-Suggesting...' : '🤖 Auto-Suggest All'}
        </button>
      </div>

      <div className={styles.infoBox}>
        <strong>Template Resolution Hierarchy:</strong>
        <ol>
          <li>Project-specific template (if assigned)</li>
          <li>Partner template (from partner1, if assigned)</li>
          <li>Default template (system-wide)</li>
          <li>Hardcoded fallback</li>
        </ol>
      </div>

      <div className={styles.projectsList}>
        {filteredProjects.length === 0 ? (
          <div className={styles.empty}>
            No projects found with current filter
          </div>
        ) : (
          filteredProjects.map(project => {
            const partner1Id = getPartnerId(project.partner1);
            const partner2Id = getPartnerId(project.partner2);
            const isSaving = saving === project._id;

            return (
              <div key={project._id} className={styles.projectCard}>
                <div className={styles.projectHeader}>
                  <h3 className={styles.projectName}>{project.eventName}</h3>
                  <span className={styles.editSlug}>{project.editSlug}</span>
                </div>

                <div className={styles.partnerSelectors}>
                  <div className={styles.selectorGroup}>
                    <label className={styles.label}>
                      Partner 1 (Home Team)
                      {partner1Id && (
                        <span className={styles.badge}>
                          {partners.find(p => p._id === partner1Id)?.reportTemplateId ? '📋 Has Template' : ''}
                        </span>
                      )}
                    </label>
                    <select
                      className={styles.select}
                      value={partner1Id || ''}
                      onChange={(e) => {
                        const newId = e.target.value || null;
                        updateProjectPartners(project._id, newId, partner2Id);
                      }}
                      disabled={isSaving}
                    >
                      <option value="">No Partner</option>
                      {partners.map(partner => (
                        <option key={partner._id} value={partner._id}>
                          {partner.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.selectorGroup}>
                    <label className={styles.label}>Partner 2 (Away Team)</label>
                    <select
                      className={styles.select}
                      value={partner2Id || ''}
                      onChange={(e) => {
                        const newId = e.target.value || null;
                        updateProjectPartners(project._id, partner1Id, newId);
                      }}
                      disabled={isSaving}
                    >
                      <option value="">No Partner</option>
                      {partners.map(partner => (
                        <option key={partner._id} value={partner._id}>
                          {partner.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {isSaving && (
                  <div className={styles.savingIndicator}>Saving...</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
