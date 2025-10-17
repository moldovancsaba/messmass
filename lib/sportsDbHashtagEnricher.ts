// lib/sportsDbHashtagEnricher.ts
// WHAT: Automatically generate categorized hashtags from TheSportsDB team data
// WHY: Enrich partner hashtags with sport, league, and location metadata for better filtering
// USAGE: Called when linking/syncing SportsDB data to a partner

import type { SportsDbTeam } from './sportsDbTypes';

/**
 * WHAT: Normalize string to lowercase hashtag format
 * WHY: Consistent hashtag formatting (lowercase, no spaces)
 * EXAMPLE: "La Liga" → "laliga", "New York" → "newyork"
 */
function normalizeToHashtag(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim();
}

/**
 * WHAT: Extract individual city/location components from stadium location string
 * WHY: "Barcelona, Catalonia" should create both "barcelona" and "catalonia" hashtags
 * RETURNS: Array of normalized location parts
 */
function parseLocation(location: string): string[] {
  if (!location || typeof location !== 'string') return [];
  
  // Split by common separators (comma, hyphen, slash)
  const parts = location.split(/[,\-\/]/).map(part => part.trim());
  
  // Normalize each part and filter out empty strings
  return parts
    .map(normalizeToHashtag)
    .filter(tag => tag.length > 0);
}

/**
 * WHAT: Generate categorized hashtags from TheSportsDB team data
 * WHY: Auto-enrich partners with sport, league, and location hashtags for filtering
 * 
 * GENERATES:
 * - sport:<sport>     - e.g., sport:soccer, sport:handball
 * - league:<league>   - e.g., league:laliga, league:premierleague
 * - location:<place>  - e.g., location:barcelona, location:spain
 * 
 * RETURNS: Object with categorized hashtags ready to merge with existing partner hashtags
 */
export function generateSportsDbHashtags(team: SportsDbTeam): { [categoryName: string]: string[] } {
  const categorizedHashtags: { [categoryName: string]: string[] } = {};
  
  // WHAT: Generate sport hashtag
  // WHY: Tag partner with sport type (soccer, handball, basketball, etc.)
  if (team.strSport) {
    const sportTag = normalizeToHashtag(team.strSport);
    if (sportTag) {
      categorizedHashtags['sport'] = [sportTag];
    }
  }
  
  // WHAT: Generate league hashtag(s)
  // WHY: Tag partner with league affiliation (can be multiple if team plays in multiple leagues)
  if (team.strLeague) {
    const leagueTag = normalizeToHashtag(team.strLeague);
    if (leagueTag) {
      categorizedHashtags['league'] = [leagueTag];
    }
  }
  
  // WHAT: Generate location hashtags
  // WHY: Tag partner with geographic locations (city, region, country)
  const locationTags: string[] = [];
  
  // Add stadium location (city/region)
  if (team.strStadiumLocation) {
    const locationParts = parseLocation(team.strStadiumLocation);
    locationTags.push(...locationParts);
  }
  
  // Add country
  if (team.strCountry) {
    const countryTag = normalizeToHashtag(team.strCountry);
    if (countryTag) {
      locationTags.push(countryTag);
    }
  }
  
  // Remove duplicates from location tags
  if (locationTags.length > 0) {
    categorizedHashtags['location'] = [...new Set(locationTags)];
  }
  
  return categorizedHashtags;
}

/**
 * WHAT: Merge generated hashtags with existing partner hashtags
 * WHY: Preserve manually added hashtags while adding auto-generated ones
 * 
 * STRATEGY:
 * - For each category, merge arrays and remove duplicates
 * - Preserve all existing hashtags not in auto-generated categories
 * 
 * RETURNS: Merged categorized hashtags object
 */
export function mergeSportsDbHashtags(
  existingHashtags: { [categoryName: string]: string[] } | undefined,
  generatedHashtags: { [categoryName: string]: string[] }
): { [categoryName: string]: string[] } {
  const merged: { [categoryName: string]: string[] } = {
    ...(existingHashtags || {})
  };
  
  // WHAT: Merge each generated category
  // WHY: Add SportsDB hashtags to existing categories, removing duplicates
  for (const [category, tags] of Object.entries(generatedHashtags)) {
    if (merged[category]) {
      // Merge with existing category, remove duplicates
      merged[category] = [...new Set([...merged[category], ...tags])];
    } else {
      // Create new category
      merged[category] = tags;
    }
  }
  
  return merged;
}

/**
 * WHAT: Example usage for documentation
 * WHY: Show how to integrate with partner linking workflow
 */
export function exampleUsage() {
  // Example: FC Barcelona team data from TheSportsDB
  const team: SportsDbTeam = {
    idTeam: '133604',
    strTeam: 'FC Barcelona',
    strSport: 'Soccer',
    strLeague: 'La Liga',
    idLeague: '4335',
    strStadium: 'Camp Nou',
    strStadiumLocation: 'Barcelona, Catalonia',
    intStadiumCapacity: '99354',
    strCountry: 'Spain',
    // ... other fields
  } as SportsDbTeam;
  
  // Generate hashtags from team data
  const generatedHashtags = generateSportsDbHashtags(team);
  // Result: {
  //   sport: ['soccer'],
  //   league: ['laliga'],
  //   location: ['barcelona', 'catalonia', 'spain']
  // }
  
  // Merge with existing partner hashtags
  const existingHashtags = {
    category: ['club'],
    location: ['europe'] // Will be merged with generated location tags
  };
  
  const mergedHashtags = mergeSportsDbHashtags(existingHashtags, generatedHashtags);
  // Result: {
  //   category: ['club'],
  //   location: ['europe', 'barcelona', 'catalonia', 'spain'],
  //   sport: ['soccer'],
  //   league: ['laliga']
  // }
  
  return { generatedHashtags, mergedHashtags };
}
