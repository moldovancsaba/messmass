export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function getStoredOrDerivedTotalFans(
  stats?: {
    totalFans?: unknown;
    remoteFans?: unknown;
    indoor?: unknown;
    outdoor?: unknown;
    stadium?: unknown;
  } | null
): number {
  if (!stats) {
    return 0;
  }

  const storedTotalFans = toFiniteNumber(stats.totalFans);
  if (storedTotalFans !== null) {
    return storedTotalFans;
  }

  const remoteFans = toFiniteNumber(stats.remoteFans);
  const indoor = toFiniteNumber(stats.indoor) ?? 0;
  const outdoor = toFiniteNumber(stats.outdoor) ?? 0;
  const stadium = toFiniteNumber(stats.stadium) ?? 0;

  return (remoteFans ?? (indoor + outdoor)) + stadium;
}
