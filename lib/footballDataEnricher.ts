// lib/footballDataEnricher.ts
// WHAT: Generate categorized hashtags and enrichment payloads from Football-Data.org data
// WHY: Reuse unified hashtag system for league, competition, and location-like tags

import type { FootballDataCompetition, FootballDataTeamRef } from './footballData.types';

// NOTE: We intentionally re-implement a small normalizer to avoid tight coupling to SportsDB module.
// Strategic: Keeps modules independent while following the same normalization rule.
function normalizeToHashtag(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function generateFootballDataHashtags(
  team: FootballDataTeamRef,
  competitions?: FootballDataCompetition[]
): { [categoryName: string]: string[] } {
  const categorized: Record<string, string[]> = {};

  // Team code as category tag can help disambiguate
  const teamTags: string[] = [];
  if (team.tla) teamTags.push(normalizeToHashtag(team.tla));
  if (team.shortName) teamTags.push(normalizeToHashtag(team.shortName));
  if (team.name) teamTags.push(normalizeToHashtag(team.name));
  const uniqueTeam = Array.from(new Set(teamTags.filter(Boolean)));
  if (uniqueTeam.length) categorized['team'] = uniqueTeam;

  // League/competition tags
  const leagueTags: string[] = [];
  for (const c of competitions || []) {
    if (c.name) leagueTags.push(normalizeToHashtag(c.name));
    if (c.code) leagueTags.push(normalizeToHashtag(c.code));
  }
  const uniqueLeague = Array.from(new Set(leagueTags.filter(Boolean)));
  if (uniqueLeague.length) categorized['league'] = uniqueLeague;

  return categorized;
}

export function mergeFootballDataHashtags(
  existing: { [categoryName: string]: string[] } | undefined,
  generated: { [categoryName: string]: string[] }
): { [categoryName: string]: string[] } {
  const merged: Record<string, string[]> = { ...(existing || {}) };
  for (const [category, tags] of Object.entries(generated)) {
    merged[category] = Array.from(new Set([...(merged[category] || []), ...tags]));
  }
  return merged;
}
