'use client';

import { useState, useEffect, useId, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { apiGet, apiPost, apiPut } from '@/lib/apiClient';
import PartnerSelector from '@/components/PartnerSelector';
import BaseModal from '@/components/modals/BaseModal';

interface Partner {
  _id: string;
  name: string;
  emoji?: string;
  showEmoji?: boolean;
  logoUrl?: string | null;
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
  const searchId = useId();
  const [projects, setProjects] = useState<Project[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [autoSuggesting, setAutoSuggesting] = useState(false);
  const [confirmAutoSuggestOpen, setConfirmAutoSuggestOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'missing' | 'assigned'>('missing');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [projectsData, partnersData] = await Promise.all([
        apiGet('/api/admin/project-partners'),
        apiGet('/api/admin/partners'),
      ]);

      if (projectsData.success) {
        setProjects(projectsData.projects || []);
      }
      if (partnersData.success) {
        setPartners(partnersData.partners || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setErrorMessage('Failed to load events and partner directory.');
    } finally {
      setLoading(false);
    }
  }

  async function updateProjectPartners(
    projectId: string,
    partner1Id: string | null,
    partner2Id: string | null
  ) {
    setSaving(projectId);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const data = await apiPut('/api/admin/project-partners', { projectId, partner1Id, partner2Id });
      if (data.success) {
        setProjects((prev) =>
          prev.map((p) =>
            p._id === projectId
              ? { ...p, partner1: partner1Id || undefined, partner2: partner2Id || undefined }
              : p
          )
        );
        setStatusMessage('Matchup club assignment saved.');
      } else {
        setErrorMessage('Failed to update matchup clubs: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to update partners:', error);
      setErrorMessage('Failed to update matchup clubs.');
    } finally {
      setSaving(null);
    }
  }

  async function runAutoSuggestAll() {
    setConfirmAutoSuggestOpen(false);
    setAutoSuggesting(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const data = await apiPost('/api/admin/project-partners/auto-suggest', {});
      if (data.success) {
        setStatusMessage(`Auto-suggested partner clubs for ${data.updated} event(s).`);
        await loadData();
      } else {
        setErrorMessage('Failed to auto-suggest: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to auto-suggest:', error);
      setErrorMessage('Failed to run auto-suggest.');
    } finally {
      setAutoSuggesting(false);
    }
  }

  const getPartnerId = (partner: Project['partner1']): string | null => {
    if (!partner) return null;
    if (typeof partner === 'string') return partner;
    return partner._id || null;
  };

  const partnerMap = useMemo(() => new Map(partners.map((p) => [p._id, p])), [partners]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter === 'missing' && p.partner1) return false;
      if (filter === 'assigned' && !p.partner1) return false;
      if (!q) return true;
      const p1Id = getPartnerId(p.partner1);
      const p2Id = getPartnerId(p.partner2);
      const p1Name = (p1Id && partnerMap.get(p1Id)?.name) || '';
      const p2Name = (p2Id && partnerMap.get(p2Id)?.name) || '';
      return (
        p.eventName.toLowerCase().includes(q) ||
        (p.editSlug || '').toLowerCase().includes(q) ||
        p1Name.toLowerCase().includes(q) ||
        p2Name.toLowerCase().includes(q)
      );
    });
  }, [filter, partnerMap, projects, searchQuery]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading matchup assignments…</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Matchup &amp; Team Assignments</h1>
          <p className={styles.subtitle}>
            Link Home and Away partner clubs to events for automatic crest, theme, and report template inheritance.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/events" className={styles.backButton}>
            Events
          </Link>
          <Link href="/admin/partners" className={styles.backButton}>
            Partners
          </Link>
          <Link href="/admin/club-logos" className={styles.backButton}>
            🛡️ Club Logos
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div role="status" className={styles.bannerStatus}>
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div role="alert" className={styles.bannerError}>
          {errorMessage}
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.filters} role="group" aria-label="Filter events by assignment status">
          <button
            type="button"
            className={filter === 'all' ? styles.filterActive : styles.filterButton}
            onClick={() => setFilter('all')}
          >
            All ({projects.length})
          </button>
          <button
            type="button"
            className={filter === 'missing' ? styles.filterActive : styles.filterButton}
            onClick={() => setFilter('missing')}
          >
            Missing Home Club ({projects.filter((p) => !p.partner1).length})
          </button>
          <button
            type="button"
            className={filter === 'assigned' ? styles.filterActive : styles.filterButton}
            onClick={() => setFilter('assigned')}
          >
            Assigned ({projects.filter((p) => !!p.partner1).length})
          </button>
        </div>

        <input
          id={searchId}
          type="search"
          aria-label="Search events or clubs"
          placeholder="Search event, slug, or club…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />

        <button
          type="button"
          className={styles.autoSuggestButton}
          onClick={() => setConfirmAutoSuggestOpen(true)}
          disabled={autoSuggesting}
        >
          {autoSuggesting ? 'Auto-Suggesting…' : '🤖 Auto-Suggest Missing'}
        </button>
      </div>

      <div className={styles.projectsList}>
        {filteredProjects.length === 0 ? (
          <div className={styles.empty}>No events match the current filter and search query.</div>
        ) : (
          filteredProjects.map((project) => {
            const partner1Id = getPartnerId(project.partner1);
            const partner2Id = getPartnerId(project.partner2);
            const partner1Obj = partner1Id ? partnerMap.get(partner1Id) || null : null;
            const partner2Obj = partner2Id ? partnerMap.get(partner2Id) || null : null;
            const isSaving = saving === project._id;

            return (
              <div key={project._id} className={styles.projectCard}>
                <div className={styles.projectHeader}>
                  <div className={styles.projectHeaderRow}>
                    <div className={styles.projectTitleRow}>
                      {partner1Obj?.logoUrl && (
                        <Image
                          src={partner1Obj.logoUrl}
                          alt={partner1Obj.name}
                          width={28}
                          height={28}
                          className={styles.matchupLogo}
                          unoptimized
                        />
                      )}
                      <h3 className={styles.projectName}>
                        <Link href={`/admin/events/${project._id}`} className={styles.cardLink}>
                          {project.eventName}
                        </Link>
                      </h3>
                      {partner2Obj?.logoUrl && (
                        <Image
                          src={partner2Obj.logoUrl}
                          alt={partner2Obj.name}
                          width={28}
                          height={28}
                          className={styles.matchupLogo}
                          unoptimized
                        />
                      )}
                    </div>

                    <div className={styles.cardLinks}>
                      <Link href={`/admin/events/${project._id}`} className={styles.cardLink}>
                        Event Hub
                      </Link>
                      <Link href={`/admin/events/${project._id}/edit`} className={styles.cardLink}>
                        Full Setup
                      </Link>
                      {partner1Id && (
                        <Link href={`/admin/partners/${partner1Id}`} className={styles.cardLink}>
                          Home Club
                        </Link>
                      )}
                      {partner2Id && (
                        <Link href={`/admin/partners/${partner2Id}`} className={styles.cardLink}>
                          Away Club
                        </Link>
                      )}
                    </div>
                  </div>
                  <span className={styles.editSlug}>{project.editSlug}</span>
                </div>

                <div className={styles.partnerSelectors}>
                  <div className={styles.selectorGroup}>
                    <span className={styles.label}>
                      Home Club (Partner 1)
                      {partner1Obj?.reportTemplateId && (
                        <span className={styles.badge}>📋 Has Template</span>
                      )}
                    </span>
                    <PartnerSelector
                      selectedPartnerId={partner1Id}
                      partners={partners}
                      onChange={(newId) => void updateProjectPartners(project._id, newId, partner2Id)}
                      placeholder="Search Home Club (e.g. Ferencvárosi TC, Beretta)..."
                      disabled={isSaving}
                    />
                  </div>

                  <div className={styles.selectorGroup}>
                    <span className={styles.label}>Away Club (Partner 2)</span>
                    <PartnerSelector
                      selectedPartnerId={partner2Id}
                      partners={partners}
                      onChange={(newId) => void updateProjectPartners(project._id, partner1Id, newId)}
                      placeholder="Search Away Club (e.g. Galatasaray, Paksi FC)..."
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {isSaving && (
                  <div role="status" className={styles.savingIndicator}>
                    Saving…
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <BaseModal
        isOpen={confirmAutoSuggestOpen}
        onClose={() => setConfirmAutoSuggestOpen(false)}
        ariaLabel="Auto-Suggest Missing Home Clubs"
        size="sm"
      >
        <h2 className={styles.projectName}>Auto-Suggest Missing Home Clubs</h2>
        <p>
          Analyze event titles for all events currently missing a Home Club (Partner 1) and automatically assign exact matches from the Partner directory?
        </p>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => setConfirmAutoSuggestOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.autoSuggestButton}
            onClick={() => void runAutoSuggestAll()}
          >
            Run Auto-Suggest
          </button>
        </div>
      </BaseModal>
    </div>
  );
}
