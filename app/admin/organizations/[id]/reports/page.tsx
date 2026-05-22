'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import ColoredCard from '@/components/ColoredCard';
import SharePopup from '@/components/SharePopup';
import { FormModal } from '@/components/modals';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiPost, apiPut } from '@/lib/apiClient';
import styles from './page.module.css';
import { useCallback } from 'react';

type ReportVariant = {
  _id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  status: 'draft' | 'published' | 'archived';
  periodPreset: string;
  customDateRange: { startDate: string; endDate: string } | null;
  createdAt: string;
  updatedAt: string;
};

type OrganizationRecord = {
  _id: string;
  name: string;
};

const PERIOD_OPTIONS = [
  { value: 'all_time', label: 'All Time' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Time Period' },
];

function getVariantPageId(basePageId: string, variantSlug?: string | null): string {
  if (!variantSlug || variantSlug === 'default') return basePageId;
  return `${basePageId}::variant=${variantSlug}`;
}

function formatPeriodLabel(variant: ReportVariant) {
  if (variant.periodPreset === 'custom' && variant.customDateRange) {
    return `${variant.customDateRange.startDate} to ${variant.customDateRange.endDate}`;
  }

  return PERIOD_OPTIONS.find((option) => option.value === variant.periodPreset)?.label || variant.periodPreset;
}

export default function OrganizationReportsWorkspacePage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const { user, loading: authLoading } = useAdminAuth();
  const [organization, setOrganization] = useState<OrganizationRecord | null>(null);
  const [variants, setVariants] = useState<ReportVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    periodPreset: 'all_time',
    customStartDate: '',
    customEndDate: '',
  });
  const [shareTarget, setShareTarget] = useState<ReportVariant | null>(null);

  const loadWorkspace = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const [orgRes, variantsRes] = await Promise.all([
        fetch(`/api/admin/organizations/${id}`, { cache: 'no-store' }),
        fetch(`/api/report-variants?ownerType=organization&ownerId=${encodeURIComponent(id)}`, { cache: 'no-store' }),
      ]);

      const [orgData, variantsData] = await Promise.all([orgRes.json(), variantsRes.json()]);
      if (!orgData.success) {
        throw new Error(orgData.error || 'Failed to load organization');
      }
      if (!variantsData.success) {
        throw new Error(variantsData.error || 'Failed to load report variants');
      }

      setOrganization(orgData.organization);
      setVariants(variantsData.variants || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load reports workspace');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && user) {
      void loadWorkspace();
    }
  }, [authLoading, loadWorkspace, user]);

  const defaultVariant = useMemo(
    () => variants.find((variant) => variant.isDefault) || null,
    [variants]
  );

  const createVariant = async () => {
    if (!createForm.name.trim()) return;

    const payload: Record<string, unknown> = {
      ownerType: 'organization',
      ownerId: id,
      name: createForm.name.trim(),
      periodPreset: createForm.periodPreset,
    };

    if (createForm.periodPreset === 'custom') {
      payload.customDateRange = {
        startDate: createForm.customStartDate,
        endDate: createForm.customEndDate,
      };
    }

    const result = await apiPost('/api/report-variants', payload);
    if (!result.success) {
      setError(result.error || 'Failed to create report variant');
      return;
    }

    setCreateOpen(false);
    setCreateForm({
      name: '',
      periodPreset: 'all_time',
      customStartDate: '',
      customEndDate: '',
    });
    await loadWorkspace();
  };

  const updateVariant = async (variantId: string, updates: Record<string, unknown>) => {
    const result = await apiPut(`/api/report-variants/${variantId}`, updates);
    if (!result.success) {
      setError(result.error || 'Failed to update report variant');
      return;
    }
    await loadWorkspace();
  };

  if (authLoading || loading) {
    return <div className={styles.loading}>Loading organization reports…</div>;
  }

  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Organization Reports</p>
          <h1 className={styles.title}>{organization?.name || 'Organization'} Reports</h1>
          <p className={styles.subtitle}>
            `DEFAULT` always stays the canonical all-time report. Every custom report variant starts as a duplicate of `DEFAULT`.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/organization-report/${id}`} className={styles.secondaryButton} target="_blank">
            Open Default Report
          </Link>
          <button type="button" className={styles.primaryButton} onClick={() => setCreateOpen(true)}>
            + Create Report Variant
          </button>
        </div>
      </div>

      {error && (
        <ColoredCard accentColor="#ef4444" hoverable={false}>
          <div className={styles.errorText}>{error}</div>
        </ColoredCard>
      )}

      <ColoredCard accentColor="#3b82f6" hoverable={false}>
        <div className={styles.summaryGrid}>
          <div>
            <p className={styles.summaryLabel}>Default Report</p>
            <p className={styles.summaryValue}>{defaultVariant?.name || 'DEFAULT'}</p>
          </div>
          <div>
            <p className={styles.summaryLabel}>Variants</p>
            <p className={styles.summaryValue}>{variants.length}</p>
          </div>
          <div>
            <p className={styles.summaryLabel}>Published</p>
            <p className={styles.summaryValue}>{variants.filter((variant) => variant.status === 'published').length}</p>
          </div>
        </div>
      </ColoredCard>

      <div className={styles.variantList}>
        {variants.map((variant) => {
          const reportHref = variant.isDefault
            ? `/organization-report/${id}`
            : `/organization-report/${id}?variant=${encodeURIComponent(variant.slug)}`;
          const editorHref = variant.slug === 'default'
            ? `/organization-edit/${id}`
            : `/organization-edit/${id}?variant=${encodeURIComponent(variant.slug)}`;
          return (
            <ColoredCard key={variant._id} accentColor={variant.isDefault ? '#2563eb' : '#f59e0b'} hoverable={false}>
              <div className={styles.variantCard}>
                <div className={styles.variantHeader}>
                  <div>
                    <div className={styles.badgeRow}>
                      <span className={variant.isDefault ? styles.defaultBadge : styles.variantBadge}>
                        {variant.isDefault ? 'DEFAULT' : 'CUSTOM'}
                      </span>
                      <span className={styles.statusBadge}>{variant.status}</span>
                    </div>
                    <h2 className={styles.variantTitle}>{variant.name}</h2>
                    <p className={styles.variantMeta}>{formatPeriodLabel(variant)}</p>
                  </div>
                  <div className={styles.variantActions}>
                    <Link href={reportHref} className={styles.secondaryButton} target="_blank">
                      Open Report
                    </Link>
                    <Link href={editorHref} className={styles.secondaryButton} target="_blank">
                      Edit Report
                    </Link>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setShareTarget(variant)}
                    >
                      Share Report
                    </button>
                  </div>
                </div>

                <div className={styles.controlRow}>
                  {!variant.isDefault && (
                    <button
                      type="button"
                      className={styles.inlineButton}
                      onClick={async () => {
                        const nextName = window.prompt('Rename report variant', variant.name);
                        if (!nextName || nextName.trim() === variant.name) return;
                        await updateVariant(variant._id, { name: nextName.trim() });
                      }}
                    >
                      Rename
                    </button>
                  )}

                  {!variant.isDefault && (
                    <button
                      type="button"
                      className={styles.inlineButton}
                      onClick={async () => {
                        await updateVariant(variant._id, { isDefault: true, status: 'published' });
                      }}
                    >
                      Set Default
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.inlineButton}
                    onClick={async () => {
                      const nextStatus = variant.status === 'published' ? 'archived' : 'published';
                      await updateVariant(variant._id, { status: nextStatus });
                    }}
                  >
                    {variant.status === 'published' ? 'Archive' : 'Publish'}
                  </button>
                </div>
              </div>
            </ColoredCard>
          );
        })}
      </div>

      <FormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Report Variant"
        subtitle="Every custom report starts as a duplicate of DEFAULT, then you can change its period, text, images, style, and template."
        onSubmit={createVariant}
        submitText="Create Variant"
      >
        <div className={styles.formStack}>
          <div className="form-group">
            <label className="form-label-block">Variant Name</label>
            <input
              className="form-input"
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="CHL This Year"
            />
          </div>
          <div className="form-group">
            <label className="form-label-block">Time Period</label>
            <select
              className="form-input"
              value={createForm.periodPreset}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, periodPreset: event.target.value }))}
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {createForm.periodPreset === 'custom' && (
            <div className={styles.customGrid}>
              <div className="form-group">
                <label className="form-label-block">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={createForm.customStartDate}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, customStartDate: event.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label-block">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={createForm.customEndDate}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, customEndDate: event.target.value }))}
                />
              </div>
            </div>
          )}
        </div>
      </FormModal>

      <SharePopup
        isOpen={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
        pageId={shareTarget ? getVariantPageId(id, shareTarget.isDefault ? null : shareTarget.slug) : id}
        pageType="organization-report"
        customTitle={shareTarget ? `Share ${shareTarget.name}` : undefined}
      />
    </div>
  );
}
