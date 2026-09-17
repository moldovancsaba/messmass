'use client';

// app/admin/partners/[id]/lifecycle/page.tsx
// WHAT: The lifecycle workspace for one partner -- messmass#235.
// WHY: Per the full model decided 2026-09-17: the stage is computed, not
//     invented per-page -- Activation/Renewal come from real event data
//     (lib/partnershipLifecycle.ts), Proposal/Postmortem are the two states
//     with no data signal and need an explicit admin override. Reporting/
//     Proof is a capability available throughout Activation and Renewal
//     (the #235 audit found both already live, used concurrently), not a
//     fifth sequential stage -- so this links out to the real, existing
//     Activation and Reporting surfaces rather than re-implementing them.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ColoredCard from '@/components/ColoredCard';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import styles from './Lifecycle.module.css';

interface Lifecycle {
  stage: 'proposal' | 'activation' | 'renewal' | 'postmortem';
  isOverridden: boolean;
  projectCount: number;
  mostRecentEventDate: string | null;
  monthsSinceLastEvent: number | null;
  reportingAvailable: boolean;
}

const STAGE_LABEL: Record<Lifecycle['stage'], string> = {
  proposal: 'Proposal',
  activation: 'Activation',
  renewal: 'Renewal Due',
  postmortem: 'Postmortem',
};

const STAGE_ORDER: Lifecycle['stage'][] = ['proposal', 'activation', 'renewal', 'postmortem'];

export default function PartnershipLifecyclePage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = (params?.id as string) || '';

  const [partnerName, setPartnerName] = useState('');
  const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [partnerRes, lifecycleRes] = await Promise.all([
        fetch(`/api/partners/edit/${partnerId}`, { cache: 'no-store' }),
        fetch(`/api/partners/${partnerId}/lifecycle`, { cache: 'no-store' }),
      ]);
      const partnerData = await partnerRes.json();
      const lifecycleData = await lifecycleRes.json();
      if (!partnerData.success) throw new Error(partnerData.error || 'Failed to load partner');
      if (!lifecycleData.success) throw new Error(lifecycleData.error || 'Failed to load lifecycle');
      setPartnerName(partnerData.partner.name);
      setLifecycle(lifecycleData.lifecycle);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lifecycle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  const setOverride = async (override: 'proposal' | 'postmortem' | null) => {
    const csrfRes = await fetch('/api/csrf-token');
    const { csrfToken } = await csrfRes.json();
    await fetch(`/api/partners/${partnerId}/lifecycle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ override }),
    });
    load();
  };

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title={`🔄 ${partnerName || 'Partnership'} Lifecycle`}
        subtitle="Proposal, Activation, Renewal, and Postmortem -- computed from real event data where possible."
        backLink={`/admin/partners`}
        showSearch={false}
        actionButtons={[{ label: 'Refresh', icon: 'refresh', onClick: load, variant: 'secondary' }]}
      />

      <div className={styles.page}>
        {loading && <p className={styles.status}>Loading...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {lifecycle && !loading && !error && (
          <>
            <div className={styles.stageTrack}>
              {STAGE_ORDER.map((stage) => (
                <div key={stage} className={stage === lifecycle.stage ? styles.stageActive : styles.stageInactive}>
                  {STAGE_LABEL[stage]}
                </div>
              ))}
            </div>

            <ColoredCard accentColor="var(--mm-color-primary-500)" className={styles.card}>
              <h3 className={styles.cardTitle}>Current Stage: {STAGE_LABEL[lifecycle.stage]}</h3>
              <p className={styles.cardBody}>
                {lifecycle.isOverridden
                  ? `Set manually by an admin.`
                  : lifecycle.projectCount === 0
                    ? 'No events exist for this partner yet.'
                    : `${lifecycle.projectCount} event${lifecycle.projectCount === 1 ? '' : 's'}, ${lifecycle.monthsSinceLastEvent} month${lifecycle.monthsSinceLastEvent === 1 ? '' : 's'} since the last one.`}
              </p>
              {(lifecycle.stage === 'proposal' || lifecycle.stage === 'postmortem') && (
                <button className={styles.actionButton} onClick={() => setOverride(null)} disabled={!lifecycle.isOverridden}>
                  Clear manual override
                </button>
              )}
              {lifecycle.stage !== 'postmortem' && (
                <button className={styles.actionButton} onClick={() => setOverride('postmortem')}>
                  Mark as ended (Postmortem)
                </button>
              )}
            </ColoredCard>

            <div className={styles.linkGrid}>
              <ColoredCard accentColor="var(--mm-chart-orange)" className={styles.card} hoverable>
                <h3 className={styles.cardTitle}>Activation</h3>
                <p className={styles.cardBody}>
                  {lifecycle.projectCount > 0
                    ? 'Real activation data exists for this partner.'
                    : 'Not yet tracked -- no events exist for this partner.'}
                </p>
                {lifecycle.projectCount > 0 && (
                  <a className={styles.link} href={`/admin/analytics/sponsorship/activation?partnerFilter=${partnerId}`}>
                    Open Activation Hub →
                  </a>
                )}
              </ColoredCard>

              <ColoredCard accentColor="var(--mm-chart-teal)" className={styles.card} hoverable>
                <h3 className={styles.cardTitle}>Reporting / Proof</h3>
                <p className={styles.cardBody}>
                  {lifecycle.reportingAvailable
                    ? 'Real, shareable reports exist for this partner.'
                    : 'Not yet tracked -- no events exist for this partner.'}
                </p>
                {lifecycle.reportingAvailable && (
                  <a className={styles.link} href={`/admin/partners/${partnerId}/reports`}>
                    Open Reports Workspace →
                  </a>
                )}
              </ColoredCard>

              <ColoredCard accentColor="var(--mm-color-warning-500)" className={styles.card}>
                <h3 className={styles.cardTitle}>Proposal</h3>
                <p className={styles.cardBody}>Not yet tracked as a distinct data model -- no field exists for proposal-stage details today.</p>
              </ColoredCard>

              <ColoredCard accentColor="var(--mm-gray-400)" className={styles.card}>
                <h3 className={styles.cardTitle}>Postmortem</h3>
                <p className={styles.cardBody}>Not yet tracked as a distinct data model beyond the stage marker itself -- no postmortem notes/outcomes field exists today.</p>
              </ColoredCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
