import type { ObjectId } from 'mongodb';
import { validateCustomDateRangeForAudit, type PeriodValidationErrorCode } from '@/lib/reportPeriodValidation';

export interface ReportVariantPeriodAuditCandidate {
  _id: ObjectId | string;
  ownerType?: string;
  ownerId?: string;
  name?: string;
  periodPreset?: string;
  customDateRange?: unknown;
}

export interface InvalidPeriodAuditRow {
  variantId: string;
  ownerType: string;
  ownerId: string;
  name: string;
  reason: PeriodValidationErrorCode;
  currentValue: unknown;
  proposedRepair: {
    periodPreset: 'all_time';
    customDateRange: null;
  };
}

export function classifyInvalidCustomPeriodRecord(
  variant: ReportVariantPeriodAuditCandidate
): InvalidPeriodAuditRow | null {
  if (variant.periodPreset !== 'custom') return null;

  const validation = validateCustomDateRangeForAudit(variant.customDateRange);
  if (validation.valid || !validation.reason) return null;

  return {
    variantId: variant._id.toString(),
    ownerType: variant.ownerType || 'unknown',
    ownerId: variant.ownerId || 'unknown',
    name: variant.name || '(unnamed)',
    reason: validation.reason,
    currentValue: variant.customDateRange,
    proposedRepair: {
      periodPreset: 'all_time',
      customDateRange: null,
    },
  };
}
