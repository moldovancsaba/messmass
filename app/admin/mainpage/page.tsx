'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiPut, apiPost } from '@/lib/apiClient';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import adminStyles from '@/app/styles/admin-pages.module.css';
import styles from './page.module.css';

interface ProjectOption {
  _id: string;
  eventName: string;
  viewSlug: string | null;
  eventDate?: string;
}

interface LandingSettings {
  landingReportSlug: string;
  generatedAt?: string;
}

export default function AdminMainpagePage() {
  const { user, loading: authLoading } = useAdminAuth();
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const [setRes, projRes] = await Promise.all([
          fetch('/api/admin/landing-settings', { cache: 'no-store' }),
          fetch('/api/admin/landing-projects', { cache: 'no-store' }),
        ]);
        const setData = await setRes.json();
        const projData = await projRes.json();
        if (setData.success && setData.settings) {
          setSettings(setData.settings);
          setSelectedSlug(setData.settings.landingReportSlug || '');
        }
        if (projData.success && Array.isArray(projData.projects)) {
          setProjects(projData.projects.filter((p: ProjectOption) => p.viewSlug));
        }
      } catch (e) {
        setMessage({ type: 'error', text: 'Failed to load settings or projects' });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSaveSlug = async () => {
    if (!selectedSlug.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const data = await apiPut<{ success: boolean; error?: string }>('/api/admin/landing-settings', {
        landingReportSlug: selectedSlug.trim(),
      });
      if (data.success) {
        setSettings((s) => (s ? { ...s, landingReportSlug: selectedSlug.trim() } : { landingReportSlug: selectedSlug.trim() }));
        setMessage({ type: 'success', text: 'Landing report saved.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const data = await apiPost<{
        success: boolean;
        generatedAt?: string;
        blocksCount?: number;
        verified?: boolean;
        readBackBlocks?: number;
        error?: string;
      }>('/api/admin/landing-static-generate');
      if (data.success) {
        setSettings((s) => (s ? { ...s, generatedAt: data.generatedAt } : null));
        const n = data.blocksCount ?? 0;
        const verified = data.verified === true;
        const text = verified
          ? `Static content generated (${n} blocks) and verified. This site will use it until you update again.`
          : `Static content saved (${n} blocks). If the main page does not update, open the main page on this same site (same URL origin).`;
        setMessage({ type: 'success', text });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to generate static content' });
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="Main Page"
        subtitle="Choose which event report powers messmass.com and generate the published static content"
        backLink="/admin"
      />
      {message && (
        <div className={message.type === 'error' ? adminStyles.errorContainer : styles.successBox}>
          <p className={message.type === 'error' ? adminStyles.errorText : styles.successText}>{message.text}</p>
        </div>
      )}
      {loading ? (
        <p className={styles.loading}>Loading…</p>
      ) : (
        <div className={styles.section}>
          <h2 className={styles.heading}>Report for Main Page</h2>
          <p className={styles.hint}>
            The content between the hero and the pricing section on the main page comes from this report.
          </p>
          <div className={styles.row}>
            <label htmlFor="report-select" className={styles.label}>
              Event report
            </label>
            <select
              id="report-select"
              className={styles.select}
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
            >
              <option value="">Select an event…</option>
              {projects.map((p) => (
                <option key={p._id} value={p.viewSlug!}>
                  {p.eventName} {p.eventDate ? `(${p.eventDate})` : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!selectedSlug.trim() || saving}
              onClick={handleSaveSlug}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          {settings?.generatedAt && (
            <p className={styles.meta}>Static content last generated: {new Date(settings.generatedAt).toLocaleString()}</p>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={generating}
              onClick={handleGenerate}
            >
              {generating ? 'Generating…' : 'Update static content'}
            </button>
            <p className={styles.hint}>
              Generates a snapshot from the selected report. The main site (messmass.com) will serve this static content until you click Update again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
