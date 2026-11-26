import { resolveSportIcon } from '@/lib/sportIcons';

describe('resolveSportIcon', () => {
  it('maps core and extended sports and competition tags to dedicated domain icons', () => {
    expect(resolveSportIcon('Football')).toBe('⚽');
    expect(resolveSportIcon('soccer')).toBe('⚽');
    expect(resolveSportIcon('Basketball')).toBe('🏀');
    expect(resolveSportIcon('3x3')).toBe('🏀');
    expect(resolveSportIcon('eurobasket_b_division_women')).toBe('🏀');
    expect(resolveSportIcon('eurobasket_qualifier_men')).toBe('🏀');
    expect(resolveSportIcon('Ice Hockey')).toBe('🏒');
    expect(resolveSportIcon('Handball')).toBe('🤾');
    expect(resolveSportIcon('darts')).toBe('🎯');
    expect(resolveSportIcon('motor')).toBe('🏍️');
    expect(resolveSportIcon('motorsport')).toBe('🏎️');
    expect(resolveSportIcon('volleyball')).toBe('🏐');
    expect(resolveSportIcon('euro_qualification_volleyball_men')).toBe('🏐');
    expect(resolveSportIcon('euro_qualification_volleyball_women')).toBe('🏐');
    expect(resolveSportIcon('waterpolo')).toBe('🤽');
    expect(resolveSportIcon('water_polo')).toBe('🤽');
    expect(resolveSportIcon('swimming')).toBe('🏊');
    expect(resolveSportIcon('artistic_swimming')).toBe('🏊‍♀️');
    expect(resolveSportIcon('karate')).toBe('🥋');
    expect(resolveSportIcon('Pickleball')).toBe('🎾');
    expect(resolveSportIcon('music')).toBe('🎸');
    expect(resolveSportIcon('Multi-Sport')).toBe('🏅');
  });

  it('returns the caller fallback when sport is missing or unrecognized', () => {
    expect(resolveSportIcon(null, '🏟️')).toBe('🏟️');
    expect(resolveSportIcon('', '🛡️')).toBe('🛡️');
  });
});
