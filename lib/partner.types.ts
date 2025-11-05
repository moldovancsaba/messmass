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
  
  // WHAT: TheSportsDB enrichment data (complete team profile)
  // WHY: Store all available sports club metadata for comprehensive KYC and analytics
  sportsDb?: {
    // Core Identifiers
    teamId?: string;                   // TheSportsDB team ID (e.g., "133739")
    strTeam?: string;                  // Full team name (e.g., "FC Barcelona")
    strTeamShort?: string;             // Short name (e.g., "Barcelona")
    strAlternate?: string;             // Alternative team names
    
    // Sport & League
    strSport?: string;                 // Sport type (e.g., "Soccer", "Handball")
    strLeague?: string;                // League name (e.g., "La Liga")
    leagueId?: string;                 // TheSportsDB league ID (e.g., "4335")
    
    // Venue/Stadium
    strStadium?: string;               // Stadium/venue name (e.g., "Camp Nou")
    venueId?: string;                  // TheSportsDB venue ID
    intStadiumCapacity?: number;       // Stadium capacity as number (e.g., 99354)
    strStadiumThumb?: string;          // Stadium image URL
    strStadiumDescription?: string;    // Stadium description
    strStadiumLocation?: string;       // Stadium city/location
    
    // Team Details
    intFormedYear?: string;            // Year founded (e.g., "1899")
    strCountry?: string;               // Country (e.g., "Spain")
    strDescriptionEN?: string;         // English description
    
    // Visual Assets
    strTeamBadge?: string;             // Badge/logo URL (main logo)
    strTeamLogo?: string;              // Alternative logo URL
    strTeamJersey?: string;            // Jersey/kit image URL
    strTeamBanner?: string;            // Banner image URL
    strTeamFanart1?: string;           // Fan art image 1
    strTeamFanart2?: string;           // Fan art image 2
    strTeamFanart3?: string;           // Fan art image 3
    strTeamFanart4?: string;           // Fan art image 4
    
    // Social Media & Web
    strWebsite?: string;               // Official website URL
    strFacebook?: string;              // Facebook page URL
    strTwitter?: string;               // Twitter handle
    strInstagram?: string;             // Instagram handle
    
    // Sync Metadata
    lastSynced?: string;               // ISO 8601 timestamp of last sync
    
    // Legacy fields (kept for backward compatibility)
    leagueName?: string;               // Alias for strLeague
    venueName?: string;                // Alias for strStadium
    venueCapacity?: number;            // Alias for intStadiumCapacity
    founded?: string;                  // Alias for intFormedYear
    country?: string;                  // Alias for strCountry
    website?: string;                  // Alias for strWebsite
    badge?: string;                    // Alias for strTeamBadge
  };
  
  // WHAT: Football-Data.org enrichment data (team profile and competition associations)
  // WHY: Store Football-Data.org team metadata for fixture matching and KYC enrichment
  footballData?: {
    teamId: number;                    // Football-Data.org team ID (e.g., 81)
    name: string;                      // Official team name (e.g., "FC Barcelona")
    shortName: string;                 // Short name (e.g., "Barcelona")
    tla: string;                       // Three-letter acronym (e.g., "FCB")
    crest: string;                     // Team logo URL from Football-Data.org
    
    // Competition associations
    competitions?: Array<{
      id: number;                      // Competition ID (e.g., 2014 for La Liga)
      name: string;                    // Competition name (e.g., "Primera Division")
      code: string;                    // Competition code (e.g., "PD")
      type: string;                    // "LEAGUE" or "CUP"
      emblem?: string;                 // Competition logo URL
    }>;
    
    // Sync metadata
    lastSynced: string;                // ISO 8601 timestamp of last sync
  };
  
  // WHAT: Partner logo hosted on ImgBB
  // WHY: Permanent CDN-hosted logo for display in UI (uploaded from sportsDb.badge or footballData.crest)
  logoUrl?: string;
  
  // WHAT: Shareable URL slug for public partner report page
  // WHY: Allow creating password-protected partner profiles accessible via /partner-report/[slug]
  viewSlug?: string;
  
  // Metadata
  createdAt: string; // ISO 8601 with milliseconds
  updatedAt: string; // ISO 8601 with milliseconds
  
  // WHAT: Draft flag for auto-created partners
  // WHY: Identify entities created by automation for later review
  isDraft?: boolean;
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
  sportsDb?: Partner['sportsDb']; // Use same type as Partner interface
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
  sportsDb?: Partner['sportsDb']; // Use same type as Partner interface
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
