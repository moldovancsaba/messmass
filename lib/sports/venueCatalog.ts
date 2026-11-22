// lib/sports/venueCatalog.ts
// WHAT: Canonical sports venue, stadium capacity, and geocoding catalog.
// WHY: In matchday analytics, nominal venue capacity is required to calculate
//      Capacity Fill Rate (Gate / Capacity) and Visual Reach (Visible / Capacity).

import venuesData from '@/data/venue-directory.json';

export interface VenueInfo {
  id: string;
  name: string;
  city: string;
  capacity: number;
  isIndoor: boolean;
  primarySport: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

const VENUES: VenueInfo[] = (venuesData.venues || []) as VenueInfo[];

// Normalize string for fuzzy substring/alias matching
function clean(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

/**
 * Resolves venue details from match name (e.g. "MTK x ETO FC Győr" -> home team is MTK -> Új Hidegkuti Nándor Stadion).
 */
export function resolveVenueFromMatch(matchName: string, explicitVenue?: string): VenueInfo {
  if (explicitVenue) {
    const cleanVenue = clean(explicitVenue);
    for (const v of VENUES) {
      if (clean(v.name) === cleanVenue || clean(v.id) === cleanVenue) {
        return v;
      }
      const aliases = ((venuesData.venues as any[]).find((x) => x.id === v.id)?.aliases || []) as string[];
      if (aliases.some((a) => clean(a) === cleanVenue || cleanVenue.includes(clean(a)))) {
        return v;
      }
    }
  }

  // In Messmass match names, the match fixture delimiter between home and away team
  // is " x " (or " vs " or "#"). We do not split on "-" because Hungarian sponsor-club names
  // contain hyphens with spaces (e.g., "FTC - Telekom Jégkorong", "OTP Bank - PICK Szeged").
  const rawClean = (matchName || '').replace(/^(\[?[⚽🏀🤾🏒]\]?\s*|[🔴🟢\s]*)+/g, '').trim();
  const parts = /\s+(?:x|vs\.?)\s+|\s*#\s*/i.test(rawClean)
    ? rawClean.split(/\s+(?:x|vs\.?)\s+|\s*#\s*/i)
    : rawClean.split(/\s+-\s+|\/|\s+vs\.?\s+/i);
  const homeTeam = clean(parts[0] || '');

  // Check specific sport overrides before generic loop
  if (homeTeam.includes('jegkorong') || homeTeam.includes('hoki') || homeTeam.includes('hockey') || homeTeam.includes('jegesmedvek')) {
    if (homeTeam.includes('ftc') || homeTeam.includes('ferencvaros') || homeTeam.includes('telekom')) {
      const v = VENUES.find((x) => x.id === 'tuskecsarnok');
      if (v) return v;
    }
    if (homeTeam.includes('ute') || homeTeam.includes('ujpest')) {
      const v = VENUES.find((x) => x.id === 'ujpesti-jegcsarnok');
      if (v) return v;
    }
    if (homeTeam.includes('dvtk') || homeTeam.includes('jegesmedvek')) {
      const v = VENUES.find((x) => x.id === 'miskolci-jegcsarnok');
      if (v) return v;
    }
    if (homeTeam.includes('fehervar') || homeTeam.includes('av19')) {
      const v = VENUES.find((x) => x.id === 'alba-arena');
      if (v) return v;
    }
  }

  if (homeTeam.includes('huntherm') || homeTeam.includes('kosar') || homeTeam.includes('basket') || homeTeam.includes('kc')) {
    if (homeTeam.includes('dvtk')) {
      const v = VENUES.find((x) => x.id === 'dvtk-arena');
      if (v) return v;
    }
    if (homeTeam.includes('sopron')) {
      const v = VENUES.find((x) => x.id === 'novomatic-arena');
      if (v) return v;
    }
    if (homeTeam.includes('zte')) {
      const v = VENUES.find((x) => x.id === 'zalakeramia-sportcsarnok');
      if (v) return v;
    }
    if (homeTeam.includes('deac')) {
      const v = VENUES.find((x) => x.id === 'olah-gabor-sportcsarnok');
      if (v) return v;
    }
  }

  if (homeTeam.includes('audi') || homeTeam.includes('kezilabda') || homeTeam.includes('kc')) {
    if (homeTeam.includes('gyor')) {
      const v = VENUES.find((x) => x.id === 'audi-arena-gyor');
      if (v) return v;
    }
    if (homeTeam.includes('esztergom')) {
      const v = VENUES.find((x) => x.id === 'suzuki-arena-esztergom');
      if (v) return v;
    }
    if (homeTeam.includes('pler')) {
      const v = VENUES.find((x) => x.id === 'pler-budapest-csarnok');
      if (v) return v;
    }
  }

  // Match home club to tenant club aliases
  for (const v of VENUES) {
    const raw = (venuesData.venues as any[]).find((x) => x.id === v.id);
    const tenants = (raw?.tenantClubs || []) as string[];
    const aliases = (raw?.aliases || []) as string[];

    const matchesTenant = tenants.some((t) => {
      const ct = clean(t);
      return homeTeam === ct || homeTeam.startsWith(ct) || homeTeam.includes(ct) || ct.includes(homeTeam);
    });

    if (matchesTenant) {
      return v;
    }

    const matchesAlias = aliases.some((a) => {
      const ca = clean(a);
      return homeTeam.includes(ca);
    });
    if (matchesAlias) return v;
  }

  // Default fallback if unknown: generic national venue
  return {
    id: 'generic-venue',
    name: explicitVenue || 'Városi Stadion',
    city: 'Magyarország',
    capacity: 5000,
    isIndoor: matchName.toLowerCase().includes('basket') || matchName.toLowerCase().includes('handball'),
    primarySport: 'Football',
    coordinates: { lat: 47.4979, lon: 19.0402 },
  };
}

export function getAllVenues(): VenueInfo[] {
  return VENUES;
}

export function getVenueById(id: string): VenueInfo | undefined {
  return VENUES.find((v) => v.id === id);
}
