// lib/partner.types.ts
// WHAT: TypeScript interfaces for Partner entity
// WHY: Type safety for partner management across MessMass platform

import { ObjectId } from 'mongodb';

/**
 * WHAT: Core Partner interface stored in MongoDB
 * WHY: Represents organizations that manage events (clubs, federations, venues, brands)
 */
export interface Partner {
  _id: ObjectId;
  name: string; // Partner name (e.g., "FC Barcelona", "UEFA", "Camp Nou")
  emoji: string; // Partner emoji for visual identification (e.g., "⚽", "🏟️")
  
  // WHAT: Hashtag associations (unified system)
  // WHY: Partners can be tagged and filtered like projects
  hashtags?: string[]; // Traditional hashtags
  categorizedHashtags?: { [categoryName: string]: string[] }; // Category-specific hashtags
  
  // WHAT: Bitly link associations (many-to-many)
  // WHY: Partners can have dedicated tracking links
  bitlyLinkIds?: ObjectId[]; // References to bitly_links collection
  
  // WHAT: TheSportsDB enrichment data
  // WHY: Store sports club metadata for analytics (stadium capacity, leagues, badges)
  sportsDb?: {
    teamId?: string;           // TheSportsDB team ID (e.g., "133739")
    leagueId?: string;         // TheSportsDB league ID (e.g., "4335")
    venueId?: string;          // TheSportsDB venue ID
    venueCapacity?: number;    // Stadium capacity as number (e.g., 99354)
    venueName?: string;        // Official venue name (e.g., "Camp Nou")
    leagueName?: string;       // League name (e.g., "La Liga")
    founded?: string;          // Year founded (e.g., "1899")
    country?: string;          // Country (e.g., "Spain")
    website?: string;          // Official website URL
    badge?: string;            // Team badge/logo URL from TheSportsDB
    lastSynced?: string;       // ISO 8601 timestamp of last sync
  };
  
  // WHAT: Partner logo hosted on ImgBB
  // WHY: Permanent CDN-hosted logo for display in UI (uploaded from sportsDb.badge)
  logoUrl?: string;
  
  // Metadata
  createdAt: string; // ISO 8601 with milliseconds
  updatedAt: string; // ISO 8601 with milliseconds
}

/**
 * WHAT: Partner creation input (client -> server)
 * WHY: Validates required fields for new partner
 */
export interface CreatePartnerInput {
  name: string;
  emoji: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  bitlyLinkIds?: string[]; // String IDs from client
  logoUrl?: string;
  sportsDb?: {
    teamId?: string;
    leagueId?: string;
    venueId?: string;
    venueCapacity?: number;
    venueName?: string;
    leagueName?: string;
    founded?: string;
    country?: string;
    website?: string;
    badge?: string;
    lastSynced?: string;
  };
}

/**
 * WHAT: Partner update input (partial updates allowed)
 * WHY: Supports flexible partner editing
 */
export interface UpdatePartnerInput {
  partnerId: string;
  name?: string;
  emoji?: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  bitlyLinkIds?: string[];
  logoUrl?: string;
  sportsDb?: {
    teamId?: string;
    leagueId?: string;
    venueId?: string;
    venueCapacity?: number;
    venueName?: string;
    leagueName?: string;
    founded?: string;
    country?: string;
    website?: string;
    badge?: string;
    lastSynced?: string;
  };
}

/**
 * WHAT: Partner response with populated Bitly links
 * WHY: Return full link details to client for display
 */
export interface PartnerResponse extends Omit<Partner, '_id' | 'bitlyLinkIds'> {
  _id: string;
  bitlyLinks?: Array<{
    _id: string;
    bitlink: string;
    title: string;
    long_url: string;
  }>;
}

/**
 * WHAT: Partner list response with pagination
 * WHY: Support large partner databases with efficient loading
 */
export interface PartnersListResponse {
  success: boolean;
  partners: PartnerResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

/**
 * WHAT: Partner single response
 * WHY: Standard API response format
 */
export interface PartnerSingleResponse {
  success: boolean;
  partner?: PartnerResponse;
  error?: string;
  message?: string;
}
