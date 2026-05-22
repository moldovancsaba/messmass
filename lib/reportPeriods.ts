export type ReportPeriodPreset =
  | 'all_time'
  | 'this_month'
  | 'last_30_days'
  | 'this_year'
  | 'last_year'
  | 'custom';

export interface ReportCustomDateRange {
  startDate: string;
  endDate: string;
}

export interface ResolvedReportPeriod {
  periodPreset: ReportPeriodPreset;
  customDateRange?: ReportCustomDateRange | null;
  timezone: string;
  startDate: string | null;
  endDate: string | null;
  label: string;
}

const DEFAULT_TIMEZONE = 'Europe/Budapest';

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

function endOfYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 11, 31));
}

export function resolveReportPeriod(
  periodPreset: ReportPeriodPreset,
  customDateRange?: ReportCustomDateRange | null,
  timezone = DEFAULT_TIMEZONE
): ResolvedReportPeriod {
  const now = new Date();

  if (periodPreset === 'all_time') {
    return {
      periodPreset,
      customDateRange: null,
      timezone,
      startDate: null,
      endDate: null,
      label: 'All Time',
    };
  }

  if (periodPreset === 'this_month') {
    return {
      periodPreset,
      customDateRange: null,
      timezone,
      startDate: formatDateOnly(startOfMonth(now)),
      endDate: formatDateOnly(now),
      label: 'This Month',
    };
  }

  if (periodPreset === 'last_30_days') {
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() - 29);

    return {
      periodPreset,
      customDateRange: null,
      timezone,
      startDate: formatDateOnly(startDate),
      endDate: formatDateOnly(now),
      label: 'Last 30 Days',
    };
  }

  if (periodPreset === 'this_year') {
    return {
      periodPreset,
      customDateRange: null,
      timezone,
      startDate: formatDateOnly(startOfYear(now)),
      endDate: formatDateOnly(now),
      label: 'This Year',
    };
  }

  if (periodPreset === 'last_year') {
    const lastYear = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
    return {
      periodPreset,
      customDateRange: null,
      timezone,
      startDate: formatDateOnly(startOfYear(lastYear)),
      endDate: formatDateOnly(endOfYear(lastYear)),
      label: 'Last Year',
    };
  }

  const normalizedRange = customDateRange && customDateRange.startDate && customDateRange.endDate
    ? customDateRange
    : null;

  return {
    periodPreset: 'custom',
    customDateRange: normalizedRange,
    timezone,
    startDate: normalizedRange?.startDate || null,
    endDate: normalizedRange?.endDate || null,
    label: normalizedRange
      ? `${normalizedRange.startDate} to ${normalizedRange.endDate}`
      : 'Custom',
  };
}

export function isEventDateInPeriod(
  eventDate: string | undefined | null,
  period: Pick<ResolvedReportPeriod, 'startDate' | 'endDate'>
): boolean {
  if (!eventDate) return false;
  const normalizedDate = eventDate.slice(0, 10);
  if (period.startDate && normalizedDate < period.startDate) return false;
  if (period.endDate && normalizedDate > period.endDate) return false;
  return true;
}
