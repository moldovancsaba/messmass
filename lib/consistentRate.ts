/**
 * A percentage of two stored counts, or null when the counts cannot be a real share.
 *
 * A share needs a non-empty whole and a part that does not exceed it. When the stored data
 * says "20,130 opted in of 13,572 registered", no honest percentage exists: showing one would
 * either contradict the counts printed next to it or hide the conflict (for example by capping
 * at 100). The caller shows "n/a" and keeps the raw counts visible.
 */
export function consistentRate(part: number, whole: number): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(whole)) return null;
  if (whole <= 0 || part < 0 || part > whole) return null;
  return (part / whole) * 100;
}
