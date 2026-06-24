import {
  normalizeReportPeriodInput,
  normalizeReportPeriodUpdate,
  ReportPeriodValidationError,
} from '@/lib/reportPeriodValidation';
import {
  hasReportVariantCreateFormErrors,
  validateReportVariantCreateForm,
} from '@/lib/reportVariantFormValidation';

describe('report period validation', () => {
  it('normalizes non-custom presets and clears stale custom ranges', () => {
    expect(
      normalizeReportPeriodInput({
        periodPreset: 'this_year',
        customDateRange: { startDate: '2026-01-01', endDate: '2026-06-24' },
      })
    ).toEqual({
      periodPreset: 'this_year',
      customDateRange: null,
    });
  });

  it('accepts valid same-day custom ranges', () => {
    expect(
      normalizeReportPeriodInput({
        periodPreset: 'custom',
        customDateRange: { startDate: '2026-06-24', endDate: '2026-06-24' },
      })
    ).toEqual({
      periodPreset: 'custom',
      customDateRange: { startDate: '2026-06-24', endDate: '2026-06-24' },
    });
  });

  it.each([
    ['CUSTOM_PERIOD_DATES_REQUIRED', { periodPreset: 'custom', customDateRange: null }],
    [
      'CUSTOM_PERIOD_DATE_FORMAT_INVALID',
      { periodPreset: 'custom', customDateRange: { startDate: '06/24/2026', endDate: '2026-06-24' } },
    ],
    [
      'CUSTOM_PERIOD_RANGE_INVALID',
      { periodPreset: 'custom', customDateRange: { startDate: '2026-06-24', endDate: '2026-01-01' } },
    ],
    ['PERIOD_PRESET_INVALID', { periodPreset: 'forever', customDateRange: null }],
  ])('rejects invalid periods with %s', (code, input) => {
    expect(() => normalizeReportPeriodInput(input)).toThrow(ReportPeriodValidationError);

    try {
      normalizeReportPeriodInput(input);
    } catch (error) {
      expect(error).toBeInstanceOf(ReportPeriodValidationError);
      expect((error as ReportPeriodValidationError).code).toBe(code);
    }
  });
});

describe('report variant create form validation', () => {
  it('blocks empty names and invalid custom dates', () => {
    const errors = validateReportVariantCreateForm({
      name: '',
      periodPreset: 'custom',
      customStartDate: '2026-06-24',
      customEndDate: '2026-01-01',
    });

    expect(hasReportVariantCreateFormErrors(errors)).toBe(true);
    expect(errors.name).toBe('Variant name is required.');
    expect(errors.customEndDate).toBe('End date must be on or after start date.');
  });

  it('allows valid preset forms without custom dates', () => {
    const errors = validateReportVariantCreateForm({
      name: 'CHL This Year',
      periodPreset: 'this_year',
      customStartDate: '',
      customEndDate: '',
    });

    expect(hasReportVariantCreateFormErrors(errors)).toBe(false);
  });
});

describe('report variant period updates', () => {
  it('rejects explicit null custom ranges instead of reusing stale existing dates', () => {
    expect(() =>
      normalizeReportPeriodUpdate(
        {
          periodPreset: 'custom',
          customDateRange: { startDate: '2026-01-01', endDate: '2026-06-24' },
        },
        { customDateRange: null }
      )
    ).toThrow(ReportPeriodValidationError);
  });
});
