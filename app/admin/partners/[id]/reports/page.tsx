'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import ColoredCard from '@/components/ColoredCard';
import SharePopup from '@/components/SharePopup';
import UnifiedInputField from '@/components/UnifiedInputField';
import UnifiedSelectField from '@/components/UnifiedSelectField';
import { FormModal } from '@/components/modals';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiPost, apiPut } from '@/lib/apiClient';
import { hasReportVariantCreateFormErrors, validateReportVariantCreateForm } from '@/lib/reportVariantFormValidation';
import styles from './page.module.css';

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

type PartnerRecord = {
  _id: string;
  name: string;
  viewSlug?: string;
};

const PERIOD_OPTIONS = [
  { value: 'all_time', label: 'All Time' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Time Period' },
];

function getVariantPageId(basePageId: string, variant: ReportVariant): string {
  if (variant.isDefault) return basePageId;
  return `${basePageId}::variant=${variant.slug}`;
}

function formatPeriodLabel(variant: ReportVariant) {
  if (variant.periodPreset === 'custom' && variant.customDateRange) {
    return `${variant.customDateRange.startDate} to ${variant.customDateRange.endDate}`;
  }

  return PERIOD_OPTIONS.find((option) => option.value === variant.periodPreset)?.label || variant.periodPreset;
}

export default function PartnerReportsWorkspacePage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const { user, loading: authLoading } = useAdminAuth();
  const [partner, setPartner] = useState<PartnerRecord | null>(null);
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
      const [partnerRes, variantsRes] = await Promise.all([
        fetch(`/api/partners/edit/${id}`, { cache: 'no-store' }),
        fetch(`/api/report-variants?ownerType=partner&ownerId=${encodeURIComponent(id)}`, { cache: 'no-store' }),
      ]);

      const [partnerData, variantsData] = await Promise.all([partnerRes.json(), variantsRes.json()]);
      if (!partnerData.success) {
        throw new Error(partnerData.error || 'Failed to load partner');
      }
      if (!variantsData.success) {
        throw new Error(variantsData.error || 'Failed to load report variants');
      }

      setPartner({
        _id: partnerData.partner._id,
        name: partnerData.partner.name,
        viewSlug: partnerData.partner.viewSlug || undefined,
      });
      setVariants(variantsData.variants || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load partner reports workspace');
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
  const createFormErrors = useMemo(() => validateReportVariantCreateForm(createForm), [createForm]);
  const isCreateFormInvalid = hasReportVariantCreateFormErrors(createFormErrors);

  const createVariant = async () => {
    if (isCreateFormInvalid) return;

    const payload: Record<string, unknown> = {
      ownerType: 'partner',
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
    return <div className={styles.loading}>Loading partner reports…</div>;
  }

  if (!user) return null;

  const publicSlug = partner?.viewSlug || partner?._id || id;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Partner Reports</p>
          <h1 className={styles.title}>{partner?.name || 'Partner'} Reports</h1>
          <p className={styles.subtitle}>
            `DEFAULT` always stays the canonical all-time partner report. Every custom report variant starts as a duplicate of `DEFAULT`.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/partner-report/${publicSlug}`} className={styles.secondaryButton} target="_blank">
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
            ? `/partner-report/${publicSlug}`
            : `/partner-report/${publicSlug}?variant=${encodeURIComponent(variant.slug)}`;
          const editorHref = variant.slug === 'default'
            ? `/partner-edit/${publicSlug}`
            : `/partner-edit/${publicSlug}?variant=${encodeURIComponent(variant.slug)}`;

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

                  {variant.status !== 'published' && (
                    <button
                      type="button"
                      className={styles.inlineButton}
                      onClick={() => updateVariant(variant._id, { status: 'published' })}
                    >
                      Publish
                    </button>
                  )}

                  {variant.status !== 'archived' && !variant.isDefault && (
                    <button
                      type="button"
                      className={styles.inlineButton}
                      onClick={() => updateVariant(variant._id, { status: 'archived' })}
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </ColoredCard>
          );
        })}
      </div>

      <FormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Partner Report Variant"
        onSubmit={createVariant}
        submitText="Create Variant"
        disableSubmit={isCreateFormInvalid}
      >
        <div className={styles.formStack}>
          <UnifiedInputField
            label="Variant Name"
            value={createForm.name}
            onChange={(value) => setCreateForm((prev) => ({ ...prev, name: value }))}
            placeholder="e.g. Renewal 2026"
            required
            error={createFormErrors.name}
          />

          <UnifiedSelectField
            label="Time Period"
            value={createForm.periodPreset}
            onChange={(value) => setCreateForm((prev) => ({ ...prev, periodPreset: value }))}
            options={PERIOD_OPTIONS}
            error={createFormErrors.periodPreset}
          />

          {createForm.periodPreset === 'custom' && (
            <div className={styles.customGrid}>
              <UnifiedInputField
                label="Start Date"
                type="date"
                value={createForm.customStartDate}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, customStartDate: value }))}
                required
                error={createFormErrors.customStartDate}
              />
              <UnifiedInputField
                label="End Date"
                type="date"
                value={createForm.customEndDate}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, customEndDate: value }))}
                required
                error={createFormErrors.customEndDate}
              />
            </div>
          )}
        </div>
      </FormModal>

      {shareTarget && (
        <SharePopup
          isOpen={!!shareTarget}
          onClose={() => setShareTarget(null)}
          pageId={getVariantPageId(publicSlug, shareTarget)}
          pageType="partner-report"
          customTitle={`Share ${shareTarget.name}`}
        />
      )}
    </div>
  );
}
