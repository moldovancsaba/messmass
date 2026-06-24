import type { ReportCustomDateRange, ReportPeriodPreset } from '@/lib/reportPeriods';

export const REPORT_PERIOD_PRESETS: ReportPeriodPreset[] = [
  'all_time',
  'this_month',
  'last_30_days',
  'this_year',
  'last_year',
  'custom',
];

export type PeriodValidationErrorCode =
  | 'PERIOD_PRESET_INVALID'
  | 'CUSTOM_PERIOD_DATES_REQUIRED'
  | 'CUSTOM_PERIOD_DATE_FORMAT_INVALID'
  | 'CUSTOM_PERIOD_RANGE_INVALID';

export class ReportPeriodValidationError extends Error {
  code: PeriodValidationErrorCode;
  status = 400;

  constructor(code: PeriodValidationErrorCode, message: string) {
    super(message);
    this.name = 'ReportPeriodValidationError';
    this.code = code;
  }
}

export interface NormalizedReportPeriodInput {
  periodPreset: ReportPeriodPreset;
  customDateRange: ReportCustomDateRange | null;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function fail(code: PeriodValidationErrorCode): never {
  const messages: Record<PeriodValidationErrorCode, string> = {
    PERIOD_PRESET_INVALID: 'Selected time period is not supported.',
    CUSTOM_PERIOD_DATES_REQUIRED: 'Custom time period requires a start date and end date.',
    CUSTOM_PERIOD_DATE_FORMAT_INVALID: 'Custom time period dates must use YYYY-MM-DD format.',
    CUSTOM_PERIOD_RANGE_INVALID: 'Custom time period end date must be on or after start date.',
  };

  throw new ReportPeriodValidationError(code, messages[code]);
}

export function normalizeReportPeriodInput(input: {
  periodPreset?: unknown;
  customDateRange?: unknown;
}): NormalizedReportPeriodInput {
  const periodPreset = (input.periodPreset || 'all_time') as ReportPeriodPreset;

  if (!REPORT_PERIOD_PRESETS.includes(periodPreset)) {
    fail('PERIOD_PRESET_INVALID');
  }

  if (periodPreset !== 'custom') {
    return {
      periodPreset,
      customDateRange: null,
    };
  }

  const customDateRange = input.customDateRange as Partial<ReportCustomDateRange> | null | undefined;
  const startDate = customDateRange?.startDate;
  const endDate = customDateRange?.endDate;

  if (!startDate || !endDate) {
    fail('CUSTOM_PERIOD_DATES_REQUIRED');
  }

  if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) {
    fail('CUSTOM_PERIOD_DATE_FORMAT_INVALID');
  }

  if (startDate > endDate) {
    fail('CUSTOM_PERIOD_RANGE_INVALID');
  }

  return {
    periodPreset,
    customDateRange: {
      startDate,
      endDate,
    },
  };
}

export function normalizeReportPeriodUpdate(
  existing: {
    periodPreset?: unknown;
    customDateRange?: unknown;
  },
  updates: {
    periodPreset?: unknown;
    customDateRange?: unknown;
  }
): NormalizedReportPeriodInput | null {
  const hasPeriodPresetUpdate = Object.prototype.hasOwnProperty.call(updates, 'periodPreset');
  const hasCustomDateRangeUpdate = Object.prototype.hasOwnProperty.call(updates, 'customDateRange');

  if (!hasPeriodPresetUpdate && !hasCustomDateRangeUpdate) {
    return null;
  }

  return normalizeReportPeriodInput({
    periodPreset: hasPeriodPresetUpdate ? updates.periodPreset : existing.periodPreset,
    customDateRange: hasCustomDateRangeUpdate ? updates.customDateRange : existing.customDateRange,
  });
}

export function validateCustomDateRangeForAudit(value: unknown): {
  valid: boolean;
  reason?: PeriodValidationErrorCode;
} {
  try {
    normalizeReportPeriodInput({ periodPreset: 'custom', customDateRange: value });
    return { valid: true };
  } catch (error) {
    if (error instanceof ReportPeriodValidationError) {
      return { valid: false, reason: error.code };
    }

    return { valid: false, reason: 'CUSTOM_PERIOD_DATE_FORMAT_INVALID' };
  }
}
