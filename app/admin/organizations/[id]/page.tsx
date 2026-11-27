'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import MaterialIcon from '@/components/MaterialIcon';
import EntityWorkspaceTabs from '@/components/admin/EntityWorkspaceTabs';
import WorkspaceHeader from '@/components/admin/WorkspaceHeader';
import StatsStrip from '@/components/admin/StatsStrip';
import formStyles from '@/components/admin/WorkspaceFormFields.module.css';

interface MemberClubItem {
  _id: string;
  name: string;
  emoji?: string;
  showEmoji?: boolean;
  viewSlug?: string;
  logoUrl?: string | null;
}

interface SanctionedMatchItem {
  _id: string;
  eventName: string;
  eventDate: string | null;
  viewSlug: string;
  editSlug: string;
  competition?: {
    tierLabel?: string | null;
    season?: string | null;
  } | null;
  competitionType?: string | null;
  totalFans: number;
  totalPhotos: number;
}

interface OrgDetailData {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  status?: string;
  orgType?: string;
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();

  const [organization, setOrganization] = useState<OrgDetailData | null>(null);
  const [memberClubs, setMemberClubs] = useState<MemberClubItem[]>([]);
  const [sanctionedMatches, setSanctionedMatches] = useState<SanctionedMatchItem[]>([]);
  const [stats, setStats] = useState({
    memberClubsCount: 0,
    sanctionedMatchesCount: 0,
    totalFans: 0,
    totalPhotos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrganization = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizations/${id}`, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !data?.organization) {
        throw new Error(data?.error || 'Organization not found');
      }
      setOrganization(data.organization);
      setMemberClubs(Array.isArray(data.memberClubs) ? data.memberClubs : []);
      setSanctionedMatches(Array.isArray(data.sanctionedMatches) ? data.sanctionedMatches : []);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
      return;
    }
    if (user && id) {
      void loadOrganization();
    }
  }, [authLoading, id, loadOrganization, router, user]);

  if (authLoading || loading) {
    return <div className={formStyles.loadingState}>Loading organization workspace…</div>;
  }

  if (error || !organization) {
    return (
      <div className={formStyles.hubContainer}>
        <div className={formStyles.errorState}>{error || 'Organization not found'}</div>
      </div>
    );
  }

  return (
    <div className={formStyles.hubContainer}>
      <EntityWorkspaceTabs
        ariaLabel="Organization workspace navigation"
        backHref="/admin/organizations"
        backLabel="Organizations"
        tabs={[
          { label: 'Overview', href: `/admin/organizations/${organization._id}`, icon: 'business' },
          { label: 'Setup & Members', href: `/admin/organizations/${organization._id}/edit`, icon: 'settings' },
          { label: 'Reports & Variants', href: `/admin/organizations/${organization._id}/reports`, icon: 'view_list' },
          { label: 'Classic Report', href: `/organization-report/${organization._id}`, icon: 'bar_chart', external: true },
          { label: 'AI Dashboard', href: `/interactive-report/organization/${organization.slug}`, icon: 'insights', external: true },
        ]}
      />

      <WorkspaceHeader
        eyebrow={`${(organization.orgType || 'federation').toUpperCase()} • /${organization.slug}`}
        title={organization.name}
        subtitle={`Organization ID: ${organization._id}`}
        logoUrl={organization.logoUrl}
        emoji="🏢"
        status={organization.status || 'active'}
        secondaryActions={
          <>
            <a
              href={`/interactive-report/organization/${organization.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={formStyles.actionLinkSecondary}
            >
              <MaterialIcon name="insights" />
              <span>AI League Dashboard</span>
            </a>
            <Link href={`/admin/organizations/${organization._id}/reports`} className={formStyles.actionLinkSecondary}>
              <MaterialIcon name="view_list" />
              <span>Reports &amp; Variants</span>
            </Link>
          </>
        }
        primaryAction={
          <Link href={`/admin/organizations/${organization._id}/edit`} className={formStyles.actionLinkPrimary}>
            <MaterialIcon name="settings" />
            <span>Edit &amp; Manage Members</span>
          </Link>
        }
      />

      <StatsStrip
        ariaLabel="Organization KPI summary"
        items={[
          { label: 'Member Clubs', value: stats.memberClubsCount, icon: 'shield' },
          { label: 'Sanctioned Matches', value: stats.sanctionedMatchesCount, icon: 'event' },
          { label: 'Total Photos', value: stats.totalPhotos, icon: 'photo_library' },
          { label: 'Total Fans', value: stats.totalFans, icon: 'groups' },
        ]}
      />

      <div className={formStyles.card}>
        <div className={formStyles.cardHeader}>
          <h2 className={formStyles.cardTitle}>
            <MaterialIcon name="shield" />
            <span>Member Clubs ({memberClubs.length})</span>
          </h2>
          <Link href={`/admin/organizations/${organization._id}/edit`} className={formStyles.rowLink}>
            Manage Club Membership
          </Link>
        </div>

        {memberClubs.length === 0 ? (
          <div className={formStyles.emptyState}>
            No member clubs directly assigned. Sponsor organizations aggregate events via multi-organization tags.
          </div>
        ) : (
          <div className={formStyles.tableWrap}>
            <table className={formStyles.table}>
              <thead>
                <tr>
                  <th className={formStyles.th}>Club</th>
                  <th className={formStyles.th}>Report Slug</th>
                  <th className={formStyles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberClubs.map((club) => (
                  <tr key={club._id}>
                    <td className={formStyles.td}>
                      <div className={formStyles.clubCell}>
                        {club.logoUrl ? (
                          <Image
                            src={club.logoUrl}
                            alt={`${club.name} logo`}
                            width={28}
                            height={28}
                            className={formStyles.clubLogo}
                            unoptimized
                          />
                        ) : (
                          <span>{club.showEmoji !== false ? club.emoji || '🏟️' : '🏟️'}</span>
                        )}
                        <Link href={`/admin/partners/${club._id}`} className={formStyles.rowLink}>
                          {club.name}
                        </Link>
                      </div>
                    </td>
                    <td className={formStyles.td}>{club.viewSlug ? `/${club.viewSlug}` : '—'}</td>
                    <td className={formStyles.td}>
                      <div className={formStyles.inlineActions}>
                        <Link href={`/admin/partners/${club._id}`} className={formStyles.rowLink}>
                          Club Hub
                        </Link>
                        <Link href={`/admin/partners/${club._id}/reports`} className={formStyles.rowLink}>
                          Reports
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={formStyles.card}>
        <div className={formStyles.cardHeader}>
          <h2 className={formStyles.cardTitle}>
            <MaterialIcon name="event_note" />
            <span>Sanctioned &amp; Sponsored Matches ({sanctionedMatches.length})</span>
          </h2>
          <Link href="/admin/events" className={formStyles.rowLink}>
            View All Events
          </Link>
        </div>

        {sanctionedMatches.length === 0 ? (
          <div className={formStyles.emptyState}>No matches linked to this organization yet.</div>
        ) : (
          <div className={formStyles.tableWrap}>
            <table className={formStyles.table}>
              <thead>
                <tr>
                  <th className={formStyles.th}>Matchup</th>
                  <th className={formStyles.th}>Date</th>
                  <th className={formStyles.th}>Competition / Tier</th>
                  <th className={formStyles.th}>Photos</th>
                  <th className={formStyles.th}>Fans</th>
                  <th className={formStyles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sanctionedMatches.map((match) => (
                  <tr key={match._id}>
                    <td className={formStyles.td}>
                      <Link href={`/admin/events/${match._id}`} className={formStyles.rowLink}>
                        {match.eventName}
                      </Link>
                    </td>
                    <td className={formStyles.td}>
                      {match.eventDate ? new Date(match.eventDate).toLocaleDateString() : '—'}
                    </td>
                    <td className={formStyles.td}>
                      {match.competition?.tierLabel || match.competitionType || '—'}
                    </td>
                    <td className={formStyles.td}>{match.totalPhotos.toLocaleString()}</td>
                    <td className={formStyles.td}>{match.totalFans.toLocaleString()}</td>
                    <td className={formStyles.td}>
                      <div className={formStyles.inlineActions}>
                        <a
                          href={`/report/${match.viewSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={formStyles.rowLink}
                        >
                          Report ↗
                        </a>
                        <a
                          href={`/edit/${match.editSlug}`}
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
    </div>
  );
}
