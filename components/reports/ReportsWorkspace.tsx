'use client';

// components/reports/ReportsWorkspace.tsx
// WHAT: The Reports workspace for any report-variant owner — organization,
//     partner, hashtag or filter.
// WHY: messmass#244 Phase B needed this surface for hashtags and filters, and
//     the organization and partner versions were already 345 and 364 lines of
//     near-identical code with byte-identical stylesheets. Copying twice more
//     would have made four. The repo's own rule is one implementation, many
//     consumers, and the differences between owners are narrow enough to be
//     data: where to fetch the owner's name, what its public report and editor
//     URLs look like, and which page-password type gates it.
// HOW: One component, parameterised by an OwnerConfig. Owners with no editor
//     (hashtags and filters have no edit surface) simply omit `editorHref`,
//     and the Edit action is not rendered rather than linking somewhere that
//     does not exist.

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ColoredCard from '@/components/ColoredCard';
import SharePopup from '@/components/SharePopup';
import UnifiedInputField from '@/components/UnifiedInputField';
import UnifiedSelectField from '@/components/UnifiedSelectField';
import { FormModal } from '@/components/modals';
import type { PageType } from '@/lib/pagePassword';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiPost, apiPut } from '@/lib/apiClient';
import {
  hasReportVariantCreateFormErrors,
  validateReportVariantCreateForm,
} from '@/lib/reportVariantFormValidation';
import styles from './ReportsWorkspace.module.css';

export type ReportVariantSummary = {
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

export interface OwnerConfig {
  /** Matches ReportVariantOwnerType in lib/reportVariants.ts. */
  ownerType: 'organization' | 'partner' | 'hashtag' | 'filter';
  /** Shown above the title, e.g. "Partner Reports". */
  eyebrow: string;
  /** Page-password type SharePopup should gate links with. */
  pageType: PageType;
  /**
   * Fetch the owner's display name and, where the public URL differs from the
   * admin id (partners use viewSlug), the slug those URLs are built from.
   * Returning null means "no separate lookup" — the id is the name.
   */
  loadOwner?: (id: string) => Promise<{ name: string; publicSlug?: string }>;
  /** Public report URL. `slug` is the variant slug, absent for the default. */
  reportHref: (publicSlug: string, slug?: string) => string;
  /** Editor URL, or undefined for owners that have no editor. */
  editorHref?: (publicSlug: string, slug?: string) => string;
}

const PERIOD_OPTIONS = [
  { value: 'all_time', label: 'All Time' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Time Period' },
];

/** Mirrors getReportVariantPageId in lib/reportVariants.ts. */
function getVariantPageId(basePageId: string, variantSlug?: string | null): string {
  if (!variantSlug || variantSlug === 'default') return basePageId;
  return `${basePageId}::variant=${variantSlug}`;
}

function formatPeriodLabel(variant: ReportVariantSummary) {
  if (variant.periodPreset === 'custom' && variant.customDateRange) {
    return `${variant.customDateRange.startDate} to ${variant.customDateRange.endDate}`;
  }
  return PERIOD_OPTIONS.find((o) => o.value === variant.periodPreset)?.label || variant.periodPreset;
}

export default function ReportsWorkspace({ id, config }: { id: string; config: OwnerConfig }) {
  const { user, loading: authLoading } = useAdminAuth();
  const [ownerName, setOwnerName] = useState<string>('');
  const [publicSlug, setPublicSlug] = useState<string>(id);
  const [variants, setVariants] = useState<ReportVariantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    periodPreset: 'all_time',
    customStartDate: '',
    customEndDate: '',
  });
  const [shareTarget, setShareTarget] = useState<ReportVariantSummary | null>(null);

  const loadWorkspace = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const [owner, variantsRes] = await Promise.all([
        config.loadOwner ? config.loadOwner(id) : Promise.resolve(null),
        fetch(
          `/api/report-variants?ownerType=${config.ownerType}&ownerId=${encodeURIComponent(id)}`,
          { cache: 'no-store' }
        ),
      ]);

      const variantsData = await variantsRes.json();
      if (!variantsData.success) {
        throw new Error(variantsData.error || 'Failed to load report variants');
      }

      setOwnerName(owner?.name || id);
      setPublicSlug(owner?.publicSlug || id);
      setVariants(variantsData.variants || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load reports workspace');
    } finally {
      setLoading(false);
    }
  }, [config, id]);

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
      ownerType: config.ownerType,
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
    setCreateForm({ name: '', periodPreset: 'all_time', customStartDate: '', customEndDate: '' });
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
    return <div className={styles.loading}>Loading reports…</div>;
  }

  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{config.eyebrow}</p>
          <h1 className={styles.title}>{ownerName} Reports</h1>
          <p className={styles.subtitle}>
            `DEFAULT` always stays the canonical all-time report. Every custom report variant starts as a duplicate of `DEFAULT`.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={config.reportHref(publicSlug)} className={styles.secondaryButton} target="_blank">
            Open Default Report
          </Link>
          <button type="button" className={styles.primaryButton} onClick={() => setCreateOpen(true)}>
            + Create Report Variant
          </button>
        </div>
      </div>

      {error && (
        <ColoredCard accentColor="var(--mm-error)" hoverable={false}>
          <div className={styles.errorText}>{error}</div>
        </ColoredCard>
      )}

      <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
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
            <p className={styles.summaryValue}>
              {variants.filter((variant) => variant.status === 'published').length}
            </p>
          </div>
        </div>
      </ColoredCard>

      <div className={styles.variantList}>
        {variants.map((variant) => {
          const slug = variant.isDefault ? undefined : variant.slug;
          const reportHref = config.reportHref(publicSlug, slug);
          const editorHref = config.editorHref
            ? config.editorHref(publicSlug, variant.slug === 'default' ? undefined : variant.slug)
            : null;
          return (
            <ColoredCard
              key={variant._id}
              accentColor={variant.isDefault ? 'var(--mm-color-primary-600)' : 'var(--mm-warning)'}
              hoverable={false}
            >
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
                    {editorHref && (
                      <Link href={editorHref} className={styles.secondaryButton} target="_blank">
                        Edit Report
                      </Link>
                    )}
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
        disableSubmit={isCreateFormInvalid}
      >
        <div className={styles.formStack}>
          <UnifiedInputField
            label="Variant Name"
            value={createForm.name}
            onChange={(value) => setCreateForm((prev) => ({ ...prev, name: value }))}
            placeholder="CHL This Year"
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

      <SharePopup
        isOpen={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
        pageId={shareTarget ? getVariantPageId(id, shareTarget.isDefault ? null : shareTarget.slug) : id}
        pageType={config.pageType}
        customTitle={shareTarget ? `Share ${shareTarget.name}` : undefined}
      />
    </div>
  );
}
