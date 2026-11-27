'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import GoogleSheetsConnectModal from '@/components/GoogleSheetsConnectModal';
import GoogleSheetsSyncButtons from '@/components/GoogleSheetsSyncButtons';
import GoogleSheetsSyncStatus from '@/components/GoogleSheetsSyncStatus';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
import MaterialIcon from '@/components/MaterialIcon';
import EntityWorkspaceTabs from '@/components/admin/EntityWorkspaceTabs';
import WorkspaceHeader from '@/components/admin/WorkspaceHeader';
import StatsStrip from '@/components/admin/StatsStrip';
import formStyles from '@/components/admin/WorkspaceFormFields.module.css';

interface PartnerEventItem {
  _id: string;
  eventName: string;
  eventDate: string | null;
  viewSlug: string;
  editSlug: string;
  role: 'Home' | 'Away';
  competition?: {
    tierLabel?: string | null;
    season?: string | null;
  } | null;
  totalFans: number;
  totalPhotos: number;
}

interface PartnerHubData {
  _id: string;
  name: string;
  emoji: string;
  showEmoji?: boolean;
  viewSlug?: string;
  logoUrl?: string | null;
  status?: string;
  organization?: {
    _id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  } | null;
  styleName?: string | null;
  reportTemplateName?: string | null;
  hashtags?: string[];
  googleSheetConfig?: {
    enabled: boolean;
    sheetId: string;
    sheetName: string;
  } | null;
}

export default function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const [partnerId, setPartnerId] = useState<string>('');
  const [partner, setPartner] = useState<PartnerHubData | null>(null);
  const [events, setEvents] = useState<PartnerEventItem[]>([]);
  const [stats, setStats] = useState({ totalEvents: 0, activeEvents: 0, totalFans: 0, totalPhotos: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [statusRefreshKey, setStatusRefreshKey] = useState(0);

  useEffect(() => {
    void params.then((resolvedParams) => {
      setPartnerId(resolvedParams.id);
    });
  }, [params]);

  const fetchPartner = useCallback(async () => {
    if (!partnerId) return;
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/partners/${partnerId}`, { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data?.partner) {
        throw new Error(data?.error || 'Failed to load partner');
      }
      setPartner(data.partner);
      setEvents(Array.isArray(data.events) ? data.events : []);
      if (data.stats) setStats(data.stats);
      setIsConnected(!!data.partner.googleSheetConfig?.enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partner');
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
      return;
    }
    if (user && partnerId) {
      void fetchPartner();
    }
  }, [authLoading, fetchPartner, partnerId, router, user]);

  const handleDisconnect = async () => {
    if (!confirm('Disconnect from Google Sheet?')) return;
    try {
      const response = await fetch(`/api/partners/${partnerId}/google-sheet/disconnect`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setIsConnected(false);
        await fetchPartner();
        setStatusRefreshKey((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  };

  const handleConnectSuccess = async () => {
    setIsConnected(true);
    setShowConnectModal(false);
    await fetchPartner();
    setStatusRefreshKey((prev) => prev + 1);
  };

  const handleSyncComplete = async () => {
    await fetchPartner();
    setStatusRefreshKey((prev) => prev + 1);
  };

  if (authLoading || loading) {
    return <div className={formStyles.loadingState}>Loading partner workspace…</div>;
  }

  if (error || !partner) {
    return (
      <div className={formStyles.hubContainer}>
        <div className={formStyles.errorState}>{error || 'Partner not found'}</div>
      </div>
    );
  }

  return (
    <div className={formStyles.hubContainer}>
      <EntityWorkspaceTabs
        ariaLabel="Partner workspace navigation"
        backHref="/admin/partners"
        backLabel="Partners"
        tabs={[
          { label: 'Overview', href: `/admin/partners/${partner._id}`, icon: 'handshake' },
          { label: 'Setup & Edit', href: `/admin/partners/${partner._id}/edit`, icon: 'settings' },
          { label: 'Reports & Variants', href: `/admin/partners/${partner._id}/reports`, icon: 'view_list' },
          { label: 'Analytics', href: `/admin/partners/${partner._id}/analytics`, icon: 'insert_chart' },
          { label: 'Metrics Table', href: `/admin/partners/${partner._id}/kyc-data`, icon: 'table_chart' },
          { label: 'Lifecycle', href: `/admin/partners/${partner._id}/lifecycle`, icon: 'history' },
        ]}
      />

      <WorkspaceHeader
        eyebrow="Club / Partner Hub"
        title={partner.name}
        subtitle={`Partner ID: ${partner._id}${partner.viewSlug ? ` • /partner-report/${partner.viewSlug}` : ''}`}
        logoUrl={partner.logoUrl}
        emoji={partner.showEmoji !== false ? partner.emoji : undefined}
        status={partner.status || 'active'}
        secondaryActions={
          <>
            <Link href={`/admin/partners/${partner._id}/reports`} className={formStyles.actionLinkSecondary}>
              <MaterialIcon name="view_list" />
              <span>Reports &amp; Variants</span>
            </Link>
            <Link href="/admin/events" className={formStyles.actionLinkSecondary}>
              <MaterialIcon name="add" />
              <span>Add Event</span>
            </Link>
          </>
        }
        primaryAction={
          <Link href={`/admin/partners/${partner._id}/edit`} className={formStyles.actionLinkPrimary}>
            <MaterialIcon name="settings" />
            <span>Edit Partner</span>
          </Link>
        }
      />

      <StatsStrip
        ariaLabel="Partner KPI summary"
        items={[
          { label: 'Total Events', value: stats.totalEvents, icon: 'event' },
          { label: 'Active Matches', value: stats.activeEvents, icon: 'sports_score' },
          { label: 'Total Photos', value: stats.totalPhotos, icon: 'photo_library' },
          { label: 'Total Fans', value: stats.totalFans, icon: 'groups' },
        ]}
      />

      <div className={formStyles.gridTwo}>
        <div className={formStyles.card}>
          <div className={formStyles.cardHeader}>
            <h2 className={formStyles.cardTitle}>
              <MaterialIcon name="account_tree" />
              <span>Governing Federation &amp; Brand Defaults</span>
            </h2>
            <Link href="/admin/club-logos" className={formStyles.rowLink}>
              Manage Crest
            </Link>
          </div>

          <div className={formStyles.kvList}>
            <div className={formStyles.kvRow}>
              <span className={formStyles.kvLabel}>Governing Federation</span>
              {partner.organization ? (
                <Link href={`/admin/organizations/${partner.organization._id}`} className={formStyles.rowLink}>
                  {partner.organization.name}
                </Link>
              ) : (
                <span className={formStyles.kvValue}>Standalone / Unassigned</span>
              )}
            </div>
            <div className={formStyles.kvRow}>
              <span className={formStyles.kvLabel}>Default Visual Theme</span>
              <span className={formStyles.kvValue}>{partner.styleName || 'System Default'}</span>
            </div>
            <div className={formStyles.kvRow}>
              <span className={formStyles.kvLabel}>Default Report Template</span>
              <span className={formStyles.kvValue}>{partner.reportTemplateName || 'System Default'}</span>
            </div>
          </div>

          {partner.hashtags && partner.hashtags.length > 0 && (
            <div className={formStyles.tagCloud}>
              {partner.hashtags.map((tag) => (
                <ColoredHashtagBubble key={tag} hashtag={tag} small interactive={false} />
              ))}
            </div>
          )}
        </div>

        <div className={formStyles.card}>
          <div className={formStyles.cardHeader}>
            <h2 className={formStyles.cardTitle}>
              <MaterialIcon name="table_view" />
              <span>Google Sheets Integration</span>
            </h2>
          </div>

          {isConnected && partnerId && (
            <GoogleSheetsSyncStatus
              partnerId={partnerId}
              onDisconnect={handleDisconnect}
              refreshKey={statusRefreshKey}
            />
          )}

          {partnerId && (
            <GoogleSheetsSyncButtons
              partnerId={partnerId}
              isConnected={isConnected}
              onSyncComplete={handleSyncComplete}
              onError={(syncErr) => console.error('Sync error:', syncErr)}
            />
          )}

          {!isConnected && (
            <div>
              <p className={formStyles.hint}>
                Connect a Google Sheet to import or export partner event rows on demand.
              </p>
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                className="btn btn-primary mt-2"
              >
                Connect Google Sheet
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={formStyles.card}>
        <div className={formStyles.cardHeader}>
          <h2 className={formStyles.cardTitle}>
            <MaterialIcon name="event_note" />
            <span>Associated Events ({events.length})</span>
          </h2>
        </div>

        {events.length === 0 ? (
          <div className={formStyles.emptyState}>No matches or events linked to this partner yet.</div>
        ) : (
          <div className={formStyles.tableWrap}>
            <table className={formStyles.table}>
              <thead>
                <tr>
                  <th className={formStyles.th}>Matchup / Event</th>
                  <th className={formStyles.th}>Role</th>
                  <th className={formStyles.th}>Date</th>
                  <th className={formStyles.th}>Competition</th>
                  <th className={formStyles.th}>Photos</th>
                  <th className={formStyles.th}>Fans</th>
                  <th className={formStyles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev._id}>
                    <td className={formStyles.td}>
                      <Link href={`/admin/events/${ev._id}`} className={formStyles.rowLink}>
                        {ev.eventName}
                      </Link>
                    </td>
                    <td className={formStyles.td}>
                      <span className={formStyles.pill}>{ev.role}</span>
                    </td>
                    <td className={formStyles.td}>
                      {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : '—'}
                    </td>
                    <td className={formStyles.td}>
                      {ev.competition?.tierLabel || '—'}
                    </td>
                    <td className={formStyles.td}>{ev.totalPhotos.toLocaleString()}</td>
                    <td className={formStyles.td}>{ev.totalFans.toLocaleString()}</td>
                    <td className={formStyles.td}>
                      <div className={formStyles.inlineActions}>
                        <a
                          href={`/report/${ev.viewSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={formStyles.rowLink}
                        >
                          Report ↗
                        </a>
                        <a
                          href={`/edit/${ev.editSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={formStyles.rowLink}
                        >
                          Recorder ↗
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GoogleSheetsConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleConnectSuccess}
        partnerId={partnerId}
        partnerName={partner.name}
      />
    </div>
  );
}
