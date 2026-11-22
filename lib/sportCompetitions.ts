// lib/sportCompetitions.ts
// WHAT: Canonical sport, competition format, division, and league-tier taxonomy
//       plus deterministic project classification & report-variant filtering.

export type CompetitionFormat = 'league' | 'cup' | 'super_cup' | 'qualifier' | 'tournament' | 'friendly';
export type CompetitionDivision = 'men' | 'women' | 'mixed' | 'youth_u20' | 'youth_u21';

export interface ProjectCompetition {
  competitionId?: string;
  sport: string;
  format: CompetitionFormat;
  division: CompetitionDivision;
  tierLevel: number | null;
  tierLabel: string | null;
  sponsorTitle?: string | null;
  season?: string | null;
}

export interface CompetitionFilter {
  competitionTypes?: string[];
  leagueTags?: string[];
  sponsorTags?: string[];
  sportTags?: string[];
  formats?: string[];
  divisions?: string[];
  tierLabels?: string[];
  seasons?: string[];
  excludeSyntheticRollups?: boolean;
}

function normalizeSportKey(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (s.includes('basket') || s.includes('kosár') || s.includes('kosar') || s.includes('3x3') || s.includes('🏀')) return 'basketball';
  if (s.includes('handball') || s.includes('kézi') || s.includes('kezi') || s.includes('ehf') || s.includes('🤾')) return 'handball';
  if (s.includes('hockey') || s.includes('hoki') || s.includes('jégkorong') || s.includes('jegkorong') || s.includes('erste') || s.includes('icehl') || s.includes('av19') || s.includes('🏒')) return 'ice_hockey';
  if (s.includes('volley') || s.includes('röplabda') || s.includes('roplabda') || s.includes('cev')) return 'volleyball';
  if (s.includes('aquatic') || s.includes('swim') || s.includes('waterpolo')) return 'aquatics';
  if (s.includes('moto')) return 'motorsport';
  if (s.includes('foot') || s.includes('soccer') || s.includes('labdar') || s.includes('nb1') || s.includes('nb2') || s.includes('serie') || s.includes('uefa') || s.includes('⚽')) return 'football';
  return 'other';
}

export function resolveCompetitionFromProject(project: Record<string, any>): ProjectCompetition {
  if (project.competition && typeof project.competition === 'object' && project.competition.sport) {
    return project.competition as ProjectCompetition;
  }

  const name = String(project.eventName || '');
  const lowName = name.toLowerCase();
  const hashtags = Array.isArray(project.hashtags) ? project.hashtags.map((h: unknown) => String(h).toLowerCase()) : [];
  const cat = (project.categorizedHashtags || {}) as Record<string, string[]>;
  const sportsArr = Array.isArray(cat.sport) ? cat.sport.map((s) => s.toLowerCase()) : [];
  const leaguesArr = Array.isArray(cat.league) ? cat.league.map((s) => s.toLowerCase()) : [];
  const scopesArr = Array.isArray(cat.scope) ? cat.scope.map((s) => s.toLowerCase()) : [];
  const sponsorsArr = Array.isArray(cat.sponsor) ? cat.sponsor.map((s) => s.toLowerCase()) : [];

  const combined = `${lowName} ${sportsArr.join(' ')} ${leaguesArr.join(' ')} ${hashtags.join(' ')}`;
  const sport = normalizeSportKey(combined);

  // Division
  let division: CompetitionDivision = 'men';
  if (combined.includes('u20') || combined.includes('u-20')) division = 'youth_u20';
  else if (combined.includes('u21') || combined.includes('u-21')) division = 'youth_u21';
  else if (
    hashtags.includes('women') ||
    hashtags.includes('noi') ||
    hashtags.includes('női') ||
    combined.includes('women') ||
    combined.includes('női') ||
    combined.includes('noi_') ||
    combined.includes('_noi') ||
    combined.includes('huntherm') ||
    combined.includes('sopron basket') ||
    combined.includes('ksc szekszárd') ||
    combined.includes('győri audi eto kc') ||
    combined.includes('dvsc schaffler') ||
    combined.includes('ftc-rail cargo') ||
    combined.includes('rail cargo') ||
    combined.includes('mosonmagyaróvár') ||
    combined.includes('vác') ||
    combined.includes('esztergom') ||
    combined.includes('kohász') ||
    combined.includes('budaörs') ||
    combined.includes('kozármisleny')
  ) {
    division = 'women';
  }

  // Format
  let format: CompetitionFormat = 'league';
  if (combined.includes('kupa') || combined.includes('cup') && !combined.includes('world cup')) {
    format = 'cup';
  } else if (combined.includes('super cup') || combined.includes('szuperkupa')) {
    format = 'super_cup';
  } else if (combined.includes('qualif') || combined.includes('selejtez') || scopesArr.includes('national_games')) {
    format = 'qualifier';
  } else if (combined.includes('world cup') || combined.includes('championship') || combined.includes('eurobasket') || combined.includes('fiba u20')) {
    format = 'tournament';
  } else if (combined.includes('friendly') || combined.includes('felkészül')) {
    format = 'friendly';
  }

  // Tier
  let tierLevel: number | null = 1;
  let tierLabel: string | null = null;
  if (format === 'cup') {
    tierLevel = null;
    tierLabel = 'Magyar Kupa';
  } else if (format === 'qualifier' || format === 'tournament') {
    tierLevel = null;
    tierLabel = 'International';
  } else if (leaguesArr.some((l) => l.includes('division_ii') || l.includes('nb2') || l.includes('merkantil'))) {
    tierLevel = 2;
    tierLabel = 'NB II';
  } else if (sport === 'basketball') {
    tierLevel = 1;
    tierLabel = 'NB I. A';
  } else if (sport === 'football' && leaguesArr.some((l) => l.includes('serie_a'))) {
    tierLevel = 1;
    tierLabel = 'Serie A';
  } else if (sport === 'football') {
    tierLevel = 1;
    tierLabel = 'NB I';
  } else if (sport === 'handball') {
    tierLevel = 1;
    tierLabel = 'NB I';
  } else if (sport === 'ice_hockey') {
    tierLevel = 1;
    tierLabel = leaguesArr.some((l) => l.includes('icehl')) || lowName.includes('av19') ? 'ICEHL' : 'Erste Liga';
  }

  // Season
  const dateStr = String(project.eventDate || '');
  const ym = /^(\d{4})[-./](\d{1,2})/.exec(dateStr);
  let season: string | null = null;
  if (ym) {
    const year = Number(ym[1]);
    const month = Number(ym[2]);
    season = month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
  }

  const sponsorTitle = sponsorsArr.includes('tippmix')
    ? 'Tippmix'
    : sponsorsArr.includes('mol')
      ? 'MOL'
      : null;

  return {
    sport,
    format,
    division,
    tierLevel,
    tierLabel,
    sponsorTitle,
    season,
  };
}

export function matchesVariantEventFilter(
  project: Record<string, any>,
  filter?: CompetitionFilter | null
): boolean {
  if (!filter) return true;

  const name = String(project.eventName || '');
  const isSynthetic = /statisztika|ai analytics/i.test(name);
  if (filter.excludeSyntheticRollups && isSynthetic) {
    return false;
  }
  if (Array.isArray(filter.competitionTypes) && filter.competitionTypes.length > 0) {
    if (filter.competitionTypes.includes('synthetic_rollup') && !isSynthetic) return false;
  }

  const comp = resolveCompetitionFromProject(project);

  if (Array.isArray(filter.sportTags) && filter.sportTags.length > 0) {
    const allowed = filter.sportTags.map((s) => normalizeSportKey(s));
    if (!allowed.includes(comp.sport)) return false;
  }

  if (Array.isArray(filter.formats) && filter.formats.length > 0) {
    if (!filter.formats.includes(comp.format)) return false;
  }

  if (Array.isArray(filter.divisions) && filter.divisions.length > 0) {
    if (!filter.divisions.includes(comp.division)) return false;
  }

  if (Array.isArray(filter.tierLabels) && filter.tierLabels.length > 0) {
    const target = (comp.tierLabel || '').toLowerCase();
    if (!filter.tierLabels.some((t) => t.toLowerCase() === target)) return false;
  }

  if (Array.isArray(filter.seasons) && filter.seasons.length > 0) {
    if (!comp.season || !filter.seasons.includes(comp.season)) return false;
  }

  return true;
}
