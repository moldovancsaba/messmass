// tests/photo-hashtags.test.ts
// WHAT: Every delivered photo carries Fanmass's hashtags plus its event's, in one clean form.

import { eventHashtags, parsePhotoHashtags, toPhotoHashtag, withEventHashtags } from '@/lib/photoHashtags';

const fail = (message: string): never => { throw new Error(message); };

describe('photo hashtags', () => {
  it('folds an event hashtag to the photo form', () => {
    expect(toPhotoHashtag('#Ferencvárosi TC')).toBe('ferencvarositc');
  });

  it('reads the event hashtags from the list, a comma-separated text and the categories', () => {
    expect(eventHashtags({ hashtags: ['tippmixreport2026', '#MTK'], categorizedHashtags: { sport: ['Football'], city: ['Budapest', 'mtk'] } }))
      .toEqual(['tippmixreport2026', 'mtk', 'football', 'budapest']);
    expect(eventHashtags({ hashtags: 'derby, #Cup' })).toEqual(['derby', 'cup']);
    expect(eventHashtags(null)).toEqual([]);
  });

  it('keeps the photo hashtags first and each once', () => {
    expect(withEventHashtags(['vans', 'happy'], ['happy', 'derby'])).toEqual(['vans', 'happy', 'derby']);
  });

  it('refuses a hashtag Fanmass should have cleaned', () => {
    expect(parsePhotoHashtags(['#Vans', 'vans'], fail)).toEqual(['vans']);
    expect(() => parsePhotoHashtags(['two words'], fail)).toThrow();
  });
});

describe('one hashtag, every spelling', () => {
  it('treats an underscore as spelling only, and keeps the event\'s typed spelling on a photo', () => {
    const { compactHashtag, hashtagSpellings, withEventHashtags } = require('@/lib/photoHashtags');
    expect(compactHashtag('#OTP_Bank_Pick_Szeged')).toBe(compactHashtag('otpbankpickszeged'));
    expect(hashtagSpellings('ujpest_fc').test('ujpestfc')).toBe(true);
    expect(withEventHashtags(['otpbankpickszeged', 'happy'], ['otp_bank_pick_szeged'])).toEqual(['happy', 'otp_bank_pick_szeged']);
  });
});
