// lib/matchEvent.ts
// WHAT: A sports-match event built from its two partners: the name "Home x Away", every hashtag of the home team and
//     the away team's hashtags except its location (the match is played at home), and the zeroed starting stats.
// WHY: Quick Add's match builder and the Fanmass match-event route make the same event; the rule lives once. No
//     database import, so the client page can use it.

export interface MatchPartner {
  name: string;
  hashtags?: string[];
  categorizedHashtags?: Record<string, string[]>;
}

export function buildMatchEvent(home: MatchPartner, away: MatchPartner): {
  eventName: string;
  hashtags: string[];
  categorizedHashtags: Record<string, string[]>;
} {
  const categorizedHashtags: Record<string, string[]> = {};
  const add = (partner: MatchPartner, skipLocation: boolean) => {
    for (const [category, tags] of Object.entries(partner.categorizedHashtags ?? {})) {
      if (skipLocation && category.toLowerCase() === 'location') continue;
      categorizedHashtags[category] = [...new Set([...(categorizedHashtags[category] ?? []), ...tags])];
    }
  };
  add(home, false);
  add(away, true);
  return {
    eventName: `${home.name} x ${away.name}`,
    hashtags: [...new Set([...(home.hashtags ?? []), ...(away.hashtags ?? [])])],
    categorizedHashtags,
  };
}

/** The stats a new match event starts with. */
export const EMPTY_MATCH_STATS = {
  remoteImages: 0, hostessImages: 0, selfies: 0, female: 0, male: 0, genAlpha: 0, genYZ: 0, genX: 0, boomer: 0,
  indoor: 0, outdoor: 0, stadium: 0, merched: 0, jersey: 0, scarf: 0, flags: 0, baseballCap: 0, other: 0,
};
