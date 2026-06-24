import type { ReportPeriodPreset } from '@/lib/reportPeriods';
import { REPORT_PERIOD_PRESETS } from '@/lib/reportPeriodValidation';

export interface ReportVariantCreateFormState {
  name: string;
  periodPreset: string;
  customStartDate: string;
  customEndDate: string;
}

export type ReportVariantCreateFormField = 'name' | 'periodPreset' | 'customStartDate' | 'customEndDate';

export type ReportVariantCreateFormErrors = Partial<Record<ReportVariantCreateFormField, string>>;

export function validateReportVariantCreateForm(
  form: ReportVariantCreateFormState
): ReportVariantCreateFormErrors {
  const errors: ReportVariantCreateFormErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Variant name is required.';
  }

  if (!REPORT_PERIOD_PRESETS.includes(form.periodPreset as ReportPeriodPreset)) {
    errors.periodPreset = 'Select a supported time period.';
  }

  if (form.periodPreset === 'custom') {
    if (!form.customStartDate) {
      errors.customStartDate = 'Start date is required.';
    }

    if (!form.customEndDate) {
      errors.customEndDate = 'End date is required.';
    }

    if (form.customStartDate && form.customEndDate && form.customStartDate > form.customEndDate) {
      errors.customEndDate = 'End date must be on or after start date.';
    }
  }

  return errors;
}

export function hasReportVariantCreateFormErrors(errors: ReportVariantCreateFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
