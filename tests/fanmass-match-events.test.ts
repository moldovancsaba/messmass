// tests/fanmass-match-events.test.ts
// WHAT: Fanmass creates a match event only for two known partners, named exactly (case and accents aside), once.

import { foldName, MATCH_EVENT_CONTRACT, parseMatchEventRequest, pickPartner } from '@/lib/fanmassMatchEvents';
import { buildMatchEvent, EMPTY_MATCH_STATS } from '@/lib/matchEvent';

const body = (over: Record<string, unknown> = {}) => ({ contractVersion: MATCH_EVENT_CONTRACT, home: 'Paksi FC', away: 'NYÍREGYHÁZA SPARTACUS FC', eventDate: '2025-12-20', ...over });
const partners = [
  { _id: 'p1', name: 'Paksi FC', hashtags: ['paks', 'football'], categorizedHashtags: { location: ['paks'], sport: ['football'] } },
  { _id: 'p2', name: 'Nyíregyháza Spartacus FC', hashtags: ['nyiregyhaza', 'football'], categorizedHashtags: { location: ['nyiregyhaza'], sport: ['football'] } },
  { _id: 'p3', name: 'Soproni KC' },
  { _id: 'p4', name: 'SOPRONI KC' },
];

describe('the Fanmass match event', () => {
  it('reads a valid request', () => {
    expect(parseMatchEventRequest(body())).toEqual({ home: 'Paksi FC', away: 'NYÍREGYHÁZA SPARTACUS FC', eventDate: '2025-12-20' });
  });

  it.each([
    ['another contract', body({ contractVersion: 'x' })],
    ['a date that is not YYYY-MM-DD', body({ eventDate: '2025.12.20.' })],
    ['the same club twice', body({ away: 'PAKSI fc' })],
    ['no away club', body({ away: '' })],
  ])('refuses %s', (_label, input) => {
    expect(() => parseMatchEventRequest(input)).toThrow();
  });

  it('matches a partner by its name with case and accents ignored', () => {
    expect(foldName('NYÍREGYHÁZA SPARTACUS FC')).toBe(foldName('Nyíregyháza Spartacus FC'));
    expect(pickPartner(partners, 'NYÍREGYHÁZA SPARTACUS FC', 'away')._id).toBe('p2');
  });

  it('never guesses: an unknown or ambiguous club is refused with the candidates', () => {
    expect(() => pickPartner(partners, 'Paks', 'home')).toThrow(/not a Messmass partner/);
    expect(() => pickPartner(partners, 'Soproni KC', 'home')).toThrow(/several partners/);
  });

  it('names the event Home x Away and keeps the location of the home club only', () => {
    const event = buildMatchEvent(partners[0], partners[1]);
    expect(event.eventName).toBe('Paksi FC x Nyíregyháza Spartacus FC');
    expect(event.hashtags).toEqual(['paks', 'football', 'nyiregyhaza']);
    expect(event.categorizedHashtags).toEqual({ location: ['paks'], sport: ['football'] });
    expect(EMPTY_MATCH_STATS.selfies).toBe(0);
  });
});
