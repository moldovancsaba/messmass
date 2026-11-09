// lib/brandEntityClustering.ts
// WHAT: Definitive taxonomic clustering and entity separation for {messmass} Fanmass Visual Analytics.
// WHY: Enforces strict separation between:
//      1. Commercial Brands & Corporate Sponsors
//      2. Sport Franchises & Athletic Teams (Clubs)
//      3. Match Venues & Arenas (e.g. Novomatic Aréna Sopron)

export type BrandClusterId =
  | 'title'
  | 'apparel'
  | 'corporate'
  | 'finance'
  | 'automotive'
  | 'fmcg'
  | 'lifestyle'
  | 'tech';

export interface BrandClusterInfo {
  id: BrandClusterId;
  label: string;
  badgeClass: string;
  badgeBg: string;
  badgeColor: string;
  icon: string;
  isSponsor: boolean;
}

export interface VenueInfo {
  name: string;
  city: string;
  primaryClub: string;
  website?: string;
  description: string;
}

export interface FranchiseInfo {
  name: string;
  sport: 'Basketball' | 'Football' | 'Handball' | 'Ice Hockey' | 'Multi-Sport';
  origin: 'Domestic' | 'International' | 'National Team';
  homeVenue?: string;
  venueWebsite?: string;
}

// 1. Venues & Arenas (locations of clubs, NOT sponsor brands)
export const VENUES_DIRECTORY: Record<string, VenueInfo> = {
  'novomatic arena': {
    name: 'Novomatic Aréna Sopron',
    city: 'Sopron',
    primaryClub: 'Sopron KC',
    website: 'https://www.novomaticarenasopron.hu',
    description: 'Home arena of Sopron KC (Men NB I/A) and Sopron Basket (EuroLeague Women).',
  },
  'novomatic aréna': {
    name: 'Novomatic Aréna Sopron',
    city: 'Sopron',
    primaryClub: 'Sopron KC',
    website: 'https://www.novomaticarenasopron.hu',
    description: 'Home arena of Sopron KC (Men NB I/A) and Sopron Basket (EuroLeague Women).',
  },
  'novomatic arena sopron': {
    name: 'Novomatic Aréna Sopron',
    city: 'Sopron',
    primaryClub: 'Sopron KC',
    website: 'https://www.novomaticarenasopron.hu',
    description: 'Home arena of Sopron KC (Men NB I/A) and Sopron Basket (EuroLeague Women).',
  },
  'dvtk arena': {
    name: 'DVTK Arena',
    city: 'Miskolc',
    primaryClub: 'DVTK Diósgyőr',
    description: 'Multifunctional sports arena in Miskolc, home of DVTK basketball and ice hockey.',
  },
  'corso kaposvár': {
    name: 'Corso Kaposvár',
    city: 'Kaposvár',
    primaryClub: 'Kometa Kaposvári KK',
    description: 'Commercial partner hub and fan meeting point in Kaposvár.',
  },
  'grand hotel esztergom': {
    name: 'Grand Hotel Esztergom',
    city: 'Esztergom',
    primaryClub: 'MOL Esztergom Kézilabda',
    description: 'Official hospitality venue and event partner in Esztergom.',
  },
};

// 2. Sport Franchises & Athletic Clubs
export const SPORT_FRANCHISES_DIRECTORY: Record<string, FranchiseInfo> = {
  // Basketball
  'sopron kc': {
    name: 'Sopron KC',
    sport: 'Basketball',
    origin: 'Domestic',
    homeVenue: 'Novomatic Aréna Sopron',
    venueWebsite: 'https://www.novomaticarenasopron.hu',
  },
  'soproni kc': {
    name: 'Sopron KC',
    sport: 'Basketball',
    origin: 'Domestic',
    homeVenue: 'Novomatic Aréna Sopron',
    venueWebsite: 'https://www.novomaticarenasopron.hu',
  },
  'falco': { name: 'Falco KC Szombathely', sport: 'Basketball', origin: 'Domestic', homeVenue: 'Arena Savaria' },
  'falco kc': { name: 'Falco KC Szombathely', sport: 'Basketball', origin: 'Domestic', homeVenue: 'Arena Savaria' },
  'körmend': { name: 'Egis Körmend', sport: 'Basketball', origin: 'Domestic', homeVenue: 'Körmend Városi Sportcsarnok' },
  'szolnok': { name: 'Szolnoki Olajbányász', sport: 'Basketball', origin: 'Domestic', homeVenue: 'Tiszaligeti Sportcsarnok' },
  'szolnoki olajbányász': { name: 'Szolnoki Olajbányász', sport: 'Basketball', origin: 'Domestic', homeVenue: 'Tiszaligeti Sportcsarnok' },
  'kaposvár': { name: 'Kometa Kaposvári KK', sport: 'Basketball', origin: 'Domestic', homeVenue: 'Kaposvár Aréna' },
  'atomerőmű': { name: 'Atomerőmű SE Paks', sport: 'Basketball', origin: 'Domestic', homeVenue: 'ASE Sportcsarnok' },
  'mvm-ose lions': { name: 'MVM-OSE Lions', sport: 'Basketball', origin: 'Domestic', homeVenue: 'Krajnyik Akác András Sportcsarnok' },
  'ose lions': { name: 'MVM-OSE Lions', sport: 'Basketball', origin: 'Domestic', homeVenue: 'Krajnyik Akác András Sportcsarnok' },

  // Ice Hockey
  'fehérvár av19': { name: 'Hydro Fehérvár AV19', sport: 'Ice Hockey', origin: 'Domestic', homeVenue: 'Ifjabb Ocskay Gábor Jégcsarnok' },
  'fehervar av19': { name: 'Hydro Fehérvár AV19', sport: 'Ice Hockey', origin: 'Domestic', homeVenue: 'Ifjabb Ocskay Gábor Jégcsarnok' },
  'fehérvár hockey': { name: 'Hydro Fehérvár AV19', sport: 'Ice Hockey', origin: 'Domestic', homeVenue: 'Ifjabb Ocskay Gábor Jégcsarnok' },
  'fehervar avis': { name: 'Hydro Fehérvár AV19', sport: 'Ice Hockey', origin: 'Domestic', homeVenue: 'Ifjabb Ocskay Gábor Jégcsarnok' },
  'av19': { name: 'Hydro Fehérvár AV19', sport: 'Ice Hockey', origin: 'Domestic', homeVenue: 'Ifjabb Ocskay Gábor Jégcsarnok' },
  'alba volts': { name: 'Hydro Fehérvár AV19', sport: 'Ice Hockey', origin: 'Domestic', homeVenue: 'Ifjabb Ocskay Gábor Jégcsarnok' },
  'bja': { name: 'Budapest Jégkorong Akadémia HC', sport: 'Ice Hockey', origin: 'Domestic', homeVenue: 'Vasas Jégcentrum' },
  'mac budapest': { name: 'Budapest Jégkorong Akadémia HC', sport: 'Ice Hockey', origin: 'Domestic', homeVenue: 'Vasas Jégcentrum' },
  'devil hockey': { name: 'Devil Hockey', sport: 'Ice Hockey', origin: 'Domestic' },

  // Multi-Sport & Football
  'deac': { name: 'DEAC', sport: 'Multi-Sport', origin: 'Domestic', homeVenue: 'Oláh Gábor Utcai Sportcsarnok' },
  'dvtk': { name: 'DVTK Diósgyőr', sport: 'Multi-Sport', origin: 'Domestic', homeVenue: 'DVTK Stadion / Arena' },
  'dvtk diósgyőr': { name: 'DVTK Diósgyőr', sport: 'Multi-Sport', origin: 'Domestic', homeVenue: 'DVTK Stadion / Arena' },
  'diósgyőr': { name: 'DVTK Diósgyőr', sport: 'Multi-Sport', origin: 'Domestic', homeVenue: 'DVTK Stadion / Arena' },
  'vtk': { name: 'DVTK Diósgyőr', sport: 'Multi-Sport', origin: 'Domestic', homeVenue: 'DVTK Stadion / Arena' },
  'ferencváros': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'fradi': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'ftc': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'fordi': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'újpest': { name: 'Újpest FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Szusza Ferenc Stadion' },
  'ute': { name: 'Újpest FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Szusza Ferenc Stadion' },
  'honvéd': { name: 'Budapesti Honvéd', sport: 'Football', origin: 'Domestic', homeVenue: 'Bozsik Aréna' },
  'haladás': { name: 'Szombathelyi Haladás', sport: 'Football', origin: 'Domestic', homeVenue: 'Haladás Sportkomplexum' },
  'budapesti haladás': { name: 'Szombathelyi Haladás', sport: 'Football', origin: 'Domestic', homeVenue: 'Haladás Sportkomplexum' },
  'kozármisleny': { name: 'HR-Rent Kozármisleny', sport: 'Football', origin: 'Domestic', homeVenue: 'Kozármislenyi Stadion' },
  'fehérvár': { name: 'Fehérvár FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'fehérvár fc': { name: 'Fehérvár FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'győr': { name: 'Győri ETO', sport: 'Football', origin: 'Domestic', homeVenue: 'ETO Park' },
  'győri eto': { name: 'Győri ETO', sport: 'Football', origin: 'Domestic', homeVenue: 'ETO Park' },
  'győr mtk': { name: 'Győri ETO', sport: 'Football', origin: 'Domestic', homeVenue: 'ETO Park' },
  'debreceni vsc': { name: 'Debreceni VSC', sport: 'Football', origin: 'Domestic', homeVenue: 'Nagyerdei Stadion' },
  'dvsc': { name: 'Debreceni VSC', sport: 'Football', origin: 'Domestic', homeVenue: 'Nagyerdei Stadion' },

  // Handball
  'pick handball': { name: 'OTP Bank-Pick Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'pick hands': { name: 'OTP Bank-Pick Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'pick': { name: 'OTP Bank-Pick Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'pick szeged': { name: 'OTP Bank-Pick Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'otp bank-pick szeged': { name: 'OTP Bank-Pick Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'veszprém': { name: 'Telekom Veszprém', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'telekom veszprém': { name: 'Telekom Veszprém', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'veszprém kse': { name: 'Telekom Veszprém', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'pler': { name: 'PLER-Budapest', sport: 'Handball', origin: 'Domestic', homeVenue: 'Budapest Sportcsarnok' },
  'pler-budapest': { name: 'PLER-Budapest', sport: 'Handball', origin: 'Domestic', homeVenue: 'Budapest Sportcsarnok' },
  'hungary national handball team': { name: 'Hungary National Handball Team', sport: 'Handball', origin: 'National Team', homeVenue: 'MVM Dome' },

  // International Franchises
  'real madrid': { name: 'Real Madrid CF', sport: 'Football', origin: 'International', homeVenue: 'Santiago Bernabéu' },
  'real madrid cf': { name: 'Real Madrid CF', sport: 'Football', origin: 'International', homeVenue: 'Santiago Bernabéu' },
  'fc barcelona': { name: 'FC Barcelona', sport: 'Football', origin: 'International', homeVenue: 'Camp Nou' },
  'boca juniors': { name: 'CA Boca Juniors', sport: 'Football', origin: 'International', homeVenue: 'La Bombonera' },
  'celtic': { name: 'Celtic FC', sport: 'Football', origin: 'International', homeVenue: 'Celtic Park' },
  'celtic fc': { name: 'Celtic FC', sport: 'Football', origin: 'International', homeVenue: 'Celtic Park' },
  'hibernian fc': { name: 'Hibernian FC', sport: 'Football', origin: 'International', homeVenue: 'Easter Road' },
  'hajduk split': { name: 'HNK Hajduk Split', sport: 'Football', origin: 'International', homeVenue: 'Poljud' },
  'hnk hajduk split': { name: 'HNK Hajduk Split', sport: 'Football', origin: 'International', homeVenue: 'Poljud' },
  'fc bäcker': { name: 'FC Bäcker', sport: 'Football', origin: 'International' },
};

/**
 * Checks whether an entity is a sport franchise / club.
 */
export function isSportFranchise(rawName: string): boolean {
  if (!rawName) return false;
  const norm = rawName.toLowerCase().trim();
  return Boolean(SPORT_FRANCHISES_DIRECTORY[norm]);
}

/**
 * Checks whether an entity is a match arena or venue (e.g. Novomatic Aréna Sopron).
 */
export function isVenue(rawName: string): boolean {
  if (!rawName) return false;
  const norm = rawName.toLowerCase().trim();
  return Boolean(VENUES_DIRECTORY[norm]);
}

/**
 * Resolves venue metadata including website and primary club.
 */
export function getVenueInfo(rawName: string): VenueInfo | null {
  if (!rawName) return null;
  const norm = rawName.toLowerCase().trim();
  return VENUES_DIRECTORY[norm] || null;
}

/**
 * Resolves franchise metadata including sport and home venue.
 */
export function getFranchiseInfo(rawName: string): FranchiseInfo | null {
  if (!rawName) return null;
  const norm = rawName.toLowerCase().trim();
  return SPORT_FRANCHISES_DIRECTORY[norm] || null;
}

/**
 * Classifies a commercial brand into an analytical cluster.
 */
export function getBrandCluster(brand: string): BrandClusterInfo {
  const norm = brand.toLowerCase().trim();

  // 1. Title & Primary Official Partners
  if (norm.includes('tippmix')) {
    return {
      id: 'title',
      label: 'Title Sponsor',
      badgeClass: 'brandTagSponsor',
      badgeBg: 'rgba(136, 202, 69, 0.2)',
      badgeColor: '#1b4332',
      icon: '🏆',
      isSponsor: true,
    };
  }
  if (norm.includes('szerencsejáték') || norm.includes('szerencsejatek') || norm === 'szrt') {
    return {
      id: 'title',
      label: 'Official Partner',
      badgeClass: 'brandTagSponsor',
      badgeBg: 'rgba(136, 202, 69, 0.25)',
      badgeColor: '#1b4332',
      icon: '🍀',
      isSponsor: true,
    };
  }

  // 2. Energy, Corporate & Venue Sponsors
  if (
    norm.includes('mvm') ||
    norm.includes('mol') ||
    norm.includes('hydro') ||
    norm.includes('veolia') ||
    norm.includes('sapa') ||
    norm.includes('kirchhoff')
  ) {
    return {
      id: 'corporate',
      label: 'Corporate & Energy',
      badgeClass: 'brandTagVenue',
      badgeBg: '#e0e7ff',
      badgeColor: '#3730a3',
      icon: '⚡',
      isSponsor: true,
    };
  }

  // 3. Banking & Financial
  if (
    norm.includes('otp') ||
    norm.includes('mbh') ||
    norm.includes('bank') ||
    norm.includes('bettor')
  ) {
    return {
      id: 'finance',
      label: 'Banking & Financial',
      badgeClass: 'brandTagVenue',
      badgeBg: '#dcfce7',
      badgeColor: '#166534',
      icon: '🏦',
      isSponsor: true,
    };
  }

  // 4. Automotive & Industrial
  if (
    norm.includes('audi') ||
    norm.includes('suzuki') ||
    norm.includes('hyundai') ||
    norm.includes('mercedes') ||
    norm.includes('opel') ||
    norm.includes('pirelli')
  ) {
    return {
      id: 'automotive',
      label: 'Automotive',
      badgeClass: 'brandTagTech',
      badgeBg: '#ffedd5',
      badgeColor: '#9a3412',
      icon: '🚗',
      isSponsor: true,
    };
  }

  // 5. Food, Beverage & Consumer (FMCG)
  if (
    norm.includes('pepsi') ||
    norm.includes('coca-cola') ||
    norm.includes('lay') ||
    norm.includes('dreher') ||
    norm.includes('pilsner') ||
    norm.includes('mizo') ||
    norm.includes('fresh corner') ||
    norm.includes('csiki')
  ) {
    return {
      id: 'fmcg',
      label: 'Beverage & FMCG',
      badgeClass: 'brandTagTech',
      badgeBg: '#fee2e2',
      badgeColor: '#991b1b',
      icon: '🥤',
      isSponsor: true,
    };
  }

  // 6. Technology & Media
  if (
    norm === 'veo' ||
    norm.includes('sportfive') ||
    norm.includes('foxconn') ||
    norm.includes('tcl') ||
    norm.includes('pwc')
  ) {
    return {
      id: 'tech',
      label: 'Tech & Media',
      badgeClass: 'brandTagTech',
      badgeBg: '#d1fae5',
      badgeColor: '#065f46',
      icon: '📡',
      isSponsor: true,
    };
  }

  // 7. Lifestyle & Retail
  if (
    norm.includes('the north face') ||
    norm.includes('columbia') ||
    norm.includes('tommy hilfiger') ||
    norm.includes('calvin klein') ||
    norm.includes('guess') ||
    norm.includes('pull&bear') ||
    norm.includes('converse') ||
    norm.includes('jack & jones') ||
    norm.includes('drk') ||
    norm.includes('new era') ||
    norm.includes('ellesse')
  ) {
    return {
      id: 'lifestyle',
      label: 'Lifestyle & Retail',
      badgeClass: 'brandTagApparel',
      badgeBg: '#f1f5f9',
      badgeColor: '#475569',
      icon: '🧢',
      isSponsor: false,
    };
  }

  // 8. Technical Kit & Athletic Apparel
  return {
    id: 'apparel',
    label: 'Kit & Equipment',
    badgeClass: 'brandTagApparel',
    badgeBg: '#e0f2fe',
    badgeColor: '#075985',
    icon: '👕',
    isSponsor: false,
  };
}

export interface SupporterGroupInfo {
  group: string;
  parentClub: string;
  sport: 'Basketball' | 'Football' | 'Handball' | 'Ice Hockey' | 'Multi-Sport';
  description?: string;
}

export const SUPPORTER_GROUPS_DIRECTORY: Record<string, SupporterGroupInfo> = {
  'green monsters': { group: 'Green Monsters', parentClub: 'Ferencvárosi TC', sport: 'Football' },
  'monsters': { group: 'Green Monsters', parentClub: 'Ferencvárosi TC', sport: 'Football' },
  'gm05': { group: 'Green Monsters', parentClub: 'Ferencvárosi TC', sport: 'Football' },
  'b-közép fradi': { group: 'B-Közép', parentClub: 'Ferencvárosi TC', sport: 'Football' },
  'fradi b-közép': { group: 'B-Közép', parentClub: 'Ferencvárosi TC', sport: 'Football' },
  '16-os szektor': { group: '16-os Szektor', parentClub: 'Ferencvárosi TC', sport: 'Football' },
  'eastern green supporters': { group: 'Eastern Green Supporters', parentClub: 'Ferencvárosi TC', sport: 'Football' },
  'liget clan': { group: 'Liget Clan', parentClub: 'Ferencvárosi TC', sport: 'Football' },

  'ultra viola bulldogs': { group: 'Ultra Viola Bulldogs', parentClub: 'Újpest FC', sport: 'Football' },
  'uvb': { group: 'Ultra Viola Bulldogs', parentClub: 'Újpest FC', sport: 'Football' },
  'viola kaos': { group: 'Viola Kaos', parentClub: 'Újpest FC', sport: 'Football' },
  'ujpest 1885': { group: 'Újpest 1885', parentClub: 'Újpest FC', sport: 'Football' },
  'korps': { group: 'Korps', parentClub: 'Újpest FC', sport: 'Football' },
  'angol brigád': { group: 'Angol Brigád', parentClub: 'Újpest FC', sport: 'Football' },

  'carpathian brigade': { group: 'Carpathian Brigade', parentClub: 'MLSZ - Magyar Labdarúgó Szövetség', sport: 'Football' },
  'carpathian brigade 09': { group: 'Carpathian Brigade', parentClub: 'MLSZ - Magyar Labdarúgó Szövetség', sport: 'Football' },
  'cb09': { group: 'Carpathian Brigade', parentClub: 'MLSZ - Magyar Labdarúgó Szövetség', sport: 'Football' },

  'ultras diósgyőr': { group: 'Ultras Diósgyőr', parentClub: 'DVTK Diósgyőr', sport: 'Multi-Sport' },
  'commandos': { group: 'Commandos', parentClub: 'DVTK Diósgyőr', sport: 'Multi-Sport' },
  'red & white warriors': { group: 'Red & White Warriors', parentClub: 'DVTK Diósgyőr', sport: 'Multi-Sport' },

  'red-blue devils': { group: 'Red-Blue Devils', parentClub: 'Fehérvár FC', sport: 'Football' },
  'rbd': { group: 'Red-Blue Devils', parentClub: 'Fehérvár FC', sport: 'Football' },
  'we are devils': { group: 'Alba Volán Jégkorong Fan Club', parentClub: 'Hydro Fehérvár AV19', sport: 'Ice Hockey' },
  'alba volán jégkorong fan club': { group: 'Alba Volán Jégkorong Fan Club', parentClub: 'Hydro Fehérvár AV19', sport: 'Ice Hockey' },

  'soproni tigrisek': { group: 'Soproni Tigrisek', parentClub: 'Sopron KC', sport: 'Basketball' },
  'sopron b-közép': { group: 'Soproni B-Közép', parentClub: 'Sopron KC', sport: 'Basketball' },
  'hűségváros brigád': { group: 'Hűségváros Brigád', parentClub: 'Sopron KC', sport: 'Basketball' },
  'soproni kosárlabda fan club': { group: 'Sopron KC Fan Club', parentClub: 'Sopron KC', sport: 'Basketball' },

  'sárga-fekete szív': { group: 'Sárga-Fekete Szív', parentClub: 'Falco KC Szombathely', sport: 'Basketball' },
  'falco b-közép': { group: 'Falco B-Közép', parentClub: 'Falco KC Szombathely', sport: 'Basketball' },

  'b-közép körmend': { group: 'B-Közép Körmend', parentClub: 'Egis Körmend', sport: 'Basketball' },
  'red devils körmend': { group: 'Red Devils Körmend', parentClub: 'Egis Körmend', sport: 'Basketball' },

  'szögedi csibészek': { group: 'Szögedi Csibészek', parentClub: 'OTP Bank-Pick Szeged', sport: 'Handball' },
  'pick kézilabda fan club': { group: 'Pick Kézilabda Fan Club', parentClub: 'OTP Bank-Pick Szeged', sport: 'Handball' },

  'építők fan club': { group: 'Építők Fan Club', parentClub: 'Telekom Veszprém', sport: 'Handball' },
  'veszprémi szurkolói egyesület': { group: 'Veszprémi Szurkolói Egyesület', parentClub: 'Telekom Veszprém', sport: 'Handball' },

  'oroszlányi bányász b-közép': { group: 'Bányász B-Közép', parentClub: 'MVM-OSE Lions', sport: 'Basketball' },
  'olaj b-közép': { group: 'Olaj B-Közép', parentClub: 'Szolnoki Olajbányász', sport: 'Basketball' },

  'szívtiprók ultras debrecen': { group: 'Szívtiprók Ultras Debrecen', parentClub: 'DEAC', sport: 'Multi-Sport' },
  'szud': { group: 'Szívtiprók Ultras Debrecen', parentClub: 'DEAC', sport: 'Multi-Sport' },
};

export function getSupporterGroupInfo(name: string): SupporterGroupInfo | undefined {
  const norm = name.toLowerCase().trim();
  return SUPPORTER_GROUPS_DIRECTORY[norm];
}
