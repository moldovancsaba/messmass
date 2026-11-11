import { consistentRate } from '@/lib/consistentRate';

describe('consistentRate', () => {
  it('returns the share when the part fits inside the whole', () => {
    expect(consistentRate(9771, 13572)).toBeCloseTo(71.99, 1);
    expect(consistentRate(100, 100)).toBe(100);
    expect(consistentRate(0, 50)).toBe(0);
  });

  it('returns null when the part exceeds the whole (conflicting stored counts)', () => {
    expect(consistentRate(20130, 13572)).toBeNull();
    expect(consistentRate(4540, 4527)).toBeNull();
  });

  it('returns null for an empty or invalid whole', () => {
    expect(consistentRate(5, 0)).toBeNull();
    expect(consistentRate(0, 0)).toBeNull();
    expect(consistentRate(-1, 10)).toBeNull();
    expect(consistentRate(NaN, 10)).toBeNull();
  });
});
