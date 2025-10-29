// WHAT: Centralized country lookup service with caching
// WHY: Replace hardcoded country mappings with MongoDB queries
// HOW: In-memory cache + MongoDB fallback for performance

import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';

// WHAT: Country document structure from MongoDB
export interface Country {
  _id: ObjectId;
  code: string;           // ISO 3166-1 alpha-2 (e.g., "US", "HU")
  name: string;           // Official name (e.g., "United States", "Hungary")
  flag: string;           // Unicode flag emoji (e.g., "🇺🇸", "🇭🇺")
  aliases: string[];      // Alternative names
  region: string;         // Continent
  subregion: string;      // Geographic subregion
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// WHAT: In-memory cache for country lookups
// WHY: Avoid repeated MongoDB queries for same countries
let countryCache: Map<string, Country> | null = null;
let cacheInitialized = false;

/**
 * WHAT: Initialize country cache from MongoDB
 * WHY: Load all countries once for fast lookups
 * HOW: Fetch all active countries and build lookup maps
 */
async function initializeCache(): Promise<void> {
  if (cacheInitialized) return;

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    const countries = await db.collection('countries')
      .find({ active: true })
      .toArray();
    
    countryCache = new Map();
    
    for (const country of countries) {
      const c = country as unknown as Country;
      
      // Index by code (uppercase)
      countryCache.set(c.code.toUpperCase(), c);
      
      // Index by name (lowercase)
      countryCache.set(c.name.toLowerCase(), c);
      
      // Index by aliases (lowercase)
      if (c.aliases && Array.isArray(c.aliases)) {
        c.aliases.forEach(alias => {
          countryCache?.set(alias.toLowerCase(), c);
        });
      }
    }
    
    cacheInitialized = true;
    console.log(`[countryService] Initialized cache with ${countries.length} countries`);
    
  } catch (error) {
    console.error('[countryService] Failed to initialize cache:', error);
    throw error;
  }
}

/**
 * WHAT: Get country by ISO code
 * WHY: Convert Bitly country codes to full country data
 * 
 * @param code - ISO 3166-1 alpha-2 code (e.g., "US", "HU")
 * @returns Country document or null if not found
 * 
 * EXAMPLES:
 * - getCountryByCode('US') → { _id, code: 'US', name: 'United States', flag: '🇺🇸', ... }
 * - getCountryByCode('hu') → { _id, code: 'HU', name: 'Hungary', flag: '🇭🇺', ... } (case-insensitive)
 * - getCountryByCode('XYZ') → null (unknown code)
 */
export async function getCountryByCode(code: string | null | undefined): Promise<Country | null> {
  if (!code) return null;
  
  await initializeCache();
  
  const normalized = code.toUpperCase().trim();
  return countryCache?.get(normalized) || null;
}

/**
 * WHAT: Get country by name or alias
 * WHY: Support lookups by full country name (e.g., from partner data)
 * 
 * @param name - Country name or alias (case-insensitive)
 * @returns Country document or null if not found
 * 
 * EXAMPLES:
 * - getCountryByName('Hungary') → { _id, code: 'HU', name: 'Hungary', ... }
 * - getCountryByName('usa') → { _id, code: 'US', name: 'United States', ... } (alias match)
 * - getCountryByName('Unknown') → null
 */
export async function getCountryByName(name: string | null | undefined): Promise<Country | null> {
  if (!name) return null;
  
  await initializeCache();
  
  const normalized = name.toLowerCase().trim();
  return countryCache?.get(normalized) || null;
}

/**
 * WHAT: Get country by _id ObjectId
 * WHY: Resolve country references from projects/partners
 * 
 * @param id - MongoDB ObjectId or string representation
 * @returns Country document or null if not found
 */
export async function getCountryById(id: ObjectId | string | null | undefined): Promise<Country | null> {
  if (!id) return null;
  
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const country = await db.collection('countries').findOne({ _id: objectId });
    
    return country as unknown as Country | null;
    
  } catch (error) {
    console.error('[countryService] Error fetching country by ID:', error);
    return null;
  }
}

/**
 * WHAT: Convert ISO code to country name
 * WHY: Replace hardcoded isoToCountryName function
 * 
 * @param code - ISO 3166-1 alpha-2 code
 * @returns Country name or 'Unknown' if not found
 * 
 * EXAMPLES:
 * - isoToCountryName('US') → 'United States'
 * - isoToCountryName('HU') → 'Hungary'
 * - isoToCountryName('XYZ') → 'Unknown'
 */
export async function isoToCountryName(code: string | null | undefined): Promise<string> {
  const country = await getCountryByCode(code);
  return country?.name || 'Unknown';
}

/**
 * WHAT: Convert ISO code to flag emoji
 * WHY: Replace hardcoded countryToFlag function
 * 
 * @param code - ISO 3166-1 alpha-2 code
 * @returns Flag emoji or empty string if not found
 * 
 * EXAMPLES:
 * - isoToFlag('US') → '🇺🇸'
 * - isoToFlag('HU') → '🇭🇺'
 * - isoToFlag('XYZ') → ''
 */
export async function isoToFlag(code: string | null | undefined): Promise<string> {
  const country = await getCountryByCode(code);
  return country?.flag || '';
}

/**
 * WHAT: Get all countries (optionally filtered by region)
 * WHY: Support dropdowns, filters, and analytics
 * 
 * @param region - Optional region filter (e.g., "Europe", "Asia")
 * @returns Array of country documents
 */
export async function getAllCountries(region?: string): Promise<Country[]> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    const filter: Record<string, unknown> = { active: true };
    if (region) {
      filter.region = region;
    }
    
    const countries = await db.collection('countries')
      .find(filter)
      .sort({ name: 1 })
      .toArray();
    
    return countries as unknown as Country[];
    
  } catch (error) {
    console.error('[countryService] Error fetching all countries:', error);
    return [];
  }
}

/**
 * WHAT: Clear country cache
 * WHY: Force cache refresh after country updates
 * 
 * USE CASE: After seeding or updating countries collection
 */
export function clearCountryCache(): void {
  countryCache = null;
  cacheInitialized = false;
  console.log('[countryService] Cache cleared');
}
