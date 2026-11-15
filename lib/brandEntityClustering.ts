// lib/brandEntityClustering.ts
// WHAT: Definitive taxonomic clustering and entity separation for {messmass} Fanmass Visual Analytics.
// WHY: Enforces strict separation between:
//      1. Commercial Brands & Corporate Sponsors
//      2. Sport Franchises & Athletic Teams (Clubs)
//      3. Match Venues & Arenas (e.g. Novomatic Aréna Sopron)

import { INTERACTIVE_REPORT_THEME } from '@/lib/theme/interactiveReportPalette';

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
  'haladás': { name: 'Szombathelyi Haladás', sport: 'Football', origin: 'Domestic', homeVenue: 'Haladás Sportkomplexum' },
  'haladas': { name: 'Szombathelyi Haladás', sport: 'Football', origin: 'Domestic', homeVenue: 'Haladás Sportkomplexum' },
  'szombathelyi haladás': { name: 'Szombathelyi Haladás', sport: 'Football', origin: 'Domestic', homeVenue: 'Haladás Sportkomplexum' },
  'szombathelyi haladas': { name: 'Szombathelyi Haladás', sport: 'Football', origin: 'Domestic', homeVenue: 'Haladás Sportkomplexum' },
  'budapesti haladás': { name: 'Szombathelyi Haladás', sport: 'Football', origin: 'Domestic', homeVenue: 'Haladás Sportkomplexum' },
  'fc szerencsési haladás': { name: 'Szombathelyi Haladás', sport: 'Football', origin: 'Domestic', homeVenue: 'Haladás Sportkomplexum' },
  'ferencvárosi haladás': { name: 'Szombathelyi Haladás', sport: 'Football', origin: 'Domestic', homeVenue: 'Haladás Sportkomplexum' },
  'szombathely': { name: 'Szombathelyi Haladás', sport: 'Football', origin: 'Domestic', homeVenue: 'Haladás Sportkomplexum' },
  'kozármisleny': { name: 'HR-Rent Kozármisleny', sport: 'Football', origin: 'Domestic', homeVenue: 'Kozármislenyi Stadion' },
  'fehérvár': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'fehervar': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'fehérvár fc': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'fehervar fc': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'videoton': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'videoton fc': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'videoton fc fehérvár': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'székesfehérvár': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'szekesfehervar': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'újpest': { name: 'Újpest FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Szusza Ferenc Stadion' },
  'ujpest': { name: 'Újpest FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Szusza Ferenc Stadion' },
  'újpest fc': { name: 'Újpest FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Szusza Ferenc Stadion' },
  'ujpest fc': { name: 'Újpest FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Szusza Ferenc Stadion' },
  'fc ujpest': { name: 'Újpest FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Szusza Ferenc Stadion' },
  'fc újpest': { name: 'Újpest FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Szusza Ferenc Stadion' },
  'ute': { name: 'Újpest FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Szusza Ferenc Stadion' },
  'ferencváros': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'ferencvaros': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'fradi': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'ftc': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'ferencvárosi tc': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'fordi': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'paks': { name: 'Paksi FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Fehérvári úti Stadion' },
  'paksi fc': { name: 'Paksi FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Fehérvári úti Stadion' },
  'paks fc': { name: 'Paksi FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Fehérvári úti Stadion' },
  'zte': { name: 'Zalaegerszegi TE', sport: 'Football', origin: 'Domestic', homeVenue: 'ZTE Aréna' },
  'zte fc': { name: 'Zalaegerszegi TE', sport: 'Football', origin: 'Domestic', homeVenue: 'ZTE Aréna' },
  'zalaegerszeg': { name: 'Zalaegerszegi TE', sport: 'Football', origin: 'Domestic', homeVenue: 'ZTE Aréna' },
  'zalaegerszegi te': { name: 'Zalaegerszegi TE', sport: 'Football', origin: 'Domestic', homeVenue: 'ZTE Aréna' },
  'mtk': { name: 'MTK Budapest', sport: 'Football', origin: 'Domestic', homeVenue: 'Hidegkuti Nándor Stadion' },
  'mtk budapest': { name: 'MTK Budapest', sport: 'Football', origin: 'Domestic', homeVenue: 'Hidegkuti Nándor Stadion' },
  'honvéd': { name: 'Budapest Honvéd', sport: 'Football', origin: 'Domestic', homeVenue: 'Bozsik Aréna' },
  'honved': { name: 'Budapest Honvéd', sport: 'Football', origin: 'Domestic', homeVenue: 'Bozsik Aréna' },
  'budapest honvéd': { name: 'Budapest Honvéd', sport: 'Football', origin: 'Domestic', homeVenue: 'Bozsik Aréna' },
  'budapesti honvéd': { name: 'Budapest Honvéd', sport: 'Football', origin: 'Domestic', homeVenue: 'Bozsik Aréna' },
  'kispest': { name: 'Budapest Honvéd', sport: 'Football', origin: 'Domestic', homeVenue: 'Bozsik Aréna' },
  'vasas': { name: 'Vasas FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Illovszky Rudolf Stadion' },
  'vasas fc': { name: 'Vasas FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Illovszky Rudolf Stadion' },
  'kecskemét': { name: 'Kecskeméti TE', sport: 'Football', origin: 'Domestic', homeVenue: 'Széktói Stadion' },
  'kecskemet': { name: 'Kecskeméti TE', sport: 'Football', origin: 'Domestic', homeVenue: 'Széktói Stadion' },
  'kte': { name: 'Kecskeméti TE', sport: 'Football', origin: 'Domestic', homeVenue: 'Széktói Stadion' },
  'kisvárda': { name: 'Kisvárda FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Várkerti Stadion' },
  'kisvarda': { name: 'Kisvárda FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Várkerti Stadion' },
  'dvtk jegesmedvék': { name: 'DVTK Jegesmedvék', sport: 'Ice Hockey', origin: 'Domestic', homeVenue: 'Miskolci Jégcsarnok' },
  'dvtk jegesmedvek': { name: 'DVTK Jegesmedvék', sport: 'Ice Hockey', origin: 'Domestic', homeVenue: 'Miskolci Jégcsarnok' },
  'magyarország': { name: 'Hungary National Team', sport: 'Multi-Sport', origin: 'National Team', homeVenue: 'Puskás Aréna' },
  'magyarorszag': { name: 'Hungary National Team', sport: 'Multi-Sport', origin: 'National Team', homeVenue: 'Puskás Aréna' },
  'hungary': { name: 'Hungary National Team', sport: 'Multi-Sport', origin: 'National Team', homeVenue: 'Puskás Aréna' },
  'eto fc': { name: 'ETO FC Győr', sport: 'Football', origin: 'Domestic', homeVenue: 'ETO Park' },
  'eto fc győr': { name: 'ETO FC Győr', sport: 'Football', origin: 'Domestic', homeVenue: 'ETO Park' },
  'győri eto fc': { name: 'ETO FC Győr', sport: 'Football', origin: 'Domestic', homeVenue: 'ETO Park' },
  'győr mtk': { name: 'ETO FC Győr', sport: 'Football', origin: 'Domestic', homeVenue: 'ETO Park' },
  'debreceni vsc': { name: 'Debreceni VSC', sport: 'Football', origin: 'Domestic', homeVenue: 'Nagyerdei Stadion' },
  'dvsc': { name: 'Debreceni VSC', sport: 'Football', origin: 'Domestic', homeVenue: 'Nagyerdei Stadion' },
  'debrecen': { name: 'Debreceni VSC', sport: 'Football', origin: 'Domestic', homeVenue: 'Nagyerdei Stadion' },
  'loki': { name: 'Debreceni VSC', sport: 'Football', origin: 'Domestic', homeVenue: 'Nagyerdei Stadion' },
  'nyíregyháza': { name: 'Nyíregyháza FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Nyíregyházi Városi Stadion' },
  'nyíregyháza fc': { name: 'Nyíregyháza FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Nyíregyházi Városi Stadion' },
  'nyíregyháza spartacus': { name: 'Nyíregyháza FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Nyíregyházi Városi Stadion' },
  'szpari': { name: 'Nyíregyháza FC', sport: 'Football', origin: 'Domestic', homeVenue: 'Nyíregyházi Városi Stadion' },

  // Handball
  'győri audi eto kc': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'gyori audi eto kc': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'győri eto': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'gyori eto': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'győr': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'győri eto kc': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'gyori eto kc': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'győri eto kézilabda club': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'gyori eto kezilabda club': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'audi eto': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'győri audi eto': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'gyori audi eto': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'eto kc': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'hajrá győr!': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'hajrá győr': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },
  'hajra gyor': { name: 'Győri Audi ETO KC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Audi Aréna Győr' },

  'ftc rail cargo hungária': { name: 'FTC Rail Cargo Hungária', sport: 'Handball', origin: 'Domestic', homeVenue: 'Elek Gyula Aréna' },
  'ftc rail cargo hungaria': { name: 'FTC Rail Cargo Hungária', sport: 'Handball', origin: 'Domestic', homeVenue: 'Elek Gyula Aréna' },
  'ftc rail cargo': { name: 'FTC Rail Cargo Hungária', sport: 'Handball', origin: 'Domestic', homeVenue: 'Elek Gyula Aréna' },
  'rail cargo hungária': { name: 'FTC Rail Cargo Hungária', sport: 'Handball', origin: 'Domestic', homeVenue: 'Elek Gyula Aréna' },
  'rail cargo hungaria': { name: 'FTC Rail Cargo Hungária', sport: 'Handball', origin: 'Domestic', homeVenue: 'Elek Gyula Aréna' },
  'ftc kézilabda': { name: 'FTC Rail Cargo Hungária', sport: 'Handball', origin: 'Domestic', homeVenue: 'Elek Gyula Aréna' },
  'ftc kezilabda': { name: 'FTC Rail Cargo Hungária', sport: 'Handball', origin: 'Domestic', homeVenue: 'Elek Gyula Aréna' },
  'ferencvárosi tc kézilabda': { name: 'FTC Rail Cargo Hungária', sport: 'Handball', origin: 'Domestic', homeVenue: 'Elek Gyula Aréna' },

  'one veszprém hc': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'one veszprem hc': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'one veszprém': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'one veszprem': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'telekom veszprém': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'telekom veszprem': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'telekom veszprém kc': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'veszprém': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'veszprem': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'veszprém hc': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'veszprem hc': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'veszprém kse': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'veszprem kse': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'mkb veszprém kc': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'mkb veszprém': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'veszprém kft': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'hc veszprém kse': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'veszprém handball': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'veszprem handball': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },
  'veszprém kiképző sportegyesület': { name: 'One Veszprém HC', sport: 'Handball', origin: 'Domestic', homeVenue: 'Veszprém Aréna' },

  'pick handball': { name: 'OTP Bank - PICK Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'pick hands': { name: 'OTP Bank - PICK Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'pick': { name: 'OTP Bank - PICK Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'pick szeged': { name: 'OTP Bank - PICK Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'otp bank-pick szeged': { name: 'OTP Bank - PICK Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'otp bank - pick szeged': { name: 'OTP Bank - PICK Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'pick szeged handball': { name: 'OTP Bank - PICK Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'fick szeged handball': { name: 'OTP Bank - PICK Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },
  'fick szeged': { name: 'OTP Bank - PICK Szeged', sport: 'Handball', origin: 'Domestic', homeVenue: 'Pick Aréna' },

  'pler': { name: 'PLER-Budapest', sport: 'Handball', origin: 'Domestic', homeVenue: 'Budapest Sportcsarnok' },
  'pler-budapest': { name: 'PLER-Budapest', sport: 'Handball', origin: 'Domestic', homeVenue: 'Budapest Sportcsarnok' },
  'pler budapest': { name: 'PLER-Budapest', sport: 'Handball', origin: 'Domestic', homeVenue: 'Budapest Sportcsarnok' },
  'pler kc': { name: 'PLER-Budapest', sport: 'Handball', origin: 'Domestic', homeVenue: 'Budapest Sportcsarnok' },

  'hungary national handball team': { name: 'Hungary National Handball Team', sport: 'Handball', origin: 'National Team', homeVenue: 'MVM Dome' },
  'hungary handball team': { name: 'Hungary National Handball Team', sport: 'Handball', origin: 'National Team', homeVenue: 'MVM Dome' },
  'hungary handball': { name: 'Hungary National Handball Team', sport: 'Handball', origin: 'National Team', homeVenue: 'MVM Dome' },
  'hun handball': { name: 'Hungary National Handball Team', sport: 'Handball', origin: 'National Team', homeVenue: 'MVM Dome' },
  'magyar kézilabda válogatott': { name: 'Hungary National Handball Team', sport: 'Handball', origin: 'National Team', homeVenue: 'MVM Dome' },
  'magyar kezilabda valogatott': { name: 'Hungary National Handball Team', sport: 'Handball', origin: 'National Team', homeVenue: 'MVM Dome' },

  // Domestic Re-mappings for Computer Vision False Positives
  'hibernian fc': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'hibernian': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'celtic': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'celtic fc': { name: 'Ferencvárosi TC', sport: 'Football', origin: 'Domestic', homeVenue: 'Groupama Aréna' },
  'hajduk split': { name: 'Hydro Fehérvár AV19', sport: 'Ice Hockey', origin: 'Domestic', homeVenue: 'Ifjabb Ocskay Gábor Jégcsarnok' },
  'hnk hajduk split': { name: 'Hydro Fehérvár AV19', sport: 'Ice Hockey', origin: 'Domestic', homeVenue: 'Ifjabb Ocskay Gábor Jégcsarnok' },
  'fc barcelona': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'barcelona': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'anderlecht': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },
  'ludogorets razgrad': { name: 'Videoton FC Fehérvár', sport: 'Football', origin: 'Domestic', homeVenue: 'Sóstói Stadion' },

  // International Franchises (true foreign appearances)
  'real madrid': { name: 'Real Madrid CF', sport: 'Football', origin: 'International', homeVenue: 'Santiago Bernabéu' },
  'real madrid cf': { name: 'Real Madrid CF', sport: 'Football', origin: 'International', homeVenue: 'Santiago Bernabéu' },
  'boca juniors': { name: 'CA Boca Juniors', sport: 'Football', origin: 'International', homeVenue: 'La Bombonera' },
  'fc bäcker': { name: 'FC Bäcker', sport: 'Football', origin: 'International' },
};

/**
 * Checks whether an entity is a sport franchise / club.
 */
/**
 * Canonicalizes commercial brand display names so spelling/OCR variants merge
 * into a single brand row (e.g. "TippmixPro.Hu", "Borsodi Tippmix" -> "Tippmix").
 */
export function canonicalizeBrandName(rawName: string): string {
  if (!rawName) return rawName;
  const trimmed = rawName.trim();
  const low = trimmed.toLowerCase();
  if (low.replace(/\s+/g, '').includes('tippmix')) return 'Tippmix';
  if (low.includes('szerencsejáték') || low.includes('szerencsejatek') || low === 'szrt') {
    return 'Szerencsejáték Zrt.';
  }
  return trimmed;
}

/**
 * Merges a brand list by canonical name, summing counts and keeping the first logo found.
 */
export function mergeBrandVariants<T extends { brand: string; count: number; logoUrl?: string }>(
  brands: T[]
): T[] {
  const map = new Map<string, T>();
  for (const b of brands) {
    if (!b?.brand) continue;
    const name = canonicalizeBrandName(b.brand);
    const key = name.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.count += b.count;
      if (!existing.logoUrl && b.logoUrl) existing.logoUrl = b.logoUrl;
    } else {
      map.set(key, { ...b, brand: name });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

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

export const GENERIC_VISION_PATTERNS: RegExp[] = [
  /^handball team/i,
  /^football team/i,
  /^basketball team/i,
  /^team wearing/i,
  /^team with/i,
  /^handball team name/i,
  /^handball family/i,
  /^red united handball/i,
  /^royal handball/i,
  /^red star handball/i,
  /^handball$/i,
  /^fc szerencsejáték/i,
  /^fc szerencsésiak/i,
  /^borsodi$/i,
  /\{'name':/i,
  /^etoile du/i,
  /^etoile rouge/i,
  /^győr-megyeri/i,
  /^veszprém energy/i,
  /^veszprém akadémiai/i,
  /^egc máv/i,
  /^uji győr/i,
  /^asgyőr/i,
  /^kosármisleny handball team/i,
  /^kőszegi bence handball team/i,
];

/**
 * Flags descriptive model artifacts, noise, or generic phrases that do not represent real clubs.
 */
export function isGenericVisionDescription(rawName: string): boolean {
  if (!rawName) return true;
  const norm = rawName.trim();
  const low = norm.toLowerCase();
  if (
    low === 'n/a' ||
    low === 'none' ||
    low === 'unknown' ||
    low.includes('szerencsej') ||
    low === 'tippmix' ||
    low === 'mol' ||
    low === 'nike' ||
    low === 'adidas' ||
    low === 'puma' ||
    low === 'ice hockey' ||
    low === 'hockey' ||
    low === 'handball' ||
    low === 'football' ||
    low === 'soccer' ||
    low === 'basketball' ||
    low === 'sports' ||
    low === 'sport' ||
    low === 'ball' ||
    low === 'team' ||
    low === 'club'
  ) {
    return true;
  }
  return GENERIC_VISION_PATTERNS.some((p) => p.test(norm));
}

/**
 * Canonicalizes a raw club string to its primary official entity name and franchise metadata.
 * Returns null if the string is generic noise or a non-entity.
 */
export function canonicalizeClub(rawName: string): { canonicalName: string; franchise?: FranchiseInfo } | null {
  if (isGenericVisionDescription(rawName)) return null;

  const low = rawName.toLowerCase().trim();

  // 1. Direct franchise directory hit
  const directHit = SPORT_FRANCHISES_DIRECTORY[low];
  if (directHit) {
    return { canonicalName: directHit.name, franchise: directHit };
  }

  // 2. Győri Audi ETO KC (Handball) & ETO FC variations
  if (low.includes('győr') || low.includes('gyor') || low.includes('eto')) {
    if (low.includes('fc') || low.includes('labdarúg') || low.includes('foci')) {
      const fr = SPORT_FRANCHISES_DIRECTORY['győri eto'];
      return { canonicalName: 'ETO FC Győr', franchise: fr };
    }
    if (low.includes('uni') || low.includes('kosár')) {
      return { canonicalName: 'UNI Győr' };
    }
    const fr = SPORT_FRANCHISES_DIRECTORY['győri audi eto kc'];
    return { canonicalName: 'Győri Audi ETO KC', franchise: fr };
  }

  // 3. FTC Rail Cargo Hungária (Handball) variations
  if (
    low.includes('rail cargo') ||
    ((low.includes('ftc') || low.includes('ferencváros') || low.includes('ferencvaros') || low.includes('fradi')) &&
      (low.includes('kézi') || low.includes('kezi') || low.includes('cargo') || low.includes('rail')))
  ) {
    const fr = SPORT_FRANCHISES_DIRECTORY['ftc rail cargo hungária'];
    return { canonicalName: 'FTC Rail Cargo Hungária', franchise: fr };
  }

  // 4. One Veszprém HC (Handball) variations
  if (low.includes('veszprém') || low.includes('veszprem')) {
    const fr = SPORT_FRANCHISES_DIRECTORY['one veszprém hc'];
    return { canonicalName: 'One Veszprém HC', franchise: fr };
  }

  // 5. OTP Bank - PICK Szeged (Handball) variations
  if (low.includes('szeged') || low.includes('pick')) {
    const fr = SPORT_FRANCHISES_DIRECTORY['otp bank - pick szeged'];
    return { canonicalName: 'OTP Bank - PICK Szeged', franchise: fr };
  }

  // 6. PLER-Budapest (Handball)
  if (low.includes('pler')) {
    const fr = SPORT_FRANCHISES_DIRECTORY['pler-budapest'];
    return { canonicalName: 'PLER-Budapest', franchise: fr };
  }

  // 7. Hungary National Handball Team
  if (
    (low.includes('hungary') || low.includes('magyar') || low.includes('hun')) &&
    (low.includes('handball') || low.includes('kézi') || low.includes('kezi'))
  ) {
    const fr = SPORT_FRANCHISES_DIRECTORY['hungary national handball team'];
    return { canonicalName: 'Hungary National Handball Team', franchise: fr };
  }

  // 8. Fehérvár & Videoton variations
  if (
    low.includes('fehérvár') ||
    low.includes('fehervar') ||
    low.includes('videoton') ||
    low.includes('székesfehérvár') ||
    low.includes('szekesfehervar')
  ) {
    if (
      low.includes('av19') ||
      low.includes('hockey') ||
      low.includes('hoki') ||
      low.includes('avis') ||
      low.includes('volts')
    ) {
      const fr = SPORT_FRANCHISES_DIRECTORY['fehérvár av19'];
      return { canonicalName: 'Hydro Fehérvár AV19', franchise: fr };
    }
    if (low.includes('kosár') || low.includes('kosar') || low.includes('alba')) {
      return { canonicalName: 'Alba Fehérvár Kosárlabda' };
    }
    const fr = SPORT_FRANCHISES_DIRECTORY['videoton fc fehérvár'];
    return { canonicalName: 'Videoton FC Fehérvár', franchise: fr };
  }

  // 9. Ferencvárosi TC (Football)
  if (low.includes('ferencváros') || low.includes('ferencvaros') || low.includes('fradi') || low.includes('ftc')) {
    const fr = SPORT_FRANCHISES_DIRECTORY['ferencvárosi tc'];
    return { canonicalName: 'Ferencvárosi TC', franchise: fr };
  }

  // 10. Újpest FC (Football)
  if (
    low.includes('újpest') ||
    low.includes('ujpest') ||
    low === 'ute' ||
    low.includes('fc ujpest') ||
    low.includes('fc újpest')
  ) {
    const fr = SPORT_FRANCHISES_DIRECTORY['újpest fc'];
    return { canonicalName: 'Újpest FC', franchise: fr };
  }

  // 11. Debreceni VSC (Loki)
  if (low.includes('debrecen') || low.includes('dvsc') || low.includes('loki')) {
    if (low.includes('deac')) {
      const fr = SPORT_FRANCHISES_DIRECTORY['deac'];
      return { canonicalName: 'DEAC', franchise: fr };
    }
    const fr = SPORT_FRANCHISES_DIRECTORY['debreceni vsc'];
    return { canonicalName: 'Debreceni VSC', franchise: fr };
  }

  // 12. DVTK Diósgyőr
  if (low.includes('diósgyőr') || low.includes('diosgyor') || low.includes('dvtk') || low === 'vtk') {
    if (low.includes('jeges') || low.includes('hoki') || low.includes('hockey')) {
      const fr = SPORT_FRANCHISES_DIRECTORY['dvtk jegesmedvék'];
      return { canonicalName: 'DVTK Jegesmedvék', franchise: fr };
    }
    const fr = SPORT_FRANCHISES_DIRECTORY['dvtk'];
    return { canonicalName: 'DVTK Diósgyőr', franchise: fr };
  }

  // 13. Szombathelyi Haladás
  if (low.includes('haladás') || low.includes('haladas') || low.includes('szombathely')) {
    if (low.includes('falco')) {
      const fr = SPORT_FRANCHISES_DIRECTORY['falco'];
      return { canonicalName: 'Falco KC Szombathely', franchise: fr };
    }
    const fr = SPORT_FRANCHISES_DIRECTORY['haladás'];
    return { canonicalName: 'Szombathelyi Haladás', franchise: fr };
  }

  // 14. Paksi FC / Atomerőmű
  if (low.includes('paks') || low.includes('atomerőmű') || low.includes('atomeromu')) {
    if (low.includes('kosár') || low.includes('ase')) {
      const fr = SPORT_FRANCHISES_DIRECTORY['atomerőmű'];
      return { canonicalName: 'Atomerőmű SE Paks', franchise: fr };
    }
    const fr = SPORT_FRANCHISES_DIRECTORY['paksi fc'];
    return { canonicalName: 'Paksi FC', franchise: fr };
  }

  // 15. Nyíregyháza FC
  if (low.includes('nyíregyház') || low.includes('nyiregyhaz') || low.includes('szpari')) {
    const fr = SPORT_FRANCHISES_DIRECTORY['nyíregyháza fc'];
    return { canonicalName: 'Nyíregyháza FC', franchise: fr };
  }

  // 8. Supporter group parent club mapping
  const group = SUPPORTER_GROUPS_DIRECTORY[low];
  if (group) {
    const parentDirect = SPORT_FRANCHISES_DIRECTORY[group.parentClub.toLowerCase()];
    return { canonicalName: group.parentClub, franchise: parentDirect };
  }

  return { canonicalName: rawName.trim() };
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
      badgeBg: INTERACTIVE_REPORT_THEME.badges.bettingLotteryBg,
      badgeColor: INTERACTIVE_REPORT_THEME.badges.bettingLotteryColor,
      icon: '🏆',
      isSponsor: true,
    };
  }
  if (norm.includes('szerencsejáték') || norm.includes('szerencsejatek') || norm === 'szrt') {
    return {
      id: 'title',
      label: 'Official Partner',
      badgeClass: 'brandTagSponsor',
      badgeBg: INTERACTIVE_REPORT_THEME.badges.bettingLotteryBg25,
      badgeColor: INTERACTIVE_REPORT_THEME.badges.bettingLotteryColor,
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
      badgeBg: INTERACTIVE_REPORT_THEME.badges.sportswearBg,
      badgeColor: INTERACTIVE_REPORT_THEME.badges.sportswearColor,
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
      badgeBg: INTERACTIVE_REPORT_THEME.badges.bankingBg,
      badgeColor: INTERACTIVE_REPORT_THEME.badges.bankingColor,
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
      badgeBg: INTERACTIVE_REPORT_THEME.badges.automotiveBg,
      badgeColor: INTERACTIVE_REPORT_THEME.badges.automotiveColor,
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
      badgeBg: INTERACTIVE_REPORT_THEME.badges.telecomBg,
      badgeColor: INTERACTIVE_REPORT_THEME.badges.telecomColor,
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
      badgeBg: INTERACTIVE_REPORT_THEME.badges.beverageBg,
      badgeColor: INTERACTIVE_REPORT_THEME.badges.beverageColor,
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
      badgeBg: INTERACTIVE_REPORT_THEME.badges.defaultBg,
      badgeColor: INTERACTIVE_REPORT_THEME.badges.defaultColor,
      icon: '🧢',
      isSponsor: false,
    };
  }

  // 8. No rule matched: the brand has no known category. The cluster id stays 'apparel'
  // (existing filter key) but it only stands for "not classified", never for kit or equipment.
  return {
    id: 'apparel',
    label: 'Unclassified',
    badgeClass: 'brandTagApparel',
    badgeBg: INTERACTIVE_REPORT_THEME.badges.venuesBg,
    badgeColor: INTERACTIVE_REPORT_THEME.badges.venuesColor,
    icon: '🏷️',
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
