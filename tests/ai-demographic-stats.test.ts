// tests/ai-demographic-stats.test.ts
// WHAT: Pins how a summary's demographic/brand data turns into report
//     variables — the fix for "AI Variables is missing gender/age/emotion
//     entirely" (only 6 scalar + 7 sparse merch variables existed; none of
//     the populated demographics data was reachable as a report token).
// WHY: Wrong here means either a report author sees a variable that doesn't
//     actually reflect the underlying data, or a real signal stays invisible
//     exactly like the bug this fixes.

import { deriveFanmassDemographicStats } from '@/lib/aiDemographicStats';

describe('deriveFanmassDemographicStats', () => {
  it('turns fixed-category projections into percentage variables of the analysed total', () => {
    const stats = deriveFanmassDemographicStats({
      genderProjection: { male: 60, female: 40 },
      ageProjection: { adults: 80, children: 20 },
      emotionProjection: { happy: 90, neutral: 10 },
    });
    expect(stats.fanmassDemographicsAnalyzed).toBe(100);
    expect(stats.fanmassGenderMalePct).toBe(60);
    expect(stats.fanmassGenderFemalePct).toBe(40);
    expect(stats.fanmassAgeAdultsPct).toBe(80);
    expect(stats.fanmassEmotionHappyPct).toBe(90);
  });

  it('uses the largest projection as the denominator when they disagree', () => {
    // Same reasoning as AiEventReportView's demographicsAnalyzed: the three
    // projections should agree since they label the same faces, but if one
    // pass covered fewer than another, anchor on the most complete one
    // rather than under-reporting coverage.
    const stats = deriveFanmassDemographicStats({
      genderProjection: { male: 50 },
      ageProjection: { adults: 100 },
    });
    expect(stats.fanmassDemographicsAnalyzed).toBe(100);
    expect(stats.fanmassGenderMalePct).toBe(50); // 50 of 100, not 50 of 50
  });

  it('capitalizes multi-word category keys correctly', () => {
    const stats = deriveFanmassDemographicStats({ ageProjection: { youngAdults: 30, older: 70 } });
    expect(stats.fanmassAgeYoungAdultsPct).toBe(30);
    expect(stats.fanmassAgeOlderPct).toBe(70);
  });

  it('omits demographics entirely when nothing was analysed, rather than a misleading 0%', () => {
    const stats = deriveFanmassDemographicStats({});
    expect(stats.fanmassDemographicsAnalyzed).toBeUndefined();
    expect(Object.keys(stats).some((k) => k.startsWith('fanmassGender'))).toBe(false);
  });

  it('derives brand/club counts, not names', () => {
    const stats = deriveFanmassDemographicStats({
      brandMentions: [{ name: 'Nike', count: 5 }, { name: 'Adidas', count: 3 }],
      clubMentions: [{ name: 'Real Madrid', count: 10 }],
    });
    expect(stats.fanmassBrandCount).toBe(2);
    expect(stats.fanmassClubCount).toBe(1);
    expect(stats).not.toHaveProperty('fanmassBrandNike');
  });

  it('passes smilingPct through unchanged when present', () => {
    expect(deriveFanmassDemographicStats({ smilingPct: 42 }).fanmassSmilingPct).toBe(42);
    expect(deriveFanmassDemographicStats({}).fanmassSmilingPct).toBeUndefined();
  });

  it('skips zero-value categories rather than emitting fanmassXPct: 0', () => {
    const stats = deriveFanmassDemographicStats({ genderProjection: { male: 100, female: 0 } });
    expect(stats.fanmassGenderMalePct).toBe(100);
    expect(stats).not.toHaveProperty('fanmassGenderFemalePct');
  });
});
