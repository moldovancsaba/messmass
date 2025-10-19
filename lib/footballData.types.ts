// lib/footballData.types.ts
// WHAT: TypeScript types for Football-Data.org integration (fixtures, teams, competitions)
// WHY: Provide strict typing for API client, DB documents, and UI components

import type { ObjectId } from 'mongodb';

// Minimal competition info returned by Football-Data.org
export interface FootballDataCompetition {
  id: number;                 // e.g., 2021 (Premier League)
  name: string;               // "Premier League"
  code: string;               // "PL"
  type: 'LEAGUE' | 'CUP' | string;
  emblem?: string;            // Competition logo URL
}

// Minimal season info
export interface FootballDataSeasonRef {
  id?: number;
  startDate?: string;         // ISO 8601 (YYYY-MM-DD)
  endDate?: string;           // ISO 8601 (YYYY-MM-DD)
  currentMatchday?: number;
}

// Team reference used in fixtures
export interface FootballDataTeamRef {
  id: number;                 // Football-Data.org team ID
  name: string;
  shortName?: string;
  tla?: string;               // Three-letter acronym
  crest?: string;             // Team crest URL
}

// Stored fixture document in MongoDB
export interface FootballDataFixtureDoc {
  _id?: ObjectId;
  fixtureId: number;          // Football-Data.org match ID

  competition: FootballDataCompetition;
  season?: FootballDataSeasonRef;

  utcDate: string;            // ISO 8601 datetime
  status: 'SCHEDULED' | 'TIMED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELED' | string;
  matchday?: number;
  stage?: string;             // e.g., "REGULAR_SEASON"
  group?: string | null;
  venue?: string | null;

  homeTeam: FootballDataTeamRef;
  awayTeam: FootballDataTeamRef;

  // Partner matching
  homePartnerId?: ObjectId;
  awayPartnerId?: ObjectId;

  // Linked project (event)
  projectId?: ObjectId;
  isDraftProject?: boolean;

  // Metadata
  lastUpdated: string;        // ISO 8601 with milliseconds
  createdAt: string;          // ISO 8601 with milliseconds
  syncedAt: string;           // ISO 8601 with milliseconds
}

// API client return shape for matches
export interface FootballDataMatchesResponse {
  filters?: Record<string, unknown>;
  resultSet?: {
    count?: number;
    first?: string;
    last?: string;
    played?: number;
  };
  competition?: FootballDataCompetition;
  matches: Array<{
    id: number;
    utcDate: string;
    status: FootballDataFixtureDoc['status'];
    matchday?: number;
    stage?: string;
    group?: string | null;
    area?: { id?: number; name?: string };
    season?: FootballDataSeasonRef;
    competition?: FootballDataCompetition;
    venue?: string | null;
    homeTeam: FootballDataTeamRef;
    awayTeam: FootballDataTeamRef;
    lastUpdated?: string;
  }>;
}
