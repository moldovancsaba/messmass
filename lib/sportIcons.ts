// lib/sportIcons.ts
// WHAT: Canonical sport & competition discipline icon resolver across Interactive Reports,
//       Territory Maps, Club Matrices, Organizations, and Admin Surfaces.
// WHY: Replaces partial 4-sport maps (`Football`, `Basketball`, `Ice Hockey`, `Handball`)
//      and hardcoded `⚽` tab icons so all 22+ sports and competition tags render proper domain icons.

export function resolveSportIcon(sport?: string | null, fallback = '🏅'): string {
  if (!sport) return fallback;
  const raw = String(sport).trim();
  if (!raw) return fallback;
  const low = raw.toLowerCase().replace(/[_-]+/g, ' ').trim();

  if (low === 'all' || low === 'all sports') return '🏆';
  if (low.includes('foot') || low.includes('soccer') || low.includes('futsal') || low.includes('labdarug') || low.includes('labdarúg')) {
    return '⚽';
  }
  if (low.includes('basket') || low.includes('3x3') || low.includes('eurobasket') || low.includes('kosar') || low.includes('kosár')) {
    return '🏀';
  }
  if (low.includes('hockey') || low.includes('icehl') || low.includes('jegkorong') || low.includes('jégkorong')) {
    return '🏒';
  }
  if (low.includes('handball') || low.includes('hand') || low.includes('kezilabda') || low.includes('kézilabda')) {
    return '🤾';
  }
  if (low.includes('dart')) {
    return '🎯';
  }
  if (low.includes('motogp') || low.includes('moto ') || low === 'motor') {
    return '🏍️';
  }
  if (low.includes('motorsport') || low.includes('formula') || low === 'f1' || low.includes('rally') || low.includes('auto')) {
    return '🏎️';
  }
  if (low.includes('volley') || low.includes('roplabda') || low.includes('röplabda')) {
    return '🏐';
  }
  if (low.includes('water polo') || low.includes('waterpolo') || low.includes('vizilabda') || low.includes('vízilabda')) {
    return '🤽';
  }
  if (low.includes('artistic swimming') || low.includes('synchronized swimming')) {
    return '🏊‍♀️';
  }
  if (low.includes('swim') || low.includes('aquatic') || low.includes('uszas') || low.includes('úszás')) {
    return '🏊';
  }
  if (low.includes('karate') || low.includes('martial') || low.includes('judo') || low.includes('taekwondo')) {
    return '🥋';
  }
  if (low.includes('tennis') || low.includes('pickleball') || low.includes('padel')) {
    return '🎾';
  }
  if (low.includes('music') || low.includes('concert') || low.includes('festival')) {
    return '🎸';
  }
  if (low.includes('multi-sport') || low.includes('multisport')) {
    return '🏅';
  }
  return fallback;
}
