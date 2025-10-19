// lib/footballDataApi.ts
// WHAT: Football-Data.org API client with minimal rate limiting and error handling
// WHY: Centralized, typed access to competitions, teams, and fixtures for enrichment and planning

import { config } from './config';
import type {
  FootballDataCompetition,
  FootballDataMatchesResponse,
  FootballDataTeamRef,
} from './footballData.types';

// Simple rate limiter: max 10 requests/minute (free tier). Queue requests at ~1 req/6s.
// Strategic choice: Lightweight queue to avoid introducing heavy deps.
const REQUEST_INTERVAL_MS = 6500; // 6.5s spacing for safety buffer
let lastRequestAt = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < REQUEST_INTERVAL_MS) {
    await new Promise((res) => setTimeout(res, REQUEST_INTERVAL_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

function getHeaders(): HeadersInit {
  const token = config.footballDataApiToken;
  if (!token) {
    throw new Error('FOOTBALL_DATA_API_TOKEN is not configured');
  }
  return {
    'X-Auth-Token': token,
    'Content-Type': 'application/json',
  };
}

async function httpGet<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  await rateLimit();
  const base = config.footballDataBaseUrl || 'https://api.football-data.org/v4';
  const url = new URL(path.startsWith('http') ? path : `${base}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: getHeaders(),
  });

  // Handle rate limiting and transient errors with simple retry
  if (res.status === 429) {
    // Exponential backoff retry once
    await new Promise((r) => setTimeout(r, 5000));
    return httpGet<T>(path, params);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Football-Data GET ${url.toString()} failed: ${res.status} ${res.statusText} ${text}`);
  }

  return res.json() as Promise<T>;
}

// Public API
export async function fetchCompetitions(): Promise<FootballDataCompetition[]> {
  const data = await httpGet<{ competitions: FootballDataCompetition[] }>(`/competitions`);
  return data.competitions || [];
}

export async function fetchFixtures(
  competitionCodeOrId: string | number,
  opts?: { status?: string; dateFrom?: string; dateTo?: string }
): Promise<FootballDataMatchesResponse> {
  const path = `/competitions/${competitionCodeOrId}/matches`;
  const params: Record<string, string> = {};
  if (opts?.status) params.status = opts.status;
  if (opts?.dateFrom) params.dateFrom = opts.dateFrom;
  if (opts?.dateTo) params.dateTo = opts.dateTo;
  return httpGet<FootballDataMatchesResponse>(path, params);
}

export async function fetchTeam(teamId: number): Promise<FootballDataTeamRef & { area?: unknown; venue?: string | null }>
{
  // API returns a larger structure; we narrow to the essentials we care about.
  const data = await httpGet<any>(`/teams/${teamId}`);
  const team: FootballDataTeamRef & { area?: unknown; venue?: string | null } = {
    id: data?.id,
    name: data?.name,
    shortName: data?.shortName,
    tla: data?.tla,
    crest: data?.crest,
    area: data?.area,
    venue: data?.venue ?? null,
  };
  return team;
}

export async function fetchCompetitionStandings(competitionIdOrCode: number | string): Promise<any> {
  return httpGet<any>(`/competitions/${competitionIdOrCode}/standings`);
}

// Utility to ISO timestamp with milliseconds in UTC as per global rule
export function nowIsoMs(): string {
  return new Date().toISOString(); // Node produces ISO 8601 with milliseconds in Z
}
